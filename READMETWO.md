# JRMSU AI-Library System – Deep Code Map (READMETWO)

This document gives a **developer-focused** view of the entire system:

- Where each major **feature** lives (frontend, backend, AI, mirror, DB)
- Which **source files** implement it
- How those files connect (imports, API calls, realtime events)
- **What to edit** and **where to look** when changing behavior

It does **not** paste every line of code, but it tells you where important logic is and how it works so you can open the files and edit the right places.

> Paths are relative to the repo root: `C:\Users\provu\Desktop\jrmsu-ai-lib-system-main`.

---

## 1. Top-Level Structure

- `jrmsu-wise-library-main/` – **Main web app** (students + admins), plus the primary **Python backend** in `python-backend/`.
- `mirror-login-page/` – **Mirror/library entry** single-page app (port 8081), QR scanner and library session UI.
- `ai_server/` – **AI assistant HTTP API** and knowledge base.
- `python-backend/` (at repo root) – A small, separate script area (e.g., `generate_qr_with_logo.py`).
- SQL and Excel files in root – create/seed DB tables, geography data.

If you want to understand or edit a feature, start with the frontend page in `jrmsu-wise-library-main/src/pages`, follow its imports into `src/services`, then follow those APIs into `python-backend/*.py` and finally into the DB schema.

---

## 2. Main Frontend App (`jrmsu-wise-library-main/src`)

### 2.1 Entry & Global Setup

- **`src/main.tsx`**
  - Bootstraps React with **React Router** and **QueryClientProvider**.
  - Wraps everything in `AuthProvider` (global authentication state).
  - If you want to add a global provider (e.g., new context), this is where you wrap it.

- **`src/App.tsx`**
  - Defines top-level `RouterProvider` routes to pages in `src/pages`.
  - Connects the app to `TooltipProvider`, `Toaster`, and `Sonner` for UI/notifications.
  - To add a new page (e.g., `/my-feature`), define the route here and create a `src/pages/MyFeature.tsx`.

### 2.2 Authentication & Sessions (Main App)

- **`src/context/AuthContext.tsx`**
  - **Purpose:** Global auth state: current user, login/logout functions, 2FA, QR login, and session refresh.
  - Key parts:
    - `signIn({ id, password, role })` – manual login path for admins and students.
      - Validates ID format based on role (admin: `KCL-00000`; student: `KC-00-A-00000`).
      - Calls in-memory `databaseService.authenticateUser` (front-end side) and then hydrates from backend `/api/users/{id}`.
      - Logs `ActivityService.log(id, 'login')`.
    - `signInWithQR(qrData)` – login from user QR code.
      - Validates `systemId === "JRMSU-LIBRARY"` and presence of tokens.
      - Uses `databaseService.authenticateWithQRCode` and then identical session handling as manual login.
      - Logs `ActivityService.log(id, 'login', 'QR')`.
    - 2FA methods:
      - `enableTwoFactor(authKey)` – updates DB via `databaseService.updateUser` and backend `/api/users/{id}/2fa`.
      - `disableTwoFactor()` – similar pattern, turning off 2FA.
      - `verifyTotp(token)` – uses `verifyTotpToken` locally and optionally Python verification.
    - Auto-logout for inactivity:
      - In a `useEffect`, sets a timer based on `jrmsu_session_timeout_minutes` in localStorage.
      - When triggered, logs `ActivityService.log(user.id, 'auto_logout_inactive')` and pushes a system notification to admins via `NotificationsService.add`.

  - **Edit here if you want to:**
    - Change login validation rules, ID formats, or error messages.
    - Change session persistence behavior.
    - Modify how 2FA is enforced or disabled.
    - Customize what events get written to `ActivityService` and notifications.

- **`src/services/activity.ts`**
  - **Purpose:** Lightweight front-end activity log, with optional backend sync.
  - Functions:
    - `ActivityService.log(userId, action, details?)` – writes to `localStorage` and POSTs to backend `/api/activity` (Python) to fill `activity_log`.
    - `ActivityService.list(userId?)` – returns recent activities.
    - `ActivityService.subscribe(cb)` – listens on a `BroadcastChannel` and periodically polls `/api/activity`.
  - **If the dashboard recent activity looks wrong**, check here and the backend routes in `notifications_routes.py`.

### 2.3 Navbar, Sidebar, and Layout

- **`src/components/Layout/Navbar.tsx`**
  - Top blue bar used across admin/student pages.
  - Contains:
    - Sidebar toggle (broadcasts layout changes across tabs).
    - **Notification bell** powered by `NotificationsService` and `NotificationsAPI`.
      - `reload(filter)` loads local notifications first, then merges backend `/api/notifications`.
      - `NotificationsAPI.connect(user.id, handlers)` attaches Socket.IO listeners for realtime updates.
    - Password reset and system settings overlays.
  - **Edit here if you want to:**
    - Change how many notifications are shown.
    - Add new filter types or actions on notifications.
    - Adjust styling of the bell, dropdown, or debug/logging.

- **`src/components/Layout/Sidebar.tsx`**
  - Left nav for admin/student dashboards.
  - Reads navigation config from `src/config/navigation.ts`.
  - To add a new sidebar item, add it in `navigation.ts` and ensure the route exists in `App.tsx`.

### 2.4 Book Inventory & Reservation (Main App)

- **`src/pages/Books.tsx`**
  - **Purpose:** Unified view of all books (for both students and admins). Also provides reservation functionality.
  - Core pieces:
    - Local state: `books`, `viewMode`, `filterCategory`, `filterAvailability`, `borrowedRecords`, `reservationRecords`, etc.
    - Data loading:
      - `BooksService.ensureSeed()` & `BooksService.list()` – local seed for UI.
      - `loadBorrowed()` – calls `/api/library/borrowed-all` (admin) or `/api/library/user-borrowed/{id}` (student) from Python backend.
      - `loadReservations()` – calls `/api/library/user-reservations/{id}` (student) or `/api/library/reservations-all` (admin).
    - AI search integration with `aiSearchService` (`smartSearch` & `getAutocompleteSuggestions`).
    - **Reservation function:**
      - `reserve(book)` – opens quantity dialog.
      - `confirmReserve()` – POSTs to `/api/library/reserve-book` with `userId`, `userType`, `bookId`, `bookTitle`, `quantity`.
      - On success:
        - Stores a local reservation via `ReservationsService.add(...)`.
        - Updates state via `loadReservations()`.
        - Notifies admins via `NotificationManager.bookReserved(...)` (or fallback `NotificationsService.add` to `receiverId: 'ADMIN'`).
        - Displays a toast message.
    - **Admin vs Student actions:**
      - After recent changes, both student and admin see **Reserve** buttons in list and detailed views (gated by book availability).

  - **Edit here if you want to:**
    - Change reservation rules (e.g., limit per user, per admin).
    - Adjust how AI search interacts with filters.
    - Add new columns to the list view.

- **`src/pages/BookManagement.tsx`**
  - Admin-only page for **CRUD on books**.
  - Uses `BooksService` to create/update/delete books, plus track overlays such as checkout statistics.
  - Shows a QR column (`QRCodeDisplay`) for each book and allows downloading the code as PNG.
  - Also contains an **Edit Book** dialog with QR preview.
  - **Edit here if you want to:**
    - Change QR payload structure (`buildBookQrPayload(book)` from `services/books.ts`).
    - Adjust which fields are editable, or add new custom columns.

### 2.5 Dashboard & Activity

- **`src/pages/Dashboard.tsx`**
  - Shows:
    - Total books, active borrowers, borrowed today, overdue.
    - `Recent Activity` card showing real-time actions from `activity_log`.
  - Uses:
    - `StatsService.get()` and `StatsService.subscribe()` for live stats.
    - `DashboardApi.summary()` and other endpoints for overlays.
    - `connectDashboardRealtime` (Socket.IO) to reload overlays on events.
    - For recent activity:
      - Fetches `GET /api/activity-log?limit=100` from Python backend.
      - Maps rows (from `notifications_service.get_activity_log`) to `ActivityItem` objects.
      - Uses `formatActivityLine(item)` to show `userId • event • method`, inferring `manual/QR/auto` from `details`.

  - **Edit here if you want to:**
    - Customize what appears on the dashboard.
    - Change how frequently overlays/activities refresh.
    - Add new overlays for other tables (e.g., overdue lists, reservation breakdowns).

### 2.6 Notifications (Frontend)

- **`src/services/notifications.ts`** – local + AI notifications store.
- **`src/services/notificationsApi.ts`** – REST + Socket.IO client for `/api/notifications`.
- **`src/services/notificationManager.ts`** – high-level events, such as:
  - `bookReserved(userId, bookId, bookTitle)` – call when a user reserves a book.
  - `libraryLoginManual(userId, userType)` / `libraryLogoutManual` / `libraryLoginQR` / `libraryLogoutQR` – high-level wrappers around `NotificationsService.add`.

To wire a **new event** into the admin bell and history:

1. Choose or add a helper in `notificationManager.ts`.
2. Call it from the relevant feature (e.g., after a borrow or profile update).
3. Optionally add a backend-side `notifications_routes` handler if you want DB persistence.

---

## 3. Mirror Frontend (`mirror-login-page/src`)

### 3.1 LibraryEntry Page

- **`mirror-login-page/src/pages/LibraryEntry.tsx`**
  - Combines:
    - Login UI (manual + QR) using `AuthContext`.
    - Library session management (`useLibrarySession`).
    - Active sessions side panel (`ActiveSessionsPanel`).
    - Book pickup/return prompts for reservations/borrows.
    - Book scanner dialog for QR-based borrow/return.
    - Logout flow that may require scanning before ending session.
  - Important pieces:
    - `handleLogin(e)` – manual login
      - Validates ID pattern for student/admin.
      - Calls `signIn` from `AuthContext`.
      - Creates library session: `createSession(formData.id, userType, fullName, 'manual')`.
      - Calls `checkUserStatus` to see `hasReservations` / `hasBorrowedBooks`.
      - Opens `BookPickupDialog` or `BookReturnDialog` as needed.
    - `handleLibraryLogout(e)` – library logout for current user
      - Uses `checkUserStatus(activeUserId)`.
      - If there are reserved books, shows `BorrowReturnPromptDialog` (borrow mode) and then scanner.
      - If there are borrowed books, shows `BorrowReturnPromptDialog` (return mode).
      - Otherwise, calls `handleLogoutComplete()` which ends session and shows a welcome-style logout message.
    - `handleBookScanned(bookId)` – callback from `BookScannerDialog`:
      - Calls `borrowBook(bookId)` or `returnBook(bookId)` from `useLibrarySession`.
      - Shows success overlays (`showBorrowSuccessOverlay`, `showReturnSuccessOverlay`).

  - **Edit here if you want to:**
    - Change the UI flow for borrow/return prompts.
    - Enforce additional rules on when scanning is allowed.
    - Adjust logout behavior or messages.

### 3.2 LibrarySessionContext

- **`mirror-login-page/src/context/LibrarySessionContext.tsx`**
  - **Purpose:** Mirror-friendly wrapper around central library endpoints at `/api/library/*`.
  - Fields:
    - `session: LibrarySession | null` – includes `sessionId`, `userId`, `userType`, `fullName`, `hasReservations`, `hasBorrowedBooks`.
  - Methods:
    - `createSession(userId, userType, fullName, loginMethod)` → `/api/library/login`
      - On success, sets `session` and calls `NotificationManager.libraryLoginManual` or `libraryLoginQR` via frontend service (note: there is also backend-side notification).
    - `endSession()` → `/api/library/force-logout` (delegates to `create_logout_session` internally) and notifies admins of library logout.
    - `forceLogoutUser(userId)` → `/api/library/force-logout` for admin panel.
    - `checkUserStatus(userId)` → `/api/library/user-status/{userId}` (reservations + borrowed books).
    - `checkUserSessionStatus(userId)` → `/api/library/check-session/{userId}`.
    - `borrowBook(bookId)` → `/api/library/borrow-book`.
    - `returnBook(bookId)` → `/api/library/return-book`.
    - `cancelReservation(bookId)` → `/api/library/cancel-reservation`.
    - `activateReturnTime(bookId)` → `/api/library/activate-return-time`.

  - **Edit here if you want to:**
    - Point the mirror to a different backend base URL (`API.BACKEND.BASE`).
    - Add new session-level actions (e.g., hold extension).
    - Adjust error handling or logging around `/api/library/*` calls.

---

## 4. Python Backend (`jrmsu-wise-library-main/python-backend`)

### 4.1 `app.py` – Core Application

**Key responsibilities:**

- Configure Flask and Flask-SocketIO.
- Health check and root routes.
- CORS headers for `8080` and `8081`.
- Fallback file-backed DB (`data.json`) and dev activity logging.
- Audit logs, backup/restore endpoints, system version, developers metadata.
- Integrate **library session** and **notifications** blueprints.

Important functions and patterns:

- `log_activity(user_id, action, details="")` – writes activities to `data.json` and emits `activity.new` realtime events. The newer, DB-backed activity log uses `notifications_service.log_activity()` instead; both coexist.
- `_ensure_tables_for_admin_features()` – sets up `audit_log`, `db_backups`, `system_version`, `developers` tables.
- `/api/backup/*` – create/list/download/upload/restore backups.
- `/api/audit/export` – CSV/XLSX export of audit events.
- `/api/admin/system-version`, `/api/admin/developers` – metadata used by the settings UI.
- `/api/students/*`, `/api/admins/*`, `/api/users/*` – CRUD and registration; use `StudentDB` and `AdminDB` for MySQL.
- 2FA endpoints for both roles.

**Edit here if you want to:**

- Add new system-level admin tools.
- Change audit logging or backup behavior.
- Extend users/admins API (add custom attributes or behaviors).

### 4.2 `library_endpoints.py` – Library Operations

**Main focus for reservation, borrowing and returning logic.**

- Reservation endpoints:
  - `/api/library/reserve-book` – creates a `reservations` row and decrements `books.available_copies`.
  - `/api/library/cancel-reservation` – cancels reservation.
  - `/api/library/user-reservations/<user_id>` – per-user view.
  - `/api/library/reservations-all` – admin-wide view.

- Borrow/return endpoints:
  - `/api/library/borrow-book` – marks a reservation as fulfilled, inserts into `borrow_records`, decrements availability, notifies admins and dashboards.
  - `/api/library/return-book` – marks `borrow_records` row as `returned`, increments availability, notifies admins and dashboards.
  - `/api/library/activate-return-time` – sets `return_time_activated` for the latest borrowed row, used when scanning on logout.

- Status endpoints:
  - `/api/library/user-status/<user_id>` – returns JSON with `hasReservations`, `hasBorrowedBooks`, and lists `reservedBooks` / `borrowedBooks`.
  - `/api/library/user-borrowed/<user_id>` – list of active borrows for a user.
  - `/api/library/borrowed-all` – global active borrows.

**Where to edit:**

- Change reservation rules (e.g., requiring different statuses or quantities) → the SQL around `reservations` in this file.
- Adjust how borrow/return interacts with `borrow_records` or `books` → update the SQL inserts/updates here.
- Change the text or meta of admin notifications for these actions → `_notify_all_admins` calls inside this file.

### 4.3 `library_session_manager.py` – Session Tracking & Activity Log

- Ensures tables:
  - `active_sessions`, `library_sessions`, `activity_log` (with upgrade/tablespace handling).
- Functions:
  - `create_login_session(user_id, user_type, full_name, method)` – inserts a row into `library_sessions` (and `active_sessions` mirror), writes login info into `activity_log`, and logs odd `action_count`.
  - `create_logout_session(user_id, session_id=None)` – marks session as logged out, writes logout activity, updates `active_sessions` mirror.
  - `notify_all_admins(...)` – sends bell notifications for library login/logout and forgotten logouts.
  - `check_forgotten_logouts()` – used by `/api/library/forgotten-logouts` to find long-lived sessions.
- Routes (registered by `register_library_session_endpoints(app)`):
  - `/api/library/check-session/<user_id>` – whether user has an active session.
  - `/api/library/login` – login entrypoint for `LibrarySessionContext`.
  - `/api/library/logout` – logout entrypoint.
  - `/api/library/active-sessions` – list of current `inside_library` sessions.
  - `/api/library/force-logout` – admin forced logout.
  - `/api/library/forgotten-logouts` – for daily checks and notifications.

**Edit here if you want to:**

- Change how sessions are counted or labeled.
- Alter the even/odd action semantics.
- Modify which events are pushed into `activity_log` for the dashboard.

### 4.4 `notifications_service.py` & `notifications_routes.py` – Notifications & Activity

- `notifications_service.py`:
  - `create_notification` – generic DB write into `notifications` with AI-generated `message` via `JoseAI` (queries `jose_message_templates`).
  - `create_activity_log` – writes rows into `activity_log` with JSON `details`.
  - `get_notifications(user_id, role, filter, limit, offset)` – returns notifications for user/role.
  - `get_unread_count(user_id, role)` – unread count.
  - `get_activity_log(limit, offset)` – fetches and JSON-decodes `details` if possible; after recent fixes, it tolerates plain text and invalid JSON.
  - `notify_all_admins(...)` and `notify_user(...)` – convenience wrappers.
  - `log_activity(event_type, user_id, summary, details, source)` – writes activity log entries used by `/api/activity-log`.

- `notifications_routes.py`:
  - REST endpoints for notification lists, single notification, mark-read, mark-all-read.
  - `/api/activity-log` – used by `Dashboard.tsx` for **Recent Activity**; only reads from the DB table.
  - `/api/activity` (GET/POST) – compatibility endpoint for `ActivityService` to push front-end events into `activity_log`.
  - Also defines handlers for `handle_library_login_manual`, `handle_library_logout_manual`, `handle_library_login_qr`, `handle_library_logout_qr`, `handle_book_reserved`, `handle_book_borrowed`, `handle_book_returned`, `handle_book_overdue` which:
    - Create admin notifications using `notify_all_admins`.
    - Log activity using `log_activity`.
    - Emit Socket.IO events to **admins** or specific users.

**Edit here if you want to:**

- Change how notifications are formatted or filtered.
- Modify the shape of the JSON returned to the front-end.
- Adjust which events appear in the **Recent Activity** card.

### 4.5 `notification_endpoints.py` – Email/SMS/Push Overdue Notifications

- Email, SMS, and push senders for overdue books.
- Reads preferences from `students`/`admins` tables.
- Integrates with `NotificationsService.notify_user` to add bell notifications when emails/SMS/push are triggered.

**Edit here if you want to:**

- Configure real SMTP/Twilio/FCM credentials.
- Change email/ SMS content and formatting.
- Wire additional overdue flows (e.g., extra reminders, fine calculation).

---

## 5. AI Server (`ai_server/`)

- **`ai_server/app.py`** (not fully printed here):
  - Typically loads `system_knowledge.json` into memory.
  - Exposes endpoints such as `/ai/chat`, `/ai/search` (depending on your implementation) used by `aiService.ts` and `aiSearchService.ts`.
  - Calls an LLM via `OLLAMA_URL` or another HTTP API.

- **`ai_server/system_knowledge.json`**
  - Contains structured knowledge about:
    - JRMSU Library policies
    - User flows (login, QR scanning, mirror usage)
    - Borrow and return rules (inside/outside campus, overdue rules)
    - Developer notes and system version metadata

**Edit here if you want to:**

- Add or refine library policies the AI should respect.
- Change model and connection parameters to point to another AI backend.

---

## 6. Annotated Key Files with Line Ranges

Below are **concrete pointers** to important files, including approximate line ranges where key logic lives. Use these as a map when opening files in your editor.

> Line numbers come from the current repository state. They may shift slightly when you edit, but will still get you close to the right region.

### 6.1 Frontend Authentication & Sessions (Main App)

- **File:** `jrmsu-wise-library-main/src/context/AuthContext.tsx`
  - **Lines ~33–106** – Initial auth state & auto-logout effect
    - Creates `user` state, defines `signOut`, and sets up inactivity-based auto logout.
    - Where `ActivityService.log(currentUser.id, 'auto_logout_inactive')` is called.
    - **Edit here** to change inactivity timeout behavior or how auto-logout is logged/notified.
  - **Lines ~108–176** – `signIn` (manual login)
    - Validates ID format based on `role`.
    - Calls `databaseService.authenticateUser(id, password)`.
    - Hydrates session from backend `GET /api/users/{id}`.
    - Logs `ActivityService.log(dbUser.id, 'login')`.
    - **Edit here** to change login rules, error messages, or post-login actions.
  - **Lines ~178–261** – `signInWithQR` (QR login)
    - Validates `qrData.systemId === 'JRMSU-LIBRARY'`.
    - Calls `databaseService.authenticateWithQRCode(qrData)`.
    - Logs `ActivityService.log(dbUser.id, 'login', 'QR')`.
    - **Edit here** to alter QR payload requirements or additional QR-based checks.
  - **Lines ~264–287** – `enableTwoFactor` / `disableTwoFactor`
    - Calls `databaseService.updateUser` and backend `/api/users/{id}/2fa`.
    - Logs `ActivityService.log(user.id, '2fa_enable' | '2fa_disable')` and pushes notifications.
    - **Edit here** to add new 2FA-related events or change how status is persisted.

### 6.2 Book Inventory & Reservations (Main App)

- **File:** `jrmsu-wise-library-main/src/pages/Books.tsx`
  - **Lines ~53–81** – Top-level state and initial book loading
    - Declares `books`, `viewMode`, filters, AI search flags.
    - `useEffect` calls `BooksService.ensureSeed()` and `BooksService.list()`.
  - **Lines ~83–128** – `loadBorrowed` (backend borrowed records)
    - Builds URL depending on `userType` (`/api/library/borrowed-all` or `/api/library/user-borrowed/{id}`).
    - Normalizes rows into `BackendBorrowRecord` (borrowId, userId, status, dates).
    - **Edit here** if you change backend borrow response shape or want to include extra fields.
  - **Lines ~138–184** – `loadReservations` (backend reservations)
    - For students: `GET /api/library/user-reservations/{userId}`.
    - For admins: `GET /api/library/reservations-all`.
    - Normalizes rows into `BackendReservationRecord` (reservationId, userId, userType, bookId, bookTitle, quantity).
    - **Edit here** when adding reservation fields or filtering.
  - **Lines ~277–313** – `filtered` memo (search + filters)
    - Applies text search, category filters, and availability filters (including `reserved`).
    - **Edit here** to change filter semantics or sorting.
  - **Lines ~315–382** – `reserve` & `confirmReserve`
    - `reserve(book)` opens the quantity dialog.
    - `confirmReserve()`:
      - Validates `reserveTargetBook` and `reserveQuantity`.
      - `fetch(`${API_BASE}/api/library/reserve-book`, { body: JSON.stringify({ userId, userType, bookId, bookTitle, quantity }) })`.
      - On success, calls `ReservationsService.add(book.id, book.title, studentId, studentName, reserveQuantity)`.
      - Calls `loadReservations()` to sync backend state.
      - Calls `NotificationManager.bookReserved(studentId, studentName, book.id, book.title)` where available.
      - Shows a toast.
    - **Edit here** to change reservation limits, error handling, or admin/student notification behavior.
  - **Lines ~504–552** – Book Inventory list view (table)
    - Renders columns: Book ID, Title, Author, Category, Shelf, Status, Actions.
    - **Lines ~535–545** – Actions column:
      - Button shown when `(userType === "student" || userType === "admin")`.
      - `onClick={() => reserve(book)}` with disabled state when `book.status !== 'available'`.
      - **Edit here** to change who is allowed to reserve or to add more action buttons.
  - **Lines ~579–605** – Detailed view actions
    - **Lines ~594–603** – Reserve button in detailed view:
      - Same gating `(userType === 'student' || userType === 'admin')`.
      - Calls `reserve(b)`.

### 6.3 Dashboard & Recent Activity (Main App)

- **File:** `jrmsu-wise-library-main/src/pages/Dashboard.tsx`
  - **Lines ~18–27** – Live stats and local activity state
    - `const [live, setLive] = useState<LiveStats>(StatsService.get());`
    - `const [activity, setActivity] = useState<ActivityItem[]>([]);`
  - **Lines ~65–82** – Stats realtime updates via `connectDashboardRealtime`
    - Subscribes to socket.io dashboard events; reloads overlays when books are added/borrowed/returned/overdue.
  - **Lines ~84–100** – `filteredGroups` memo
    - Filters and groups overlay data (total books, active borrowers, borrowed today, overdue).
  - **Lines ~149–166** – `formatActivityLine(item: ActivityItem)`
    - Builds text like `KC-23-A-00001 • library login • manual/QR/auto`.
    - Inspects `item.details` for keywords (`manual`, `qr`, `auto`, `inactive`).
    - **Edit here** to change how method is determined or to add new tags.
  - **Lines ~35–74 (earlier in file)** – Recent Activity loader
    - `useEffect` with `loadActivity()` fetching `GET /api/activity-log?limit=100`.
    - Maps backend rows into `ActivityItem` (`id`, `userId`, `action`, `details`, `timestamp`).
    - Sorts newest-first and handles errors by clearing `activity`.
    - **Edit here** to adjust refresh interval or error behavior.
  - **Lines ~135–157** – Recent Activity card UI
    - Uses `formatActivityLine(a)` for primary text.
    - Renders `a.details` (summary/message) and `toLocaleString()` timestamp.

### 6.4 Mirror Login & Library Sessions

- **File:** `mirror-login-page/src/pages/LibraryEntry.tsx`
  - **Lines ~30–55** – Top-level state (login form, 2FA flags, library session flags).
  - **Lines ~71–90** – Socket.IO listener for `session_cleanup` and restart overlay.
  - **Lines ~100–149** – Typed user session checker
    - Whenever `formData.id` changes, uses `checkUserSessionStatus(formData.id)` from `useLibrarySession`.
    - Sets `isUserLoggedInLibrary` accordingly.
  - **Lines ~172–235** – `handleLogin(e)`
    - Validates ID formats via `adminIdRegex` and `studentIdRegex`.
    - Calls `signIn` from `AuthContext`.
    - Handles 2FA branch for manual login.
    - Calls `createSession(formData.id, userType, fullName, 'manual')` from `LibrarySessionContext`.
    - After session creation, calls `checkUserStatus(formData.id)` to fetch `reservedBooks` / `borrowedBooks`.
    - Based on status, opens `BookPickupDialog` or `BookReturnDialog` after showing a welcome message.
  - **Lines ~347–402** – `handleLibraryLogout(e)`
    - Chooses `activeUserId = session?.userId || user?.id || formData.id`.
    - Calls `checkUserStatus(activeUserId)` to get live reservations/borrows.
    - If reserved books exist, sets `showBorrowPrompt` and `logoutAfterScan`.
    - If borrowed books exist, sets `showReturnPrompt` and `logoutAfterScan`.
    - Otherwise, calls `handleLogoutComplete()` and ends the session.
  - **Lines ~282–320** – `handleBookScanned(bookId)`
    - Uses `scannerMode` to decide between `borrowBook(bookId)` or `returnBook(bookId)`.
    - Shows success overlays and toasts.

- **File:** `mirror-login-page/src/context/LibrarySessionContext.tsx`
  - **Lines ~38–67** – Session state and localStorage persistence
    - On mount, loads `library_session` from localStorage if present.
    - On updates, keeps localStorage in sync.
  - **Lines ~86–127** – `createSession(userId, userType, fullName, loginMethod)`
    - POST `/api/library/login` with `userId`, `userType`, `fullName`, `method`.
    - Saves returned `sessionId`, `hasReservations`, `hasBorrowedBooks`, etc.
    - Calls `NotificationManager.libraryLoginManual/QR` on the frontend side for UX, while backend also notifies via `_notify_all_admins`.
  - **Lines ~141–177** – `endSession()`
    - POST `/api/library/force-logout` with `session.userId`.
    - Invokes `NotificationManager.libraryLogoutManual/QR` and clears context.
  - **Lines ~179–203** – `checkUserStatus(userId)`
    - GET `/api/library/user-status/{userId}`.
    - Returns aggregated `hasReservations`, `hasBorrowedBooks`, `reservedBooks`, `borrowedBooks`.
  - **Lines ~205–249** – `borrowBook` & `returnBook`
    - `borrowBook(bookId)` → POST `/api/library/borrow-book` with `userId` and `sessionId`.
    - `returnBook(bookId)` → POST `/api/library/return-book`.
    - Both log to console on success, and exceptions are rethrown.
  - **Lines ~251–295** – `cancelReservation` & `activateReturnTime`
    - Cancel reservation and activate return time via `/api/library/cancel-reservation` and `/api/library/activate-return-time`.

### 6.5 Backend Key Blocks with Line Ranges

- **File:** `jrmsu-wise-library-main/python-backend/library_endpoints.py`
  - **Lines ~110–159** – `/api/library/user-status/<user_id>`
    - Queries `reservations` (pending) and `borrow_records` (borrowed) for a user.
    - Returns JSON used by mirror and main site to decide what prompts to show.
  - **Lines ~161–225** – `/api/library/user-reservations/<user_id>` and `/api/library/reservations-all`
    - LEFT JOIN to `books` so reservations remain visible even if the book row is missing.
  - **Lines ~287–415** – `/api/library/borrow-book`
    - Validates presence of reservation (if any) and book availability.
    - Inserts into `borrow_records` (with fallback if newer columns not present).
    - Updates `books.available_copies` and `status`.
    - Builds `full_name` from in-memory `LIBRARY_SESSIONS`.
    - Calls `_notify_all_admins(app, ..., 'book_borrowed', meta)`.
    - Calls `_broadcast('book.borrowed', {...})` for realtime dashboards.
  - **Lines ~416–484** – `/api/library/return-book`
    - Finds active `borrow_records` row and marks it returned.
    - Increments `books.available_copies` and sets `status='available'`.
    - Notifies admins with type `book_returned`.
    - Broadcasts `'book.returned'` event.
  - **Lines ~486–613** – `/api/library/reserve-book`
    - Ensures book exists and has enough available copies.
    - Checks for existing pending reservation.
    - Inserts new `reservations` row (handles presence/absence of `reservation_id` column).
    - Decrements availability and sets `status='unavailable'` when out of stock.
    - Calls `_notify_all_admins(app, ..., 'reservation_created', meta)` and broadcasts `'reservation.created'`.
  - **Lines ~615–681** – `/api/library/cancel-reservation`
    - Marks reservation as `cancelled` with `cancelled_by=user_id`.
    - Notifies admins with type `reservation_cancelled` and broadcasts `'reservation.cancelled'`.
  - **Lines ~683–729** – `/api/library/activate-return-time`
    - Marks the latest `borrow_records` row as `return_time_activated`, `scan_time=NOW()`, `scanned_at_logout=TRUE`.
    - Notifies admins with type `return_time_activated` and broadcasts `'return_time.activated'`.

- **File:** `jrmsu-wise-library-main/python-backend/library_session_manager.py`
  - **Lines ~47–146** – `_ensure_active_sessions_table`, `_ensure_library_sessions_table`, `_ensure_activity_log_table`
    - Create/repair the three core session tables with upgrade-safe logic.
  - **Lines ~281–349** – `create_login_session(user_id, user_type, full_name, method)`
    - Computes odd `action_count` for login events.
    - Inserts into `library_sessions` and `active_sessions`.
    - Writes an activity log row with event `'LIBRARY LOGIN'`.
  - **Lines ~376–476** – `create_logout_session(user_id, session_id=None)`
    - Finds active session (DB, mirror table, or fallback store).
    - Computes even `action_count` for logout.
    - Updates `library_sessions` and `active_sessions`.
    - Writes activity log row `'LIBRARY LOGOUT'`.
  - **Lines ~493–521** – `notify_all_admins(app, message, notification_type, meta)`
    - Enumerates `AdminDB.list_all_admins()`.
    - Calls `_new_notif_id`, `_ensure_user_store`, `_emit('notification.new', admin_id, notif)`.
    - Bell UI in `Navbar.tsx` receives this via Socket.IO.
  - **Lines ~567–865** – `register_library_session_endpoints(app)`
    - Defines `/api/library/check-session/<user_id>`, `/api/library/login`, `/api/library/logout`, `/api/library/active-sessions`, `/api/library/force-logout`, `/api/library/forgotten-logouts`.
    - Each endpoint uses `create_login_session`, `create_logout_session`, `notify_all_admins`, and emits Socket.IO `session_update` events.

- **File:** `jrmsu-wise-library-main/python-backend/notifications_service.py`
  - **Lines ~43–124** – `NotificationsService.create_notification`
    - Delegates to `JoseAI.generate_message(event_type, variables)` to pick a template from `jose_message_templates` table.
    - Inserts notification into `notifications` table with `details` and optional `action_payload`.
  - **Lines ~127–166** – `NotificationsService.create_activity_log`
    - Writes an entry into `activity_log` with JSON `details`.
  - **Lines ~168–247** – `get_notifications`, `get_unread_count`, `mark_as_read`, `mark_all_as_read`
    - Query and update `notifications` table for a user or role.
  - **Lines ~250–272** – `get_activity_log(limit, offset)`
    - SELECTs from `activity_log`, trying to JSON-parse `details` safely.
    - Returns a list of activity rows used by `/api/activity-log`.
  - **Lines ~271–330** – `notify_all_admins`, `notify_user`, `log_activity`
    - Thin wrappers calling `create_notification` / `create_activity_log`.

- **File:** `jrmsu-wise-library-main/python-backend/notifications_routes.py`
  - **Lines ~22–46** – `/api/notifications` (GET)
    - Uses `NotificationsService.get_notifications` and `get_unread_count`.
  - **Lines ~81–92** – `/api/activity-log` (GET)
    - Calls `NotificationsService.get_activity_log(limit, offset)`.
    - Returns `{'items': activities, 'total': len(activities)}` to `Dashboard.tsx`.
  - **Lines ~93–140** – `/api/activity` (GET/POST)
    - GET: compatibility mirror of `/api/activity-log`.
    - POST: called by `ActivityService.log`, builds `summary` from `details` and calls `log_activity(event_type, user_id, summary, details, 'MAIN')`.

---

## 7. Summary: Using This Map

- To understand **what a feature does**, start from the corresponding page in `src/pages` and follow into `src/services` and then Python backend.
- To know **where to edit**, use the line ranges above to jump into the right region of each file.
- To trace **notifications and realtime behavior**, look for `_notify_all_admins`, `notify_all_admins`, `_broadcast`, `socketio.emit`, and the associated Socket.IO client code in `dashboardRealtime.ts` and `notificationsApi.ts`.

This enriched `READMETWO.md` now ties **files, line ranges, responsibilities, and connection points** together so you can quickly navigate and modify the JRMSU AI-Library System with confidence.

When you want to change behavior, follow this general pattern:

1. **Locate the page** in `src/pages` that shows the behavior.
   - Example: Book list/reservations → `src/pages/Books.tsx`.
2. **Check associated services** in `src/services`.
   - Example: Reservations → `src/services/reservations.ts`, `/api/library/reserve-book` in `library_endpoints.py`.
3. **Open the backend file** for the API route used.
   - Search the route path (e.g., `/api/library/reserve-book`) in `python-backend` to find the function.
4. **Inspect DB usage** in SQL or runtime table creation.
   - Use `create_library_tables.sql` and `notifications_schema.sql` for schema.
5. **Update both front and back** as needed.
   - Keep request/response shapes in sync.
   - Adjust any `NotificationManager` or `_notify_all_admins` calls if the behavior should change admin visible notifications.

If you’re not sure where a function is used:

- Use your IDE’s **“Find All References”** or `grep` for the function name.
- For routes, search for the path string (e.g., `"/api/library/borrow-book"`).

This document should give you enough orientation to:

- Understand how all the main pieces connect.
- Know which files to open and what each part is responsible for.
- Confidently edit and extend the JRMSU AI-Library System without guessing. 
