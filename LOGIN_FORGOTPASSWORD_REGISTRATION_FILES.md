# Login, Forgot Password & Registration System - Complete File Map

**Generated:** October 29, 2025  
**System:** JRMSU AI Library System (Main System)  
**Purpose:** Comprehensive mapping of all files related to Login, Forgot Password, and 4-Phase Registration

---

## OVERVIEW

This document maps all frontend, backend, and database files specifically related to:
1. **Login System** (Manual & QR Code)
2. **Forgot Password System** (Email & Admin Request)
3. **4-Phase Registration System** (Student & Admin)

---

## 1. LOGIN SYSTEM FILES

### Frontend Files (Login)

#### Main Login Page
**File:** `src/pages/Login.tsx` (329 lines)
- **Purpose:** Main login interface
- **Features:**
  - Manual login (ID + Password)
  - QR code login
  - Student/Admin role switching
  - 2FA verification
  - Forgot password link
- **Key Components Used:**
  - QRCodeLogin component
  - WelcomeMessage component
  - ForgotPasswordOverlayBody component
- **Validation:**
  - Admin ID: `KCL-00001` format (regex: `/^KCL-\d{5}$/`)
  - Student ID: `KC-23-A-00762` format (regex: `/^KC-\d{2}-[A-D]-\d{5}$/`)
- **State Management:**
  - User type (student/admin)
  - Login method (manual/qr)
  - 2FA requirement
  - Form data (id, password, totp)

#### QR Code Login Component
**File:** `src/components/auth/QRCodeLogin.tsx` (61 matches)
- **Purpose:** QR code scanning for login
- **Features:**
  - Camera-based QR scanning
  - QR data validation
  - Automatic login after scan
  - Error handling
- **Dependencies:**
  - html5-qrcode library
  - QR validation service

#### Welcome Message Component
**File:** `src/components/auth/WelcomeMessage.tsx`
- **Purpose:** Post-login welcome screen
- **Features:**
  - Personalized greeting
  - Role-based messaging
  - Auto-redirect to dashboard

#### Authentication Context
**File:** `src/context/AuthContext.tsx` (295 lines)
- **Purpose:** Global authentication state management
- **Key Functions:**
  - `signIn()` - Manual login
  - `signInWithQR()` - QR code login
  - `signOut()` - Logout
  - `verifyTotp()` - 2FA verification
  - `refreshSession()` - Session refresh
- **Session Management:**
  - LocalStorage key: `jrmsu_auth_session`
  - Token storage: `token`
  - Auto-logout: 30 minutes inactivity
- **Validation:**
  - ID format validation
  - Password verification
  - Role matching

### Backend Files (Login)

#### Main Backend API
**File:** `python-backend/app.py` (1,485 lines)
- **Login Endpoints:**
  - `/auth/login` - Main login endpoint
  - `/api/auth/login` - Alternative endpoint
- **Key Functions:**
  - User authentication
  - Password verification (bcrypt)
  - Session creation
  - 2FA verification
  - Activity logging

#### Database Module
**File:** `python-backend/db.py`
- **Purpose:** Database connection and queries
- **Classes:**
  - `StudentDB` - Student operations
  - `AdminDB` - Admin operations
- **Key Methods:**
  - `get_student_by_id()`
  - `get_admin_by_id()`
  - `authenticate_user()`
  - `verify_password()`

#### 2FA Module
**File:** `python-backend/twofa.py`
- **Purpose:** Two-factor authentication
- **Functions:**
  - `generate_base32_secret()` - Generate TOTP secret
  - `current_totp_code()` - Get current code
  - `verify_totp_code()` - Verify user code
  - `key_uri()` - Generate QR URI

### Service Files (Login)

#### Database Service
**File:** `src/services/database.ts` (19 matches)
- **Purpose:** Frontend database operations
- **Key Functions:**
  - `authenticateUser()` - Verify credentials
  - `getUserById()` - Fetch user data
  - `getUserByEmail()` - Email lookup
- **User Interface:**
  - id, fullName, email, userType
  - passwordHash, twoFactorEnabled
  - twoFactorKey, qrCodeData

#### QR Service
**File:** `src/services/qr.ts` (24 matches)
- **Purpose:** QR code operations
- **Key Functions:**
  - `generateQRCode()` - Create QR codes
  - `parseQRData()` - Parse scanned data
  - `validateQRLogin()` - Validate QR login
- **QR Data Structure:**
  - userId, fullName, role
  - authKey (encrypted)
  - timestamp, signature

#### Activity Service
**File:** `src/services/activity.ts`
- **Purpose:** Activity logging
- **Key Functions:**
  - `log()` - Log user actions
  - `getActivityLog()` - Retrieve logs
- **Logged Events:**
  - login, logout
  - failed_login
  - 2fa_enabled, 2fa_disabled

### Database Schema (Login)

#### Admin Table Fields (Login-Related)
**File:** `database/admin_registration_schema.sql`
- `id` - Primary key (KCL-00001)
- `admin_id` - Unique identifier
- `password_hash` - Bcrypt hash
- `two_factor_enabled` - Boolean
- `two_factor_secret` - TOTP secret
- `qr_code_data` - QR login data
- `last_login` - Timestamp
- `account_status` - active/inactive/suspended

#### Student Table Fields (Login-Related)
**File:** `database/student_registration_schema.sql`
- `id` - Primary key (KC-23-A-00762)
- `student_id` - Unique identifier
- `password_hash` - Bcrypt hash
- `two_factor_enabled` - Boolean
- `two_factor_secret` - TOTP secret
- `qr_code_data` - QR login data
- `last_login` - Timestamp
- `account_status` - active/inactive/suspended

---

## 2. FORGOT PASSWORD SYSTEM FILES

### Frontend Files (Forgot Password)

#### Forgot Password Page
**File:** `src/pages/ForgotPassword.tsx` (165 lines)
- **Purpose:** Standalone forgot password page
- **Features:**
  - Email-based reset
  - Admin request option
  - 2FA verification option
  - Code verification
  - Password reset form
- **Flow:**
  1. Enter email
  2. Receive 6-digit code
  3. Verify code
  4. Set new password
- **Validation:**
  - Email format
  - Code expiry (10 minutes)
  - Password strength (min 8 chars)
  - Password confirmation match

#### Forgot Password Overlay
**File:** `src/components/auth/ForgotPasswordOverlay.tsx` (319 lines)
- **Purpose:** Overlay component for login page
- **Features:**
  - Three reset methods:
    1. Email verification
    2. Admin request
    3. 2FA verification
  - Auto-fill user data by ID
  - Cooldown timers
  - Rate limiting
- **State Management:**
  - User identity (ID, name, email)
  - Code verification status
  - New password fields
  - Cooldown timers
- **Security:**
  - Email cooldown: 60 seconds
  - Admin request limit: 3 attempts
  - Block duration: 5 minutes after 3 attempts

### Backend Files (Forgot Password)

#### Password Reset Endpoints
**File:** `python-backend/app.py`
- **Endpoints:**
  - `/auth/reset-password` - Main reset endpoint
  - `/api/auth/reset-password` - Alternative endpoint
  - `/auth/request-reset` - Request reset code
  - `/auth/verify-code` - Verify reset code
- **Key Functions:**
  - `send_reset_email()` - Send email with code
  - `verify_reset_code()` - Validate code
  - `update_password()` - Change password
- **Email Configuration:**
  - SMTP server: Gmail (default)
  - Port: 587 (TLS)
  - Environment variables:
    - `EMAIL_ENABLED` - Enable/disable emails
    - `SMTP_SERVER` - SMTP server
    - `SENDER_EMAIL` - From address
    - `SENDER_PASSWORD` - Email password

#### Email Service
**File:** `python-backend/app.py` (lines 78-150)
- **Function:** `send_reset_email()`
- **Features:**
  - HTML email template
  - Plain text fallback
  - 6-digit code generation
  - 5-minute expiry
  - Dev mode (console output)
- **Email Template:**
  - JRMSU branding
  - Reset code display
  - Expiry warning
  - Security notice

### Service Files (Forgot Password)

#### Auth Reset Service
**File:** `src/services/authReset.ts` (55 lines)
- **Purpose:** Frontend API wrapper for password reset
- **Key Functions:**
  - `requestResetByEmail()` - Email method
  - `requestResetByAdmin()` - Admin request
  - `verifyCode()` - Code verification
  - `resetPassword()` - Password update
- **API Integration:**
  - Primary: Environment-based URL
  - Fallback: `http://localhost:5000`
  - Automatic endpoint mapping

#### Notifications Service
**File:** `src/services/notifications.ts`
- **Purpose:** Notify admins of reset requests
- **Key Functions:**
  - `notifyAdmins()` - Send to all admins
  - `notifyUser()` - Send to specific user
- **Notification Types:**
  - password_reset_request
  - password_reset_success
  - password_reset_failed

### Database Schema (Forgot Password)

#### Password Reset Requests Table
**Structure:**
- `id` - Request ID
- `user_id` - User requesting reset
- `email` - User email
- `code` - 6-digit verification code
- `created_at` - Request timestamp
- `expires_at` - Expiry timestamp (5 minutes)
- `verified` - Boolean
- `used` - Boolean
- `ip_address` - Request IP
- `user_agent` - Browser info

---

## 3. 4-PHASE REGISTRATION SYSTEM FILES

### Frontend Files (Registration)

#### Phase 1: Account Type Selection
**File:** `src/pages/RegistrationSelect.tsx` (60 lines)
- **Purpose:** Choose Student or Admin registration
- **Progress:** 25% (Step 1 of 4)
- **Features:**
  - Student registration button
  - Admin registration button
  - Back to login link
  - Progress indicator
- **Navigation:**
  - Student → `/register/personal` (with role: "student")
  - Admin → `/register/personal` (with role: "admin")
- **Context Update:**
  - Sets `role` field
  - Initializes `studentId` with "KC-" prefix

#### Phase 2: Personal Information
**File:** `src/pages/RegistrationPersonal.tsx`
- **Purpose:** Collect personal details
- **Progress:** 50% (Step 2 of 4)
- **Required Fields:**
  - First Name *
  - Middle Name *
  - Last Name *
  - Suffix (Optional: Jr., Sr., II)
  - Age * (Input + dropdown)
  - Birthdate * (MM/DD/YYYY)
  - Gender * (Male/Female buttons)
  - Email *
  - Phone * (11 digits)
- **Address Fields:**
  - **Permanent Address:**
    - Region * (Dropdown)
    - Province * (Dependent on Region)
    - Municipality/City * (Dependent on Province)
    - Barangay *
    - Street (Optional)
    - Zip Code * (Auto-filled)
    - Country (Philippines - disabled)
  - **Current Address:**
    - Same fields as Permanent
    - "Same as Permanent Address" checkbox
    - Landmark/Notes (Optional)
- **Validation:**
  - Email format
  - Phone: exactly 11 digits
  - Age: 16-100
  - Birthdate: not future date
- **Address Behavior:**
  - When "Same as Permanent" checked:
    - Current address fields become pale/disabled
    - Values mirror permanent address
  - When unchecked:
    - Current address fields editable
    - Independent values

#### Phase 3: Institutional Information
**File:** `src/pages/RegistrationInstitution.tsx`
- **Purpose:** Collect institution-specific data
- **Progress:** 75% (Step 3 of 4)
- **For Students:**
  - Student ID * (Format: KC-23-A-00762)
  - College/Department * (Dropdown)
    - CTE (College of Teacher Education)
    - CBA (College of Business Administration)
    - CAFSE (College of Agriculture, Fisheries and Sciences)
    - SCJE (School of Criminal Justice Education)
    - CCS (College of Computer Studies)
  - Course/Major * (Text input)
  - Year Level * (1, 2, 3, 4)
  - Block (Auto-extracted from Student ID)
- **For Admins:**
  - Admin ID * (Format: KCL-00001)
  - Position/Role * (Dropdown/Text)
    - Librarian
    - Assistant Librarian
    - Library Aide
    - System Administrator
  - Email * (Confirmation)
  - Contact Number * (11 digits)
- **Validation:**
  - ID format validation
  - Block extraction from Student ID
  - Email confirmation match

#### Phase 4: Security Setup
**File:** `src/pages/RegistrationSecurity.tsx`
- **Purpose:** Set password and generate QR code
- **Progress:** 100% (Step 4 of 4)
- **Required Fields:**
  - Password * (Min 8 chars, 1 uppercase, 1 number)
  - Confirm Password *
- **Password Requirements:**
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 number
  - At least 1 special character (optional)
- **QR Code Generation:**
  - Automatic on "Finish" button
  - Contains:
    - User ID
    - Full name
    - Role (student/admin)
    - Encrypted auth key
    - System tag (JRMSU-KCS or JRMSU-KCL)
  - Logo:
    - Students: JRMSU-KCS
    - Admins: JRMSU-KCL
- **Final Actions:**
  - Save all data to database
  - Generate QR code
  - Create user account
  - Redirect to login

#### Registration Wrapper
**File:** `src/pages/Registration.tsx`
- **Purpose:** Wrapper for registration flow
- **Features:**
  - Route protection
  - Progress tracking
  - Context provider

#### Registration Context
**File:** `src/context/RegistrationContext.tsx`
- **Purpose:** Shared state across registration phases
- **State Fields:**
  - role (student/admin)
  - Personal info (all Phase 2 fields)
  - Institutional info (all Phase 3 fields)
  - Security info (password)
  - Current step (1-4)
- **Key Functions:**
  - `update()` - Update registration data
  - `reset()` - Clear registration data
  - `goToStep()` - Navigate to specific step
  - `nextStep()` - Move to next phase
  - `previousStep()` - Go back

### Backend Files (Registration)

#### Registration Endpoints
**File:** `python-backend/app.py`
- **Endpoints:**
  - `/api/students/register` - Student registration
  - `/api/admins/register` - Admin registration
  - `/api/auth/register` - General registration
- **Key Functions:**
  - `validate_registration_data()` - Data validation
  - `hash_password()` - Password hashing (bcrypt)
  - `generate_qr_code()` - QR code creation
  - `create_user_account()` - Database insertion
  - `send_welcome_email()` - Welcome email
- **Validation:**
  - ID format validation
  - Email uniqueness check
  - Password strength validation
  - Required fields check
  - Data type validation

#### Student API
**File:** `src/services/studentApi.ts` (6 matches)
- **Purpose:** Student-specific API calls
- **Key Functions:**
  - `registerStudent()` - Student registration
  - `updateStudent()` - Update student data
  - `getStudent()` - Fetch student info
  - `listStudents()` - List all students
- **Validation:**
  - Student ID format
  - Block extraction
  - Department validation

#### Admin API
**File:** `src/services/adminApi.ts` (5 matches)
- **Purpose:** Admin-specific API calls
- **Key Functions:**
  - `registerAdmin()` - Admin registration
  - `updateAdmin()` - Update admin data
  - `getAdmin()` - Fetch admin info
  - `listAdmins()` - List all admins
- **Validation:**
  - Admin ID format
  - Position validation
  - Email verification

### Service Files (Registration)

#### Address Service
**File:** `src/services/address.ts`
- **Purpose:** Geographic data management
- **Key Functions:**
  - `getRegions()` - List all regions
  - `getProvinces(regionId)` - Get provinces by region
  - `getMunicipalities(provinceId)` - Get municipalities
  - `getBarangays(municipalityId)` - Get barangays
  - `getZipCode(municipalityId)` - Auto-fill zip code
- **Data Source:**
  - Philippine geographic data
  - Excel files (Region and Province.xlsx, etc.)
  - Cached in localStorage

#### QR Code Service
**File:** `src/services/qrcode.ts`
- **Purpose:** QR code generation
- **Key Functions:**
  - `generateUserQR()` - Create user QR code
  - `embedLogo()` - Add logo to QR
  - `encryptAuthKey()` - Encrypt auth data
  - `downloadQR()` - Download QR image
- **QR Data Structure:**
  ```json
  {
    "userId": "KC-23-A-00762",
    "fullName": "Juan Dela Cruz",
    "role": "student",
    "authKey": "encrypted_key",
    "systemTag": "JRMSU-KCS",
    "generatedAt": "2025-10-29T07:45:00Z"
  }
  ```

#### Admin Notifications Service
**File:** `src/services/adminNotifications.ts` (3 matches)
- **Purpose:** Notify admins of new registrations
- **Key Functions:**
  - `notifyNewRegistration()` - Send to all admins
  - `notifyPendingApproval()` - If approval required
- **Notification Content:**
  - New user name and ID
  - Registration timestamp
  - User type (student/admin)
  - Pending approval status

### Database Schema (Registration)

#### Complete Admin Table
**File:** `database/admin_registration_schema.sql` (385 lines)
- **All Fields:**
  - **Identity:** id, admin_id
  - **Personal:** first_name, middle_name, last_name, suffix, full_name, age, birthdate, gender
  - **Contact:** email, phone
  - **Position:** position
  - **Permanent Address:** street, barangay, municipality, province, region, country, zip_code
  - **Current Address:** current_street, current_barangay, current_municipality, current_province, current_region, current_country, current_zip, current_landmark
  - **Address Management:** same_as_current (Boolean), address (computed), current_address (computed)
  - **Security:** password_hash, two_factor_enabled, two_factor_secret
  - **QR Code:** qr_code_data, qr_code_generated_at, qr_code_last_regenerated
  - **System:** system_tag (JRMSU-KCL), created_at, updated_at, last_login, account_status
- **Indexes:**
  - idx_admin_email
  - idx_admin_position
  - idx_admin_status
  - idx_admin_created
- **Triggers:**
  - update_admin_timestamp (on UPDATE)
  - log_admin_changes (audit trail)

#### Complete Student Table
**File:** `database/student_registration_schema.sql` (452 lines)
- **All Fields:**
  - **Identity:** id, student_id
  - **Personal:** first_name, middle_name, last_name, suffix, full_name, age, birthdate, gender
  - **Contact:** email, phone
  - **Academic:** department, course, year_level, block
  - **Current Address:** current_address_street, current_address_barangay, current_address_municipality, current_address_province, current_address_region, current_address_country, current_address_zip, current_address_landmark
  - **Permanent Address:** permanent_address_street, permanent_address_barangay, permanent_address_municipality, permanent_address_province, permanent_address_region, permanent_address_country, permanent_address_zip, permanent_address_notes
  - **Address Management:** same_as_current (Boolean), current_address_full (computed), permanent_address_full (computed)
  - **Security:** password_hash, two_factor_enabled, two_factor_secret
  - **QR Code:** qr_code_data, qr_code_generated_at, qr_code_last_regenerated
  - **System:** system_tag (JRMSU-KCS), created_at, updated_at, last_login, account_status
- **Indexes:**
  - idx_student_email
  - idx_student_department
  - idx_student_year_level
  - idx_student_status
  - idx_student_created
- **Triggers:**
  - update_student_timestamp (on UPDATE)
  - log_student_changes (audit trail)

---

## FILE SUMMARY BY CATEGORY

### Frontend Files

#### Pages (7 files)
1. `src/pages/Login.tsx` - Login page
2. `src/pages/ForgotPassword.tsx` - Forgot password page
3. `src/pages/Registration.tsx` - Registration wrapper
4. `src/pages/RegistrationSelect.tsx` - Phase 1
5. `src/pages/RegistrationPersonal.tsx` - Phase 2
6. `src/pages/RegistrationInstitution.tsx` - Phase 3
7. `src/pages/RegistrationSecurity.tsx` - Phase 4

#### Components (3 files)
1. `src/components/auth/QRCodeLogin.tsx` - QR login
2. `src/components/auth/ForgotPasswordOverlay.tsx` - Password reset overlay
3. `src/components/auth/WelcomeMessage.tsx` - Welcome screen

#### Context (2 files)
1. `src/context/AuthContext.tsx` - Authentication state
2. `src/context/RegistrationContext.tsx` - Registration state

#### Services (8 files)
1. `src/services/database.ts` - Database operations
2. `src/services/qr.ts` - QR utilities
3. `src/services/qrcode.ts` - QR generation
4. `src/services/activity.ts` - Activity logging
5. `src/services/authReset.ts` - Password reset API
6. `src/services/address.ts` - Geographic data
7. `src/services/studentApi.ts` - Student API
8. `src/services/adminApi.ts` - Admin API

### Backend Files

#### Python Modules (3 files)
1. `python-backend/app.py` - Main Flask application
2. `python-backend/db.py` - Database module
3. `python-backend/twofa.py` - 2FA module

### Database Files

#### SQL Schemas (2 files)
1. `database/admin_registration_schema.sql` - Admin schema
2. `database/student_registration_schema.sql` - Student schema

---

## API ENDPOINTS SUMMARY

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /api/auth/login` - Alternative login
- `POST /auth/logout` - User logout
- `POST /auth/verify-totp` - 2FA verification

### Password Reset Endpoints
- `POST /auth/request-reset` - Request reset code
- `POST /auth/verify-code` - Verify reset code
- `POST /auth/reset-password` - Update password
- `POST /api/auth/reset-password` - Alternative reset

### Registration Endpoints
- `POST /api/students/register` - Student registration
- `POST /api/admins/register` - Admin registration
- `POST /api/auth/register` - General registration

### User Management Endpoints
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/admins` - List all admins
- `GET /api/admins/:id` - Get admin by ID
- `GET /api/students` - List all students
- `GET /api/students/:id` - Get student by ID

---

## VALIDATION RULES

### ID Formats
- **Admin ID:** `KCL-00001` (regex: `/^KCL-\d{5}$/`)
- **Student ID:** `KC-23-A-00762` (regex: `/^KC-\d{2}-[A-D]-\d{5}$/`)

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- Optional: 1 special character

### Email Validation
- Valid email format
- Unique in database
- Confirmed in registration

### Phone Validation
- Exactly 11 digits
- Philippine format

### Age Validation
- Minimum: 16 years
- Maximum: 100 years

---

## SECURITY FEATURES

### Password Security
- Bcrypt hashing (cost factor: 12)
- Salt generation
- No plain text storage

### 2FA Security
- TOTP-based (RFC 6238)
- 30-second time window
- QR code generation
- Backup codes

### Session Security
- JWT tokens
- 30-minute inactivity timeout
- Secure cookie storage
- HTTPS required (production)

### Password Reset Security
- 6-digit random code
- 5-minute expiry
- One-time use
- Rate limiting
- IP tracking

---

## TOTAL FILE COUNT

**Frontend:** 20 files
- Pages: 7
- Components: 3
- Context: 2
- Services: 8

**Backend:** 3 files
- Python modules: 3

**Database:** 2 files
- SQL schemas: 2

**Total:** 25 core files

---

## DEPENDENCIES

### Frontend Dependencies
- React 18.3.1
- React Router DOM 6.30.1
- html5-qrcode 2.3.8
- qrcode.react 4.2.0
- otplib 12.0.1
- bcrypt.js (client-side hashing)
- Zod 3.25.76 (validation)

### Backend Dependencies
- Flask 3.0.3
- bcrypt 4.1.2
- pyotp 2.9.0
- qrcode 7.4.2
- mysql-connector-python 8.2.0
- python-dotenv 1.0.0

---

## ENVIRONMENT VARIABLES

### Backend (.env)
```env
# Email Configuration
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=noreply@jrmsu.edu.ph
SENDER_PASSWORD=your_password
SENDER_NAME=JRMSU Library System

# CORS
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

# AI
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b-instruct-q4_K_M
```

---

## CONCLUSION

This document provides a complete mapping of all files related to the Login, Forgot Password, and 4-Phase Registration systems in the JRMSU AI Library System. All files are interconnected and work together to provide a secure, user-friendly authentication and registration experience.

**Key Features:**
- Dual login methods (Manual & QR)
- Multiple password reset options
- Comprehensive 4-phase registration
- Role-based access (Student/Admin)
- 2FA support
- Complete address management
- QR code generation
- Email notifications
- Activity logging
- Secure password handling
