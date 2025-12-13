# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.
``

## Overview

This repo hosts the JRMSU AI-Library System, a multi-service application composed of:
- `jrmsu-wise-library-main/` – main React + TypeScript web app for students and admins, plus the primary Python backend in `python-backend/`.
- `mirror-login-page/` – React + TypeScript app focused on library entry/exit and QR-based borrow/return.
- `ai_server/` – Python Flask AI service that wraps a local Ollama LLaMA 3 model and uses `system_knowledge.json`.
- `python-backend/` – standalone QR generator utility (not the main backend).
- Root scripts and data: SQL schemas, Excel geography data, `COMPREHENSIVE_SYSTEM_CHECK.py`, startup PowerShell/batch scripts.

Primary ports (from `ENVIRONMENT.README.md` and `RUNSYSTEM.txt`):
- Main frontend: `http://localhost:8080`
- Mirror frontend: `http://localhost:8081`
- Python backend API: `http://localhost:5000`
- AI server: `http://localhost:5002`
- Ollama model server: `http://localhost:11434`

## Common commands

All commands assume the repo root is `C:\Users\provu\Desktop\jrmsu-ai-lib-system-main` and are written for PowerShell.

### Start everything manually (recommended for debugging)

Use separate terminals for clear logs.

- Python backend (Flask API, port 5000):
  - `cd jrmsu-wise-library-main/python-backend`
  - `. .venv\Scripts\Activate.ps1`
  - `python app.py`

- Main frontend (React, port 8080):
  - `cd jrmsu-wise-library-main`
  - `npm run dev`

- Mirror frontend (React, port 8081):
  - `cd mirror-login-page`
  - `npm run dev`

- AI server (Flask, port 5002):
  - `cd ai_server`
  - `. .venv\Scripts\Activate.ps1`
  - `python app.py`

- Ollama (model server, port 11434):
  - `ollama serve`

### One-shot startup scripts (all services)

From the repo root:
- `powershell -ExecutionPolicy Bypass -File .\Start-All-Enforced.ps1`
  - or `powershell -ExecutionPolicy Bypass -File .\run_all_enforced.ps1`

These scripts free ports 8080, 8081, 5000, 5002, 11434 and then start:
- Python backend (`jrmsu-wise-library-main/python-backend/app.py`)
- Main frontend (`jrmsu-wise-library-main`, `npm run dev`)
- Mirror frontend (`mirror-login-page`, `npm run dev`)
- AI server (`ai_server/app.py`)
- Ollama (`ollama serve`)

You can alternatively double‑click `Start-All-Enforced.ps1`, `run_all_enforced.ps1`, or `Start_all_system.bat` from File Explorer.

### Frontend: build, lint, and tests

The main app and mirror app share the same script structure.

- Main app (`jrmsu-wise-library-main/`):
  - Install deps: `cd jrmsu-wise-library-main && npm install`
  - Build: `npm run build`
  - Lint: `npm run lint`
  - Run test suite (Vitest): `npm test`
  - Run tests in watch mode: `npm run test:watch`
  - Run a single test file (Vitest convention): `npm test -- path/to/file.test.tsx`

- Mirror app (`mirror-login-page/`):
  - Install deps: `cd mirror-login-page && npm install`
  - Build: `npm run build`
  - Lint: `npm run lint`
  - Run test suite: `npm test`
  - Watch tests: `npm run test:watch`
  - Single test file: `npm test -- path/to/file.test.tsx`

### Python backend: environment and run

Backend lives in `jrmsu-wise-library-main/python-backend` (see its `README.md`):

- Create venv and install dependencies:
  - `cd jrmsu-wise-library-main/python-backend`
  - `python -m venv .venv`
  - `. .venv\Scripts\Activate.ps1`
  - `pip install --upgrade pip`
  - `pip install -r requirements.txt`

- Run backend:
  - `. .venv\Scripts\Activate.ps1`
  - `python app.py`

Key requirements (from `requirements.txt` and docs):
- `flask`, `flask-socketio`, `mysql-connector-python`, `bcrypt`, `pyotp`, `requests`, `bleach`, `Pillow`, `openpyxl`.

Database expectations:
- MySQL/MariaDB database `jrmsu_library` created from `create_library_tables.sql` (root) plus `notifications_schema.sql` and other SQL files in `python-backend/`.
- Connection settings controlled via `db.py` and environment variables (e.g. `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

### AI server: environment and run

AI service lives in `ai_server/` (see `ai_server/app.py` and `ENVIRONMENT.README.md`).

- Create venv and install dependencies:
  - `cd ai_server`
  - `python -m venv .venv`
  - `. .venv\Scripts\Activate.ps1`
  - `pip install --upgrade pip`
  - `pip install flask requests mysql-connector-python textblob`

- Ensure Ollama is installed and model pulled:
  - `ollama serve`
  - `ollama pull llama3:8b-instruct-q4_K_M`

- Run AI server:
  - `. .venv\Scripts\Activate.ps1`
  - `python app.py`

Configuration notes:
- `ai_server/app.py` binds to port `5002` and talks to Ollama at `http://127.0.0.1:11434` (hard‑coded `OLLAMA_URL`).
- Optional `LIBRARY_API_BASE` env var points to the Python backend (default `http://localhost:5000`).
- Optional MySQL logging DB `library_system_ai` is used if `mysql-connector-python` is available.

### Root QR generator utility

The root `python-backend/` folder is a small utility for generating QR codes with an embedded logo:
- Script: `python-backend/generate_qr_with_logo.py`
- Dependencies: `qrcode[pil]`, `Pillow` (install with `pip install qrcode[pil] Pillow`).

Example usage (from its docstring and `ENVIRONMENT.README.md`):
- `cd python-backend`
- `python generate_qr_with_logo.py --data '{"systemId":"JRMSU-LIBRARY"}' --logo "..\jrmsu-wise-library-main\src\assets\<logo>.png" --out qr.png`

### System health check

From the repo root:
- `python COMPREHENSIVE_SYSTEM_CHECK.py`

This script verifies MySQL connectivity, required DBs/tables, service health on ports 5000/5002/8080/8081, Ollama availability, and presence of key `.env` files and Python modules.

## High-level architecture

### 1. Frontends (React + TypeScript)

Both frontends use the same stack (Vite, React 18, TypeScript, Tailwind, shadcn-ui, Socket.IO client, QR libraries).

- Main app (`jrmsu-wise-library-main/src`):
  - `main.tsx` boots React, React Router, React Query, and wraps the app in `AuthProvider`.
  - `App.tsx` defines the router and global layout (navbar, side navigation, AI assistant shell, toasts).
  - `pages/` contains feature pages (login/registration, dashboard, books, book management, reports, profile, etc.).
  - `context/` contains shared state:
    - `AuthContext.tsx` – authentication, user session, QR login support, 2FA flows, auto‑logout behavior.
    - Other contexts (e.g. registration) that coordinate multi‑step flows.
  - `services/` wraps backend APIs and local models:
    - `books`, `reservations`, `dashboardApi`, `stats`, `activity`, `notifications`, `notificationsApi`, `notificationManager`, and AI integration services.
  - `components/` hosts UI building blocks (layout, tables, dialogs, QR components, AI assistant UI, etc.).

- Mirror app (`mirror-login-page/src`):
  - `main.tsx` and `App.tsx` provide a slim router that primarily serves `pages/LibraryEntry.tsx`.
  - `pages/LibraryEntry.tsx` orchestrates:
    - Manual and QR login via shared `AuthContext` logic.
    - Creation and termination of library sessions using `LibrarySessionContext`.
    - Prompts and dialogs for picking up reserved books or returning borrowed books.
    - QR scanner dialog used during borrow/return flows.
  - `context/LibrarySessionContext.tsx` wraps `/api/library/*` endpoints from the Python backend, maintaining the active session, and exposing `createSession`, `endSession`, `checkUserStatus`, `borrowBook`, `returnBook`, and related helpers.

Key pattern: frontends call Python backend endpoints (under `/api/...`) via these service/ context layers, so any behavior changes typically involve coordinated edits in `src/services`, `src/context`, and the corresponding Python route implementations.

### 2. Python backend (`jrmsu-wise-library-main/python-backend`)

This is the core business logic service (Flask + Flask-SocketIO):

- `app.py`:
  - Configures Flask app, Socket.IO server, CORS (allowing ports 8080 and 8081), and DB connections via `db.py`.
  - Exposes routes for admin/student/user management, authentication, 2FA, backups, audit logs, and system metadata.
  - Integrates library session routes and notifications by importing and registering `library_session_manager` and `notifications_routes`.
  - Provides file‑backed JSON fallbacks (`data.json`) for development when MySQL is unavailable.

- `db.py`:
  - Centralizes connection handling to the `jrmsu_library` database.
  - Offers helper functions (`execute_query`, repository‑style helpers like `StudentDB`, `AdminDB`) used throughout the backend.

- `library_endpoints.py`:
  - Implements core library flows, including:
    - Reservation endpoints (`/api/library/reserve-book`, `/api/library/cancel-reservation`, user/admin reservation queries).
    - Borrow/return routes (`/api/library/borrow-book`, `/api/library/return-book`, `/api/library/activate-return-time`).
    - Status endpoints (`/api/library/user-status/<user_id>`, borrow/reservation lists per user or global).
  - Maintains `books`, `reservations`, and `borrow_records` tables; updates availability and status fields.
  - Emits notifications and realtime dashboard events via helpers like `_notify_all_admins` and `_broadcast`.

- `library_session_manager.py`:
  - Ensures and uses the `library_sessions`, `active_sessions`, and `activity_log` tables.
  - Defines the session lifecycle endpoints (`/api/library/login`, `/api/library/logout`, `/api/library/force-logout`, `/api/library/check-session/<user_id>`, `/api/library/active-sessions`, `/api/library/forgotten-logouts`).
  - Logs structured activity and uses notification services to inform admins on library login/logout and forgotten logouts.

- `notifications_service.py` and `notifications_routes.py`:
  - Manage the `notifications` and DB‑backed `activity_log` tables.
  - Provide API routes for listing/marking notifications and for fetching recent activity used by the dashboard.
  - Encapsulate higher‑level helpers like `notify_all_admins`, `notify_user`, and `log_activity` that unify how events are surfaced to admins.

- `notification_endpoints.py`:
  - Implements email/SMS/push flows for overdue books and notification preferences.
  - Integrates with `NotificationsService` so overdue operations also appear in the in‑app notification bell and activity log.

Most cross‑cutting library logic flows through these three modules: `library_endpoints.py`, `library_session_manager.py`, and the notifications service/routes. When changing behavior for library check‑in/out, reservations, or admin visibility, update both the backend functions and the corresponding frontend services/contexts.

### 3. AI server (`ai_server/`)

The AI server is intentionally isolated from the main backend:

- `app.py`:
  - Runs a Flask app on port 5002 with permissive CORS so both frontends can call it.
  - Loads and sanitizes `system_knowledge.json` at startup into in‑memory structures (`SYSTEM_KNOWLEDGE`, `SYSTEM_TOPICS`).
  - For each user query, builds a composed prompt that includes:
    - A fixed Jose system prompt (short, library‑focused answers).
    - Relevant slices from `system_knowledge.json` based on keyword matching.
    - Optional catalog context fetched from the main backend (e.g. `/api/ai/book-context`).
  - Calls Ollama via `subprocess.run(["ollama", "run", "llama3:8b-instruct-q4_K_M"], ...)` and returns the streamed answer.
  - Optionally logs interactions to a `library_system_ai` MySQL database if `mysql-connector-python` is installed.
  - Provides health and control endpoints such as `/ai/health` and `/ai/quit`.

Frontend AI components (`AIAssistant` and related services in `jrmsu-wise-library-main/src/services`) call these endpoints; they do not talk directly to Ollama.

### 4. Root scripts and support files

- `ENVIRONMENT.README.md`:
  - Canonical reference for global installation requirements (Node, Python, MySQL/XAMPP, Ollama) and per‑service setup.
  - Summarizes how to start each service and how to run the system check script.

- `RUNSYSTEM.txt`:
  - Focused "how to run" guide for Windows, outlining manual startup, PowerShell startup scripts, and port‑freeing snippets.

- `COMPREHENSIVE_SYSTEM_CHECK.py`:
  - Orchestrates end‑to‑end environment validation: DB, backend, frontends, AI server, Ollama, and presence of required configs.

- `scripts/check_mmd.py`:
  - Utility to validate the `flowchart.mmd` Mermaid diagram for quote/parenthesis balance and certain syntax patterns.

- Design documents (`READMEONE.md`, `READMETWO.md`, `READMETHREE.md`, `READMEFOUR.md`, `READMEFIVE.md`, `Design and command.txt`):
  - Describe the conceptual and visual design, detailed code map, and a full system flowchart for the JRMSU AI‑Library System.
  - When making structural changes, cross‑check whether they stay consistent with these documents.

## How to approach changes

- For **UI/UX changes** in the main system, start from `jrmsu-wise-library-main/src/pages` and follow into `components/`, `context/`, and `services/`.
- For **library behavior** (reservations, borrowing, returning, sessions), coordinate edits between:
  - Mirror app (`mirror-login-page/src/pages/LibraryEntry.tsx` and `context/LibrarySessionContext.tsx`).
  - Main app books/dashboard pages and services.
  - Python backend modules: `library_endpoints.py`, `library_session_manager.py`, `notifications_service.py`, `notifications_routes.py`.
- For **notifications and activity logs**, work primarily in `notifications_service.py`, `notifications_routes.py`, and the frontend notification services and navbar.
- For **AI behavior**, adjust:
  - Prompting and control flow in `ai_server/app.py`.
  - Domain knowledge in `ai_server/system_knowledge.json`.
  - Frontend integration in the AI assistant components and services.

Keeping these boundaries in mind will help future Warp instances locate the right layer quickly and avoid making changes in the wrong service.
