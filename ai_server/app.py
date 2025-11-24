from flask import Flask, request, jsonify
import subprocess
import requests
import time
import os
import signal
import socket
import sys
import json
from pathlib import Path

# Optional dependencies with graceful fallbacks
try:
    from textblob import TextBlob  # sentiment (optional)
    _HAVE_TEXTBLOB = True
except Exception:
    _HAVE_TEXTBLOB = False

try:
    import mysql.connector  # MySQL client (optional)
    _HAVE_MYSQL = True
except Exception:
    _HAVE_MYSQL = False

app = Flask(__name__)

# Constants: enforce fixed ports (not overridable)
AI_SERVER_PORT = 5002
OLLAMA_URL = "http://127.0.0.1:11434"
# Force Ollama host for CLI as well (prevents external overrides)
os.environ["OLLAMA_HOST"] = OLLAMA_URL

# Base URL of main backend for catalog and metadata queries
LIBRARY_API_BASE = os.getenv("LIBRARY_API_BASE", "http://localhost:5000")

# CORS: allow frontends (8080/8081) to call AI server (5002)
@app.before_request
def _preflight():
    if request.method == "OPTIONS":
        return ("", 204)

@app.after_request
def _add_cors(resp):
    # Always allow frontends to call AI server
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Credentials"] = "false"
    return resp

# 🧩 Database connection (adjust to your .env or XAMPP settings)
db = None
cursor = None
if _HAVE_MYSQL:
    try:
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",  # change if needed
            database="library_system_ai"
        )
        cursor = db.cursor()
    except Exception as e:
        print(f"[AI_SERVER] MySQL disabled: {e}")
else:
    print("[AI_SERVER] mysql-connector not installed; DB logging disabled")

# 🔹 Jose system prompt (keeps answers short and JRMSU-library-specific)
JOSE_SYSTEM_PROMPT = """You are Jose, the AI assistant for the JRMSU Library System.\n\n- Answer in a concise way (33 short paragraphs max).\n- Use bullet points when listing steps.\n- Focus only on what the user asked. Do not add long extra explanations.\n- When questions are about this system (JRMSU AI Library), explain features, pages, and workflows in clear, simple steps.\n- If you are not sure about an implementation detail, say so briefly instead of guessing."""

# In-memory store for system knowledge loaded from system_knowledge.json
SYSTEM_KNOWLEDGE = {}
SYSTEM_TOPICS = []

def load_system_knowledge(path: str | None = None) -> None:
    """Load system_knowledge.json once at startup.

    Populates SYSTEM_KNOWLEDGE and SYSTEM_TOPICS used by get_relevant_knowledge().
    Also strips any stray control characters so the JSON parser does not fail
    when the file contains copy-paste artifacts.
    """
    global SYSTEM_KNOWLEDGE, SYSTEM_TOPICS

    if path is None:
        path = os.path.join(Path(__file__).parent, "system_knowledge.json")

    try:
        with open(path, "r", encoding="utf-8") as f:
            raw = f.read()

        # Remove non-whitespace control characters (< 0x20) to tolerate
        # accidental characters like U+001A that break json.loads.
        sanitized = "".join(
            ch for ch in raw
            if (ch >= " " or ch in "\r\n\t")
        )

        data = json.loads(sanitized)

        SYSTEM_KNOWLEDGE = data or {}
        SYSTEM_TOPICS = SYSTEM_KNOWLEDGE.get("topics", []) or []
        print(f"[AI_SERVER] Loaded system knowledge from {path}")
    except FileNotFoundError:
        SYSTEM_KNOWLEDGE = {}
        SYSTEM_TOPICS = []
        print(f"[AI_SERVER] system_knowledge.json not found at {path}; continuing without extra context")
    except Exception as e:
        SYSTEM_KNOWLEDGE = {}
        SYSTEM_TOPICS = []
        print(f"[AI_SERVER] Failed to load system knowledge: {e}")

def get_relevant_knowledge(user_prompt: str) -> str:
    """Return a slice of system knowledge relevant to the user's prompt.

    Uses simple keyword matching against SYSTEM_TOPICS from system_knowledge.json.
    """
    if not isinstance(user_prompt, str):
        user_prompt = str(user_prompt or "")

    text = user_prompt.lower()
    if not SYSTEM_TOPICS:
        # Fall back to summary only
        return SYSTEM_KNOWLEDGE.get("summary", "")

    matched_details = []
    for topic in SYSTEM_TOPICS:
        keywords = [str(k).lower() for k in topic.get("keywords", [])]
        if any(k in text for k in keywords):
            details = topic.get("details")
            if details:
                matched_details.append(str(details))

    summary = SYSTEM_KNOWLEDGE.get("summary", "")
    if matched_details:
        return (summary + "\n\n" + "\n\n".join(matched_details)).strip()

    return summary

def fetch_book_context(user_prompt: str) -> str:
    """Optionally fetch extra book/catalog context from the main backend.

    This is best-effort: if the endpoint doesn't exist or times out, we just return "".
    """
    try:
        # Example endpoint – adjust if you later add a dedicated AI context route
        resp = requests.get(f"{LIBRARY_API_BASE}/api/ai/book-context", timeout=1.5)
        if not resp.ok:
            return ""
        payload = resp.json() or {}
        return str(
            payload.get("context")
            or payload.get("details")
            or payload.get("summary")
            or ""
        )
    except Exception:
        return ""

# 🔹 Function: run local LLaMA 3
def run_llama(user_prompt: str) -> str:
    knowledge_block = get_relevant_knowledge(user_prompt)
    book_block = fetch_book_context(user_prompt)

    context_parts: list[str] = []
    if knowledge_block:
        context_parts.append(f"System context:\n{knowledge_block}")
    if book_block:
        context_parts.append(f"Book catalog context:\n{book_block}")
    context_text = "\n\n".join(context_parts)
    context_section = f"\n\n{context_text}" if context_text else ""

    # Prefix with Jose instructions so replies are shorter and system-focused
    full_prompt = (
        f"{JOSE_SYSTEM_PROMPT}"
        f"{context_section}\n\n"
        f"User message:\n{user_prompt.strip()}\n\n"
        f"Jose (short helpful answer, using the context above when relevant):"
    )
    result = subprocess.run(
        ["ollama", "run", "llama3:8b-instruct-q4_K_M"],
        input=full_prompt.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    return result.stdout.decode("utf-8").strip()

# 🔹 Function: detect emotion via sentiment (fallback if TextBlob missing)
def detect_emotion(text):
    try:
        if _HAVE_TEXTBLOB:
            polarity = TextBlob(text).sentiment.polarity
            if polarity > 0.4:
                return "positive"
            elif polarity < -0.4:
                return "negative"
            else:
                return "neutral"
    except Exception:
        pass
    # Fallback heuristic
    low = (text or "").lower()
    pos = any(k in low for k in ["great","good","excellent","awesome","love","happy","thanks"])  # basic
    neg = any(k in low for k in ["bad","terrible","angry","sad","hate","awful","issue","error"]) 
    if pos and not neg:
        return "positive"
    if neg and not pos:
        return "negative"
    return "neutral"

# 🔹 Health check (for frontends)
@app.route("/ai/health", methods=["GET"])
def ai_health():
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=2)
        return jsonify({"ollama": r.ok}) if r.ok else (jsonify({"ollama": False}), 503)
    except Exception:
        return jsonify({"ollama": False}), 503

# 🔹 Graceful handover: allow a new instance to ask the old one to quit
@app.route("/ai/quit", methods=["POST"])
def ai_quit():
    # Only allow local requests to terminate
    if request.remote_addr not in ("127.0.0.1", "::1"):
        return jsonify({"error": "forbidden"}), 403
    shutdown = request.environ.get("werkzeug.server.shutdown")
    try:
        if shutdown:
            shutdown()
        else:
            os._exit(0)
    except Exception:
        os._exit(0)
    return jsonify({"ok": True})

# Helper: request previous instance to shut down (if any)
def _is_port_open(port: int) -> bool:
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.25):
            return True
    except Exception:
        return False

def _force_free_port_windows(port: int):
    try:
        # Query owning process via PowerShell and kill it
        cmd = [
            "powershell", "-NoProfile", "-NonInteractive", "-Command",
            f"$p=(Get-NetTCPConnection -LocalPort {AI_SERVER_PORT} -State Listen -ErrorAction SilentlyContinue).OwningProcess; if($p){{Stop-Process -Id $p -Force -ErrorAction SilentlyContinue}}"
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=2)
        time.sleep(0.6)
    except Exception:
        pass

def _request_previous_shutdown():
    try:
        requests.post(f"http://127.0.0.1:{AI_SERVER_PORT}/ai/quit", timeout=0.5)
        time.sleep(0.8)
    except Exception:
        pass
    # If still occupied, attempt Windows force-kill of the listener
    try:
        if _is_port_open(AI_SERVER_PORT) and os.name == "nt":
            _force_free_port_windows(AI_SERVER_PORT)
    except Exception:
        pass

# 🔹 Route: handle AI chat & logging
@app.route("/ai/chat", methods=["POST"])
def ai_chat():
    data = request.get_json()
    user_id = data.get("user_id", "unknown")
    prompt = data.get("prompt", "")

    # Run LLaMA 3 locally
    response_text = run_llama(prompt)

    # Detect emotion
    emotion = detect_emotion(response_text)

    # Save to ai_logs table (if DB available)
    if cursor and db:
        try:
            query = "INSERT INTO ai_logs (user_id, message, ai_response, emotion_detected) VALUES (%s, %s, %s, %s)"
            cursor.execute(query, (user_id, prompt, response_text, emotion))
            db.commit()
        except Exception as e:
            print(f"[AI_SERVER] DB log failed: {e}")

    return jsonify({
        "response": response_text,
        "emotion": emotion
    })

if __name__ == "__main__":
    # Load optional system knowledge file for Jose
    load_system_knowledge()
    # Force single-instance by asking any running server on 5002 to quit
    _request_previous_shutdown()
    # Always bind to the fixed port; no overrides allowed
    app.run(host="0.0.0.0", port=AI_SERVER_PORT, debug=False, use_reloader=False)

