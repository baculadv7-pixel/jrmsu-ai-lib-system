# JRMSU AI-Library System – Speechlines for Project Presentation (READMEFIVE)

This file contains **ready-to-read speechlines** for the team members, aligned with the actual system implementation and the documentation/flowcharts in:

- `README.md` (system proposal + deep overview)
- `READMETHREE.md` (real-system flowchart)
- `READMEFOUR.md` (real-system flowchart + future upgrade plans)

You can copy these into slides or read them directly during a live defense or demo.

---

## 1. Speechline for Jhon Mark Suico – Overall System (based on README.md)

> **Role focus:** Team Leader & System Engineer. This script summarizes the full system as documented in `README.md`.

"Good day everyone. I am **Jhon Mark Suico**, the team leader and system engineer of the **JRMSU AI-Library Management System**.

Our system is an **AI-enhanced smart library platform** designed for Jose Rizal Memorial State University – Katipunan Campus. It addresses the limitations of traditional and semi-digital library workflows by tightly integrating five major components:

1. A **React + TypeScript web application** for students and administrators, where users register, log in with QR and 2FA, manage their profiles, browse the book inventory, reserve titles, and view analytics and notifications.
2. A **Python Flask backend** as the central API and business logic layer. It handles authentication, registration, 2FA, book and user management, library reservations and borrow/return operations, notification storage, audit logging, and database backup/restore.
3. A **Mirror Login Page**, also built in React and TypeScript, that functions as a front-desk or kiosk at the library entrance and exit. Here, users log in manually or via QR code, and they borrow or return books by scanning each book’s QR code. The mirror UI is directly connected to the same Python backend and shares the same MySQL database.
4. A **Desktop Application** called `DesktopappLibrary`, built with Electron, that wraps the same web frontend inside a desktop window. It connects to the same Python backend at `http://localhost:5000` and therefore shares the same `jrmsu_library` database. Whatever data appears or changes on the web app (users, books, sessions, borrows, returns, notifications) is automatically synchronized and visible in the desktop app as well.
5. A dedicated **AI server** for our assistant, ‘Jose’. This is a Python Flask service that talks to a local LLaMA 3 model through Ollama. It loads a curated `system_knowledge.json` file containing JRMSU library rules and flows, then combines that knowledge with user questions to give concise, policy-aware answers. It also detects the sentiment of responses and logs each interaction into a separate AI log database.

Underneath these components is a **MySQL database** named `jrmsu_library`, where we store students, admins, books, reservations, borrow records, notifications, library sessions, activity logs, audit logs, and backup metadata. When MySQL is temporarily unavailable, the backend falls back to a JSON file called `data.json` for development and testing, so the system can still run in a limited mode.

At the **frontend layer**, our main web app uses Vite, React 18, TypeScript, Tailwind CSS, and shadcn UI. We rely on React Router for page navigation, React Query for data fetching and caching, and Socket.IO for real-time events. Components like `AuthContext.tsx`, `Books.tsx`, `Dashboard.tsx`, and `Navbar.tsx` are responsible for authentication, reservations, dashboards, and the notification bell respectively.

At the **backend layer**, we organize our Flask code into focused modules:
- `app.py` coordinates auth, 2FA, backups, audit exports, system version metadata, and the REST API for students and admins.
- `library_endpoints.py` implements the reservation, borrow, return, status, and activation of return time logic, all backed by the `books`, `reservations`, and `borrow_records` tables.
- `library_session_manager.py` manages library entry and exit sessions so that we know who is currently inside the library and when they logged in or out.
- `notifications_service.py` and `notifications_routes.py` form the notification and activity-logging subsystem that feeds the admin bell and the dashboard’s recent-activity card.

Functionally, our system supports:
- Student and admin registration and management.
- QR and password-based login with optional TOTP 2FA for both roles.
- Local and database-backed tracking of book reservations, borrowings, returns, and overdue states.
- Real-time notifications and overlays in the dashboard whenever key events occur, such as reservations, borrows, returns, logins, logouts, and detected forgotten logouts.
- An AI assistant that helps users understand system features, policies, and flows, and that can later be extended with contextual information from the catalog.

In short, the **JRMSU AI-Library Management System** turns the traditional library into an integrated digital environment with secure authentication, QR-based circulation, comprehensive activity logging, and an AI-powered support layer, all grounded on a robust Python + React + MySQL architecture."

---

## 2. Speechline for Jhon Ernie Alimpong – Flowcharts & Architecture (READMETHREE + READMEFOUR)

> **Role focus:** System Architect. This script explains the architecture and real/future flows as shown in `READMETHREE.md` and `READMEFOUR.md`.

"I am **Jhon Ernie Alimpong**, the system architect. I will walk you through the **architecture and flowcharts** that describe how the JRMSU AI-Library system works internally.

In `READMETHREE.md`, we present a **single, end-to-end real-system flowchart**. It starts from two types of users: **students** and **library administrators**. Both interact with two main frontends:

1. The **Main Web Application** at port 8080, which is built with React and TypeScript inside `jrmsu-wise-library-main/src`. This includes the login and registration pages (`Login.tsx`, `Registration*.tsx`), the `Books.tsx` page for reservations and viewing borrowed books, the `BookManagement.tsx` page for admin CRUD over books, the `Dashboard.tsx` for analytics, the `Navbar.tsx` with the notification bell, and the AI assistant component.
2. The **Mirror Login Page** at port 8081, inside `mirror-login-page/src`. Its central component `LibraryEntry.tsx` handles manual and QR login, session creation with `LibrarySessionContext.tsx`, QR borrowing and returning of books using `BookScannerDialog.tsx` and `QRScanner.tsx`, and the display of active sessions via `ActiveSessionsPanel.tsx`.

Both frontends communicate with a shared **Python Flask backend** located at `jrmsu-wise-library-main/python-backend`. Architecturally, the backend has three major functional areas:

- The **Auth & Users API** in `app.py`, which exposes `/api/students/*`, `/api/admins/*`, and `/api/users/{id}`. This layer also knows how to fall back to `data.json` if the database is offline.
- The **Library & Sessions API** split between `library_endpoints.py` and `library_session_manager.py`. `library_endpoints.py` is responsible for `/api/library/*` operations, including reserving books, borrowing, returning, checking user status, and activating return time. `library_session_manager.py` implements `/api/library/login`, `/api/library/logout`, `/api/library/active-sessions`, and `/api/library/forgotten-logouts` for entry/exit tracking.
- The **Notifications & Activity** area, handled by `notifications_service.py` and `notifications_routes.py`, which stores notifications in the `notifications` table and activity entries in `activity_log`, and serves them via `/api/notifications` and `/api/activity-log`.

All of these backend components are backed by a **MySQL database** named `jrmsu_library`. The database holds students, admins, books, reservations, borrow records, library sessions, active sessions, notifications, notification deduplication, audit logs, backup metadata, and the activity log. When MySQL is down, the backend transparently uses a JSON file (`data.json`) for a limited dev mode.

In parallel, the **AI server**, implemented in `ai_server/app.py`, exposes `POST /ai/chat`. It loads `system_knowledge.json` to derive contextual knowledge about JRMSU library policies and flows, constructs a system prompt for the LLaMA 3 model via Ollama, and returns a concise answer along with a detected emotion label. Each AI interaction is stored into a separate database `library_system_ai` in the `ai_logs` table.

The real-system flowchart in `READMETHREE.md` connects all of this:
- From login and registration, through auth endpoints and the `jrmsu_library` database.
- From the `Books.tsx` reservations and admin book management, through library endpoints and MySQL tables.
- From mirror sessions and QR borrow/return, through `library_session_manager.py` and `library_endpoints.py`, and into `library_sessions`, `active_sessions`, `reservations`, and `borrow_records`.
- From backend events into `notifications_service.py` and `notifications_routes.py`, and then into the React notification bell and dashboard.
- Finally, from the AI assistant’s React components, to `ai_server/app.py`, to the AI model and back.

In `READMEFOUR.md`, we add a second flowchart that shows **future planned upgrades** on top of this real architecture. These plans include:

- A centralized **Config API** (`/api/config/*`) that frontends can call to discover ports, feature flags, and integration toggles dynamically.
- A dedicated **AI context endpoint** on the backend (`/api/ai/book-context`) that can serve book and borrowing context directly to the AI server, making Jose’s answers more data-aware without hardcoding SQL inside the AI service.
- A **Notification Rules Engine** that sits between library/session events and the notification service, so we can declaratively control which events go to which admins via which channels.
- A **Background Scheduler** that runs periodic jobs to detect overdue books and forgotten logouts and triggers batch notifications rather than relying purely on on-demand endpoints.
- A stronger **RBAC (role-based access control)** layer, so that roles like librarian, staff, and supervisor can be enforced more systematically across auth, library operations, and session management.

These future components do not change the current system; instead, they extend it along the same boundaries we already have. The flowcharts provide a clear, visual guide that connects the **present implementation** and the **direction of future improvements** in a way that is easy to follow during the defense and further development.
"

---

## 3. Speechline for Viviene Punay – System Proposal & Product View (README.md)

> **Role focus:** Product Manager. This script emphasizes the proposal, objectives, scope, users, and evaluation aspects in `README.md`.

"I am **Viviene Punay**, the product manager of the JRMSU AI-Library Management System. I will discuss the **system proposal**, our objectives, and how the system serves its users.

Our proposal starts from a clear problem: **traditional library operations** at JRMSU rely on manual or semi-digital processes for authentication, book circulation, and records management. This leads to inefficient tracking of who is inside the library, inconsistent borrowing and returning records, and limited visibility into real-time activity and overdue books.

The **JRMSU AI-Library Management System** proposes a solution that integrates:

1. **QR-based authentication and identity binding**, so both students and admins can log in and identify themselves quickly and accurately in the main app and at the library entrance.
2. **Two-Factor Authentication** using TOTP for both high-privilege admin accounts and for students who want stronger security.
3. A **mirror login page** that acts as a live entry and exit console. It tracks who is currently inside the library and manages borrow and return operations via QR scans of book codes.
4. A curated **AI assistant** that understands JRMSU library rules and policies and can answer user questions clearly, assisted by a local LLaMA 3 model.
5. A unified **notification and activity log system** that feeds a modern dashboard, giving administrators real-time and historical visibility into reservations, borrows, returns, logins, logouts, forgotten logouts, and overdue-related actions.

Our **objectives**, as outlined in `README.md`, are to:
- Develop an AI-enhanced library system with secure QR and 2FA authentication.
- Automate book reservation, borrowing, returning, and notification workflows.
- Integrate an AI assistant that provides contextual, library-specific guidance.
- Provide real-time dashboards and activity feeds for administrators.
- Improve the security, auditability, and consistency of library data using MySQL as the primary store.

In terms of **scope and users**, we focus on:
- **Students**, who can register, log in, update their profiles, reserve books, borrow and return via the mirror, and receive notifications.
- **Library administrators**, who can manage user accounts and books, monitor live sessions and activity logs, review audit trails, manage backups and system versions, and use 2FA for added protection.

The system is implemented as a **multi-service architecture** using modern, industry-relevant technologies: React and TypeScript on the frontend, Python and Flask on the backend, Tailwind and shadcn UI for interface design, Socket.IO for real-time behavior, and MySQL for durable storage. The AI assistant is powered by a local LLaMA 3 model through Ollama, which can operate even when external internet access is limited.

For **evaluation**, we emphasize that the quality attributes of the system—functionality, reliability, security, and usability—are not speculative. They are supported by concrete features such as audit logs, backup and restore endpoints, explicit ID format enforcement, 2FA, auto-logout on inactivity, and structured dashboards that display real system data from `activity_log` and `notifications`.

Overall, the JRMSU AI-Library System proposal positions the library not just as a physical collection of books, but as an **intelligent, secure, and data-driven service** for students and faculty, with a clear roadmap for incremental enhancements in future iterations.
"

---

## 4. Speechline for Lenny Mambo – Data & Reporting View (README.md)

> **Role focus:** Data Analyst. This script focuses on the data model, logs, and reporting aspects highlighted in `README.md` and the code map.

"I am **Lenny Mambo**, the data analyst of our team. My focus is on how the JRMSU AI-Library System structures and uses data for reporting and decision making.

Our system is built on top of a **normalized MySQL schema** called `jrmsu_library`. It contains core entities such as:
- `students` and `admins` for user profiles and roles.
- `books` for catalog information, including availability and status.
- `reservations` and `borrow_records` to model the full life cycle of book circulation, from initial reservation in the main app to confirmed borrow and final return through the mirror page.
- `library_sessions` and `active_sessions` to record every entry and exit event, giving us a time-stamped history of who was inside the library and when.
- `notifications`, `notification_dedup`, and `activity_log` to capture system messages and structured events that can be analyzed historically.
- `audit_log` and `db_backups` for system-level oversight and backup tracking.

The **frontend** consumes this data through well-defined API endpoints documented in `README.md`. For example:
- The `Dashboard.tsx` page combines **summary statistics** from the backend with **real-time events** and **recent activity logs** to present a comprehensive view of the current state of the system.
- The `Books.tsx` page pulls reservations and borrowing data to show per-user and global views of circulation.
- The **notification bell** integrates both local, AI-generated messages and server-side notifications from the `notifications` table.

On the **backend**, the `notifications_service.py` module includes helper functions that log structured events into `activity_log` and generate human-readable messages into `notifications`. This means that every borrow, return, login, logout, reservation, and overdue event can be analyzed later, and not just shown once in the UI.

Additionally, `app.py` exposes endpoints for **backup creation and audit export**. The backup endpoints serialize the fallback file store into compressed JSON, while the audit export endpoint can generate CSV or Excel views of audit data. These features are essential for long-term data retention, compliance, and more advanced analytics.

Even the **AI assistant** contributes data: `ai_server/app.py` writes to the `ai_logs` table in `library_system_ai`, recording each user query, the AI’s response, and the detected emotion. This can be used in the future to analyze what users struggle with, which parts of the system need better UX, and how often certain policies are referenced.

By designing the system around **explicit tables and logs**, and by providing **export and backup mechanisms**, the JRMSU AI-Library System ensures that administrators and researchers have the data they need to evaluate usage patterns, spot issues, and continuously improve library services.
"
