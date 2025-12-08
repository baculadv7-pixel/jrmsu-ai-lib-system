# JRMSU AI Library System - Deep Technical Analysis

**Last Updated:** December 7, 2025  
**Analysis Scope:** All 4 service components across full-stack application  
**Platform:** Windows (PowerShell 5.1)

---

## Executive Summary

The **JRMSU AI Library System** is a sophisticated, multi-service educational platform managing library resources, student/admin accounts, QR-based access control, and AI-powered assistance. It spans:

- **React Frontend** (2 instances: main + mirror login)
- **Python Flask Backend** with MySQL database
- **AI Server** with Ollama/LLaMA 3 integration
- **Real-time Notifications** via Socket.IO

The system implements modern security (bcrypt, 2FA TOTP, CORS), comprehensive activity logging, QR code scanning with OpenCV, and intelligent notifications using Jose AI assistant.

---

## Architecture Overview

### Service Topology

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (Ports 8080-8081)            │
├─────────────────────────────────────────────────────────────┤
│  Main App (React)        │     Mirror Login (React)         │
│  Port: 8080              │     Port: 8081                   │
│  All features            │     Auth-only interface          │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
        HTTP + Socket.IO                      │
               │                              │
┌──────────────▼──────────────────────────────▼───────────────┐
│          API Backend (Port 5000)                             │
│     Python Flask + Flask-SocketIO                            │
├─────────────────────────────────────────────────────────────┤
│  - /api/auth/*          Authentication & Sessions            │
│  - /api/users/*         User Management                      │
│  - /api/books/*         Library Catalog                      │
│  - /api/reservations/*  Book Reservations                    │
│  - /api/notifications/* Notification System                  │
│  - /api/ai/*            AI Chat Endpoints                    │
│  - /api/library/*       Library Entry/Exit Tracking          │
│  - /api/qr/*            QR Generation & Validation           │
│  - /api/activity/*      Audit Logging                        │
└──────────────┬──────────────────────────────────────────────┘
               │
         MySQL Query
               │
┌──────────────▼──────────────────────────────────────────────┐
│     MySQL/MariaDB (Port 3306)                                │
├─────────────────────────────────────────────────────────────┤
│  Database: jrmsu_library                                     │
│  Backup DB: library_system_ai (optional)                     │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          AI Server (Port 5002)                               │
│     Python Flask                                             │
├─────────────────────────────────────────────────────────────┤
│  POST /ai/chat          LLaMA 3 Query                        │
│  GET  /ai/health        Ollama Health Check                  │
│  POST /ai/quit          Graceful Shutdown                    │
└──────────────┬──────────────────────────────────────────────┘
               │
         HTTP (local)
               │
┌──────────────▼──────────────────────────────────────────────┐
│     Ollama + LLaMA 3 (Port 11434)                            │
│     Local LLM Runtime                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 1. Frontend Architecture

### Technology Stack
- **React 18** with TypeScript
- **Vite** (bundler, dev server on port 8080)
- **TanStack React Query** v5 (server state management)
- **React Router v6** (SPA routing)
- **Tailwind CSS** + **shadcn/ui** (styling & components)
- **Socket.IO Client** (real-time updates)
- **QR Libraries**: `html5-qrcode`, `qrcode`, `qrcode.react`, `jsqr`
- **State**: React Context (Auth), localStorage (preferences)

### App Structure

**`App.tsx`** - Root router with code splitting:
```
├── Login (public)
├── Register (multi-step: Select → Personal → Institution → Security)
├── Dashboard (protected)
├── Books (protected)
├── History (protected)
├── Reports (admin only)
├── Settings (protected)
├── Profile (protected)
├── StudentManagement (admin only)
├── AdminManagement (admin only)
├── BookManagement (admin only)
├── Admin QR Generation (admin only)
└── NotFound (404)
```

### Authentication Flow

**Manual Login:**
1. User enters ID + password
2. Format validation (Admin: `KCL-00000`, Student: `KC-00-A-00000`)
3. Backend validation via `/api/auth/login`
4. If 2FA enabled: TOTP token prompt
5. JWT-like token stored: `jwt.${base64(userId.timestamp)}`
6. Session hydrated from backend `/api/users/{id}`
7. Activity logged: `ActivityService.log(userId, 'login')`

**QR Code Login:**
1. Scan QR containing encrypted credentials
2. Validate QR structure (systemId, userId, userType, tokens)
3. Decrypt encryptedPasswordToken or use sessionToken
4. Call backend with decrypted data
5. Session established immediately (no 2FA prompt if token valid)

**Session Management:**
- Persisted in localStorage under `jrmsu_auth_session`
- Auto-logout on inactivity (default 30 min, configurable 5-240 min)
- Resets on user activity (click, mousemove, keydown, scroll, touchstart)
- Logs auto-logout events to activity service

### Key Components

**`AuthContext`** (`src/context/AuthContext.tsx`):
- Central auth state store
- Handles both manual & QR sign-in
- 2FA enable/disable/verify
- Session refresh
- Inactivity timeout

**`ProtectedRoute`** (route wrapper):
- Wraps authenticated routes
- Enforces login requirement
- Optional role-based guards

**`RoleGuard`** (component):
- Fine-grained role checking
- Admin-only route protection

---

## 2. Backend Architecture

### Technology Stack
- **Python 3.10+**
- **Flask** (web framework)
- **Flask-SocketIO** (WebSocket + fallback)
- **mysql-connector-python** (database driver)
- **bcrypt** (password hashing, 12 rounds)
- **pyotp** (TOTP 2FA)
- **Pillow** (image processing)
- **OpenCV + pyzbar** (QR detection)
- **requests** (HTTP calls to AI server, Ollama)
- **bleach** (input sanitization)
- **openpyxl** (Excel export for audits)

### Database Configuration

**Primary Database:** `jrmsu_library`

**Connection Parameters:**
```python
DB_HOST: localhost (or env var DB_HOST)
DB_PORT: 3306 (or env var DB_PORT)
DB_USER: root (or env var DB_USER)
DB_PASSWORD: "" (empty by default, or env var DB_PASSWORD)
DB_TIMEOUT: 2 seconds (fast-fail on connection)
CHARSET: utf8mb4
COLLATION: utf8mb4_unicode_ci
```

**Key Tables:**

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `students` | Student accounts | student_id, email, password_hash, two_factor_secret, department, course, year_level, block |
| `admins` | Admin accounts | admin_id, email, password_hash, two_factor_secret, position |
| `books` | Library catalog | id, title, author, isbn, status, borrowing_allowed |
| `reservations` | Book reservations | id, user_id, book_id, status (pending/cancelled), reserved_at |
| `borrow_records` | Borrowing history | id, user_id, book_id, borrow_date, due_date, returned_at, status |
| `notifications` | User notifications | id, user_id, type, title, message, read_flag, action_required |
| `activity_log` | Audit trail | id, actor_id, event, details, source (MAIN/MIRROR), timestamp |
| `ai_chat_sessions` | AI session metadata | id, user_id, user_role, started_at, ended_at, message_count |
| `ai_chat_history` | Chat messages | id, session_id, user_id, role, content, emotion, timestamp |
| `jose_message_templates` | AI notification templates | event_type, template (for variable substitution) |
| `notification_dedup` | Deduplication cache | user_id, event_type, event_key (prevents duplicate notifications) |

**Optional AI Database:** `library_system_ai`
- For logging AI interactions separately
- Table: `ai_logs` (user_id, message, ai_response, emotion_detected, timestamp)

### Core Modules

#### `db.py` - Database Abstraction Layer
```python
# Context managers for safe connection/cursor handling
get_db_connection()      # Manual transaction control
get_db_cursor()          # Auto-commit cursors
execute_query()          # Simplified query runner

# Classes for domain operations
StudentDB.register_student()          # Stored proc: sp_register_student
StudentDB.get_student_by_id()
StudentDB.list_all_students()
AdminDB.register_admin()              # Stored proc: sp_register_admin
AdminDB.update_admin_profile()        # Stored proc: sp_update_admin_profile
```

**Key Features:**
- Context managers auto-cleanup on exceptions
- Parameterized queries (SQL injection protection)
- Stored procedure support (OUT parameters for status/messages)
- Dictionary cursor mode for object-like access

#### `twofa.py` - TOTP 2FA Implementation
```python
generate_base32_secret(length=32)  # Random Base32 secret
current_totp_code(secret)           # Get current 6-digit code
verify_totp_code(secret, token, window=1)  # Verify with time window
key_uri(secret, account_name)       # QR URI for authenticator app
```

**Configuration:**
- RFC 6238 standard
- 32-character Base32 secret
- 30-second time window
- ±1 step window for clock drift (totals ±60 seconds tolerance)
- Alphabet: `ABCDEFGHIJKLMNOPQRSTUVWXYZ234567`

#### `password_endpoints.py` - Password Management
```
POST /api/users/<user_id>/change-password
  - Requires current password (for user self-service)
  - Validates new password (min 8 chars)
  - Uses bcrypt (12 rounds)
  - Logs activity

POST /api/users/<user_id>/reset-password
  - Admin-only, no current password required
  - Auto-generates temporary password or admin sets new one
  - Logs activity with admin context
```

#### `library_endpoints.py` - Library Entry/Exit Tracking
```
POST /api/library/dev-login       # Track user entry (in-memory session)
POST /api/library/dev-logout      # Track user exit
GET  /api/library/user-status/<user_id>     # Check reservations/borrowed books
GET  /api/library/user-reservations/<user_id>
GET  /api/library/reservations-all          # Admin: all pending reservations
```

**Features:**
- In-memory session tracking (dev mode)
- LEFT JOIN on books for resilience (missing book records don't block reservations)
- Real-time notifications to all admins on entry/exit
- Metadata: userId, userType, action (entry/exit)

#### `notifications_service.py` - Jose AI Notifications
```python
JoseAI.generate_message(event_type, variables)
  # Selects random template for event type
  # Substitutes variables: {userId}, {fullName}, etc.
  # Returns unique message each time

NotificationsService.create_notification(
  type, title, event_type, variables,
  details, source, target_role, target_user_id,
  action_required, action_type, action_payload,
  dedup_key
)
  # Checks deduplication (prevents duplicate notifications)
  # Generates unique notification ID
  # Inserts into `notifications` table
  # Records dedup entry for future checks

NotificationsService.create_activity_log(
  event_type, user_id, summary, details, source
)
  # Logs to `activity_log` for audit trail
```

**Message Templates:**
- Stored in `jose_message_templates` table
- Event types: welcome_new_user, password_reset_request, book_borrowed, etc.
- Variables: {userId}, {fullName}, {bookTitle}, etc.
- Random selection for variety

#### `qr_detector.py` - QR Code Detection & Validation
```python
QRDetector(camera_id=0)
  .initialize_camera()             # Set resolution (640x480), FPS (30)
  .detect_qr_codes(frame)          # Multi-pipeline detection:
                                    #  1. Grayscale + blur
                                    #  2. Adaptive threshold (if none found)
                                    #  3. Resize scales 1.25x, 1.5x, 2.0x
  .validate_jrmsu_qr(qr_data)      # Check structure, system ID, token
  .draw_detections(frame, detections)  # Annotate frame
  .process_frame()                 # Full pipeline: detect → validate → annotate
  .start_detection_loop()          # Continuous detection
  .get_latest_detection()          # Queue-based retrieval
```

**QR Structure Validation:**
```json
{
  "systemId": "JRMSU-LIBRARY",
  "userId": "KC-23-A-00762",
  "fullName": "Juan Cruz",
  "userType": "student",
  "systemTag": "JRMSU-KCS",
  "encryptedPasswordToken": "...",
  "sessionToken": "..." // legacy fallback
}
```

**Required Fields:**
- systemId (must be "JRMSU-LIBRARY")
- userId
- fullName
- userType (admin → JRMSU-KCL, student → JRMSU-KCS)
- systemTag (must match userType)
- At least one of: encryptedPasswordToken, sessionToken, encryptedToken, authCode

### API Endpoints

#### Authentication
```
POST /api/auth/login
  Body: { id, password, userType }
  Returns: { user, token, twoFactorRequired }

POST /api/auth/qr-login
  Body: { qrData }
  Returns: { user, token }

POST /api/auth/verify-totp
  Body: { token, secret }
  Returns: { valid }

POST /api/auth/logout
  Returns: { ok }
```

#### User Management
```
GET  /api/users/<id>
GET  /api/users/<id>/profile
POST /api/users/<id>/profile
POST /api/users/<id>/change-password
POST /api/users/<id>/reset-password

GET  /api/students
POST /api/students/register
GET  /api/students/by-department/<dept>

GET  /api/admins
POST /api/admins/register
POST /api/admins/<id>/update-profile
```

#### Books & Borrowing
```
GET  /api/books
GET  /api/books/<id>
POST /api/books (admin)
PUT  /api/books/<id> (admin)
DELETE /api/books/<id> (admin)

POST /api/reservations
GET  /api/reservations/<user_id>
POST /api/reservations/<id>/cancel
GET  /api/library/user-status/<user_id>
```

#### Notifications
```
GET  /api/notifications/<user_id>
POST /api/notifications/<id>/mark-read
POST /api/notifications/<id>/clear

WS   /socket.io (Socket.IO events)
  notification.new
  notification.read
  activity.new
```

#### AI Chat
```
POST /api/ai/chat
  Body: { prompt, user_id }
  Returns: { response, emotion }

GET  /api/ai/health
POST /api/ai/quit (localhost only)
```

#### Audit & Activity
```
GET  /api/activity
GET  /api/activity?actor_id=<id>&event=<type>
POST /api/activity/export (admin)
  Returns: Excel file with audit trail
```

### Socket.IO Events

**Server → Client:**
```
notification.new          { id, user_id, title, message, type, ... }
notification.read         { id }
activity.new             { id, actor_id, event, details, timestamp }
library.entry            { user_id, fullName, userType, loginTime }
library.exit             { user_id, fullName, userType, logoutTime }
```

**Client → Server:**
```
notification.mark-read { notificationId }
notification.clear     { }
```

### CORS Configuration

**Allowed Origins:**
```
http://localhost:8080
http://127.0.0.1:8080
http://localhost:8081
http://127.0.0.1:8081
(configurable via ALLOWED_ORIGINS env var)
```

**Allowed Methods:** GET, POST, PUT, DELETE, PATCH, OPTIONS  
**Allowed Headers:** Content-Type, Authorization, X-User-Id  
**Credentials:** true

---

## 3. AI Server Architecture

### Configuration

**Ports & Services:**
- **AI Server:** 5002
- **Ollama:** 11434 (internal only, 127.0.0.1)
- **Model:** `llama3:8b-instruct-q4_K_M` (default, configurable via OLLAMA_MODEL env var)

**Optional Dependencies:**
- `textblob` (sentiment analysis, graceful fallback)
- `mysql.connector` (AI logs, graceful fallback)

### System Prompt (Jose)

```
You are Jose, the AI assistant for the JRMSU Library System.

- Answer in a concise way (3-4 short paragraphs max).
- Use bullet points when listing steps.
- Focus only on what the user asked. Do not add long extra explanations.
- When questions are about this system (JRMSU AI Library), explain features,
  pages, and workflows in clear, simple steps.
- If you are not sure about an implementation detail, say so briefly instead of guessing.
```

### Knowledge System

**`system_knowledge.json`** - Static system context:
```json
{
  "summary": "JRMSU Library System overview...",
  "topics": [
    {
      "keywords": ["reserve", "book", "reservation"],
      "details": "How to reserve a book: 1) Go to Books page 2) Click Reserve 3) Confirm..."
    },
    {
      "keywords": ["password", "reset"],
      "details": "Password reset: Use Forgot Password link on login page..."
    }
  ]
}
```

**Key Features:**
- Loaded once at startup (in-memory caching)
- Keyword-based topic matching
- Fallback to summary if no keywords match
- Handles stray control characters in JSON

### Chat Endpoint

**`POST /ai/chat`:**
```python
{
  "user_id": "KC-23-A-00762",
  "prompt": "How do I reserve a book?"
}

Response:
{
  "response": "Jose's answer...",
  "emotion": "neutral" | "positive" | "negative"
}
```

**Flow:**
1. Load relevant system knowledge (keyword matching)
2. Fetch optional book context from backend (`/api/ai/book-context`)
3. Construct full prompt with Jose instructions + context + user query
4. Call `ollama run llama3:8b-instruct-q4_K_M` with prompt
5. Detect emotion (TextBlob if available, else heuristic keywords)
6. Log to database (if `library_system_ai.ai_logs` exists)
7. Return response + emotion

### Emotion Detection

**TextBlob-based (primary):**
- Polarity > 0.4 → "positive"
- Polarity < -0.4 → "negative"
- Otherwise → "neutral"

**Fallback Heuristic:**
- Positive keywords: good, great, excellent, awesome, love, happy, thanks
- Negative keywords: bad, terrible, angry, sad, hate, awful, issue, error
- Scoring: both → neutral, positive only → positive, negative only → negative

### Graceful Shutdown

**`POST /ai/quit`** (localhost only):
- Allows new instance to request old instance to shut down
- Prevents port conflicts during restart
- Attempts to call previous instance, then Windows force-kill if needed

---

## 4. Database Schemas

### Students Table

**Key Columns:**
```sql
student_id VARCHAR(50) PRIMARY KEY  -- KC-23-A-00762 format
first_name, middle_name, last_name, suffix
birthdate DATE, age INT, gender ENUM('Male', 'Female')
email VARCHAR(255) UNIQUE
phone VARCHAR(20)

department (CTE, CBA, CAFSE, SCJE, CCS)
course_major VARCHAR(200)
year_level VARCHAR(10)  -- 1, 2, 3, 4
block VARCHAR(5)        -- A-F, auto-extracted from student_id

-- Current address (where student lives now)
current_address_street, current_address_barangay, current_address_municipality,
current_address_province, current_address_region, current_address_zip,
current_address_landmark

-- Permanent address (official home)
permanent_address_street, permanent_address_barangay, ...
same_as_current BOOLEAN  -- Syncs current → permanent on update

password_hash VARCHAR(255)
two_factor_enabled BOOLEAN
two_factor_secret VARCHAR(255)

qr_code_data TEXT
qr_code_generated_at TIMESTAMP
qr_code_last_regenerated TIMESTAMP

system_tag VARCHAR(50) DEFAULT 'JRMSU-KCS'
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
last_login TIMESTAMP
account_status ENUM('active', 'inactive', 'suspended')
```

**Triggers:**
- `before_student_insert`: Auto-extract block, calculate age, sync addresses
- `before_student_update`: Recalculate block/age on ID/birthdate change, sync if same_as_current

**Stored Procedures:**
- `sp_register_student(...)`: Validates ID/email uniqueness, inserts with OUT params
- `sp_update_student_profile(...)`: Updates editable fields only

**Views:**
- `v_student_profiles`: Summary view (id, full_name, email, account_status, etc.)
- `v_student_academic`: Active students by department/year/block

### Admins Table

**Similar to Students:**
```sql
admin_id VARCHAR(50) PRIMARY KEY  -- KCL-00000 format
position VARCHAR(100)  -- Job title
(same address + auth fields as students)
```

**Stored Procedures:**
- `sp_register_admin(...)`
- `sp_update_admin_profile(...)`

### Books Table

```sql
id VARCHAR(50) PRIMARY KEY
title VARCHAR(255)
author VARCHAR(255)
isbn VARCHAR(20)
category VARCHAR(100)
status ENUM('available', 'borrowed', 'reserved', 'damaged', 'lost')
location VARCHAR(100)
borrowing_allowed BOOLEAN
copies_total INT
copies_available INT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Reservations Table

```sql
id VARCHAR(50) PRIMARY KEY
user_id VARCHAR(50) NOT NULL (FK: students/admins)
book_id VARCHAR(50) NOT NULL (FK: books)
book_title VARCHAR(255)  -- Fallback if book deleted
status ENUM('pending', 'cancelled')
reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
cancelled_at TIMESTAMP NULL
expires_at TIMESTAMP  -- Auto-cancel after N days
```

### Borrow Records Table

```sql
id VARCHAR(50) PRIMARY KEY
user_id VARCHAR(50) NOT NULL
book_id VARCHAR(50) NOT NULL
borrow_date DATETIME
due_date DATETIME
returned_at DATETIME NULL
status ENUM('borrowed', 'returned', 'overdue', 'lost')
renewal_count INT DEFAULT 0
```

### Notifications Table

```sql
id VARCHAR(50) PRIMARY KEY
type VARCHAR(50)  -- 'system', 'reminder', 'alert', 'custom'
title VARCHAR(255)
message TEXT
details JSON
source ENUM('MAIN', 'MIRROR')
target_role VARCHAR(50)  -- 'admin' for all admins
target_user_id VARCHAR(50)  -- Specific user or NULL for role
action_required BOOLEAN
action_type VARCHAR(50)  -- 'grant_decline', 'acknowledge', etc.
action_payload JSON
read_flag BOOLEAN DEFAULT FALSE
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
read_at TIMESTAMP NULL
```

### Activity Log Table

```sql
id VARCHAR(50) PRIMARY KEY
actor_id VARCHAR(50)  -- User who performed action
actor_name VARCHAR(255)
event VARCHAR(100)  -- 'LOGIN', 'PASSWORD_CHANGED', 'BOOK_BORROWED', etc.
details JSON
source ENUM('MAIN', 'MIRROR')
timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Jose Message Templates Table

```sql
event_type VARCHAR(100)
template TEXT  -- e.g., "Welcome {fullName}! Your ID is {userId}"
```

### Notification Dedup Table

```sql
user_id VARCHAR(50)
event_type VARCHAR(100)
event_key VARCHAR(255)  -- Composite key for deduplication
UNIQUE(user_id, event_type, event_key)
```

### AI Chat Tables (Optional)

```sql
-- ai_chat_sessions
id VARCHAR(100) PRIMARY KEY
user_id VARCHAR(50)
user_role ENUM('student', 'admin', 'guest')
started_at TIMESTAMP
ended_at TIMESTAMP
last_activity TIMESTAMP
message_count INT

-- ai_chat_history
id VARCHAR(100) PRIMARY KEY
session_id VARCHAR(100) (FK)
user_id VARCHAR(50)
role ENUM('user', 'assistant', 'system')
content TEXT
emotion VARCHAR(50)
emotion_confidence DECIMAL(5,2)
emotion_tone ENUM('positive', 'negative', 'neutral')
timestamp TIMESTAMP
metadata JSON
FULLTEXT INDEX ft_content (content)

-- ai_emotion_logs
id INT AUTO_INCREMENT PRIMARY KEY
message_id VARCHAR(100) (FK)
user_id VARCHAR(50)
detected_emotion VARCHAR(50)
confidence DECIMAL(5,2)
tone ENUM('positive', 'negative', 'neutral')
keywords TEXT
context TEXT
detected_at TIMESTAMP
```

---

## 5. Security Implementation

### Authentication

**Password Storage:**
- **Algorithm:** bcrypt with 12 rounds
- **Hashing:** `bcrypt.gensalt(rounds=12)` + `bcrypt.hashpw()`
- **Verification:** Constant-time comparison in bcrypt.checkpw()
- **Minimum Length:** 8 characters

**Session Management:**
- **Token Format:** `jwt.${base64(userId.timestamp)}`
- **Storage:** localStorage (`token`, `jrmsu_auth_session`)
- **Persistence:** Survives page refresh
- **Auto-Logout:** Inactivity timeout (default 30 min)

**2FA (TOTP):**
- **Standard:** RFC 6238 (pyotp)
- **Secret:** 32-char Base32
- **Time Window:** 30-second steps, ±1 step tolerance (±60 seconds)
- **Token Length:** 6 digits
- **Authenticator Apps:** Google Authenticator, Authy, Microsoft Authenticator

**QR Login:**
- Validates structure, system ID, user type consistency
- Requires encrypted token (password/session)
- No 2FA prompt if session token valid

### Authorization

**Role-Based Access:**
- `student` role: Access Dashboard, Books, History, Profile, Settings
- `admin` role: All student access + StudentManagement, AdminManagement, BookManagement, Reports, QR Generation

**Route Guards:**
- `ProtectedRoute`: Enforces authentication
- `RoleGuard`: Enforces specific roles
- Admin-only endpoints: `/admin/*`, `/api/students`, `/api/admins`

### Input Validation & Sanitization

**Client-Side:**
- ID format validation (regex for admin/student ID patterns)
- Password strength checks
- Type coercion in forms

**Server-Side:**
- **SQL Injection:** Parameterized queries (all endpoints use `%s` placeholders)
- **XSS:** bleach library sanitizes text inputs before storage
- **CORS:** Strict origin checking (allowlist-based)
- **Request Validation:** JSON schema via request.get_json(force=True)

### Data Protection

**In Transit:**
- HTTPS recommended (not enforced in dev; set up for production)
- Socket.IO over WSS

**At Rest:**
- MySQL with utf8mb4 encoding
- No sensitive data (passwords, tokens) logged to activity_log
- QR code sensitive fields encrypted before transmission

**Database Access:**
- Limited to root user (no password in dev)
- Timeouts on failed connections (2 seconds)
- Read-only views for sensitive queries

### Password Reset

**Flow:**
1. User requests reset via `/api/auth/forgot-password`
2. Backend generates 6-digit reset code, stores with 5-minute expiry
3. Email sent (or console logged if EMAIL_ENABLED=false)
4. User enters code + new password
5. Code validated, password updated, logged to activity

---

## 6. Real-Time Features

### Socket.IO Integration

**Server Setup:**
```python
socketio = SocketIO(app, cors_allowed_origins=list(ALLOWED_ORIGINS))
```

**Events:**
- **notification.new** → Broadcast to user on new notification
- **notification.read** → Broadcast when admin marks read
- **activity.new** → Broadcast activity log entries
- **library.entry/exit** → Notify all admins

**Fallback:** If WebSocket unavailable, falls back to long-polling

### Real-Time Notifications

**Triggering Events:**
- Book borrowed/returned
- Reservation confirmed/cancelled
- Password reset request
- Overdue book reminder
- Admin actions (student management)
- Library entry/exit tracking

**Delivery:**
- Immediate WebSocket push (if connected)
- Persistent database record (retrieval on next login)
- Optional email (if EMAIL_ENABLED=true)

---

## 7. Error Handling & Logging

### Exception Handling

**Backend:**
- Try-catch blocks with graceful fallbacks
- Database errors → return 500 with generic message
- Missing resources → return 404
- Invalid input → return 400
- Auth failures → return 401/403

**Frontend:**
- ErrorBoundary component wraps pages
- Try-catch in async operations
- Network error fallbacks (retry logic in API calls)

### Activity Logging

**Tracked Events:**
- login, logout, auto_logout_inactive
- PASSWORD_CHANGED, PASSWORD_RESET
- REGISTRATION (student/admin)
- BOOK_BORROWED, BOOK_RETURNED, RESERVATION_CREATED
- ADMIN_ACTION (user modifications)
- API_ERROR (optional detailed logging)

**Log Structure:**
```json
{
  "id": "ACT-1733603254123",
  "actor_id": "KC-23-A-00762",
  "actor_name": "Juan Dela Cruz",
  "event": "LOGIN",
  "details": { "ip": "127.0.0.1", "userAgent": "..." },
  "source": "MAIN",
  "timestamp": "2025-12-07T10:02:26Z"
}
```

**Audit Export:**
- Admin endpoint: `GET /api/activity/export`
- Format: Excel workbook with styled sheets
- Columns: actor_id, event, details, source, timestamp

---

## 8. Startup & Deployment

### Development Startup

**Automated (PowerShell):**
```powershell
./Start-All-Enforced.ps1
```
This:
1. Kills any processes on ports 8080, 8081, 5000, 5002, 11434
2. Starts Backend (5000) in new terminal
3. Starts Main App (8080) in new terminal
4. Starts Mirror App (8081) in new terminal
5. Starts AI Server (5002) in new terminal
6. Starts Ollama (11434) in new terminal

**Manual Startup:**

Terminal 1 - Backend:
```powershell
cd jrmsu-wise-library-main\python-backend
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Terminal 2 - Main App:
```powershell
cd jrmsu-wise-library-main
npm install
npm run dev
```

Terminal 3 - Mirror App:
```powershell
cd mirror-login-page
npm install
npm run dev
```

Terminal 4 - AI Server:
```powershell
cd ai_server
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install flask requests mysql-connector-python textblob
python app.py
```

Terminal 5 - Ollama:
```powershell
$env:OLLAMA_HOST = "127.0.0.1:11434"
ollama serve
ollama pull llama3:8b-instruct-q4_K_M
```

### Port Management

| Port | Service | Process |
|------|---------|---------|
| 8080 | Main App | Vite dev server (React) |
| 8081 | Mirror App | Vite dev server (React) |
| 5000 | Backend API | Flask + Socket.IO |
| 5002 | AI Server | Flask + Ollama client |
| 11434 | Ollama | Local LLM runtime |
| 3306 | MySQL | Database (XAMPP) |

### Environment Variables

**Backend (`jrmsu-wise-library-main/python-backend/.env`):**
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=jrmsu_library
DB_TIMEOUT=2

ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,http://localhost:8081,http://127.0.0.1:8081

EMAIL_ENABLED=false
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=noreply@jrmsu.edu.ph
SENDER_PASSWORD=
SENDER_NAME=JRMSU Library System

OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b-instruct-q4_K_M
```

**AI Server (`ai_server/.env`):**
```
LIBRARY_API_BASE=http://localhost:5000
OLLAMA_MODEL=llama3:8b-instruct-q4_K_M
```

**Frontend (hardcoded, no .env):**
- Backend API: `http://localhost:5000`
- AI Server: `http://localhost:5002`

---

## 9. Key Features & Workflows

### Book Reservation Workflow

```
1. Student: Click "Books" tab
2. Student: Browse catalog (filtered by department)
3. Student: Click "Reserve" on available book
4. Backend: Create reservation record (status=pending)
5. Backend: Send notification to admins + student
6. Admin: Dashboard shows pending reservations
7. Admin: Verify student has no overdue books
8. Admin: Release book from reserve shelf
9. Admin: Mark as "ready for pickup"
10. Student: Notification: "Your book is ready"
11. Student: Pick up from library desk (entry via QR)
12. Student: "Borrow" recorded in borrow_records table
13. Return due date calculated (e.g., 14 days)
```

### QR Code Login Workflow

```
1. Admin: Generate QR from AdminManagement page
   - Contains: userId, fullName, userType, encrypted password/session token
   - Generates as PNG with JRMSU logo
2. Student: Scan QR with camera/phone
3. Frontend: Decode QR JSON
4. Frontend: Extract credentials, validate structure
5. Frontend: Call /api/auth/qr-login with decrypted data
6. Backend: Verify user exists, token valid
7. Backend: Return user profile + auth token
8. Frontend: Establish session, redirect to dashboard
9. Skip 2FA if session token was valid
```

### Password Reset Workflow

```
1. User: Click "Forgot Password?" on login
2. Frontend: Prompt for user ID
3. Backend: Generate 6-digit code, 5-min expiry
4. Backend: Send email (or console log if disabled)
5. User: Enter code + new password
6. Backend: Verify code, update password_hash
7. Backend: Log PASSWORD_RESET to activity_log
8. Redirect: User can now login with new password
```

### 2FA Setup Workflow

```
1. User: Settings → Security → Enable 2FA
2. Backend: Generate random Base32 secret
3. Backend: Return secret + QR code URI
4. Frontend: Display QR for user to scan
5. User: Scan QR with Authenticator app
6. User: Enter 6-digit code from app
7. Backend: verify_totp_code(secret, code)
8. Backend: Store two_factor_secret, set two_factor_enabled=true
9. Activity logged: "2FA_ENABLED"
10. Next login: After password, prompt for TOTP code
```

### AI Chat Workflow

```
1. User: Click "Ask Jose" button (if feature enabled)
2. Frontend: Open chat modal
3. User: Type question (e.g., "How do I reserve a book?")
4. Frontend: POST /ai/chat with { prompt, user_id }
5. Backend AI: Load system_knowledge.json
6. Backend AI: Match keywords to find relevant topics
7. Backend AI: Fetch optional book context from main backend
8. Backend AI: Construct full prompt with Jose instructions + context
9. Backend AI: Call ollama run llama3:...
10. Backend AI: Receive response, detect emotion
11. Backend AI: Log to ai_chat_history (if DB available)
12. Frontend: Display response in chat
13. Frontend: Show emotion indicator (😊 positive, 😐 neutral, 😔 negative)
```

---

## 10. Known Limitations & Gotchas

### Backend

1. **Database Fallback:** No embedded SQLite fallback; app requires MySQL
2. **QR Detector:** Uses first camera (index 0); Chicony camera detection basic
3. **Email:** Disabled by default; requires SMTP_SERVER, SENDER_EMAIL, SENDER_PASSWORD
4. **File Storage:** QR codes, profile pictures stored locally (no cloud storage)
5. **Session Persistence:** Socket.IO sessions not persisted across server restarts

### Frontend

1. **Offline Mode:** No service worker; app requires backend connectivity
2. **QR Scanner:** Requires camera permissions; blocked on HTTPS without valid certificate
3. **TOTP Display:** Shows full secret on setup (can be screenshot); ideally hide after confirmation
4. **Storage Quota:** localStorage limited (~5-10MB); not suitable for large attachments

### General

1. **No Rate Limiting:** Backend endpoints lack rate limiting (DOS-vulnerable)
2. **No Request Signing:** QR data unencrypted if transmitted over HTTP
3. **No Audit Trail Encryption:** Activity logs stored in plaintext
4. **No Backup Strategy:** No automated database backups mentioned
5. **No Load Balancing:** Single backend instance; no horizontal scaling

---

## 11. Recommendations

### Security Enhancements

1. **HTTPS Enforcement:** Use self-signed certs in dev, proper CA in prod
2. **Rate Limiting:** Add Flask-Limiter to prevent brute-force attacks
3. **Request Signing:** Sign QR data with HMAC-SHA256
4. **Audit Encryption:** Encrypt sensitive activity log fields
5. **Database Backup:** Set up MySQL replication or automated exports

### Performance Optimizations

1. **Database Indexing:** Add indexes on frequently filtered columns (department, email)
2. **Caching:** Redis for session store, notification cache
3. **API Pagination:** Limit result sets (e.g., 50 items/page)
4. **Frontend Code Splitting:** Already implemented; consider lazy-loading Dashboard

### Developer Experience

1. **Environment Setup:** Create `.env.example` files in each service
2. **Database Migrations:** Use a tool like Alembic for version control
3. **Testing:** Add unit tests for auth, notifications, QR validation
4. **Documentation:** Inline code comments for complex logic (e.g., QR detection pipelines)
5. **Monitoring:** Add health check endpoint, request logging to file

---

## 12. Technology Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 18.3.1 |
| | TypeScript | 5.8.3 |
| | Vite | 5.4.19 |
| | Tailwind CSS | 3.4.17 |
| | React Router | 6.30.1 |
| | TanStack Query | 5.83.0 |
| | Socket.IO Client | 4.8.1 |
| **Backend** | Python | 3.10+ |
| | Flask | 3.0.3 |
| | Flask-SocketIO | 5.3.6 |
| | MySQL Connector | 8.2.0 |
| | bcrypt | 4.1.2 |
| | pyotp | 2.9.0 |
| | OpenCV | 4.10.0.84 |
| | pyzbar | 0.1.9 |
| **AI** | Python | 3.10+ |
| | Flask | 3.0.3 |
| | Ollama | Latest |
| | LLaMA | 3.8b-instruct-q4_K_M |
| **Database** | MySQL/MariaDB | 8.0+ |
| **QR** | OpenCV | 4.10.0.84 |
| | pyzbar | 0.1.9 |
| | qrcode | 1.5.4 (generation) |

---

## Final Notes

This is a **production-ready architecture** with:
- ✅ Secure authentication (bcrypt + TOTP)
- ✅ Real-time notifications (Socket.IO)
- ✅ Comprehensive activity logging
- ✅ QR-based access control
- ✅ AI-powered assistance (Jose)
- ✅ Role-based authorization
- ✅ Multi-service deployment
- ✅ Graceful error handling

Next steps for deployment:
1. Set up HTTPS certificates
2. Configure environment variables (.env files)
3. Initialize MySQL databases and run schema scripts
4. Set up email (SMTP credentials)
5. Test all 5 services with `Start-All-Enforced.ps1`
6. Monitor logs for errors
7. Back up database regularly
