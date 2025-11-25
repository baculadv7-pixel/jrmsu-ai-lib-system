# JRMSU AI-Library Management System

An AI-enhanced smart library platform for Jose Rizal Memorial State University – Katipunan Campus.

**Presented by:** Jhon Mark A. Suico & Group  
**Institution:** Jose Rizal Memorial State University – Katipunan Campus

---

## Background of the Study

Traditional library operations at JRMSU have relied on manual or semi-digital processes for user authentication, book circulation, and records management. This leads to:

- Inefficient tracking of active library users and sessions
- Fragmented or inconsistent borrowing/return records
- Limited visibility for administrators into real-time library activity
- Manual notification workflows for overdue books and system events

The **JRMSU AI-Library Management System** addresses these gaps by integrating:

- QR-based authentication and identity binding
- Two-Factor Authentication (TOTP-based 2FA) for both students and admins
- A real-time, database-backed library entry/exit system (mirror page + backend)
- An AI assistant backed by an LLM and curated system knowledge
- A unified notifications and activity log system for admins and users

All of these components are implemented in this repository under a multi-service architecture.

---

## Objectives of the Study

1. **Develop an AI-enhanced library system with QR + 2FA authentication** for both students and administrators.
2. **Automate book reservation, borrowing, returning, and notification workflows** using a central Python backend and a mirror login page.
3. **Integrate an AI assistant** that understands JRMSU library policies, supports natural-language queries, and surfaces contextual, library-specific guidance.
4. **Provide real-time dashboards and activity feeds** so admins can monitor active sessions, book circulation, and system events.
5. **Improve security, auditability, and data consistency** by consolidating operations on top of MySQL/MariaDB and file-backed fallbacks.

These objectives are realized in the codebase through specific modules and endpoints described in later sections.

---

## Scope, Users, and Limitations

### Scope

The system includes the following major subsystems:

- **Main Web Application (Admin + Student Portal)**  
  Path: `jrmsu-wise-library-main/`  
  Technologies: React + TypeScript (Vite), Tailwind, ShadCN UI  
  Features:
  - Book management and inventory (`src/pages/BookManagement.tsx`, `src/services/books.ts`)
  - Student and admin profile management (`src/pages/Profile.tsx`, `src/components/student/StudentProfileModal.tsx`, `src/components/AdminProfileModal.tsx`)
  - Borrow and reservation views (`src/pages/Books.tsx`, `src/services/borrow.ts`, `src/services/reservations.ts`)
  - Dashboards and reports (`src/pages/Dashboard.tsx`, `src/services/dashboardApi.ts`, `src/services/stats.ts`, `src/pages/Reports.tsx`)
  - Notifications and bell UI (`src/components/Layout/Navbar.tsx`, `src/services/notifications.ts`, `src/services/notificationsApi.ts`, `src/services/notificationManager.ts`)
  - 2FA setup and verification (`src/components/auth/TwoFASetup.tsx`, `src/context/AuthContext.tsx`)

- **Python Backend (Core API + Auth + Library Integration)**  
  Path: `jrmsu-wise-library-main/python-backend/`  
  Technologies: Python, Flask, Flask-SocketIO, MySQL/MariaDB  
  Key modules:
  - `app.py` – main Flask application, CORS, socket.io, audit log, backup/restore, admin & student APIs, 2FA, email
  - `library_endpoints.py` – DB-backed reservation, borrow, return, user-status, admin views
  - `library_session_manager.py` – robust library session tracking, active sessions, activity_log table
  - `notifications_routes.py` & `notifications_service.py` – notifications + activity log, Socket.IO integration
  - `notification_endpoints.py` – email/SMS/push for overdue notifications and notification preferences

- **Mirror Login Page (Library Entry/Exit + QR Borrow/Return)**  
  Path: `mirror-login-page/`  
  Technologies: React + TypeScript, QR scanner components  
  Features:
  - Library entry/exit login UI at `http://localhost:8081/` (`src/pages/LibraryEntry.tsx`)
  - Shared library session context (`src/context/LibrarySessionContext.tsx`) calling Python backend library APIs
  - QR-based book scanning dialogs (`src/components/library/BookScannerDialog.tsx`, `src/components/qr/QRScanner.tsx`)
  - Borrow/return prompts when logging in or out with outstanding reservations/borrows

- **AI Server**  
  Path: `ai_server/`  
  Technologies: Python + Flask, LLM via Ollama or HTTP API  
  Files:
  - `ai_server/app.py` – exposes AI assistant HTTP endpoints
  - `system_knowledge.json` – curated JRMSU Library domain knowledge used for grounded responses

- **Root Scripts and Data**  
  At repo root (`COMPREHENSIVE_SYSTEM_CHECK.py`, SQL files, Excel geography and address data), used to:
  - Seed and normalize Philippine geography (regions, provinces, municipalities)
  - Initialize library tables (`create_library_tables.sql`)
  - Run consistency checks across services

### Users

- **Students**
  - Register, manage profile, generate and download personal QR codes
  - Login with ID/password or QR on main site and mirror page
  - Reserve, borrow, and return books
  - Receive notifications (overdue, borrow/return events, password resets)

- **Library Administrators**
  - Manage books, students, and fellow admins
  - Monitor dashboards, activity logs, active sessions, and reports
  - Configure and use 2FA for high-privilege accounts
  - Receive library activity notifications for reservations, borrows, returns, and forgotten logouts

### Limitations

- Some features depend on **MySQL/MariaDB** being available. When unavailable, several modules gracefully fall back to a file-backed JSON store (`python-backend/data.json`), which is suitable for development only.
- The AI assistant depends on an external LLM endpoint (Ollama by default); if unreachable, the frontend falls back to standard search and static UX.
- Certain mirror-specific notification hooks in `mirror_login_api.py` are currently console-only stubs and not wired into the unified bell system, but the core borrow/return/return-time events are wired through `library_endpoints.py` and `library_session_manager.py`.

---

## Related Works / Studies

Most legacy library systems at HEIs focus on basic catalog management and manual circulation, often lacking:

- QR-based identity and session tracking
- Robust per-user and per-session audit trails
- Realtime dashboards and web socket–based notifications
- Tight integration between library entry/exit flows and the lending system
- AI-driven assistance grounded in institutional policies

The JRMSU AI-Library Management System extends beyond typical LMS solutions by:

- Combining **entry/exit tracking** (mirror page + `library_session_manager.py`) with 
  **circulation data** (`borrow_records`, `reservations`, `books` tables) to provide a unified view of library usage.
- Using **AI** (via `ai_server/app.py` and `system_knowledge.json`) to offer policy-aware responses and search assistance across the UI.
- Implementing **2FA and QR-based user identity** via `AuthContext.tsx`, `TwoFASetup.tsx`, and Python 2FA endpoints to improve account security.

---

## Technologies Used

### Frontend

- **Framework:** React 18 + TypeScript
- **Bundler/Dev server:** Vite (`jrmsu-wise-library-main/package.json`)
- **UI Library:** ShadCN UI components (`src/components/ui/…`)
- **Styling:** Tailwind CSS (`tailwind.config.ts`)
- **Routing:** React Router DOM (`src/main.tsx`, `src/pages/*.tsx`)
- **State & Data Fetching:** React Query (`@tanstack/react-query`)
- **Realtime:** Socket.IO client (`socket.io-client`) in `src/services/dashboardRealtime.ts`, `src/services/notificationsApi.ts` and mirror `backendRealtime` service

### Backend

- **Primary API:** Python + Flask (`python-backend/app.py`)
- **Realtime transport:** Flask-SocketIO (`SocketIO(app, ...)`) for:
  - Dashboard events (`book.added`, `book.borrowed`, `book.returned`, `book.overdue`)
  - Notification events (`notification.new`, `notification.update`)
  - Library session updates (`session_update`)
- **Secondary APIs:**
  - `notifications_routes.py` – `/api/notifications`, `/api/activity-log`, `/api/notifications/create`, etc.
  - `notification_endpoints.py` – `/api/notifications/email/overdue`, `/api/overdue/notify-all`, `/api/borrows`
  - `library_endpoints.py` – `/api/library/reserve-book`, `/api/library/borrow-book`, `/api/library/return-book`, `/api/library/user-status/<userId>`
  - `library_session_manager.py` – `/api/library/login`, `/api/library/logout`, `/api/library/force-logout`, `/api/library/check-session/<userId>`, `/api/library/forgotten-logouts`

### Database & Storage

- **Relational DB:** MariaDB/MySQL (e.g. `jrmsu_library`)
  - Core schemas created from SQL:
    - `create_library_tables.sql`
    - `python-backend/notifications_schema.sql`
  - Runtime table initialization in `library_session_manager.py`:
    - `active_sessions`, `library_sessions`, `activity_log`
  - Library and notifications tables (from SQL + runtime code):
    - `books`, `borrow_records`, `reservations`, `notifications`, `notification_dedup`, `audit_log`, `db_backups`, `system_version`, `developers`
- **File-backed dev store:** `python-backend/data.json` with helper `load_db()` / `save_db()` for:
  - Minimal users, books, borrows in dev
  - Audit logs when MySQL is not available

### AI Module

- **AI Server:** Python Flask app in `ai_server/app.py`
- **Model:** Configurable via `OLLAMA_URL` and `OLLAMA_MODEL` (defaults in `python-backend/app.py`)
- **Knowledge base:** `ai_server/system_knowledge.json` (JRMSU library rules, flows, policies) used to ground AI responses.
- **Frontend integration:**
  - `src/components/Layout/AIAssistant.tsx` and `src/components/ui/ai-assistant.tsx`
  - `src/services/aiService.ts` and `src/services/aiSearchService.ts` for AI assistance and smart search.

### Version Control & Tooling

- **VCS:** Git (GitHub-ready)  
- **Linting:** ESLint (`eslint.config.js`)  
- **Testing:** Vitest (`vitest` in `package.json`)

---

## System Design

### High-Level Architecture

The system is split into coordinated services:

1. **Frontend (Admin/Student UI)** – `jrmsu-wise-library-main/src`
   - React routes: `src/pages/*.tsx`
   - Contexts: `src/context/AuthContext.tsx`, `src/context/RegistrationContext.tsx`
   - Services: `src/services/*.ts` for API clients, business logic, and realtime handlers

2. **Python Backend API** – `jrmsu-wise-library-main/python-backend`
   - Unified app in `app.py` mounts:
     - Core routes (auth, users, admin)
     - Library session endpoints via `register_library_session_endpoints(app)`
     - Notification routes via `app.register_blueprint(notifications_bp)`
   - Socket.IO used for dashboards, notifications, and active sessions

3. **Mirror Login Page** – `mirror-login-page/src`
   - Single `LibraryEntry` route for all mirror operations
   - Uses `LibrarySessionContext` to talk to `/api/library/*` endpoints
   - QR Scanner flows for borrowing and returning books

4. **AI Server** – `ai_server/app.py`
   - Provides AI assistant/chat and smart search endpoints
   - Consumes `system_knowledge.json` for domain grounding

### Key Data Model (Conceptual)

- **Students** – `students` table in DB, plus user records in `data.json` for fallback
- **Admins** – `admins` table in DB
- **Books** – `books` table with fields like `id`, `title`, `author`, `category`, `available_copies`, `total_copies`, `status`
- **Borrow Records** – `borrow_records` table with `borrow_id`, `user_id`, `user_type`, `book_id`, `book_title`, `borrowed_at`, `due_date`, `status`, `returned_at`, `return_time_activated`
- **Reservations** – `reservations` table linking `user_id` ↔ `book_id`, with `status`, `reserved_at`, `fulfilled_at`, `cancelled_at`
- **Notifications** – `notifications` table + in-memory `NOTIFICATIONS` map used by Socket.IO, plus `notification_dedup`
- **Active Sessions** – `library_sessions` table + `active_sessions` mirror used by `library_session_manager.py`
- **Activity Log** – `activity_log` table storing `actor_id`, `event`, `details`, `source`, and `timestamp`

---

## System Demonstration (End-to-End Flow)

### 1. Registration & Authentication

- **Student registration** via `/register` (frontend):  
  Code: `src/pages/Registration*.tsx`, `src/context/RegistrationContext.tsx`  
  Backend: `app.py` → `/api/students/register` calling `StudentDB.register_student()`  
- **Admin registration** via admin screens:  
  Backend: `app.py` → `/api/admins/register` using `AdminDB.register_admin()`

- **Login (main app)**:  
  Frontend: `src/pages/Login.tsx`, `AuthContext.tsx::signIn`  
  Backend: `app.py` user authentication using `databaseService` (frontend) and MySQL `admins`/`students` tables.

- **2FA Setup & Verification**:  
  Frontend: `TwoFASetup.tsx`, `AuthContext.tsx::enableTwoFactor/disableTwoFactor`, `verifyTotp`  
  Backend: `app.py` routes:
  - `/api/admins/<admin_id>/2fa/setup`, `/api/admins/<admin_id>/2fa/verify`, `/api/admins/<admin_id>/2fa/disable`
  - `/api/students/<student_id>/2fa/setup`, `/api/students/<student_id>/2fa/verify`, `/api/students/<student_id>/2fa/disable`

### 2. Library Entry / Exit (Mirror Page)

- **Mirror login** at `http://localhost:8081/` (`mirror-login-page`):
  - Frontend: `src/pages/LibraryEntry.tsx`
  - Uses `AuthContext` for identity, then `LibrarySessionContext.createSession()`
  - Backend: `library_session_manager.register_library_session_endpoints(app)` → `/api/library/login`, `/api/library/logout`, `/api/library/forced-logout`

- **Active session list**:  
  Frontend: `mirror-login-page/src/components/sessions/ActiveSessionsPanel.tsx` (via `useLibrarySession` and `/api/library/active-sessions`)  
  Backend: `library_session_manager._active_tbl()` + `/api/library/active-sessions`

- **Forgotten logouts** are detected and admins are notified:  
  Backend: `library_session_manager.check_forgotten_logouts()` and `/api/library/forgotten-logouts`

### 3. Book Reservation (Main Site)

- **Student/Admin reserves a book** on `/books` (`http://localhost:8080/books`):
  - Frontend:
    - Page: `src/pages/Books.tsx`
    - Reserve flow: `reserve(book)` → `confirmReserve()`
    - API call:
      ```ts
      fetch(`${API_BASE}/api/library/reserve-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: studentId,
          userType: userType,
          bookId: book.id,
          bookTitle: book.title,
          quantity: reserveQuantity,
        }),
      })
      ```
    - Local persistence: `ReservationsService.add(...)`
  - Backend:
    - Endpoint: `library_endpoints.library_reserve_book` (`/api/library/reserve-book`)
    - Tables used: `books`, `reservations`
    - Notifications:
      - `_notify_all_admins(app, ..., 'reservation_created', {...})` → admins’ notification bell via Socket.IO

### 4. Borrowing Books (Mirror QR Scanner)

When a user with reservations logs into the mirror page:

- **Status check**:  
  Frontend: `LibrarySessionContext.checkUserStatus(userId)` calls `/api/library/user-status/<userId>`  
  Backend: `library_endpoints.library_user_status`

- **Prompt to scan reserved book**:  
  Frontend: `BookPickupDialog` and `BorrowReturnPromptDialog` in `LibraryEntry.tsx`  
  On confirm → open `BookScannerDialog` → `handleBookScanned(bookId)` → `borrowBook(bookId)`.

- **Borrow**:  
  Frontend: `LibrarySessionContext.borrowBook(bookId)` → POST `/api/library/borrow-book` with `userId`, `sessionId`  
  Backend: `library_endpoints.library_borrow_book`:
  - Verifies pending reservation
  - Inserts row into `borrow_records`
  - Marks reservation as fulfilled
  - Decrements `books.available_copies`
  - Logs activity to `activity_log` (via `library_session_manager`) and emits:
    - Admin notification: `_notify_all_admins(app, ..., 'book_borrowed', {...})`
    - Realtime event: `_broadcast('book.borrowed', {...})` for dashboard overlays

### 5. Returning Books (Mirror QR Scanner)

- **Prompt to return**:  
  If `checkUserStatus` shows borrowed books, `LibraryEntry.tsx` opens `BookReturnDialog` or `BorrowReturnPromptDialog` in return mode.

- **Return**:  
  Frontend: `LibrarySessionContext.returnBook(bookId)` → POST `/api/library/return-book`  
  Backend: `library_endpoints.library_return_book`:
  - Finds active `borrow_records` row
  - Marks it returned and updates timestamps
  - Restores book availability and status
  - Calls `_notify_all_admins(app, ..., 'book_returned', {...})`
  - Emits `_broadcast('book.returned', {...})`

### 6. Return Time Activation on Logout

- During logout, mirror can optionally call `/api/library/activate-return-time` when a book is scanned at exit:
  - Frontend: `LibrarySessionContext.activateReturnTime(bookId)`
  - Backend: `library_endpoints.library_activate_return_time` updates `borrow_records.return_time_activated` and notifies admins with `return_time_activated` type, also broadcasting `return_time.activated`.

### 7. Notifications & Dashboard

- **Notification bell** in main app:  
  Frontend: `src/components/Layout/Navbar.tsx`  
  Data sources:
  - Local `NotificationsService` (AI + system messages from `notificationManager.ts`)
  - Backend `NotificationsAPI` (`notificationsApi.ts`) → `/api/notifications`, `/api/notifications/mark-read`, plus Socket.IO events `notification.new`, `notification.update`

- **Dashboard stats and overlays**:  
  Frontend: `src/pages/Dashboard.tsx`  
  Sources:
  - Summary: `DashboardApi.summary()` → `/api/dashboard/summary`
  - Total books, active borrowers, borrowed today, overdue: `/api/dashboard/*`
  - Realtime events via `connectDashboardRealtime` (`dashboardRealtime.ts`)

- **Recent Activity (real DB)**:  
  Frontend: `Dashboard.tsx` fetches `/api/activity-log?limit=100` and formats lines as `userId • event • method`.  
  Backend: `notifications_routes.get_activity_log` → `NotificationsService.get_activity_log` → `activity_log` table, tolerant of non-JSON `details`.

---

## Evaluation & Results (Qualitative)

While numerical ISO/IEC 25010 scores require formal user testing, the current system design emphasizes:

- **Functionality** – Full cycle from registration, QR + 2FA login, reservation, borrowing, returning, and overdue handling, using coordinated frontends and a shared Python backend.
- **Reliability** – Database-backed tables with schema migration safety, fallbacks to file storage, and robust error handling for critical endpoints (library and notifications).
- **Security** – Enforced ID formats for admin and student IDs, 2FA for both roles, audit logging, and role-aware endpoints.
- **Usability** – Tailored admin and student dashboards, mirror entry UI focused on rapid QR workflows, and an AI assistant to reduce cognitive load.

---

## Acknowledgment

We acknowledge the effort of the development team and the JRMSU Katipunan Campus stakeholders who contributed requirements, feedback, and validation during the design and implementation of this system.

Special thanks to:

- **Jhon Mark Suico** – Team Leader & System Engineer  
- **Jhon Ernie Alimpong** – System Architect  
- **Vivien Punay** – Product Manager  
- **Lenny Mambo** – Data Analyst  

for their significant roles in designing, building, and refining the JRMSU AI-Library Management System.

---

## System Flowchart (Mermaid)

The following Mermaid diagram summarizes the end-to-end flow across frontend, backend, mirror page, and database. This code can be pasted into the Mermaid Live Editor.

```mermaid
flowchart TD
  %% Users
  UStudent[Student User]
  UAdmin[Admin User]

  %% Frontends
  subgraph Frontend_Main[Main Web App (8080)]
    LLogin[Login / Registration Pages]
    BBooks[Books Page / Reservations]
    BManage[Book Management]
    DDash[Admin Dashboard]
    NBell[Notification Bell]
    AIAssist[AI Assistant]
  end

  subgraph Frontend_Mirror[Mirror Login Page (8081)]
    MEntry[LibraryEntry.tsx
    (Manual/QR Login)]
    MScanner[BookScannerDialog
    + QRScanner]
    MSessions[ActiveSessionsPanel]
  end

  %% Backend
  subgraph Backend[Python Backend (Flask, 5000)]
    subgraph AuthAPI[Auth & Users]
      AUsers[/Admins & Students
      (admins, students tables)/]
      AuthRoutes[/Auth & Users API
      (app.py)/]
    end

    subgraph LibraryAPI[Library & Sessions]
      LEndpoints[/library_endpoints.py
      /api/library/*/]
      LSessionMgr[/library_session_manager.py
      sessions & activity_log/]
    end

    subgraph NotifAPI[Notifications]
      NService[/notifications_service.py
      notifications & activity_log/]
      NRoutes[/notifications_routes.py
      /api/notifications/*, /api/activity-log/]
    end

    subgraph AIAPI[AI Server]
      AIHTTP[/ai_server/app.py
      /ai/*/]
      AIKB[(system_knowledge.json)]
    end

    DB[(MariaDB / MySQL
    jrmsu_library
    - books
    - reservations
    - borrow_records
    - notifications
    - library_sessions
    - active_sessions
    - activity_log
    - audit_log
    )]
  end

  %% Flows: Main login/registration
  UStudent --> LLogin
  UAdmin --> LLogin

  LLogin -->|Register / Update Profile| AuthRoutes
  AuthRoutes --> AUsers
  AUsers --> AuthRoutes

  %% Main site: Reservations
  UStudent --> BBooks
  UAdmin --> BBooks

  BBooks -->|Reserve Book
  POST /api/library/reserve-book| LEndpoints
  LEndpoints --> DB
  LEndpoints -->|Notify Admins| NService
  NService --> NRoutes
  NRoutes -->|Socket.IO notification.new| NBell

  %% Mirror login & sessions
  UStudent --> MEntry
  UAdmin --> MEntry

  MEntry -->|Auth via AuthContext
  (ID/PW or QR)| AuthRoutes
  AuthRoutes --> AUsers

  MEntry -->|Create Library Session
  POST /api/library/login| LSessionMgr
  LSessionMgr --> DB
  LSessionMgr -->|Admin Notifications
  (library_login)| NService

  %% Mirror: Status checks and prompts
  MEntry -->|GET /api/library/user-status/{userId}| LEndpoints
  LEndpoints --> DB
  LEndpoints --> MEntry

  MEntry -->|Show Pickup/Return Dialogs| MScanner

  %% Mirror: Borrow via QR
  MScanner -->|Scan QR Borrow
  POST /api/library/borrow-book| LEndpoints
  LEndpoints --> DB
  LEndpoints -->|_notify_all_admins
  (book_borrowed)| NService
  NService --> NRoutes
  NRoutes -->|Socket.IO| NBell

  %% Mirror: Return via QR
  MScanner -->|Scan QR Return
  POST /api/library/return-book| LEndpoints
  LEndpoints --> DB
  LEndpoints -->|_notify_all_admins
  (book_returned)| NService

  %% Mirror: Return time activation
  MEntry -->|Logout with scan
  POST /api/library/activate-return-time| LEndpoints
  LEndpoints --> DB
  LEndpoints -->|_notify_all_admins
  (return_time_activated)| NService

  %% Dashboards & Activity
  DDash -->|GET /api/dashboard/*| LEndpoints
  LEndpoints --> DB

  DDash -->|GET /api/activity-log| NRoutes
  NRoutes --> DB
  DB --> NRoutes
  NRoutes --> DDash

  %% AI Assistant
  AIAssist -->|User question| AIHTTP
  AIHTTP --> AIKB
  AIHTTP --> AIAssist

  %% Active Sessions overlay
  MSessions -->|GET /api/library/active-sessions| LSessionMgr
  LSessionMgr --> DB

  %% Notifications from library_session_manager
  LSessionMgr -->|notify_all_admins
  (library_login/logout,
   forgotten_logout)| NService
  NService --> NRoutes --> NBell
```

---

## Code Map by Layer and Feature

This section maps specific features to code files and (conceptual) line ranges.

> **Note:** Line numbers are approximate; use your editor’s search to jump to the referenced functions and routes.

### Frontend: Main Web App (`jrmsu-wise-library-main/src`)

- **Authentication & 2FA**
  - `context/AuthContext.tsx`
    - `signIn` (manual login) and `signInWithQR` (QR login)
    - TOTP verification via `verifyTotp`
    - Logs activities with `ActivityService.log`
  - `components/auth/TwoFASetup.tsx` – UI for enabling/disabling 2FA
  - `components/auth/QRCodeLogin.tsx` – QR-based login (main app)

- **Books, Reservations, and Borrowing (Read-only + Reserve)**
  - `pages/Books.tsx`
    - Table and cards listing books
    - `reserve(book)` and `confirmReserve()` → `/api/library/reserve-book`
    - Reflects backend reservations via `ReservationsService` + `loadReservations()` calling `/api/library/user-reservations/<userId>` and `/api/library/reservations-all`
  - `services/books.ts` – book seed & local store for front-end-only operations
  - `services/reservations.ts` – local reservation persistence

- **Admin Book Management**
  - `pages/BookManagement.tsx`
    - CRUD UI for books (create, edit, delete)
    - QR code generation for each book using `components/qr/QRCodeDisplay.tsx`

- **Dashboards and Stats**
  - `pages/Dashboard.tsx`
    - Uses `StatsService` for live stats (borrowed, available, etc.)
    - Uses `DashboardApi` for backend overlays
    - Uses `connectDashboardRealtime` to receive Socket.IO events from backend (`dashboardRealtime.ts`)
    - Recent Activity from `/api/activity-log` formatted with `formatActivityLine`
  - `services/dashboardApi.ts` – HTTP client for `/api/dashboard/*`
  - `services/stats.ts` – combines local stats with backend `summary()`

- **Notifications & Admin Bell**
  - `components/Layout/Navbar.tsx`
    - Integrates `NotificationsService` (local) and `NotificationsAPI` (backend)
    - Connects to Socket.IO for `notification.new`, `notification.update`, `notification.mark_all_read`
  - `services/notifications.ts` – local + AI notifications store
  - `services/notificationsApi.ts` – REST + realtime wrapper for `/api/notifications` endpoints
  - `services/notificationManager.ts` – higher-level notification helpers (e.g., `bookReserved`, `libraryLoginManual`, `libraryLogoutManual`), used in registration and book flows

- **AI Assistant**
  - `components/Layout/AIAssistant.tsx`, `components/ui/ai-assistant.tsx`
  - `services/aiService.ts` and `services/aiSearchService.ts` – calls to AI server and AI-powered search

### Frontend: Mirror Login Page (`mirror-login-page/src`)

- **Library Entry UI**
  - `pages/LibraryEntry.tsx`
    - Handles manual and QR logins (`AuthContext`)
    - Integrates `useLibrarySession()` for session creation and logout
    - Coordinates `BookPickupDialog`, `BookReturnDialog`, `BorrowReturnPromptDialog`, `BookScannerDialog`

- **Library Session Context**
  - `context/LibrarySessionContext.tsx`
    - Tracks current session (`LibrarySession` type)
    - `createSession`, `endSession` → `/api/library/login`, `/api/library/logout`
    - `checkUserStatus` → `/api/library/user-status/<userId>`
    - `checkUserSessionStatus` → `/api/library/check-session/<userId>`
    - `borrowBook`, `returnBook`, `cancelReservation`, `activateReturnTime` → respective `/api/library/*` endpoints

- **QR Scanning**
  - `components/library/BookScannerDialog.tsx` – wraps the QR scanner and uses callbacks
  - `components/qr/QRScanner.tsx` – camera + QR decoding
  - `components/library/BorrowReturnPromptDialog.tsx` – pre-scan prompt for borrow/return

### Backend: Python Core (`jrmsu-wise-library-main/python-backend`)

- **App & Core Infrastructure** – `app.py`
  - Configures Flask app and Socket.IO
  - Sets up CORS for `8080` and `8081`
  - Declares MySQL availability and file-backed DB (`data.json`)
  - Implements:
    - Audit logging (`write_audit_log`, `/api/audit/export`)
    - Backup and restore (`/api/backup/*`)
    - System version & developers metadata (`/api/admin/system-version`, `/api/admin/developers`)
    - Admin and student CRUD & registration (`/api/admins/*`, `/api/students/*`)
    - 2FA endpoints for admins and students

- **Notifications & Activity**
  - `notifications_service.py`
    - `JoseAI` for templated messages
    - `create_notification`, `get_notifications`, `get_unread_count`, `get_activity_log`
    - `notify_all_admins`, `notify_user`, `log_activity` helper that writes to `activity_log`
  - `notifications_routes.py`
    - REST endpoints:
      - `/api/notifications` (list)
      - `/api/notifications/mark-read`
      - `/api/notifications/mark-all-read`
      - `/api/activity-log` (dashboard recent activity)
      - `/api/activity` (compat for front-end `ActivityService`)
    - Notification-type-specific handlers for library login/logout, book_reserved/borrowed/returned/overdue

- **Library Endpoints** – `library_endpoints.py`
  - Reservation operations (`/api/library/reserve-book`, `/api/library/cancel-reservation`)
  - Borrow/return operations (`/api/library/borrow-book`, `/api/library/return-book`)
  - Return time activation (`/api/library/activate-return-time`)
  - Status endpoints (`/api/library/user-status/<userId>`, `/api/library/user-reservations/<userId>`, `/api/library/user-borrowed/<userId>`, and `*-all` variants for admins)
  - Each operation integrates with `_notify_all_admins` for bell notifications and `_broadcast` for realtime dashboard events.

- **Library Sessions & Active Sessions** – `library_session_manager.py`
  - Ensures existence of `active_sessions`, `library_sessions`, and `activity_log` tables
  - `create_login_session` and `create_logout_session` manage odd/even `action_count` semantics
  - `/api/library/login`, `/api/library/logout`, `/api/library/force-logout`, `/api/library/check-session/<userId>`, `/api/library/active-sessions`, `/api/library/forgotten-logouts`
  - Uses `notify_all_admins` and `log_activity` to push activity into admin bell & `activity_log`

- **Notification Endpoints & Overdue Handling** – `notification_endpoints.py`
  - Sends email/SMS/push notifications for overdue books
  - Maintains notification preferences per user (`/api/users/<user_id>/notification-preferences`)
  - Exposes `/api/overdue/notify-user/<user_id>` and `/api/overdue/notify-all` for batch reminder flows

### AI Server (`ai_server/app.py`)

- Flask app that:
  - Loads `system_knowledge.json`
  - Talks to LLM (e.g., via Ollama) as configured in env
  - Exposes HTTP endpoints consumed by `aiService.ts` and `aiSearchService.ts` for:
    - General AI Q&A
    - Smart search over library content

---

## How to Run (Overview)

1. **Backend** (Python):
   - Navigate to `jrmsu-wise-library-main/python-backend`.
   - Activate venv if needed, install requirements: `pip install -r requirements.txt`.
   - Run: `python app.py` (default `http://localhost:5000`).

2. **Main Frontend**:
   - Navigate to `jrmsu-wise-library-main`.
   - Install deps: `npm install`.
   - Run dev server: `npm run dev` (default `http://localhost:8080`).

3. **Mirror Frontend**:
   - Navigate to `mirror-login-page`.
   - Install deps: `npm install`.
   - Run dev server: `npm run dev` (default `http://localhost:8081`).

4. **AI Server**:
   - Navigate to `ai_server`.
   - Configure `OLLAMA_URL` / API endpoint as needed.
   - Run: `python app.py`.

Adjust `.env` files under each service (backend, frontend, AI) to point to the correct ports, DB credentials, and AI endpoints.
