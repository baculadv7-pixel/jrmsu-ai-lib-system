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
import threading
import json as pyjson
from flask_socketio import SocketIO, emit, join_room, leave_room
from db import StudentDB, AdminDB, execute_query  # MySQL integration for students and admins
import bcrypt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__)

# CORS origins (used by both HTTP and Socket.IO)
ALLOWED_ORIGINS = set((os.getenv("ALLOWED_ORIGINS") or "http://localhost:8080,http://127.0.0.1:8080").split(","))

# Socket.IO for realtime notifications
socketio = SocketIO(app, cors_allowed_origins=list(ALLOWED_ORIGINS) or "*")

# In-memory stores (dev only)
NOTIFICATIONS = {}  # user_id -> list[notification]
PASSWORD_RESET_REQUESTS = {}  # req_id -> record

# Lightweight file-backed DB (dev)
DB_PATH = os.path.join(os.path.dirname(__file__), 'data.json')
DB_LOCK = threading.Lock()
DEFAULT_DB = {
    "users": {},          # id -> user dict
    "activity": [],       # list of activity records
    "books": [],          # optional for reports
    "borrows": []         # optional for reports
}

def load_db():
    with DB_LOCK:
        try:
            if not os.path.exists(DB_PATH):
                with open(DB_PATH, 'w', encoding='utf-8') as f:
                    pyjson.dump(DEFAULT_DB, f)
            with open(DB_PATH, 'r', encoding='utf-8') as f:
                return pyjson.load(f)
        except Exception:
            return DEFAULT_DB.copy()

def save_db(db):
    with DB_LOCK:
        try:
            with open(DB_PATH, 'w', encoding='utf-8') as f:
                pyjson.dump(db, f)
        except Exception:
            pass

def log_activity(user_id: str, action: str, details: str = ""):
    db = load_db()
    rec = {"id": f"ACT-{int(time.time()*1000)}", "userId": user_id, "action": action, "details": details, "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
    db.setdefault("activity", []).append(rec)
    db["activity"] = db["activity"][-1000:]
    save_db(db)
    _emit('activity.new', user_id, rec)


# ---- Email Configuration ----
EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "noreply@jrmsu.edu.ph")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD", "")  # Set via environment variable
SENDER_NAME = os.getenv("SENDER_NAME", "JRMSU Library System")

def send_reset_email(recipient_email: str, reset_code: str, recipient_name: str = "") -> bool:
    """
    Send password reset email with code.
    Returns True if email sent successfully, False otherwise.
    If EMAIL_ENABLED is False, just prints to console (dev mode).
    """
    if not EMAIL_ENABLED or not SENDER_PASSWORD:
        print(f"[MAIL] Reset code for {recipient_email}: {reset_code} (expires in 5m)")
        print(f"[MAIL] Email sending disabled. Set EMAIL_ENABLED=true and SENDER_PASSWORD env vars to enable.")
        return True  # Consider it "sent" in dev mode
    
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'JRMSU Library - Password Reset Code'
        msg['From'] = f'{SENDER_NAME} <{SENDER_EMAIL}>'
        msg['To'] = recipient_email
        
        # Email body
        greeting = f"Hello {recipient_name}," if recipient_name else "Hello,"
        text_body = f"""
{greeting}

You have requested to reset your password for the JRMSU Library System.

Your password reset code is: {reset_code}

This code will expire in 5 minutes.

If you did not request this password reset, please ignore this email.

Best regards,
JRMSU Library System
        """
        
        html_body = f"""
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
      <h2 style="color: #003366;">JRMSU Library System</h2>
      <p>{greeting}</p>
      <p>You have requested to reset your password for the JRMSU Library System.</p>
      <p>Your password reset code is:</p>
      <h1 style="background: #f4f4f4; padding: 15px; text-align: center; letter-spacing: 5px; color: #003366;">{reset_code}</h1>
      <p style="color: #d9534f;"><strong>This code will expire in 5 minutes.</strong></p>
      <p>If you did not request this password reset, please ignore this email.</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 12px; color: #777;">Best regards,<br>JRMSU Library System</p>
    </div>
  </body>
</html>
        """
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
        
        print(f"[MAIL] ✅ Email sent successfully to {recipient_email}")
        return True
        
    except Exception as e:
        print(f"[MAIL] ❌ Failed to send email to {recipient_email}: {str(e)}")
        # Fallback to console in case of email failure
        print(f"[MAIL] Reset code for {recipient_email}: {reset_code} (expires in 5m)")
        return False


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

# ---------- Users/Profile API ----------
@app.route('/api/users')
def list_users():
    # Prefer MySQL admins and students for accuracy, then merge any file-backed users
    items = []
    try:
        arows = AdminDB.list_all_admins() or []
        for r in arows:
            items.append(_map_admin_row_to_user(r))
    except Exception:
        pass
    try:
        rows = StudentDB.list_all_students() or []
        for r in rows:
            items.append(_map_student_row_to_user(r))
    except Exception:
        pass
    try:
        fdb = load_db()
        users = list((fdb.get("users") or {}).values())
        # Avoid duplicates by id
        existing_ids = {u.get('id') for u in items}
        items.extend([u for u in users if u.get('id') not in existing_ids])
    except Exception:
        pass
    return jsonify(items=items)

@app.route('/api/users/<uid>')
def get_user(uid: str):
    # Try MySQL admin first
    try:
        arow = AdminDB.get_admin_by_id(uid)
        if arow:
            return jsonify(_map_admin_row_to_user(arow))
    except Exception:
        pass
    # Then student
    try:
        row = StudentDB.get_student_by_id(uid)
        if row:
            return jsonify(_map_student_row_to_user(row))
    except Exception:
        pass
    # Fallback to file-backed store
    fdb = load_db()
    u = fdb.get("users", {}).get(uid)
    if not u:
        u = {"id": uid}
    return jsonify(u)

# ---------- Admin-specific API (maps to users with userType == 'admin') ----------

def _ensure_users():
    db = load_db()
    db.setdefault("users", {})
    return db

# Note: All Admin routes (GET/PUT/POST) moved to line 700+ with database integration

@app.route('/api/admins/<admin_id>/2fa/setup', methods=['POST'])
def admins_2fa_setup(admin_id: str):
    # Delegate to 2FA generator, but store secret on admin
    r = twofa_generate()
    data = r.get_json()
    db = _ensure_users()
    u = (db.get('users') or {}).get(admin_id)
    if not u:
        return jsonify(error='Admin not found'), 404
    u['twoFactorSetupKey'] = data.get('secret')
    db['users'][admin_id] = u
    save_db(db)
    return jsonify(secret=data.get('secret'), otpauth=data.get('otpauth'), currentCode=data.get('currentCode'))

@app.route('/api/admins/<admin_id>/2fa/verify', methods=['POST'])
def admins_2fa_verify(admin_id: str):
    body = request.get_json(force=True) or {}
    secret = (body.get('secret') or '').strip()
    token = (body.get('token') or body.get('totpCode') or '').strip()
    ok = verify_totp_code(secret, token, window=1)
    if not ok:
        return jsonify(valid=False), 400
    db = _ensure_users()
    u = (db.get('users') or {}).get(admin_id)
    if not u:
        return jsonify(error='Admin not found'), 404
    u['twoFactorEnabled'] = True
    u['twoFactorKey'] = secret
    db['users'][admin_id] = u
    save_db(db)
    log_activity(admin_id, '2fa_enable')
    _emit('admins.updated', admin_id, {'twoFactorEnabled': True})
    return jsonify(valid=True)

@app.route('/api/admins/<admin_id>/2fa/disable', methods=['POST'])
def admins_2fa_disable(admin_id: str):
    db = _ensure_users()
    u = (db.get('users') or {}).get(admin_id)
    if not u:
        return jsonify(error='Admin not found'), 404
    u['twoFactorEnabled'] = False
    u.pop('twoFactorKey', None)
    db['users'][admin_id] = u
    save_db(db)
    log_activity(admin_id, '2fa_disable')
    _emit('admins.updated', admin_id, {'twoFactorEnabled': False})
    return jsonify(ok=True)

# ---------- Student-specific API (maps to users with userType == 'student') ----------

@app.route('/api/students', methods=['GET'])
def students_list():
    try:
        rows = StudentDB.list_all_students() or []
        students = [_map_student_row_to_user(r) for r in rows]
        return jsonify(items=students)
    except Exception:
        # Fallback
        fdb = load_db()
        users = list((fdb.get('users') or {}).values())
        students = [u for u in users if (u.get('userType') == 'student' or (u.get('role') == 'student'))]
        return jsonify(items=students)

@app.route('/api/students/<student_id>', methods=['GET'])
def students_get(student_id: str):
    try:
        row = StudentDB.get_student_by_id(student_id)
        if not row:
            return jsonify(error='Student not found'), 404
        return jsonify(_map_student_row_to_user(row))
    except Exception as e:
        # Fallback to file store
        fdb = load_db()
        u = (fdb.get('users') or {}).get(student_id)
        if not u or (u.get('userType') != 'student' and u.get('role') != 'student'):
            return jsonify(error='Student not found'), 404
        return jsonify(u)

@app.route('/api/students/<student_id>', methods=['PUT'])
def students_put(student_id: str):
    body = request.get_json(force=True) or {}
    # Map allowed editable fields to stored procedure inputs
    try:
        # Determine block from ID if not provided
        blk = body.get('block')
        if not blk and '-' in student_id:
            try:
                blk = student_id.split('-')[2]
            except Exception:
                blk = ''

        ok, msg = StudentDB.update_student_profile(
            student_id=student_id,
            department=(body.get('department') or body.get('college_department') or ''),
            course=(body.get('course') or body.get('course_major') or ''),
            year_level=(body.get('year') or body.get('year_level') or body.get('yearLevel') or ''),
            block=blk or '',
            current_street=body.get('currentStreet') or body.get('street') or '',
            current_barangay=body.get('currentBarangay') or body.get('barangay') or '',
            current_municipality=body.get('currentMunicipality') or body.get('municipality') or body.get('city') or '',
            current_province=body.get('currentProvince') or body.get('province') or '',
            current_region=body.get('currentRegion') or body.get('region') or '',
            current_zip=body.get('currentZipCode') or body.get('zipCode') or '',
            current_landmark=body.get('currentLandmark') or ''
        )
        if not ok:
            return jsonify(error=msg or 'Update failed'), 400
        # Return fresh row
        row = StudentDB.get_student_by_id(student_id) or {}
        student = _map_student_row_to_user(row)
        log_activity(student_id, 'profile_update')
        _emit('students.updated', student_id, student)
        return jsonify(ok=True, student=student)
    except Exception as e:
        # Fallback to previous file-backed logic
        fdb = _ensure_users()
        u = (fdb.get('users') or {}).get(student_id)
        if not u:
            return jsonify(error='Student not found'), 404
        # Basic merge for fallback
        for k in list(body.keys()):
            u[k] = body[k]
        fdb['users'][student_id] = u
        save_db(fdb)
        log_activity(student_id, 'profile_update')
        _emit('students.updated', student_id, u)
        return jsonify(ok=True, student=u)

@app.route('/api/students/register', methods=['POST'])
def students_register():
    body = request.get_json(force=True) or {}
    student_id = (body.get('studentId') or body.get('id') or '').strip()
    if not student_id:
        return jsonify(error='Student ID required'), 400

    # Extract block from student ID (KC-23-A-00762 => A)
    extracted_block = ''
    if '-' in student_id:
        try:
            parts = student_id.split('-')
            if len(parts) >= 3:
                extracted_block = parts[2]
        except Exception:
            pass

    # Personal Information
    first = (body.get('firstName') or '').strip()
    middle = (body.get('middleName') or '').strip()
    last = (body.get('lastName') or '').strip()
    suffix = (body.get('suffix') or '').strip()
    email = (body.get('email') or '').strip().lower()
    phone = (body.get('phone') or '').strip()
    gender = (body.get('gender') or '').strip()
    birthdate = (body.get('birthdate') or body.get('birthday') or '').strip()
    # Academic Information
    department = body.get('department') or body.get('college_department') or ''
    course = body.get('course') or body.get('course_major') or ''
    year_level = body.get('year') or body.get('year_level') or body.get('yearLevel') or ''
    block = body.get('block') or extracted_block

    # Current Address
    current_street = body.get('addressStreet') or body.get('currentAddressStreet') or ''
    current_barangay = body.get('addressBarangay') or body.get('currentAddressBarangay') or ''
    current_municipality = body.get('addressMunicipality') or body.get('currentAddressMunicipality') or body.get('municipality') or body.get('city') or ''
    current_province = body.get('addressProvince') or body.get('currentAddressProvince') or body.get('province') or ''
    current_region = body.get('addressRegion') or body.get('currentAddressRegion') or body.get('region') or ''
    current_zip = body.get('addressZip') or body.get('currentAddressZip') or body.get('zipCode') or body.get('zipcode') or ''
    current_landmark = body.get('addressPermanentNotes') or body.get('currentAddressLandmark') or ''

    # Permanent Address
    same_as_current = bool(body.get('sameAsCurrent', False))
    if same_as_current:
        permanent_street = current_street
        permanent_barangay = current_barangay
        permanent_municipality = current_municipality
        permanent_province = current_province
        permanent_region = current_region
        permanent_zip = current_zip
        permanent_notes = current_landmark
    else:
        permanent_street = body.get('permanentAddressStreet') or ''
        permanent_barangay = body.get('permanentAddressBarangay') or ''
        permanent_municipality = body.get('permanentAddressMunicipality') or ''
        permanent_province = body.get('permanentAddressProvince') or ''
        permanent_region = body.get('permanentAddressRegion') or ''
        permanent_zip = body.get('permanentAddressZip') or ''
        permanent_notes = body.get('permanentAddressNotes') or ''

    # Password hashing
    password = (body.get('password') or '').encode('utf-8')
    if not password:
        return jsonify(error='Password required'), 400
    password_hash = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

    # Use DB stored procedure
    try:
        ok, msg = StudentDB.register_student(
            student_id=student_id,
            first_name=first,
            middle_name=middle,
            last_name=last,
            suffix=suffix,
            birthdate=birthdate,
            gender=gender,
            email=email,
            phone=phone,
            department=department,
            course=course,
            year_level=year_level,
            current_street=current_street,
            current_barangay=current_barangay,
            current_municipality=current_municipality,
            current_province=current_province,
            current_region=current_region,
            current_zip=current_zip,
            current_landmark=current_landmark,
            permanent_street=permanent_street,
            permanent_barangay=permanent_barangay,
            permanent_municipality=permanent_municipality,
            permanent_province=permanent_province,
            permanent_region=permanent_region,
            permanent_zip=permanent_zip,
            permanent_notes=permanent_notes,
            same_as_current=same_as_current,
            password_hash=password_hash,
        )
        if not ok:
            return jsonify(error=msg or 'Registration failed'), 400
        # Return fresh student row
        row = StudentDB.get_student_by_id(student_id) or {}
        student = _map_student_row_to_user(row)
        log_activity(student_id, 'student_register')
        _emit('students.updated', student_id, student)
        return jsonify(ok=True, student=student, studentId=student_id)
    except Exception as e:
        # Fallback to file-backed store if DB not available
        fdb = _ensure_users()
        if student_id in fdb['users']:
            return jsonify(error='Student ID already exists'), 400
        # Minimal fallback record
        fallback = {
            'id': student_id,
            'studentId': student_id,
            'userType': 'student',
            'role': 'student',
            'firstName': first,
            'middleName': middle,
            'lastName': last,
            'suffix': suffix,
            'email': email,
            'phone': phone,
            'gender': gender,
            'birthday': birthdate,
            'age': body.get('age') or '',
            'department': department,
            'course': course,
            'year': year_level,
            'yearLevel': year_level,
            'section': block,
            'block': block,
            'address': ', '.join([p for p in [current_street, current_barangay, current_municipality, current_province, current_region, 'Philippines', current_zip] if p])
        }
        fdb['users'][student_id] = fallback
        save_db(fdb)
        log_activity(student_id, 'student_register')
        _emit('students.updated', student_id, fallback)
        return jsonify(ok=True, student=fallback, studentId=student_id)

@app.route('/api/students/<student_id>/2fa/setup', methods=['POST'])
def students_2fa_setup(student_id: str):
    r = twofa_generate()
    data = r.get_json()
    db = _ensure_users()
    u = (db.get('users') or {}).get(student_id)
    if not u:
        return jsonify(error='Student not found'), 404
    u['twoFactorSetupKey'] = data.get('secret')
    db['users'][student_id] = u
    save_db(db)
    return jsonify(secret=data.get('secret'), otpauth=data.get('otpauth'), currentCode=data.get('currentCode'))

@app.route('/api/students/<student_id>/2fa/verify', methods=['POST'])
def students_2fa_verify(student_id: str):
    body = request.get_json(force=True) or {}
    secret = (body.get('secret') or '').strip()
    token = (body.get('token') or body.get('totpCode') or '').strip()
    ok = verify_totp_code(secret, token, window=1)
    if not ok:
        return jsonify(valid=False), 400
    db = _ensure_users()
    u = (db.get('users') or {}).get(student_id)
    if not u:
        return jsonify(error='Student not found'), 404
    u['twoFactorEnabled'] = True
    u['twoFactorKey'] = secret
    db['users'][student_id] = u
    save_db(db)
    log_activity(student_id, '2fa_enable')
    _emit('students.updated', student_id, {'twoFactorEnabled': True})
    return jsonify(valid=True)

@app.route('/api/students/<student_id>/2fa/disable', methods=['POST'])
def students_2fa_disable(student_id: str):
    db = _ensure_users()
    u = (db.get('users') or {}).get(student_id)
    if not u:
        return jsonify(error='Student not found'), 404
    u['twoFactorEnabled'] = False
    u.pop('twoFactorKey', None)
    db['users'][student_id] = u
    save_db(db)
    log_activity(student_id, '2fa_disable')
    _emit('students.updated', student_id, {'twoFactorEnabled': False})
    return jsonify(ok=True)

@app.route('/api/users/<uid>', methods=['PATCH'])
def update_user(uid: str):
    body = request.get_json(force=True)
    # Try to update admin in MySQL if exists
    try:
        arow = AdminDB.get_admin_by_id(uid)
        if arow:
            ok, msg = AdminDB.update_admin_profile(
                admin_id=uid,
                first_name=body.get('firstName') or arow.get('first_name') or '',
                middle_name=body.get('middleName') or arow.get('middle_name') or '',
                last_name=body.get('lastName') or arow.get('last_name') or '',
                suffix=body.get('suffix') or arow.get('suffix') or '',
                gender=body.get('gender') or arow.get('gender') or '',
                age=body.get('age') or arow.get('age') or '',
                birthdate=body.get('birthdate') or body.get('birthday') or (str(arow.get('birthdate')) if arow.get('birthdate') else ''),
                email=body.get('email') or arow.get('email') or '',
                phone=body.get('phone') or arow.get('phone') or '',
                street=body.get('street') or arow.get('street') or '',
                barangay=body.get('barangay') or arow.get('barangay') or '',
                municipality=body.get('municipality') or body.get('city') or arow.get('municipality') or '',
                province=body.get('province') or arow.get('province') or '',
                region=body.get('region') or arow.get('region') or '',
                zip_code=body.get('zipCode') or arow.get('zip_code') or '',
                current_street=body.get('currentStreet') or arow.get('current_street') or '',
                current_barangay=body.get('currentBarangay') or arow.get('current_barangay') or '',
                current_municipality=body.get('currentMunicipality') or arow.get('current_municipality') or '',
                current_province=body.get('currentProvince') or arow.get('current_province') or '',
                current_region=body.get('currentRegion') or arow.get('current_region') or '',
                current_zip=body.get('currentZipCode') or arow.get('current_zip') or '',
                current_landmark=body.get('currentLandmark') or arow.get('current_landmark') or ''
            )
            if not ok:
                return jsonify(error=msg or 'Update failed'), 400
            new_row = AdminDB.get_admin_by_id(uid) or {}
            user = _map_admin_row_to_user(new_row)
            log_activity(uid, 'profile_update')
            _emit('user.updated', uid, user)
            return jsonify(ok=True, user=user)
    except Exception:
        pass
    # Try to update student in MySQL if exists
    try:
        row = StudentDB.get_student_by_id(uid)
        if row:
            # Only pass editable fields per requirements
            blk = body.get('block')
            if not blk and '-' in uid:
                try:
                    blk = uid.split('-')[2]
                except Exception:
                    blk = ''
            ok, msg = StudentDB.update_student_profile(
                student_id=uid,
                department=(body.get('department') or body.get('college_department') or row.get('department') or ''),
                course=(body.get('course') or body.get('course_major') or row.get('course') or ''),
                year_level=(body.get('year') or body.get('year_level') or body.get('yearLevel') or row.get('year_level') or ''),
                block=blk or (row.get('block') or ''),
                permanent_street=body.get('permanent_address_street') or row.get('permanent_address_street') or '',
                permanent_barangay=body.get('permanent_address_barangay') or row.get('permanent_address_barangay') or '',
                permanent_municipality=body.get('permanent_address_municipality') or row.get('permanent_address_municipality') or '',
                permanent_province=body.get('permanent_address_province') or row.get('permanent_address_province') or '',
                permanent_region=body.get('permanent_address_region') or row.get('permanent_address_region') or '',
                permanent_zip=body.get('permanent_address_zip') or row.get('permanent_address_zip') or '',
                current_street=body.get('current_address_street') or body.get('currentStreet') or body.get('street') or row.get('current_address_street') or '',
                current_barangay=body.get('current_address_barangay') or body.get('currentBarangay') or body.get('barangay') or row.get('current_address_barangay') or '',
                current_municipality=body.get('current_address_municipality') or body.get('currentMunicipality') or body.get('municipality') or body.get('city') or row.get('current_address_municipality') or '',
                current_province=body.get('current_address_province') or body.get('currentProvince') or body.get('province') or row.get('current_address_province') or '',
                current_region=body.get('current_address_region') or body.get('currentRegion') or body.get('region') or row.get('current_address_region') or '',
                current_zip=body.get('current_address_zip') or body.get('currentZipCode') or body.get('zipCode') or row.get('current_address_zip') or '',
                current_landmark=body.get('current_address_landmark') or body.get('currentLandmark') or row.get('current_address_landmark') or '',
                same_as_current=body.get('same_as_current') or row.get('same_as_current') or False
            )
            if not ok:
                return jsonify(error=msg or 'Update failed'), 400
            new_row = StudentDB.get_student_by_id(uid) or {}
            user = _map_student_row_to_user(new_row)
            log_activity(uid, 'profile_update')
            _emit('user.updated', uid, user)
            return jsonify(ok=True, user=user)
    except Exception:
        pass
    # Fallback to file-backed update
    fdb = load_db()
    users = fdb.setdefault("users", {})
    cur = users.get(uid, {"id": uid})
    cur.update(body or {})
    users[uid] = cur
    save_db(fdb)
    log_activity(uid, 'profile_update')
    _emit('user.updated', uid, cur)
    return jsonify(ok=True, user=cur)

# ---------- Admin-specific API ----------

@app.route('/api/admins', methods=['GET'])
def admins_list():
    try:
        rows = AdminDB.list_all_admins() or []
        admins = [_map_admin_row_to_user(r) for r in rows]
        return jsonify(items=admins)
    except Exception:
        # Fallback to file store
        fdb = load_db()
        users = list((fdb.get('users') or {}).values())
        admins = [u for u in users if (u.get('userType') == 'admin' or (u.get('role') in ['admin','assistant','staff','librarian','supervisor']))]
        return jsonify(items=admins)

@app.route('/api/admins/<admin_id>', methods=['GET'])
def admins_get(admin_id: str):
    try:
        row = AdminDB.get_admin_by_id(admin_id)
        if not row:
            return jsonify(error='Admin not found'), 404
        return jsonify(_map_admin_row_to_user(row))
    except Exception:
        fdb = load_db()
        u = (fdb.get('users') or {}).get(admin_id)
        if not u or (u.get('userType') != 'admin' and u.get('role') not in ['admin','assistant','staff','librarian','supervisor']):
            return jsonify(error='Admin not found'), 404
        return jsonify(u)

@app.route('/api/admins/<admin_id>', methods=['PUT'])
def admins_put(admin_id: str):
    body = request.get_json(force=True) or {}
    # Editable personal/contact/address fields
    try:
        # Get existing admin data to fill defaults
        existing = AdminDB.get_admin_by_id(admin_id) or {}
        ok, msg = AdminDB.update_admin_profile(
            admin_id=admin_id,
            first_name=body.get('firstName') or existing.get('first_name') or '',
            middle_name=body.get('middleName') or existing.get('middle_name') or '',
            last_name=body.get('lastName') or existing.get('last_name') or '',
            suffix=body.get('suffix') or existing.get('suffix') or '',
            gender=body.get('gender') or existing.get('gender') or '',
            age=body.get('age') or existing.get('age') or '',
            birthdate=body.get('birthdate') or body.get('birthday') or (str(existing.get('birthdate')) if existing.get('birthdate') else ''),
            email=body.get('email') or existing.get('email') or '',
            phone=body.get('phone') or existing.get('phone') or '',
            street=body.get('street') or existing.get('street') or '',
            barangay=body.get('barangay') or existing.get('barangay') or '',
            municipality=body.get('municipality') or body.get('city') or existing.get('municipality') or '',
            province=body.get('province') or existing.get('province') or '',
            region=body.get('region') or existing.get('region') or '',
            zip_code=body.get('zipCode') or existing.get('zip_code') or '',
            current_street=body.get('currentStreet') or existing.get('current_street') or '',
            current_barangay=body.get('currentBarangay') or existing.get('current_barangay') or '',
            current_municipality=body.get('currentMunicipality') or existing.get('current_municipality') or '',
            current_province=body.get('currentProvince') or existing.get('current_province') or '',
            current_region=body.get('currentRegion') or existing.get('current_region') or '',
            current_zip=body.get('currentZipCode') or existing.get('current_zip') or '',
            current_landmark=body.get('currentLandmark') or existing.get('current_landmark') or ''
        )
        if not ok:
            return jsonify(error=msg or 'Update failed'), 400
        row = AdminDB.get_admin_by_id(admin_id) or {}
        admin = _map_admin_row_to_user(row)
        log_activity(admin_id, 'profile_update')
        _emit('admins.updated', admin_id, admin)
        return jsonify(ok=True, admin=admin)
    except Exception:
        # Fallback file store
        fdb = _ensure_users()
        u = (fdb.get('users') or {}).get(admin_id)
        if not u:
            return jsonify(error='Admin not found'), 404
        for k in list(body.keys()):
            u[k] = body[k]
        fdb['users'][admin_id] = u
        save_db(fdb)
        log_activity(admin_id, 'profile_update')
        _emit('admins.updated', admin_id, u)
        return jsonify(ok=True, admin=u)

@app.route('/api/admins/register', methods=['POST'])
def admins_register():
    body = request.get_json(force=True) or {}
    admin_id = (body.get('adminId') or body.get('id') or '').strip()
    if not admin_id:
        return jsonify(error='Admin ID required'), 400

    # Personal info
    first = (body.get('firstName') or '').strip()
    middle = (body.get('middleName') or '').strip()
    last = (body.get('lastName') or '').strip()
    suffix = (body.get('suffix') or '').strip()
    email = (body.get('email') or '').strip().lower()
    phone = (body.get('phone') or '').strip()
    gender = (body.get('gender') or '').strip()
    birthdate = (body.get('birthdate') or body.get('birthday') or '').strip()
    age = body.get('age') or ''
    position = (body.get('position') or body.get('role') or 'admin').strip()

    # Permanent Address
    street = body.get('addressStreet') or body.get('street') or ''
    barangay = body.get('addressBarangay') or body.get('barangay') or ''
    municipality = body.get('addressMunicipality') or body.get('municipality') or body.get('city') or ''
    province = body.get('addressProvince') or body.get('province') or ''
    region = body.get('addressRegion') or body.get('region') or ''
    zip_code = body.get('addressZip') or body.get('zipCode') or ''
    
    # Current Address
    current_street = body.get('currentStreet') or body.get('currentAddressStreet') or ''
    current_barangay = body.get('currentBarangay') or body.get('currentAddressBarangay') or ''
    current_municipality = body.get('currentMunicipality') or body.get('currentAddressMunicipality') or ''
    current_province = body.get('currentProvince') or body.get('currentAddressProvince') or ''
    current_region = body.get('currentRegion') or body.get('currentAddressRegion') or ''
    current_zip = body.get('currentZipCode') or body.get('currentAddressZip') or ''
    current_landmark = body.get('currentLandmark') or body.get('addressPermanentNotes') or ''
    same_as_current = bool(body.get('sameAsCurrent', False))

    # Password
    password = (body.get('password') or '').encode('utf-8')
    if not password:
        return jsonify(error='Password required'), 400
    password_hash = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

    try:
        ok, msg = AdminDB.register_admin(
            admin_id=admin_id,
            first_name=first,
            middle_name=middle,
            last_name=last,
            suffix=suffix,
            birthdate=birthdate,
            gender=gender,
            email=email,
            phone=phone,
            position=position,
            street=street,
            barangay=barangay,
            municipality=municipality,
            province=province,
            region=region,
            zip_code=zip_code,
            current_street=current_street,
            current_barangay=current_barangay,
            current_municipality=current_municipality,
            current_province=current_province,
            current_region=current_region,
            current_zip=current_zip,
            current_landmark=current_landmark,
            same_as_current=same_as_current,
            password_hash=password_hash
        )
        if not ok:
            return jsonify(error=msg or 'Registration failed'), 400
        row = AdminDB.get_admin_by_id(admin_id) or {}
        admin = _map_admin_row_to_user(row)
        log_activity(admin_id, 'admin_register')
        _emit('admins.updated', admin_id, admin)
        return jsonify(ok=True, admin=admin, adminId=admin_id)
    except Exception:
        # Fallback to file store
        fdb = _ensure_users()
        if admin_id in fdb['users']:
            return jsonify(error='Admin ID already exists'), 400
        fallback = {
            'id': admin_id,
            'userType': 'admin',
            'role': position,
            'firstName': first,
            'middleName': middle,
            'lastName': last,
            'suffix': suffix,
            'email': email,
            'phone': phone,
            'gender': gender,
            'birthday': birthdate,
            'age': age,
            'address': ', '.join([p for p in [street, barangay, municipality, province, region, 'Philippines', zip_code] if p]),
            'systemTag': 'JRMSU-KCL',
            'twoFactorEnabled': False,
            'qrCodeActive': True,
            'isActive': True,
            'createdAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            'updatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        }
        fdb['users'][admin_id] = fallback
        save_db(fdb)
        log_activity(admin_id, 'admin_register')
        _emit('admins.updated', admin_id, fallback)
        return jsonify(ok=True, admin=fallback, adminId=admin_id)

@app.route('/api/users/<uid>/2fa', methods=['POST'])
def toggle_2fa(uid: str):
    db = load_db()
    body = request.get_json(force=True)
    enabled = bool(body.get('enabled'))
    users = db.setdefault("users", {})
    cur = users.get(uid, {"id": uid})
    cur['twoFactorEnabled'] = enabled
    if enabled and body.get('secret'):
        cur['twoFactorKey'] = body.get('secret')
    users[uid] = cur
    save_db(db)
    log_activity(uid, '2fa_enable' if enabled else '2fa_disable')
    _emit('user.2fa', uid, {"enabled": enabled})
    return jsonify(ok=True, user=cur)

# Activity feed
@app.route('/api/activity', methods=['GET'])
def list_activity():
    uid = request.args.get('userId')
    db = load_db()
    arr = db.get('activity', [])
    if uid:
        arr = [a for a in arr if a.get('userId') == uid]
    arr = sorted(arr, key=lambda a: a.get('timestamp',''), reverse=True)
    return jsonify(items=arr[:200])

@app.route('/api/activity', methods=['POST'])
def add_activity():
    try:
        body = request.get_json(force=True) or {}
    except Exception:
        body = {}
    uid = (body or {}).get('userId') or _get_user_id()
    action = (body or {}).get('action') or 'event'
    details = (body or {}).get('details') or ''
    log_activity(uid, action, details)
    return jsonify(ok=True)

# Reports endpoints (derived from file-backed data)
@app.route('/api/reports/top-borrowed')
def api_top_borrowed():
    db = load_db()
    counts = {}
    for b in db.get('borrows', []):
        title = b.get('bookTitle') or b.get('bookId')
        if not title: 
            continue
        counts[title] = counts.get(title, 0) + 1
    top = sorted(({"title": k, "borrows": v} for k,v in counts.items()), key=lambda x: x['borrows'], reverse=True)[:5]
    return jsonify(items=top)

@app.route('/api/reports/category-dist')
def api_category_dist():
    db = load_db()
    counts = {}
    books = db.get('books', [])
    for b in books:
        cat = (b.get('category') or 'Uncategorized')
        counts[cat] = counts.get(cat, 0) + 1
    total = len(books) or 1
    dist = [{"category": k, "percentage": round((v/total)*100)} for k,v in counts.items()]
    return jsonify(items=dist)

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

# ---- Mapping helper ----
def _map_student_row_to_user(r: dict) -> dict:
    """Map MySQL students row to frontend user structure used across pages."""
    if not r:
        return {}
    # Prefer stable keys from schema and expose aliases expected by UI
    out = {
        'id': r.get('student_id') or r.get('id'),
        'studentId': r.get('student_id') or r.get('id'),
        'userType': 'student',
        'role': 'student',
        'firstName': r.get('first_name'),
        'middleName': r.get('middle_name'),
        'lastName': r.get('last_name'),
        'suffix': r.get('suffix') or '',
        'fullName': r.get('full_name'),
        'email': r.get('email'),
        'phone': r.get('phone'),
        'gender': r.get('gender'),
        'birthday': str(r.get('birthdate')) if r.get('birthdate') is not None else '',
        'age': r.get('age'),
        'department': r.get('department'),
        'course': r.get('course'),
        'year': r.get('year_level'),
        'yearLevel': r.get('year_level'),
        'section': r.get('block'),
        'block': r.get('block'),
        # Permanent address (display/legacy)
        'address': r.get('permanent_address_full') or r.get('current_address_full') or '',
        'region': r.get('permanent_address_region') or '',
        'province': r.get('permanent_address_province') or '',
        'municipality': r.get('permanent_address_municipality') or '',
        'barangay': r.get('permanent_address_barangay') or '',
        'street': r.get('permanent_address_street') or '',
        'zipCode': r.get('permanent_address_zip') or '',
        # Current address (student-editable section)
        'currentAddress': r.get('current_address_full') or '',
        'currentRegion': r.get('current_address_region') or '',
        'currentProvince': r.get('current_address_province') or '',
        'currentMunicipality': r.get('current_address_municipality') or '',
        'currentBarangay': r.get('current_address_barangay') or '',
        'currentStreet': r.get('current_address_street') or '',
        'currentZipCode': r.get('current_address_zip') or '',
        'twoFactorEnabled': bool(r.get('two_factor_enabled')),
        'systemTag': r.get('system_tag') or 'JRMSU-KCS',
        'accountStatus': r.get('account_status') or 'active',
    }
    return out

def _map_admin_row_to_user(r: dict) -> dict:
    """Map MySQL admins row to frontend user structure."""
    if not r:
        return {}
    out = {
        'id': r.get('admin_id') or r.get('id'),
        'userType': 'admin',
        'role': r.get('position') or 'admin',
        'position': r.get('position') or 'admin',
        'firstName': r.get('first_name'),
        'middleName': r.get('middle_name'),
        'lastName': r.get('last_name'),
        'suffix': r.get('suffix') or '',
        'fullName': r.get('full_name') or ' '.join([x for x in [r.get('first_name'), r.get('last_name')] if x]),
        'email': r.get('email'),
        'phone': r.get('phone'),
        'gender': r.get('gender'),
        'birthday': str(r.get('birthdate')) if r.get('birthdate') is not None else '',
        'age': r.get('age'),
        'department': r.get('department') or '',
        'course': '',
        'year': '',
        'yearLevel': '',
        'section': '',
        'block': '',
        # Permanent Address
        'address': r.get('address') or ', '.join([p for p in [r.get('street'), r.get('barangay'), r.get('municipality'), r.get('province'), r.get('region'), 'Philippines', r.get('zip_code')] if p]),
        'region': r.get('region') or '',
        'province': r.get('province') or '',
        'municipality': r.get('municipality') or '',
        'barangay': r.get('barangay') or '',
        'street': r.get('street') or '',
        'zipCode': r.get('zip_code') or '',
        # Current Address
        'currentAddress': r.get('current_address') or ', '.join([p for p in [r.get('current_street'), r.get('current_barangay'), r.get('current_municipality'), r.get('current_province'), r.get('current_region'), 'Philippines', r.get('current_zip')] if p]),
        'currentRegion': r.get('current_region') or '',
        'currentProvince': r.get('current_province') or '',
        'currentMunicipality': r.get('current_municipality') or '',
        'currentBarangay': r.get('current_barangay') or '',
        'currentStreet': r.get('current_street') or '',
        'currentZipCode': r.get('current_zip') or '',
        'currentLandmark': r.get('current_landmark') or '',
        'sameAsCurrent': bool(r.get('same_as_current')),
        # System fields
        'twoFactorEnabled': bool(r.get('two_factor_enabled')),
        'systemTag': r.get('system_tag') or 'JRMSU-KCL',
        'accountStatus': r.get('account_status') or 'active',
        'isActive': (r.get('account_status') or 'active') == 'active',
        'qrCodeActive': True,
        'createdAt': r.get('created_at') or '',
        'updatedAt': r.get('updated_at') or '',
    }
    return out

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
        
        # Send actual email (or print to console in dev mode)
        email_sent = send_reset_email(email, code, full_name)
        
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


# Register library entry/exit endpoints
try:
    from library_session_manager import register_library_session_endpoints
    register_library_session_endpoints(app)
    print('✅ Library session endpoints loaded')
except Exception as e:
    print(f'⚠️  Library session endpoints not loaded: {e}')

# Register additional library endpoints (book operations)
try:
    from library_endpoints import register_library_endpoints
    register_library_endpoints(app)
    print('✅ Library book endpoints loaded')
except Exception as e:
    print(f'⚠️  Library book endpoints not loaded: {e}')

# Register password management endpoints
try:
    from password_endpoints import register_password_endpoints
    register_password_endpoints(app)
    print('✅ Password endpoints loaded')
except Exception as e:
    print(f'⚠️  Password endpoints not loaded: {e}')

if __name__ == '__main__':
    print('🚀 Backend running at http://localhost:5000')
    socketio.run(app, host='0.0.0.0', port=5000)
