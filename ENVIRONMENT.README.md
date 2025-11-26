# JRMSU AI-Library System – Environment & Installation Guide

This README focuses **only on installation and environment setup** for the entire system located under:

- `C:\Users\provu\Desktop\jrmsu-ai-lib-system-main`
- `C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\jrmsu-wise-library-main`
- `C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\jrmsu-wise-library-main\python-backend`
- `C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\ai_server`
- `C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\mirror-login-page`
- `C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\python-backend` (QR generator utilities)

Use this as a **checklist of everything to install**: languages, libraries, modules, and tools.

---

## 1. Global Requirements (Install Once)

Install these tools and runtimes on your machine:

1. **Git** (optional, for cloning and version control)
2. **Node.js LTS** (e.g. 18+)
3. **Python 3.10+**
4. **MySQL / MariaDB**
   - XAMPP is recommended (as referenced in `RUN server GUIDE.txt`).
5. **Ollama** (for local LLaMA 3 model used by the AI server)

Make sure these commands work in PowerShell:

```powershell
node --version
npm --version
python --version
pip --version
mysql --version   # or confirm via XAMPP control panel
ollama --version  # after installing Ollama
```

---

## 2. Database Setup (MySQL / MariaDB)

### 2.1 Main DB: `jrmsu_library`

1. Start MySQL/MariaDB (XAMPP `mysql` service).
2. Create database:

```sql
CREATE DATABASE jrmsu_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. From phpMyAdmin or `mysql` CLI, import or run **schema files**:
   - `create_library_tables.sql` (root of repo)
     - Creates tables like `students`, `admins`, `books`, `reservations`, `borrow_records`, etc.
   - Any additional SQL schemas under `jrmsu-wise-library-main/python-backend` (e.g. notifications schema).

4. Confirm required tables exist (see `COMPREHENSIVE_SYSTEM_CHECK.py`):
   - `students`, `admins`, `notifications`, `activity_log`, `jose_message_templates`, `notification_dedup`, etc.

### 2.2 Optional AI Logs DB: `library_system_ai`

For AI interaction logs used by `ai_server/app.py`:

```sql
CREATE DATABASE library_system_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then create table `ai_logs` (follow any schema from the AI server or create one manually if needed).

### 2.3 DB Connection Configuration

Configure DB credentials in:

- `jrmsu-wise-library-main/python-backend/db.py`
- Optionally, `.env` in `jrmsu-wise-library-main/python-backend`.

Typical defaults (XAMPP):

- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: *(empty)*
- Database: `jrmsu_library`

---

## 3. Main Web App – `jrmsu-wise-library-main` (React + TS)

### 3.1 Install Node Dependencies

```powershell
cd "C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\jrmsu-wise-library-main"
npm install
```

This installs everything in `jrmsu-wise-library-main/package.json`, including:

- React 18, React DOM
- TypeScript, Vite
- Tailwind CSS, shadcn UI (Radix UI wrappers)
- `@tanstack/react-query`
- `react-router-dom`
- `socket.io-client`
- QR libraries: `html5-qrcode`, `qrcode`, `qrcode.react`, `jsqr`
- Tooling: ESLint, Vitest, Tailwind plugins, etc.

### 3.2 Run the Main Frontend

```powershell
npm run dev
```

Default URL: `http://localhost:8080` (main admin + student portal).

---

## 4. Python Backend – `jrmsu-wise-library-main\python-backend`

### 4.1 Create Virtual Environment & Install Python Libraries

```powershell
cd "C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\jrmsu-wise-library-main\python-backend"
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

If `requirements.txt` is incomplete or missing, install at least:

```powershell
pip install ^
  flask ^
  flask-socketio ^
  mysql-connector-python ^
  bcrypt ^
  pyotp ^
  requests ^
  bleach ^
  Pillow ^
  openpyxl
```

**Modules used in the backend code:**

- `flask` – main HTTP framework (`app.py`).
- `flask_socketio` – realtime events for dashboard, notifications, library sessions.
- `mysql.connector` / `mysql-connector-python` – DB access (`db.py`, `COMPREHENSIVE_SYSTEM_CHECK.py`).
- `bcrypt` – hashing admin/student passwords.
- `pyotp` – TOTP 2FA for admins and students.
- `requests` – health checks and optional external calls.
- `bleach` – sanitizing user input/text.
- `Pillow` – used where image processing is needed.
- `openpyxl` – Excel export for audit logs (`/api/audit/export`).

### 4.2 Environment Variables for Backend

Configure via environment or `.env`:

**Database (if not hardcoded in `db.py`):**

- `DB_HOST` (default `localhost`)
- `DB_PORT` (default `3306`)
- `DB_USER` (default `root`)
- `DB_PASSWORD` (default empty)
- `DB_NAME` (`jrmsu_library`)

**CORS / Origins (in `app.py`):**

- `ALLOWED_ORIGINS` – e.g.
  ```text
  http://localhost:8080,http://127.0.0.1:8080,http://localhost:8081,http://127.0.0.1:8081
  ```

**Email / SMTP:**

- `EMAIL_ENABLED` – `true` / `false`
- `SMTP_SERVER` – e.g. `smtp.gmail.com`
- `SMTP_PORT` – usually `587`
- `SENDER_EMAIL` – sender address
- `SENDER_PASSWORD` – SMTP or app password
- `SENDER_NAME` – e.g. `JRMSU Library System`

**Optional AI config in backend:**

- `OLLAMA_URL`
- `OLLAMA_MODEL`

### 4.3 Run the Backend

```powershell
cd "C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\jrmsu-wise-library-main\python-backend"
. .venv\Scripts\Activate.ps1
python app.py
```

Default URL: `http://localhost:5000`.

---

## 5. AI Server – `ai_server`

### 5.1 Python Dependencies

```powershell
cd "C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\ai_server"
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install flask requests mysql-connector-python textblob
```

**Modules used:**

- `flask` – exposes `/ai/chat` and health endpoints.
- `requests` – calls Ollama API and optional backend endpoints.
- `mysql-connector-python` – for inserting AI logs into `library_system_ai.ai_logs`.
- `textblob` – optional sentiment analysis.

### 5.2 Ollama & Model

Install Ollama from the official site, then:

```powershell
ollama serve
ollama pull llama3:8b-instruct-q4_K_M
```

The AI server expects to run `ollama run llama3:8b-instruct-q4_K_M` internally.

### 5.3 Environment Variables for AI Server

Optional variables:

- `LIBRARY_API_BASE` – base URL of backend (default `http://localhost:5000`).

`ai_server/app.py` also sets `OLLAMA_HOST=127.0.0.1:11434` for its own use.

### 5.4 Run the AI Server

```powershell
cd "C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\ai_server"
. .venv\Scripts\Activate.ps1
python app.py
```

Default URL: `http://localhost:5002`.

---

## 6. Mirror Login Page – `mirror-login-page`

### 6.1 Install Node Dependencies

```powershell
cd "C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\mirror-login-page"
npm install
```

Uses the same stack as the main app: React, TypeScript, Vite, Tailwind, shadcn, Socket.IO client, QR libraries.

### 6.2 Run the Mirror Frontend

```powershell
npm run dev
```

Default URL: `http://localhost:8081`.

---

## 7. Root Python Utilities – `python-backend` (QR Generator)

### 7.1 Dependencies

Path:

- `C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\python-backend\generate_qr_with_logo.py`

Install:

```powershell
pip install qrcode[pil] Pillow
```

This script can run in any Python environment and is independent of the main backend.

### 7.2 Example Usage

```powershell
cd "C:\Users\provu\Desktop\jrmsu-ai-lib-system-main\python-backend"
python generate_qr_with_logo.py ^
  --data '{"systemId":"JRMSU-LIBRARY"}' ^
  --logo "..\jrmsu-wise-library-main\src\assets\<your-logo>.png" ^
  --out qr.png
```

---

## 8. Quick All-in-One Startup (After Installing Everything)

Once all dependencies are installed and the databases are set up, you can start all services either:

### 8.1 Manually (4 terminals + Ollama)

1. **Backend**:
   ```powershell
   cd "jrmsu-wise-library-main/python-backend"
   . .venv\Scripts\Activate.ps1
   python app.py
   ```

2. **Main frontend**:
   ```powershell
   cd "jrmsu-wise-library-main"
   npm run dev
   ```

3. **Mirror frontend**:
   ```powershell
   cd "mirror-login-page"
   npm run dev
   ```

4. **AI Server**:
   ```powershell
   cd "ai_server"
   . .venv\Scripts\Activate.ps1
   python app.py
   ```

5. **Ollama** (if not already running):
   ```powershell
   ollama serve
   ```

### 8.2 Using Provided Scripts

From the repo root:

- `Start-All-Enforced.ps1` or `run_all_enforced.ps1`:
  - Frees ports 8080, 8081, 5000, 5002, 11434.
  - Starts:
    - Python backend (5000)
    - Main app (8080)
    - Mirror app (8081)
    - AI server (5002)
    - Ollama (11434)

### 8.3 System Check Script

Run:

```powershell
cd "C:\Users\provu\Desktop\jrmsu-ai-lib-system-main"
python COMPREHENSIVE_SYSTEM_CHECK.py
```

This script verifies:
- MySQL connectivity and required databases/tables.
- Availability of backend, AI server, frontends, and Ollama.
- Presence of `.env` files and Python modules.

---

With this environment guide, you have a **complete list of installations and setup steps** required to run the JRMSU AI-Library system across all its services.
