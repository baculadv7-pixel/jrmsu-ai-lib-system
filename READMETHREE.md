# JRMSU AI-Library System – Full Real-System Flowchart (READMETHREE)

This document contains a **single, end-to-end Mermaid flowchart** that represents the real JRMSU AI-Library System, based only on what is actually implemented in:

- `jrmsu-wise-library-main/`
- `jrmsu-wise-library-main/python-backend/`
- `ai_server/`
- `mirror-login-page/`
- root-level scripts and data in `C:\Users\provu\Desktop\jrmsu-ai-lib-system-main`

Paste the block below directly into the Mermaid Live Editor.

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
    MScanner[QR Borrow/Return Dialogs\n(components/library/BookScannerDialog.tsx\n+ components/qr/QRScanner.tsx)]
    MSessions[Active Sessions Panel\n(components/sessions/ActiveSessionsPanel.tsx)]
  end

  %% PYTHON BACKEND (jrmsu-wise-library-main/python-backend)
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
  DBFile[(File: python-backend/data.json\nusers, activity, books, borrows)]

  %% AI SERVER (ai_server)
  subgraph AIServer[AI Server (Flask, 5002)]
    AIHTTP[/ai_server/app.py\nPOST /ai/chat/]
    AIKB[(system_knowledge.json)]
    AIDBAI[(MySQL: library_system_ai.ai_logs)]
  end

  %% USER → MAIN APP AUTH & REGISTRATION
  UStudent --> LLogin
  UAdmin --> LLogin

  LLogin -->|Student/Admin registration\nRegistration*.tsx + RegistrationContext.tsx\nPOST /api/students/register\nPOST /api/admins/register| AuthRoutes
  AuthRoutes -->|INSERT/SELECT via StudentDB/AdminDB| DBMain

  LLogin -->|Login (ID + password)\nAuthContext.signIn| AuthRoutes
  LLogin -->|Login via QR\nAuthContext.signInWithQR| AuthRoutes
  AuthRoutes -->|GET /api/users/{id}\n(app.py get_user)| DBMain
  AuthRoutes -->|fallback users\n(load_db / save_db)| DBFile

  %% MAIN APP: BOOK INVENTORY & RESERVATIONS
  UStudent --> BBooks
  UAdmin --> BBooks

  BBooks -->|Initial list\nBooksService.ensureSeed/list\n(frontend only)| BBooks

  BBooks -->|Load reservations\nGET /api/library/user-reservations/{userId}\nGET /api/library/reservations-all| LEndpoints
  LEndpoints -->|SELECT reservations\n(joins books)| DBMain

  BBooks -->|Load borrowed\nGET /api/library/user-borrowed/{userId}\nGET /api/library/borrowed-all| LEndpoints
  LEndpoints -->|SELECT borrow_records\n(derive overdue)| DBMain

  BBooks -->|Reserve book\nconfirmReserve() → POST /api/library/reserve-book| LEndpoints
  LEndpoints -->|INSERT reservations,\nUPDATE books.available_copies/status| DBMain
  LEndpoints -->|notify_all_admins('reservation_created')\n+ log_activity| NService

  %% MAIN APP: NOTIFICATIONS & DASHBOARD
  NService -->|INSERT notifications,\nINSERT activity_log| DBMain
  NService -->|emit notification.new\nvia Socket.IO| NRoutes

  NBell -->|GET /api/notifications\nmark-read/mark-all-read| NRoutes
  NRoutes -->|SELECT/UPDATE notifications| DBMain

  DDash -->|GET /api/activity-log?limit=100| NRoutes
  NRoutes -->|SELECT activity_log\n(get_activity_log)| DBMain

  %% MIRROR: LIBRARY SESSION LIFECYCLE
  UStudent --> MEntry
  UAdmin --> MEntry

  MEntry -->|Login (ID/PW or QR)\nAuthContext in mirror app| AuthRoutes
  AuthRoutes --> DBMain

  MEntry -->|createSession(userId, userType, fullName, method)\nLibrarySessionContext.createSession| LSessionMgr
  LSessionMgr -->|create_login_session\nINSERT library_sessions, active_sessions, activity_log| DBMain
  LSessionMgr -->|notify_all_admins('library_login')\n+ log_activity| NService

  MEntry -->|checkUserStatus(userId)\nLibrarySessionContext.checkUserStatus| LEndpoints
  LEndpoints -->|SELECT pending reservations\n+ active borrow_records| DBMain
  LEndpoints -->|JSON: hasReservations,\nhasBorrowedBooks, reservedBooks, borrowedBooks| MEntry

  MSessions -->|GET /api/library/active-sessions| LSessionMgr
  LSessionMgr -->|SELECT active_sessions| DBMain

  %% MIRROR: BORROW VIA QR
  MEntry -->|Show borrow prompt\n(open BookScannerDialog)| MScanner
  MScanner -->|Scan book QR (bookId)\nBorrow mode
LibrarySessionContext.borrowBook| LEndpoints
  LEndpoints -->|validate reservation & availability\nINSERT borrow_records, mark reservation fulfilled,\nUPDATE books.available_copies/status| DBMain
  LEndpoints -->|notify_all_admins('book_borrowed')\n+ log_activity + emit 'book.borrowed'| NService
  LEndpoints -->|JSON ok| MScanner
  MScanner -->|show borrow success| MEntry

  %% MIRROR: RETURN VIA QR
  MEntry -->|Show return prompt\n(open BookScannerDialog)| MScanner
  MScanner -->|Scan book QR (bookId)\nReturn mode
LibrarySessionContext.returnBook| ReturnAPI[return-book in library_endpoints.py]
  ReturnAPI -->|find active borrow_records\nstatus 'borrowed'| DBMain
  ReturnAPI -->|set status='returned', returned_at\nUPDATE books.available_copies/status| DBMain
  ReturnAPI -->|notify_all_admins('book_returned')\n+ log_activity + emit 'book.returned'| NService
  ReturnAPI -->|JSON ok| MScanner
  MScanner -->|show return success| MEntry

  %% MIRROR: LOGOUT
  MEntry -->|endSession()\nLibrarySessionContext.endSession
POST /api/library/force-logout| LSessionMgr
  LSessionMgr -->|create_logout_session\nUPDATE library_sessions,
DELETE from active_sessions,
INSERT activity_log| DBMain
  LSessionMgr -->|notify_all_admins('library_logout')\n+ log_activity| NService

  %% AI ASSISTANT (JOSE)
  UStudent --> AIAssist
  UAdmin --> AIAssist

  AIAssist -->|prompt, user_id\naiService.ts| AIHTTP
  AIHTTP -->|load_system_knowledge()\nget_relevant_knowledge()| AIKB
  AIHTTP -->|compose Jose prompt
+ knowledge| Ollama[ollama run\nllama3:8b-instruct-q4_K_M]
  Ollama -->|LLM response text| AIHTTP
  AIHTTP -->|detect_emotion(response)\n(TextBlob or heuristic)| AIHTTP
  AIHTTP -->|INSERT ai_logs\n(user_id, message,
ai_response, emotion)| AIDBAI
  AIHTTP -->|JSON { response, emotion }| AIAssist
```
