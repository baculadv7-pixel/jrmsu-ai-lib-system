#!/usr/bin/env python3
from __future__ import annotations
from flask import Flask, request, jsonify
from twofa import generate_base32_secret, current_totp_code, verify_totp_code, key_uri
import json

app = Flask(__name__)

@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp

@app.route('/health')
def health():
    return jsonify(status='ok')

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
