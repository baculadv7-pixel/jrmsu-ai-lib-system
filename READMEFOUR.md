# JRMSU AI-Library System – Real Flow + Future Upgrades (READMEFOUR)

This document contains:

1. A **real, current-state flowchart** of the JRMSU AI-Library System (based only on code that exists now).
2. A **future-state flowchart** showing planned upgrades and extensions that could be implemented on top of the current architecture.

You can paste the Mermaid blocks below into the [Mermaid Live Editor](https://mermaid.live).

---

## 1. Current Real System Flowchart (As Implemented Now)

```mermaid
flowchart TD
  %% USERS
  UStudent[Student User]
  UAdmin[Admin User]

  %% MAIN FRONTEND (jrmsu-wise-library-main/src)
  subgraph MainApp[Main Web App (React+TS, Vite, 8080)]
    LLogin[Login & Registration\n(Login.tsx, Registration*.tsx)]
    BBooks[Books & Reservations\n(src/pages/Books.tsx)]
    BManage[Book Management\n(src/pages/BookManagement.tsx)]
    DDash[Admin Dashboard\n(src/pages/Dashboard.tsx)]
    NBell[Notification Bell\n(src/components/Layout/Navbar.tsx)]
    AIAssist[AI Assistant\n(src/components/Layout/AIAssistant.tsx)]
  end

  %% MIRROR FRONTEND (mirror-login-page/src)
  subgraph Mirror[Mirror Login Page (React+TS, 8081)]
    MEntry[Library Entry & Exit\n(src/pages/LibraryEntry.tsx)]
    MScanner[QR Borrow/Return Dialogs\n(BookScannerDialog.tsx\n+ QRScanner.tsx)]
    MSessions[Active Sessions Panel\n(ActiveSessionsPanel.tsx)]
  end

  %% BACKEND (jrmsu-wise-library-main/python-backend)
  subgraph Backend[Python Backend (Flask + Socket.IO, 5000)]
    subgraph AuthAPI[Auth & Users (app.py)]
      AuthRoutes[/ /api/students/*\n /api/admins/*\n /api/users/{id} /]
      FileStore[(data.json\nusers, activity)]
    end

    subgraph LibraryAPI[Library & Sessions]
      LEndpoints[/library_endpoints.py\n/api/library/*/]
      LSessionMgr[/library_session_manager.py\n/api/library/login, logout,\n/api/library/active-sessions, forgotten-logouts/]
    end

    subgraph NotifAPI[Notifications & Activity]
      NRoutes[/notifications_routes.py\n/api/notifications\n/api/activity-log\n/api/activity/]
      NService[/notifications_service.py\ncreate_notification, log_activity/]
    end
  end

  %% DATABASES
  DBMain[(MySQL: jrmsu_library\n- students, admins\n- books, reservations, borrow_records\n- library_sessions, active_sessions\n- notifications, notification_dedup\n- activity_log, audit_log, db_backups)]
  DBFile[(File: data.json\nusers, activity, books, borrows)]

  %% AI SERVER (ai_server)
  subgraph AIServer[AI Server (Flask, 5002)]
    AIHTTP[/ai_server/app.py\nPOST /ai/chat/]
    AIKB[(system_knowledge.json)]
    AIDBAI[(MySQL: library_system_ai.ai_logs)]
  end

  %% USER → MAIN APP AUTH & REGISTRATION
  UStudent --> LLogin
  UAdmin --> LLogin

  LLogin -->|Student/Admin registration\nRegistrationContext.tsx\nPOST /api/students/register\nPOST /api/admins/register| AuthRoutes
  AuthRoutes --> DBMain

  LLogin -->|Login (ID + password)\nAuthContext.signIn| AuthRoutes
  LLogin -->|Login via QR\nAuthContext.signInWithQR| AuthRoutes
  AuthRoutes -->|GET /api/users/{id}| DBMain
  AuthRoutes -->|fallback users\n(load_db / save_db)| DBFile

  %% MAIN APP: BOOK INVENTORY & RESERVATIONS
  UStudent --> BBooks
  UAdmin --> BBooks

  BBooks -->|Initial list\nBooksService.ensureSeed/list| BBooks

  BBooks -->|Load reservations\nGET /api/library/user-reservations/{userId}\nGET /api/library/reservations-all| LEndpoints
  LEndpoints --> DBMain

  BBooks -->|Load borrowed\nGET /api/library/user-borrowed/{userId}\nGET /api/library/borrowed-all| LEndpoints
  LEndpoints --> DBMain

  BBooks -->|Reserve book\nconfirmReserve() → POST /api/library/reserve-book| LEndpoints
  LEndpoints -->|INSERT reservations,\nUPDATE books.available_copies/status| DBMain
  LEndpoints -->|notify_all_admins('reservation_created')\n+ log_activity| NService

  %% NOTIFICATIONS & DASHBOARD
  NService -->|INSERT notifications,\nINSERT activity_log| DBMain
  NService -->|emit notification.new\n(Socket.IO)| NRoutes

  NBell -->|GET /api/notifications\nmark-read/mark-all-read| NRoutes
  NRoutes --> DBMain

  DDash -->|GET /api/activity-log?limit=100| NRoutes
  NRoutes --> DBMain

  %% MIRROR: LIBRARY SESSION
  UStudent --> MEntry
  UAdmin --> MEntry

  MEntry -->|Login (ID/PW or QR)\nAuthContext in mirror app| AuthRoutes
  AuthRoutes --> DBMain

  MEntry -->|createSession(userId, userType, fullName, method)\nLibrarySessionContext.createSession| LSessionMgr
  LSessionMgr -->|INSERT library_sessions, active_sessions, activity_log| DBMain
  LSessionMgr -->|notify_all_admins('library_login')\n+ log_activity| NService

  MEntry -->|checkUserStatus(userId)\nLibrarySessionContext.checkUserStatus| LEndpoints
  LEndpoints --> DBMain
  LEndpoints -->|JSON hasReservations, hasBorrowedBooks\n+ reservedBooks, borrowedBooks| MEntry

  MSessions -->|GET /api/library/active-sessions| LSessionMgr
  LSessionMgr --> DBMain

  %% MIRROR: BORROW & RETURN VIA QR
  MEntry -->|Prompt to scan| MScanner

  MScanner -->|Borrow mode\nLibrarySessionContext.borrowBook(bookId)\nPOST /api/library/borrow-book| LEndpoints
  LEndpoints -->|INSERT borrow_records,\nfulfill reservations, update books| DBMain
  LEndpoints -->|notify_all_admins('book_borrowed')\n+ log_activity + emit 'book.borrowed'| NService

  MScanner -->|Return mode\nLibrarySessionContext.returnBook(bookId)\nPOST /api/library/return-book| LEndpoints
  LEndpoints -->|UPDATE borrow_records (returned)\nUPDATE books.available_copies/status| DBMain
  LEndpoints -->|notify_all_admins('book_returned')\n+ log_activity + emit 'book.returned'| NService

  %% MIRROR: LOGOUT
  MEntry -->|endSession()\nLibrarySessionContext.endSession\nPOST /api/library/force-logout| LSessionMgr
  LSessionMgr -->|UPDATE library_sessions,
DELETE from active_sessions,
INSERT activity_log| DBMain
  LSessionMgr -->|notify_all_admins('library_logout')\n+ log_activity| NService

  %% AI ASSISTANT (JOSE)
  UStudent --> AIAssist
  UAdmin --> AIAssist

  AIAssist -->|prompt, user_id\naiService.ts| AIHTTP
  AIHTTP -->|load_system_knowledge()\nget_relevant_knowledge()| AIKB
  AIHTTP -->|compose Jose prompt + knowledge| Ollama[ollama run\nllama3:8b-instruct-q4_K_M]
  Ollama -->|response text| AIHTTP
  AIHTTP -->|detect_emotion(response)| AIHTTP
  AIHTTP -->|INSERT ai_logs\n(user_id, message, ai_response, emotion)| AIDBAI
  AIHTTP -->|JSON { response, emotion }| AIAssist
```

---

## 2. Future Planned Upgrades (Conceptual Flowchart)

> **Note:** This section is **future/optional design** – ideas that can be implemented later on top of the existing architecture. They are **not yet present in the current code**, but they respect the real structure.

Planned ideas include:

- Central **Config API** for all frontends (`/api/config/*`).
- Dedicated **AI context endpoint** in the backend (`/api/ai/book-context`) to feed richer data to Jose.
- A **Notification Rules Engine** to manage policies (who gets which event, channels, throttling).
- A **Background Scheduler** (cron/worker) for overdue scanning and forgotten logouts.
- A more formal **RBAC layer** for different admin roles (librarian, staff, supervisor).

```mermaid
flowchart TD
  %% EXISTING NODES (simplified)
  subgraph Frontends[Frontends]
    Main[Main App]
    Mirror[Mirror Page]
  end

  subgraph Backend[Current Backend (app.py + modules)]
    Auth[/Auth & Users/]
    Library[/Library Endpoints/]
    Sessions[/Library Sessions/]
    Notifs[/Notifications Service/]
  end

  DB[(jrmsu_library)]

  subgraph AIServer[AI Server]
    AIHTTP[/POST /ai/chat/]
    AIKB[(system_knowledge.json)]
  end

  %% NEW / PLANNED COMPONENTS
  subgraph Future[Planned Extensions]
    ConfigAPI[/Config API\n/app.py: /api/config/*/]
    AIContext[/AI Context Endpoint\n/library/ai-context\n/backend → /api/ai/book-context/]
    RulesEng[/Notification Rules Engine\n(policies per event/role)/]
    Scheduler[/Background Scheduler\n(Overdue, Forgotten Logouts)/]
    RBAC[/RBAC Layer\n(role-based access control)/]
  end

  %% Wiring future around existing
  Main -->|GET /api/config/*| ConfigAPI
  Mirror -->|GET /api/config/*| ConfigAPI
  ConfigAPI --> DB

  AIHTTP -->|GET /api/ai/book-context| AIContext
  AIContext -->|SELECT books, borrows, reservations| DB

  Library --> RulesEng
  Sessions --> RulesEng
  RulesEng --> Notifs

  Scheduler -->|periodic checks\n/overdue, /forgotten-logouts| Library
  Scheduler -->|emit summary notifications| Notifs

  Auth --> RBAC
  Library --> RBAC
  Sessions --> RBAC
  RBAC --> DB
```

This future-state diagram is meant to guide how you can safely extend the current system without breaking the existing flows captured in the first (real) flowchart.
