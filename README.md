# JRMSU AI-Library Management System
An AI-enhanced smart library platform for **Jose Rizal Memorial State University – Katipunan Campus**.

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
1. Develop an AI-enhanced library system with QR + 2FA authentication for both students and administrators.
2. Automate book reservation, borrowing, returning, and notification workflows using a central Python backend and a mirror login page.
3. Integrate an AI assistant that understands JRMSU library policies, supports natural-language queries, and surfaces contextual, library-specific guidance.
4. Provide real-time dashboards and activity feeds so admins can monitor active sessions, book circulation, and system events.
5. Improve security, auditability, and data consistency by consolidating operations on top of MySQL/MariaDB and file-backed fallbacks.

---

## Repository Structure (High-Level)
This repository is a multi-service system with coordinated frontends and backends.

- `jrmsu-wise-library-main/` – **Main web app** (students + admins)
  - Tech: React + TypeScript (Vite), Tailwind, ShadCN
- `jrmsu-wise-library-main/python-backend/` – **Primary Python backend**
  - Tech: Python, Flask, Flask-SocketIO, MySQL/MariaDB
- `mirror-login-page/` – **Mirror login page** (library entry/exit + QR borrow/return)
  - Tech: React + TypeScript (Vite), Tailwind, QR scanner UI
- `ai_server/` – **AI server**
  - Tech: Python + Flask, LLM via Ollama, curated knowledge base
- `DesktopappLibrary/` – **Desktop app wrapper**
  - Tech: Electron (wraps the web UI)
- `python-backend/` (repo root) – utilities (example: QR generator scripts)

---

## Scope, Users, and Limitations

### Scope
Major subsystems:

- **Main Web Application (Admin + Student Portal)**  
  Path: `jrmsu-wise-library-main/`
  - Book management and inventory: `src/pages/BookManagement.tsx`, `src/services/books.ts`
  - Borrow and reservation views: `src/pages/Books.tsx`
  - Dashboards and reports: `src/pages/Dashboard.tsx`, `src/pages/Reports.tsx`
  - Notifications: `src/services/notifications.ts`, `src/services/notificationsApi.ts`
  - 2FA setup and verification: `src/components/auth/TwoFASetup.tsx`, `src/context/AuthContext.tsx`

- **Python Backend (Core API + Auth + Library Integration)**  
  Path: `jrmsu-wise-library-main/python-backend/`
  - `app.py` – main Flask app (CORS, Socket.IO, users/admin/students, backups, audit, etc.)
  - `library_endpoints.py` – DB-backed reservation, borrow, return, user-status endpoints
  - `library_session_manager.py` – library login/logout and active session tracking
  - `notifications_routes.py` / `notifications_service.py` – notifications + activity log
  - `notification_endpoints.py` – overdue notifications and preferences

- **Mirror Login Page (Library Entry/Exit + QR Borrow/Return)**  
  Path: `mirror-login-page/`
  - Mirror UI: `src/pages/LibraryEntry.tsx`
  - Session context (calls `/api/library/*`): `src/context/LibrarySessionContext.tsx`

- **AI Server**  
  Path: `ai_server/`
  - `ai_server/app.py` – AI HTTP endpoints
  - `ai_server/system_knowledge.json` – JRMSU Library knowledge base

- **Desktop App (Electron Wrapper)**  
  Path: `DesktopappLibrary/`
  - `main.js` – Electron main process
  - Uses the same backend at `http://localhost:5000`

### Users
- **Students**
  - Register, manage profile, generate/download QR
  - Reserve, borrow, and return books
  - Receive notifications (borrow/return, overdue, password reset)

- **Library Administrators**
  - Manage books and users
  - Monitor dashboards, activity logs, active sessions, and reports
  - Use/enforce 2FA for high-privilege accounts

### Limitations
- Some features require **MySQL/MariaDB**. When DB is unavailable, some modules fall back to a file-backed store (`jrmsu-wise-library-main/python-backend/data.json`) for development only.
- The AI assistant depends on an external LLM endpoint (Ollama by default). If unavailable, AI features will fail or degrade.

---

## Technologies Used

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + ShadCN UI
- React Router
- React Query (`@tanstack/react-query`)
- Socket.IO client (realtime dashboards & notifications)

### Backend
- Python + Flask
- Flask-SocketIO
- MySQL/MariaDB

### AI Module
- Python Flask AI server (`ai_server/app.py`)
- Ollama (local LLM runtime)
- Knowledge base: `ai_server/system_knowledge.json`

---

## Ports / URLs
Default local URLs:

- Main frontend: `http://localhost:8080`
- Mirror login page: `http://localhost:8081`
- Python backend: `http://localhost:5000`
- AI server: `http://localhost:5002`
- Ollama: `http://localhost:11434`

---

## Install Guide (Windows)

### 1) Required Software
- **Node.js** (LTS recommended)
- **Python 3.10+**
- **MySQL/MariaDB** (commonly via XAMPP)
- **Ollama** (for AI features)

Make sure `node`, `npm`, `python`, and `pip` are available in your PATH.

### 2) Database Setup (MySQL / MariaDB)
1. Create database: `jrmsu_library`
2. Import schema SQL (repo root and backend SQL files), for example:
   - `create_library_tables.sql`
   - `jrmsu-wise-library-main/python-backend/database/library_schema.sql`

> Use the same credentials that `jrmsu-wise-library-main/python-backend/db.py` expects.

### 3) Python Backend Dependencies
From repo root:

```powershell
cd "jrmsu-wise-library-main/python-backend"
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

### 4) Main Frontend Dependencies

```powershell
cd "jrmsu-wise-library-main"
npm install
```

### 5) Mirror Frontend Dependencies

```powershell
cd "mirror-login-page"
npm install
```

### 6) AI Server Dependencies (Optional)

```powershell
cd "ai_server"
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install flask requests mysql-connector-python textblob
```

Then install and start Ollama:

```powershell
ollama serve
ollama pull llama3:8b-instruct-q4_K_M
```

---

## How to Run

### 1) Start the Python Backend (Port 5000)

```powershell
cd "jrmsu-wise-library-main/python-backend"
. .venv\Scripts\Activate.ps1
python app.py
```

### 2) Start the Main Web App (Port 8080)

```powershell
cd "jrmsu-wise-library-main"
npm run dev
```

### 3) Start the Mirror Login Page (Port 8081)

```powershell
cd "mirror-login-page"
npm run dev
```

### 4) Start the AI Server (Port 5002) (Optional)

```powershell
cd "ai_server"
. .venv\Scripts\Activate.ps1
python app.py
```

---

## End-to-End Flow Summary
- Users register/login (manual or QR) on the main site.
- Mirror page manages library entry/exit sessions and triggers borrow/return via QR scanning.
- Core circulation is stored in MySQL tables:
  - `books`, `reservations`, `borrow_records`
- Realtime updates are delivered via Socket.IO:
  - Dashboard events (book added/borrowed/returned)
  - Notification events (notification.new, notification.update)

---

## Acknowledgment
Special thanks to the JRMSU Katipunan Campus stakeholders who supported requirements and validation.

Development team:
- **Jhon Mark Suico** – Team Leader & System Engineer
- **Jhon Ernie Alimpong** – System Architect
- **Vivien Punay** – Product Manager
- **Lenny Mambo** – Data Analyst
