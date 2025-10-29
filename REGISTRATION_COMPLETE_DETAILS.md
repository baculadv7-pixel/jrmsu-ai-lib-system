# Registration System - Complete Details (Continuation)

## 3. REGISTRATION SYSTEM - Complete Line-by-Line Details

### Phase 3: Institutional Information (75% Complete)

**Location:** `src/pages/RegistrationInstitution.tsx`

**Student Fields:**
- Student ID: KC-23-A-00762 format
- Department: CTE, CBA, CAFSE, SCJE, CCS
- Course/Major: Text input
- Year Level: 1, 2, 3, 4
- Block: Auto-extracted from ID (read-only)

**Admin Fields:**
- Admin ID: KCL-00001 format
- Position: Librarian, Assistant, Aide, System Admin
- Email: Confirmation required
- Contact: 11 digits

### Phase 4: Security Setup (100% Complete)

**Location:** `src/pages/RegistrationSecurity.tsx`

**Password Requirements:**
- Min 8 characters
- 1 uppercase letter
- 1 number
- Passwords must match

**QR Code Generation:**
- Auto-generated on "Finish"
- Logo: JRMSU-KCL (Admin) or JRMSU-KCS (Student)
- Contains encrypted auth key

### Backend Registration Endpoints

**Location:** `python-backend/app.py`

**Student Registration:**
- Lines 468-550: `/api/students/register` POST
- Validates ID, hashes password, generates QR
- Inserts into students table

**Admin Registration:**
- Lines 279-360: `/api/admins/register` POST
- Validates ID, hashes password, generates QR
- Inserts into admins table

### Database Schemas

**Admin Table:** `database/admin_registration_schema.sql` (385 lines)
**Student Table:** `database/student_registration_schema.sql` (452 lines)

Both include:
- Personal info fields
- Address fields (current & permanent)
- Security fields (password_hash, 2FA)
- QR code data
- System tags
- Timestamps and status

## API Endpoints Summary

### Login
- POST /auth/login
- POST /auth/verify-totp

### Password Reset
- POST /auth/request-reset
- POST /auth/verify-code
- POST /auth/reset-password

### Registration
- POST /api/students/register
- POST /api/admins/register

## Total Files: 25 core files across frontend, backend, and database
