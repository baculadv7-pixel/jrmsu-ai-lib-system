from flask import Flask, request, jsonify
import subprocess
import requests
import time
import os
import signal
import socket
import sys

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

# 🔹 Function: run local LLaMA 3
def run_llama(prompt):
    result = subprocess.run(
        ["ollama", "run", "llama3:8b-instruct-q4_K_M"],
        input=prompt.encode("utf-8"),
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
    # Force single-instance by asking any running server on 5002 to quit
    _request_previous_shutdown()
    # Always bind to the fixed port; no overrides allowed
    app.run(host="0.0.0.0", port=AI_SERVER_PORT, debug=False, use_reloader=False)

