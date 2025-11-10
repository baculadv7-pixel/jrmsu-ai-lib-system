#!/usr/bin/env python3
"""
Two-Factor Authentication (TOTP) utilities using pyotp (RFC 6238)

Functions:
- generate_base32_secret(length=32)
- current_totp_code(secret)
- verify_totp_code(secret, token, window=1)
- key_uri(secret, account_name, issuer)
"""
from __future__ import annotations
import pyotp
import secrets
import string

ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

def generate_base32_secret(length: int = 32) -> str:
    length = max(16, min(length, 64))
    return "".join(secrets.choice(ALPHABET) for _ in range(length))

def current_totp_code(secret: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.now()

def verify_totp_code(secret: str, token: str, window: int = 1) -> bool:
    token = (token or "").strip().replace(" ", "")
    if not token.isdigit() or len(token) != 6:
        return False
    totp = pyotp.TOTP(secret)
    # window allows +/- window steps (30s per step)
    return bool(totp.verify(token, valid_window=window))

def key_uri(secret: str, account_name: str, issuer: str = "JRMSU-LIBRARY") -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=account_name, issuer_name=issuer)

if __name__ == "__main__":
    # Demo usage
    secret = generate_base32_secret()
    print("Secret:", secret)
    print("Key URI:", key_uri(secret, account_name="demo-user"))
    code = current_totp_code(secret)
    print("Current code:", code)
    print("Verify:", verify_totp_code(secret, code))
