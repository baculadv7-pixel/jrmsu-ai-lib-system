# Quick Reference: Login, Forgot Password & Registration Files

**Complete file locations with exact line numbers**

---

## 1. LOGIN SYSTEM - Complete Details

### Frontend Files

#### 📄 Main Login Page
**Location:** `src/pages/Login.tsx` (329 lines)

**UI Components & Design:**
- Lines 1-16: Imports (UI components, icons, hooks)
- Lines 17-40: State management setup
- Lines 41-42: ID validation regex patterns
  - Admin: `/^KCL-\d{5}$/` (e.g., KCL-00001)
  - Student: `/^KC-\d{2}-[A-D]-\d{5}$/` (e.g., KC-23-A-00762)
- Lines 44-60: Helper functions (sanitize, validation)
- Lines 62-97: `handleLogin()` function - Main login logic
- Lines 99-238: **UI/Design Section:**
  - Lines 100-114: Header with JRMSU logo
  - Lines 118-136: User type tabs (Student/Admin)
  - Lines 139-157: Login method buttons (Manual/QR)
  - Lines 160-227: **Manual Login Form:**
    - Lines 163-186: ID input field with validation
    - Lines 189-210: Password input with show/hide toggle
    - Lines 214-217: "Forgot Password?" link
    - Lines 220-222: Login button
    - Lines 224-226: Register link
  - Lines 228-236: QR Code login component
- Lines 240-249: **Forgot Password Dialog** (overlay)
- Lines 251-309: **2FA Dialog:**
  - Lines 260-273: 6-digit code input
  - Lines 274-306: Verify button with backend call
- Lines 311-323: **Welcome Message** overlay

**Key Functions:**
- Line 62: `handleLogin()` - Validates ID format, calls signIn()
- Line 77: Calls `signIn()` from AuthContext
- Lines 80-85: Checks for 2FA requirement
- Lines 286-290: Backend 2FA verification call to `http://localhost:5000/2fa/verify`

**Styling:**
- Line 100: Gradient background `bg-gradient-to-br from-background via-background to-primary/5`
- Line 101: Card with shadow `shadow-jrmsu`
- Line 104: Logo size `h-24 w-24`

---

#### 📄 QR Code Login Component
**Location:** `src/components/auth/QRCodeLogin.tsx` (479 lines)

**UI Components & Design:**
- Lines 1-13: Imports (Camera, QR scanner, auth hooks)
- Lines 15-34: TypeScript interfaces for QR data structure
- Lines 36-46: State management
- Lines 48-134: **`proceedWithAutoLogin()` function:**
  - Lines 56-64: QR data validation
  - Line 69: Calls `signInWithQR()` from AuthContext
  - Lines 74-92: Welcome message display
  - Lines 96-133: Error handling with detailed logging
- Lines 136-200: **`handleQRDetected()` function:**
  - Lines 142-144: Parse QR JSON data
  - Lines 150-180: Validate QR code structure
  - Line 195: Trigger auto-login
- Lines 202-479: **UI Rendering:**
  - Lines 220-240: Camera initialization status
  - Lines 242-280: QR Scanner component
  - Lines 282-320: Success state display
  - Lines 322-360: 2FA input (if required)
  - Lines 362-400: Error display
  - Lines 402-440: Back to manual button

**Key Features:**
- Line 69: Auto-login on QR scan
- Lines 286-290: Real-time QR scanning with html5-qrcode
- Lines 322-360: Optional 2FA verification

---

#### 📄 Authentication Context
**Location:** `src/context/AuthContext.tsx` (295 lines)

**Core Authentication Logic:**
- Lines 1-7: Imports and type definitions
- Lines 8-13: AuthUser interface
- Lines 15-26: AuthContextValue interface with all auth functions
- Lines 30: Storage key `jrmsu_auth_session`
- Lines 32-76: **AuthProvider setup:**
  - Lines 36-41: `signOut()` function
  - Lines 43-68: Session persistence and hydration
  - Lines 70-75: 30-minute inactivity auto-logout
- Lines 78-120: **`signIn()` function:**
  - Lines 84-89: ID format validation
  - Line 92: Call `databaseService.authenticateUser()`
  - Lines 100-120: Role verification and session creation
- Lines 122-160: **`signInWithQR()` function:**
  - Lines 130-145: QR data validation
  - Lines 147-160: Session creation from QR data
- Lines 162-170: **`verifyTotp()` function** - 2FA verification
- Lines 172-180: **`enableTwoFactor()` / `disableTwoFactor()`**
- Lines 182-190: **`refreshSession()`** - Update user data
- Lines 192-200: **`updateUser()`** - Partial user updates

**Session Storage:**
- Line 30: LocalStorage key for session
- Line 38: Token storage key
- Lines 60-62: Session object structure

---

### Backend Files

#### 📄 Main Backend API
**Location:** `python-backend/app.py` (1,485 lines)

**Login Endpoints:**
- Lines 1199-1235: `/auth/request-reset` - Password reset request
- Lines 1281-1315: `/auth/reset-password` - Password reset execution
- Lines 1320-1328: `/api/auth/send-reset-email` - Email reset
- Lines 1330-1332: `/api/auth/verify-reset-code` - Code verification
- Lines 1384-1386: `/api/auth/reset-password` - Alternative reset endpoint

**Email Service:**
- Lines 70-76: Email configuration (SMTP settings)
- Lines 78-150: **`send_reset_email()` function:**
  - Lines 84-87: Dev mode check
  - Lines 89-135: Email message creation (HTML + plain text)
  - Lines 137-142: SMTP send
  - Lines 146-150: Error handling

**2FA Verification:**
- Lines 1370-1382: `/2fa/verify` endpoint
  - Line 1381: Calls `verify_totp_code()` from twofa.py

**Key Functions:**
- Lines 186-210: `list_users()` - Get all users
- Lines 212-233: `get_user(uid)` - Get single user
- Lines 237-240: `_ensure_users()` - Initialize user store

---

#### 📄 Database Module
**Location:** `python-backend/db.py`

**Classes:**
- `StudentDB` class:
  - `get_student_by_id(student_id)` - Fetch student
  - `list_all_students()` - Get all students
  - `create_student(data)` - Insert new student
  - `update_student(student_id, data)` - Update student
  - `authenticate_student(student_id, password)` - Verify login
  
- `AdminDB` class:
  - `get_admin_by_id(admin_id)` - Fetch admin
  - `list_all_admins()` - Get all admins
  - `create_admin(data)` - Insert new admin
  - `update_admin(admin_id, data)` - Update admin
  - `authenticate_admin(admin_id, password)` - Verify login

**Helper Functions:**
- `execute_query(query, params)` - Execute SQL
- `hash_password(password)` - Bcrypt hashing
- `verify_password(password, hash)` - Verify bcrypt

---

#### 📄 2FA Module
**Location:** `python-backend/twofa.py`

**Functions:**
- `generate_base32_secret()` - Generate TOTP secret
- `current_totp_code(secret)` - Get current 6-digit code
- `verify_totp_code(secret, token, window=1)` - Verify user code
- `key_uri(secret, name, issuer)` - Generate QR URI for Google Authenticator

---

### Service Files

#### 📄 Database Service
**Location:** `src/services/database.ts`

**Key Functions:**
- `authenticateUser(id, password)` - Verify credentials
- `getUserById(id)` - Fetch user by ID
- `getUserByEmail(email)` - Fetch user by email
- `setUserPassword(id, newPassword)` - Update password
- `getAllUsers()` - List all users

**User Interface:**
```typescript
interface User {
  id: string;
  fullName: string;
  email: string;
  userType: "student" | "admin";
  passwordHash: string;
  twoFactorEnabled: boolean;
  twoFactorKey?: string;
  qrCodeData?: string;
}
```

---

#### 📄 QR Service
**Location:** `src/services/qr.ts`

**Key Functions:**
- `generateQRCode(userData)` - Create QR code
- `parseQRData(qrString)` - Parse scanned QR
- `validateQRLogin(qrData)` - Validate QR structure
- `encryptAuthKey(key)` - Encrypt auth data

**QR Data Structure:**
```typescript
{
  userId: string;
  fullName: string;
  userType: "admin" | "student";
  systemId: "JRMSU-LIBRARY";
  systemTag: "JRMSU-KCL" | "JRMSU-KCS";
  sessionToken: string;
  timestamp: number;
}
```

---

### Database Schema

#### 📄 Admin Login Fields
**Location:** `database/admin_registration_schema.sql` (385 lines)

**Login-Related Fields:**
- Lines 10-12: `id`, `admin_id` (Primary keys)
- Line 82: `password_hash` - Bcrypt hash
- Lines 83-84: `two_factor_enabled`, `two_factor_secret`
- Lines 87-89: `qr_code_data`, `qr_code_generated_at`
- Lines 95-96: `last_login`, `account_status`

---

#### 📄 Student Login Fields
**Location:** `database/student_registration_schema.sql` (452 lines)

**Login-Related Fields:**
- Lines 10-12: `id`, `student_id` (Primary keys)
- Line 86: `password_hash` - Bcrypt hash
- Lines 87-88: `two_factor_enabled`, `two_factor_secret`
- Lines 91-93: `qr_code_data`, `qr_code_generated_at`
- Lines 99-100: `last_login`, `account_status`

---

## 2. FORGOT PASSWORD SYSTEM - Complete Details

### Frontend Files

#### 📄 Forgot Password Page
**Location:** `src/pages/ForgotPassword.tsx` (165 lines)

**UI Components & Design:**
- Lines 1-10: Imports (UI components, hooks, services)
- Lines 12-28: State management (method, email, code, password)
- Lines 30-48: Helper functions (code storage, validation)
- Lines 50-64: **`sendResetCode()` function:**
  - Line 55: Validate email with `databaseService.getUserByEmail()`
  - Lines 60-63: Generate 6-digit code, store with 10-min expiry
- Lines 66-73: **`verifyCode()` function:**
  - Lines 67-70: Check code validity and expiry
- Lines 75-89: **`resetPassword()` function:**
  - Lines 79-82: Update password in database
- Lines 91-165: **UI Rendering:**
  - Lines 93-95: Navbar and Sidebar
  - Lines 98-100: Card header
  - Lines 102-120: Email input section
  - Lines 122-140: Code verification section
  - Lines 142-165: New password section

**Key Features:**
- Lines 31-40: LocalStorage code management with expiry
- Lines 60: 6-digit random code generation
- Line 76: Password strength validation (min 8 chars)

---

#### 📄 Forgot Password Overlay
**Location:** `src/components/auth/ForgotPasswordOverlay.tsx` (319 lines)

**UI Components & Design:**
- Lines 1-12: Imports (UI components, services, hooks)
- Lines 14-42: State management (3 methods, cooldowns, verification)
- Lines 44-56: **Admin request rate limiting:**
  - Lines 44-48: Read admin attempts from localStorage
  - Lines 50-55: Write admin attempts with block duration
- Lines 58-72: **Auto-fill user data by ID:**
  - Lines 60-68: Hydrate user info from database
- Lines 74: Password validation check
- Lines 78-94: **Cooldown timers:**
  - Lines 78-87: Email cooldown (60 seconds)
  - Lines 89-94: Admin cooldown (5 minutes after 3 attempts)
- Lines 96-140: **`sendResetCode()` function:**
  - Lines 97-100: Validate user exists
  - Lines 102-120: Call backend API `AuthResetService.requestResetByEmail()`
  - Lines 122-130: Start 60-second cooldown
  - Lines 132-140: Notify user of success
- Lines 142-180: **`verifyCode()` function:**
  - Lines 145-160: Call backend `/auth/verify-code`
  - Lines 162-170: Handle verification result
- Lines 182-220: **`resetPassword()` function:**
  - Lines 185-200: Call backend `/auth/reset-password`
  - Lines 202-210: Show success message
  - Lines 212-220: Redirect to login
- Lines 222-319: **UI Rendering:**
  - Lines 230-260: Method selection tabs (Email/Admin/2FA)
  - Lines 262-290: **Email Method UI:**
    - Lines 265-275: User ID/Email input
    - Lines 277-285: Send code button with cooldown
    - Lines 287-295: Code input field
    - Lines 297-305: Verify button
  - Lines 307-340: **Admin Request UI:**
    - Lines 310-320: Request description
    - Lines 322-330: Request button with rate limiting
    - Lines 332-340: Block warning dialog
  - Lines 342-380: **2FA Method UI:**
    - Lines 345-355: TOTP code input
    - Lines 357-365: Verify button
  - Lines 382-400: **New Password Section:**
    - Lines 385-392: New password input
    - Lines 394-400: Confirm password input
  - Lines 402-410: Reset button

**Security Features:**
- Lines 44-56: Rate limiting (3 attempts, 5-min block)
- Lines 78-87: 60-second cooldown between emails
- Lines 96-100: User validation before sending code
- Lines 142-170: Code expiry check (5 minutes)

---

### Backend Files

#### 📄 Password Reset Endpoints
**Location:** `python-backend/app.py`

**Reset Request Endpoint:**
- Lines 1199-1235: **`/auth/request-reset` POST:**
  - Lines 1200-1207: Parse request body (method, userId, email)
  - Lines 1208-1235: **Email method:**
    - Line 1210: Generate 6-digit code
    - Line 1211: Set 5-minute expiry
    - Line 1212: Store in `RESET_CODES` dict
    - Line 1215: Call `send_reset_email()`
    - Lines 1218-1234: Create notification for user
  - Lines 1236-1270: **Admin method:**
    - Lines 1238-1245: Create admin request record
    - Lines 1246-1270: Notify all admins

**Code Verification:**
- Lines 1272-1279: **`/auth/verify-code` POST:**
  - Lines 1273-1275: Check code exists and not expired
  - Lines 1276-1278: Validate code matches

**Password Reset:**
- Lines 1281-1315: **`/auth/reset-password` POST:**
  - Lines 1283-1286: Parse email, code, new password
  - Lines 1288-1295: Verify code is valid
  - Lines 1297-1305: Update password in database
  - Lines 1307-1315: Clear reset code, notify user

**Email Service:**
- Lines 78-150: **`send_reset_email()` function:**
  - Lines 84-87: Check if email enabled (dev mode fallback)
  - Lines 89-95: Create email message
  - Lines 98-111: Plain text email body
  - Lines 113-129: HTML email body with styling
  - Lines 131-135: Attach both versions
  - Lines 137-142: Send via SMTP
  - Lines 146-150: Error handling with console fallback

**Alternative Endpoints:**
- Lines 1320-1328: `/api/auth/send-reset-email` - Alias
- Lines 1330-1332: `/api/auth/verify-reset-code` - Alias
- Lines 1384-1386: `/api/auth/reset-password` - Alias

---

### Service Files

#### 📄 Auth Reset Service
**Location:** `src/services/authReset.ts` (55 lines)

**API Wrapper Functions:**
- Lines 5-38: **`post()` helper function:**
  - Lines 7-14: Primary API call to configured base URL
  - Lines 16-29: Fallback to `http://localhost:5000` if primary fails
  - Lines 31-38: Error handling and JSON parsing
- Lines 41-54: **Public API methods:**
  - Lines 42-44: `requestResetByEmail()` - Email reset
  - Lines 45-47: `requestResetByAdmin()` - Admin request
  - Lines 48-50: `verifyCode()` - Code verification
  - Lines 51-53: `resetPassword()` - Password update

**API Configuration:**
- Line 7: Uses `API.AUTH.BASE` from config
- Line 19: Fallback to `http://localhost:5000`
- Lines 21-22: Endpoint mapping for legacy routes

---

### Database Schema

#### 📄 Password Reset Tables
**Temporary Storage (In-Memory):**
- `RESET_CODES` dictionary:
  ```python
  {
    "email@example.com": {
      "code": "123456",
      "expires_at": 1698765432,
      "user_id": "KC-23-A-00762",
      "full_name": "Juan Dela Cruz"
    }
  }
  ```

- `PASSWORD_RESET_REQUESTS` dictionary:
  ```python
  {
    "req-uuid": {
      "id": "req-uuid",
      "user_id": "KC-23-A-00762",
      "email": "email@example.com",
      "status": "pending_admin",
      "created_at": 1698765432
    }
  }
  ```

**Email Configuration:**
- Line 71: `EMAIL_ENABLED` - Enable/disable emails
- Line 72: `SMTP_SERVER` - SMTP server (default: smtp.gmail.com)
- Line 73: `SMTP_PORT` - Port (default: 587)
- Line 74: `SENDER_EMAIL` - From address
- Line 75: `SENDER_PASSWORD` - Email password
- Line 76: `SENDER_NAME` - Display name

---

## REGISTRATION - Quick File List

### Phase 1: Account Type (25%)
```
📄 src/pages/RegistrationSelect.tsx (60 lines)
   - Choose Student or Admin
   - Route: /register
```

### Phase 2: Personal Info (50%)
```
📄 src/pages/RegistrationPersonal.tsx
   - Name, age, gender, birthdate
   - Email, phone
   - Permanent & Current address
   - Route: /register/personal
```

### Phase 3: Institution (75%)
```
📄 src/pages/RegistrationInstitution.tsx
   - Student: ID, department, course, year, block
   - Admin: ID, position, email, contact
   - Route: /register/institution
```

### Phase 4: Security (100%)
```
📄 src/pages/RegistrationSecurity.tsx
   - Password setup
   - QR code generation
   - Final submission
   - Route: /register/security
```

### Supporting Files
```
📄 src/pages/Registration.tsx
   - Wrapper component

📄 src/context/RegistrationContext.tsx
   - Shared state across phases
   - update(), reset(), nextStep()
```

### Backend
```
📄 python-backend/app.py
   - POST /api/students/register
   - POST /api/admins/register
   - validate_registration_data()
   - generate_qr_code()
```

### Services
```
📄 src/services/studentApi.ts
   - registerStudent()

📄 src/services/adminApi.ts
   - registerAdmin()

📄 src/services/address.ts
   - getRegions(), getProvinces()
   - getMunicipalities(), getZipCode()

📄 src/services/qrcode.ts
   - generateUserQR()
   - embedLogo()
```

---

## DATABASE SCHEMAS

```
📄 database/admin_registration_schema.sql (385 lines)
   - admins table (complete structure)
   - Indexes, triggers

📄 database/student_registration_schema.sql (452 lines)
   - students table (complete structure)
   - Indexes, triggers
```

---

## KEY VALIDATION PATTERNS

```javascript
// Admin ID
const adminIdRegex = /^KCL-\d{5}$/;
// Example: KCL-00001

// Student ID
const studentIdRegex = /^KC-\d{2}-[A-D]-\d{5}$/;
// Example: KC-23-A-00762

// Password
- Min 8 characters
- 1 uppercase letter
- 1 number

// Phone
- Exactly 11 digits
```

---

## IMPORTANT API ENDPOINTS

### Login
- `POST /auth/login`
- `POST /auth/verify-totp`

### Password Reset
- `POST /auth/request-reset`
- `POST /auth/verify-code`
- `POST /auth/reset-password`

### Registration
- `POST /api/students/register`
- `POST /api/admins/register`

---

## TOTAL FILE COUNT

| Category | Count |
|----------|-------|
| Frontend Pages | 7 |
| Frontend Components | 3 |
| Context Providers | 2 |
| Services | 8 |
| Backend Python | 3 |
| Database Schemas | 2 |
| **TOTAL** | **25** |

---

## QUICK NAVIGATION

**To modify login:** Check `src/pages/Login.tsx` and `python-backend/app.py`

**To modify password reset:** Check `src/components/auth/ForgotPasswordOverlay.tsx` and `src/services/authReset.ts`

**To modify registration:** Check all 4 phase files in `src/pages/Registration*.tsx`

**To modify validation:** Check regex patterns in login/registration pages and `src/context/AuthContext.tsx`

**To modify database:** Check `database/*.sql` files
