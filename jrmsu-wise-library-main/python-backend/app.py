#!/usr/bin/env python3
from __future__ import annotations
from flask import Flask, request, jsonify, Response
from twofa import generate_base32_secret, current_totp_code, verify_totp_code, key_uri
import json
import os
import time
import uuid
import requests
import bleach
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)

# CORS origins (used by both HTTP and Socket.IO)
ALLOWED_ORIGINS = set((os.getenv("ALLOWED_ORIGINS") or "http://localhost:8080,http://127.0.0.1:8080").split(","))

# Socket.IO for realtime notifications
socketio = SocketIO(app, cors_allowed_origins=list(ALLOWED_ORIGINS) or "*")

# In-memory stores (dev only)
NOTIFICATIONS = {}  # user_id -> list[notification]
PASSWORD_RESET_REQUESTS = {}  # req_id -> record


OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL_NAME = os.getenv("OLLAMA_MODEL", "llama3:8b-instruct-q4_K_M")

@app.before_request
def handle_preflight():
    # Handle preflight early so browsers get proper headers even if no route matches OPTIONS explicitly
    if request.method == "OPTIONS":
        return ("", 204)

@app.after_request
def add_cors(resp):
    origin = request.headers.get("Origin")
    if origin and origin in ALLOWED_ORIGINS:
        resp.headers["Access-Control-Allow-Origin"] = origin
        vary = resp.headers.get("Vary")
        resp.headers["Vary"] = f"{vary}, Origin" if vary else "Origin"
    else:
        resp.headers.setdefault("Access-Control-Allow-Origin", "*")
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-User-Id"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp


@app.route('/')
def root():
    return jsonify(message='JRMSU AI Library Backend is running!', status='ok')

@app.route('/health')
def health():
    return jsonify(status='ok')

# ---------- Socket.IO ----------
@socketio.on('connect')
def on_connect():
    user_id = request.args.get('userId') or request.headers.get('X-User-Id') or 'guest'
    join_room(f'user:{user_id}')
    emit('connected', {'ok': True, 'userId': user_id})

@socketio.on('disconnect')
def on_disconnect():
    # Rooms are auto-learned; no explicit leave required here
    pass

# Helpers

def _get_user_id():
    return request.headers.get('X-User-Id') or (request.json or {}).get('userId') or request.args.get('userId') or 'guest'

def _ensure_user_store(user_id: str):
    if user_id not in NOTIFICATIONS:
        NOTIFICATIONS[user_id] = []
    return NOTIFICATIONS[user_id]

def _emit(event: str, user_id: str, payload: dict):
    socketio.emit(event, payload, room=f'user:{user_id}')

def _new_notif_id():
    return f"notif-{uuid.uuid4()}"

@app.route('/ai/health')
def ai_health():
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        return jsonify(ollama=r.ok)
    except Exception:
        return jsonify(ollama=False), 503

@app.route('/ai/chat', methods=['POST'])
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
            json={
                "model": MODEL_NAME,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": 0.2,
                    "top_p": 0.9,
                    "repeat_penalty": 1.1,
                    "num_ctx": 2048,
                    "num_predict": 256,
                    "keep_alive": "30m"
                }
            },
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

# ---- Forgot Password API (legacy) ----
RESET_CODES = {}

@app.route('/auth/request-reset', methods=['POST'])
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
        print(f"[MAIL] Reset code for {email}: {code} (expires in 5m)")
        # Push a notification to user (dev)
        if user_id:
            lst = _ensure_user_store(user_id)
            notif = {
                'id': _new_notif_id(),
                'user_id': user_id,
                'title': 'Password reset code sent',
                'body': f'A reset code was sent to {email}',
                'type': 'password_reset_request',
                'meta': {'email': email},
                'created_at': int(time.time()),
                'read': False,
                'action_required': False,
                'action_payload': None,
                'actor_id': 'system',
            }
            lst.insert(0, notif)
            _emit('notification.new', user_id, notif)
        return jsonify(ok=True)
    elif method == 'admin':
        # Notify admins (dev: broadcast to ADMIN)
        req_id = f"req-{uuid.uuid4()}"
        PASSWORD_RESET_REQUESTS[req_id] = {
            'id': req_id,
            'user_id': user_id or email,
            'email': email,
            'status': 'pending_admin',
            'created_at': int(time.time()),
        }
        admin_id = 'ADMIN'
        lst = _ensure_user_store(admin_id)
        notif = {
            'id': _new_notif_id(),
            'user_id': admin_id,
            'title': '🔔 Password Reset Request',
            'body': f'Reset requested by {full_name or user_id or email}',
            'type': 'password_reset_request',
            'meta': {'requestId': req_id, 'requesterId': user_id or email},
            'created_at': int(time.time()),
            'read': False,
            'action_required': True,
            'action_payload': {'actions': ['grant','decline']},
            'actor_id': user_id or email,
        }
        lst.insert(0, notif)
        _emit('notification.new', admin_id, notif)
        return jsonify(ok=True)
    else:
        return jsonify(error='Invalid method'), 400

@app.route('/auth/verify-code', methods=['POST'])
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
    return jsonify(ok=True, token=f"tok-{uuid.uuid4()}")

@app.route('/auth/reset-password', methods=['POST'])
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
    # In real deployment, update user record with bcrypt
    del RESET_CODES[email]
    # Notify user
    user_id = rec.get('user_id') or email
    lst = _ensure_user_store(user_id)
    notif = {
        'id': _new_notif_id(),
        'user_id': user_id,
        'title': 'Password reset successful',
        'body': 'Your password was changed successfully',
        'type': 'system_alert',
        'meta': {},
        'created_at': int(time.time()),
        'read': False,
        'action_required': False,
        'action_payload': None,
        'actor_id': 'system',
    }
    lst.insert(0, notif)
    _emit('notification.new', user_id, notif)
    return jsonify(ok=True)

# ---- New API routes to align with plan ----

@app.route('/api/auth/send-reset-email', methods=['POST'])
def api_send_reset_email():
    body = request.get_json(force=True)
    user = (body.get('userIdOrEmail') or body.get('userId') or body.get('email') or '').strip()
    if not user:
        return jsonify(error='userIdOrEmail required'), 400
    email = body.get('email') or (user if '@' in user else '')
    # Reuse legacy route logic
    return auth_request_reset()

@app.route('/api/auth/verify-reset-code', methods=['POST'])
def api_verify_reset_code():
    return auth_verify_code()

@app.route('/api/auth/message-admin', methods=['POST'])
def api_message_admin():
    # Reuse legacy admin branch
    req = request.get_json(force=True)
    req['method'] = 'admin'
    with app.test_request_context(json=req):
        return auth_request_reset()

@app.route('/api/auth/admin-respond', methods=['POST'])
def api_admin_respond():
    body = request.get_json(force=True)
    request_id = body.get('requestId')
    action = (body.get('action') or '').lower()
    admin_id = body.get('adminId') or 'ADMIN'
    rec = PASSWORD_RESET_REQUESTS.get(request_id)
    if not rec:
        return jsonify(error='Request not found'), 404
    if action not in ('grant','decline'):
        return jsonify(error='Invalid action'), 400
    rec['status'] = 'approved' if action == 'grant' else 'declined'
    # Notify requester
    user_id = rec.get('user_id')
    lst = _ensure_user_store(user_id)
    notif = {
        'id': _new_notif_id(),
        'user_id': user_id,
        'title': 'Admin response to password reset',
        'body': f'Your request was {rec["status"]} by {admin_id}',
        'type': 'admin_response',
        'meta': {'requestId': request_id, 'status': rec['status']},
        'created_at': int(time.time()),
        'read': False,
        'action_required': False,
        'action_payload': None,
        'actor_id': admin_id,
    }
    lst.insert(0, notif)
    _emit('notification.admin_response', user_id, {'requestId': request_id, 'status': rec['status']})
    _emit('notification.new', user_id, notif)
    return jsonify(ok=True)

@app.route('/api/auth/verify-2fa', methods=['POST'])
def api_verify_2fa():
    body = request.get_json(force=True)
    secret = (body.get('secret') or '').strip()
    token = (body.get('totpCode') or body.get('token') or '').strip()
    window = int(body.get('window', 1))
    ok = verify_totp_code(secret, token, window=window)
    return jsonify(valid=ok)

@app.route('/api/auth/reset-password', methods=['POST'])
def api_reset_password():
    return auth_reset_password()

# ---- AI chat alias ----
@app.route('/api/ai/chat', methods=['POST'])
def api_ai_chat():
    return ai_chat()

# ---- Notifications API ----
@app.route('/api/notifications')
def api_notifications():
    user_id = _get_user_id()
    filter_val = request.args.get('filter','all')
    page = int(request.args.get('page',1))
    limit = min(100, int(request.args.get('limit',25)))
    lst = _ensure_user_store(user_id)
    items = sorted(lst, key=lambda x: x.get('created_at',0), reverse=True)
    if filter_val == 'unread':
        items = [n for n in items if not n.get('read')]
    total = len(items)
    start = (page-1)*limit
    end = start + limit
    return jsonify(items=items[start:end], total=total, unread=sum(1 for n in lst if not n.get('read')))

@app.route('/api/notifications/mark-read', methods=['POST'])
def api_notifications_mark_read():
    user_id = _get_user_id()
    body = request.get_json(force=True)
    ids = body.get('notificationIds') or []
    lst = _ensure_user_store(user_id)
    updated = []
    for n in lst:
        if n['id'] in ids and not n.get('read'):
            n['read'] = True
            updated.append(n)
    for n in updated:
        _emit('notification.update', user_id, n)
    return jsonify(ok=True, updated=len(updated))

@app.route('/api/notifications/mark-all-read', methods=['POST'])
def api_notifications_mark_all_read():
    user_id = _get_user_id()
    lst = _ensure_user_store(user_id)
    for n in lst:
        n['read'] = True
    _emit('notification.mark_all_read', user_id, {'userId': user_id, 'timestamp': int(time.time())})
    return jsonify(ok=True)

@app.route('/api/notifications/<nid>')
def api_notifications_get(nid: str):
    user_id = _get_user_id()
    lst = _ensure_user_store(user_id)
    for n in lst:
        if n['id'] == nid:
            if not n.get('read'):
                n['read'] = True
                _emit('notification.update', user_id, n)
            return jsonify(n)
    return jsonify(error='Not found'), 404

@app.route('/api/notifications/<nid>/action', methods=['POST'])
def api_notifications_action(nid: str):
    # For admin actions on notifications (e.g., grant/decline)
    body = request.get_json(force=True)
    action = (body.get('action') or '').lower()
    admin_id = body.get('adminId') or 'ADMIN'
    # No-op demo: just broadcast update back
    user_id = _get_user_id()
    lst = _ensure_user_store(user_id)
    for n in lst:
        if n['id'] == nid:
            n['meta'] = {**(n.get('meta') or {}), 'adminAction': action, 'adminId': admin_id}
            _emit('notification.update', user_id, n)
            return jsonify(ok=True)
    return jsonify(error='Not found'), 404

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
    print('🚀 Backend running at http://localhost:5000')
    socketio.run(app, host='0.0.0.0', port=5000)
