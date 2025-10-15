from flask import Flask, request, jsonify
import subprocess
import mysql.connector
from textblob import TextBlob

app = Flask(__name__)

# 🧩 Database connection (adjust to your .env or XAMPP settings)
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",  # change if needed
    database="library_system_ai"
)
cursor = db.cursor()

# 🔹 Function: run local LLaMA 3
def run_llama(prompt):
    result = subprocess.run(
        ["ollama", "run", "llama3:8b-instruct-q4_K_M"],
        input=prompt.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    return result.stdout.decode("utf-8").strip()

# 🔹 Function: detect emotion via sentiment
def detect_emotion(text):
    polarity = TextBlob(text).sentiment.polarity
    if polarity > 0.4:
        return "positive"
    elif polarity < -0.4:
        return "negative"
    else:
        return "neutral"

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

    # Save to ai_logs table
    query = "INSERT INTO ai_logs (user_id, message, ai_response, emotion_detected) VALUES (%s, %s, %s, %s)"
    cursor.execute(query, (user_id, prompt, response_text, emotion))
    db.commit()

    return jsonify({
        "response": response_text,
        "emotion": emotion
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)


