# JRMSU AI-Library – Python Backend Environment & Install Guide

This `README.md` is specific to the **Python backend** in `jrmsu-wise-library-main/python-backend`.

It explains **all requirements, dependencies, libraries, modules, and environment variables** you need to run this service.

---

## 1. Prerequisites

- **Python**: 3.10 or higher
- **MySQL / MariaDB** (e.g. via XAMPP)
- **Git** (optional, for source control)

Make sure `python` and `pip` are available in your PATH.

---

## 2. Database Requirements

The backend expects a running MySQL/MariaDB instance with:

- **Database**: `jrmsu_library`

You should:

1. Create the database:
   ```sql
   CREATE DATABASE jrmsu_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. Run the schema scripts (from the project root):
   - `create_library_tables.sql` – core tables for:
     - `students`, `admins`, `books`, `borrow_records`, `reservations`, etc.
   - Any additional schema files (e.g. notifications schema) present in this folder.

3. Configure DB connection in `db.py` and/or `.env` (see below).

---

## 3. Virtual Environment & Core Python Dependencies

From the repo root:

```powershell
cd "jrmsu-wise-library-main/python-backend"
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

If `requirements.txt` is missing or incomplete, install at least these modules (all are used somewhere in this backend):

```powershell
pip install \
  flask \
  flask-socketio \
  mysql-connector-python \
  bcrypt \
  pyotp \
  requests \
  bleach \
  Pillow \
  openpyxl
```

### What these libraries are for

- **Flask** – HTTP API server (`app.py`).
- **Flask-SocketIO** – real-time events for dashboard, notifications, sessions.
- **mysql-connector-python** – MySQL client used in `db.py` and other modules.
- **bcrypt** – secure password hashing for admins/students.
- **pyotp** – TOTP for 2FA setup and verification.
- **requests** – outbound HTTP calls (health checks, AI or other APIs).
- **bleach** – HTML sanitization (if used for safe text fields).
- **Pillow** – image handling when needed (e.g. QR utilities, exports).
- **openpyxl** – Excel export for audit logs (`/api/audit/export`).

---

## 4. Environment Variables / .env

You can configure the backend via environment variables or a `.env` file (if you load it). Common values:

### Database

In `db.py` or environment:

- `DB_HOST` – default `localhost`
- `DB_PORT` – default `3306`
- `DB_USER` – default `root`
- `DB_PASSWORD` – default empty ("") if using XAMPP defaults
- `DB_NAME` – `jrmsu_library`

### CORS & Origins

In `app.py`:

- `ALLOWED_ORIGINS` – comma-separated list, e.g.:
  ```text
  http://localhost:8080,http://127.0.0.1:8080,http://localhost:8081,http://127.0.0.1:8081
  ```

### Email / SMTP (Password Reset & Notifications)

- `EMAIL_ENABLED` – `true` or `false`
- `SMTP_SERVER` – e.g. `smtp.gmail.com`
- `SMTP_PORT` – typically `587`
- `SENDER_EMAIL` – the email address used for sending
- `SENDER_PASSWORD` – app password / SMTP password
- `SENDER_NAME` – display name, e.g. `JRMSU Library System`

When `EMAIL_ENABLED=false` or `SENDER_PASSWORD` is empty, the backend will print reset codes to the console instead of sending emails (dev mode).

### AI-related (Optional)

- `OLLAMA_URL` – URL of the Ollama server (e.g. `http://localhost:11434`)
- `OLLAMA_MODEL` – model name, kept in sync with `ai_server` (e.g. `llama3:8b-instruct-q4_K_M`)

These are only used if this backend also calls AI endpoints directly.

---

## 5. Files & Modules That Use These Settings

- `app.py`
  - Reads `ALLOWED_ORIGINS`, email-related vars, optional Ollama settings.
  - Uses `StudentDB`, `AdminDB`, and `execute_query` from `db.py`.
  - Registers routes for:
    - `/api/students/*` and `/api/admins/*`
    - `/api/users/{id}`
    - `/api/backup/*` and `/api/audit/export`
    - `/api/admin/system-version` and `/api/admin/developers`
    - 2FA endpoints for admins and students
    - Registers library & notification endpoints via `library_session_manager` and `notifications_routes`.

- `db.py`
  - Central place to configure MySQL connection (`DB_HOST`, `DB_USER`, etc.).

- `library_endpoints.py`
  - Uses `execute_query` to access `books`, `reservations`, `borrow_records`.

- `library_session_manager.py`
  - Ensures and uses `library_sessions`, `active_sessions`, `activity_log`.

- `notifications_service.py` / `notifications_routes.py`
  - Use `notifications` and `activity_log` tables.

- `COMPREHENSIVE_SYSTEM_CHECK.py` (at repo root)
  - Verifies: MySQL connectivity, presence of `jrmsu_library`, required tables & procedures, and HTTP endpoints exposed by this backend.

---

## 6. Running the Backend

After installing dependencies and configuring the database and environment variables:

```powershell
cd "jrmsu-wise-library-main/python-backend"
. .venv\Scripts\Activate.ps1
python app.py
```

By default, the backend will listen on `http://localhost:5000` and accept CORS requests from the main app (8080) and mirror app (8081) as long as `ALLOWED_ORIGINS` is configured appropriately.

You can then start:
- The main frontend in `jrmsu-wise-library-main` with `npm run dev`.
- The mirror frontend in `mirror-login-page` with `npm run dev`.
- The AI server in `ai_server` with its own `python app.py` and Ollama running.

This backend README focuses only on **what to install and configure** for the Python backend layer. For complete system-level instructions, see the root `README.md`.
