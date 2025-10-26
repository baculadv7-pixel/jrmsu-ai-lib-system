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

# ---- Forgot Password API ----
RESET_CODES = {}

@app.route('/auth/request-reset', methods=['POST'])
@limiter.limit("30 per minute")
def auth_request_reset():
    body = request.get_json(force=True)
    method = (body.get('method') or 'email').lower()
    user_id = (body.get('userId') or '').strip()
    email = (body.get('email') or '').strip().lower()
    full_name = (body.get('fullName') or '').strip()
    if not email:
        return jsonify(error='Email required'), 400
    if method == 'email':
        # generate code
        code = f"{int(time.time())%1000000:06d}"
        expires_at = int(time.time()) + 300  # 5 minutes
        RESET_CODES[email] = { 'code': code, 'expires_at': expires_at, 'user_id': user_id, 'full_name': full_name }
        # TODO: send email via SMTP configured env; for now just log to server
        print(f"[MAIL] Reset code for {email}: {code} (expires in 5m)")
        return jsonify(ok=True)
    elif method == 'admin':
        # Admin request acknowledged; delivery to admins is handled by app layer notifications
        return jsonify(ok=True)
    else:
        return jsonify(error='Invalid method'), 400

@app.route('/auth/verify-code', methods=['POST'])
@limiter.limit("60 per minute")
def auth_verify_code():
    body = request.get_json(force=True)
    email = (body.get('email') or '').strip().lower()
    code = (body.get('code') or '').strip()
    rec = RESET_CODES.get(email)
    if not rec:
        return jsonify(error='No code pending'), 400
    if int(time.time()) > int(rec.get('expires_at', 0)):
        return jsonify(error='Expired code'), 400
    if code != str(rec.get('code')):
        return jsonify(error='Invalid code'), 400
    return jsonify(ok=True)

@app.route('/auth/reset-password', methods=['POST'])
@limiter.limit("30 per minute")
def auth_reset_password():
    body = request.get_json(force=True)
    email = (body.get('email') or '').strip().lower()
    code = (body.get('code') or '').strip()
    new_password = (body.get('newPassword') or '').strip()
    if len(new_password) < 8:
        return jsonify(error='Password too short'), 400
    rec = RESET_CODES.get(email)
    if not rec:
        return jsonify(error='No code pending'), 400
    if int(time.time()) > int(rec.get('expires_at', 0)):
        return jsonify(error='Expired code'), 400
    if code != str(rec.get('code')):
        return jsonify(error='Invalid code'), 400
    # At this backend layer, we only confirm the reset; the frontend updates its local DB/session.
    # In a real deployment, update the actual user record here (e.g., Supabase/SQL) with bcrypt.
    # Clear the code after use
    del RESET_CODES[email]
    return jsonify(ok=True)

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
