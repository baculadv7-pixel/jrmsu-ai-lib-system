#!/usr/bin/env python3
from __future__ import annotations
from flask import Flask, request, jsonify, Response
from twofa import generate_base32_secret, current_totp_code, verify_totp_code, key_uri
import json
import os
import time
import requests
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import bleach

app = Flask(__name__)

# Rate limiter
limiter = Limiter(get_remote_address, app=app, default_limits=["100 per hour"])  # adjust as needed

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3:8b-instruct-q4_K_M")

# CORS
@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp


@app.route('/health')
def health():
    return jsonify(status='ok')

@app.route('/ai/health')
def ai_health():
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        return jsonify(ollama=r.ok)
    except Exception:
        return jsonify(ollama=False), 503

@app.route('/ai/chat', methods=['POST'])
@limiter.limit("30 per minute")
def ai_chat():
    body = request.get_json(force=True)
    raw_message = (body.get('message') or '').strip()
    # Sanitize input to prevent prompt injection / XSS
    message = bleach.clean(raw_message, strip=True)
    history = body.get('history') or []
    messages = [{"role": "system", "content": "You are Jose, the JRMSU Library AI assistant."}]
    # Include up to last 5 history messages, sanitized
    for h in history[-5:]:
        role = h.get('role') in ('user', 'assistant', 'system') and h.get('role') or 'user'
        content = bleach.clean(str(h.get('content') or ''), strip=True)
        messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    try:
        r = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={"model": MODEL_NAME, "messages": messages, "stream": False},
            timeout=60,
        )
        if not r.ok:
            return jsonify(error="Ollama request failed", details=r.text), 502
        data = r.json()
        content = (data.get('message') or {}).get('content', '')
        return jsonify(content=content)
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/2fa/generate', methods=['POST'])
def twofa_generate():
    payload = request.get_json(silent=True) or {}
    account = payload.get('account') or 'user'
    issuer = payload.get('issuer') or 'JRMSU-LIBRARY'
    secret = generate_base32_secret(32)
    uri = key_uri(secret, account_name=account, issuer=issuer)
    code = current_totp_code(secret)
    return jsonify(secret=secret, otpauth=uri, currentCode=code)

@app.route('/2fa/verify', methods=['POST'])
def twofa_verify():
    payload = request.get_json(force=True)
    secret = (payload.get('secret') or '').strip()
    token = (payload.get('token') or '').strip()
    window = int(payload.get('window', 1))
    ok = verify_totp_code(secret, token, window=window)
    return jsonify(valid=ok)

@app.route('/qr/validate', methods=['POST'])
def qr_validate():
    body = request.get_json(force=True)
    raw = body.get('data')
    try:
        obj = json.loads(raw) if isinstance(raw, str) else raw
        required = ['systemId', 'userId', 'fullName', 'userType', 'systemTag']
        if not all(k in obj for k in required):
            return jsonify(valid=False, error='Missing required fields')
        if obj.get('systemId') != 'JRMSU-LIBRARY':
            return jsonify(valid=False, error='Invalid systemId')
        if not (obj.get('encryptedPasswordToken') or obj.get('sessionToken') or obj.get('encryptedToken')):
            return jsonify(valid=False, error='Missing auth token')
        expected = 'JRMSU-KCL' if obj.get('userType') == 'admin' else 'JRMSU-KCS'
        if obj.get('systemTag') != expected:
            return jsonify(valid=False, error='System tag mismatch')
        return jsonify(valid=True)
    except Exception as e:
        return jsonify(valid=False, error=str(e)), 400


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001)
