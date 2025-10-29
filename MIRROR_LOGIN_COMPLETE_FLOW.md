# 🔄 Mirror Login Complete Flow - Odd/Even Action System

## 📋 System Requirements

### Core Behavior

1. **Session Checking**: System checks database for active session when user enters ID
2. **Button State**: 
   - **Blue "Login to Library"** = No active session (ODD action next)
   - **Green "Logout from Library"** = Active session exists (EVEN action next)
3. **Action Counting**: 
   - **ODD numbers (1, 3, 5, ...)** = Login actions
   - **EVEN numbers (2, 4, 6, ...)** = Logout actions
4. **Session Persistence**: Sessions survive page refresh and system restart
5. **Notifications**: All login/logout events notify ALL admins
6. **Activity Log**: Records summary actions (not full AI messages)
7. **Multiple Users**: Independent sessions without interference
8. **Forgotten Logout**: Auto-notify at 5 PM if user still logged in

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ USER ENTERS ID IN MIRROR LOGIN PAGE                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │ Check Database     │
        │ for Active Session │
        └────────┬───────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ NO SESSION   │   │ HAS SESSION  │
│ FOUND        │   │ FOUND        │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ BLUE BUTTON  │   │ GREEN BUTTON │
│ "Login to    │   │ "Logout from │
│  Library"    │   │  Library"    │
└──────┬───────┘   └──────┬───────┘
       │                  │
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ User enters  │   │ User clicks  │
│ password     │   │ green button │
│ and clicks   │   │ (no password │
│ blue button  │   │ needed)      │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ Authenticate │   │ Record       │
│ credentials  │   │ logout time  │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ Record login │   │ Mark session │
│ time in DB   │   │ as completed │
│ (ODD action) │   │ (EVEN action)│
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ Notify ALL   │   │ Notify ALL   │
│ admins       │   │ admins       │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ Show welcome │   │ Show logout  │
│ message      │   │ confirmation │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ Redirect to  │   │ Redirect to  │
│ mirror login │   │ mirror login │
└──────────────┘   └──────────────┘
```

---

## 🗄️ Database Schema

### library_sessions Table

```sql
CREATE TABLE library_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    user_type ENUM('student', 'admin') NOT NULL,
    full_name VARCHAR(255),
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    logout_time DATETIME,
    method ENUM('manual', 'qrcode') NOT NULL,
    status ENUM('inside_library', 'logged_out') DEFAULT 'inside_library',
    action_count INT NOT NULL DEFAULT 1 COMMENT 'ODD for login, EVEN for logout',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_login_time (login_time),
    INDEX idx_action_count (action_count)
);
```

### activity_log Table

```sql
CREATE TABLE activity_log (
    activity_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    actor_id VARCHAR(50) NOT NULL,
    actor_name VARCHAR(100) NULL,
    event VARCHAR(255) NOT NULL COMMENT 'Short action: LOGIN, LOGOUT, etc.',
    details VARCHAR(255) NULL,
    source ENUM('MAIN','MIRROR') NOT NULL DEFAULT 'MAIN',
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    device VARCHAR(100) NULL,
    INDEX idx_actor (actor_id),
    INDEX idx_source (source),
    INDEX idx_timestamp (timestamp DESC)
);
```

---

## 🔢 Odd/Even Action System

### Action Count Logic

| Action | Count | Type | Status |
|--------|-------|------|--------|
| First Login | 1 | ODD | inside_library |
| First Logout | 2 | EVEN | logged_out |
| Second Login | 3 | ODD | inside_library |
| Second Logout | 4 | EVEN | logged_out |
| Third Login | 5 | ODD | inside_library |
| Third Logout | 6 | EVEN | logged_out |

### Database Records Example

**User: KCL-00001 (John Mark Santos)**

```sql
-- Action #1 (ODD) - Login
INSERT INTO library_sessions VALUES (
    'lib-uuid-1', 'KCL-00001', 'admin', 'John Mark Santos',
    '2025-10-29 08:00:00', NULL, 'manual', 'inside_library', 1
);

-- Action #2 (EVEN) - Logout
UPDATE library_sessions SET 
    logout_time = '2025-10-29 12:00:00',
    status = 'logged_out',
    action_count = 2
WHERE session_id = 'lib-uuid-1';

-- Action #3 (ODD) - Login again
INSERT INTO library_sessions VALUES (
    'lib-uuid-2', 'KCL-00001', 'admin', 'John Mark Santos',
    '2025-10-29 13:00:00', NULL, 'manual', 'inside_library', 3
);

-- Action #4 (EVEN) - Logout again
UPDATE library_sessions SET 
    logout_time = '2025-10-29 17:00:00',
    status = 'logged_out',
    action_count = 4
WHERE session_id = 'lib-uuid-2';
```

---

## 🔌 API Endpoints

### 1. Check User Session

```http
GET /api/library/check-session/:userId
```

**Response (Has Active Session):**
```json
{
  "hasActiveSession": true,
  "sessionId": "lib-uuid-123",
  "loginTime": 1730188800,
  "actionCount": 3,
  "actionType": "ODD"
}
```

**Response (No Active Session):**
```json
{
  "hasActiveSession": false
}
```

### 2. Login to Library

```http
POST /api/library/login
Content-Type: application/json

{
  "userId": "KCL-00001",
  "userType": "admin",
  "fullName": "John Mark Santos",
  "method": "manual"
}
```

**Response:**
```json
{
  "sessionId": "lib-uuid-123",
  "userId": "KCL-00001",
  "userType": "admin",
  "fullName": "John Mark Santos",
  "loginTime": 1730188800,
  "status": "inside_library",
  "actionCount": 1,
  "actionType": "ODD"
}
```

### 3. Logout from Library

```http
POST /api/library/logout
Content-Type: application/json

{
  "userId": "KCL-00001",
  "sessionId": "lib-uuid-123"
}
```

**Response:**
```json
{
  "sessionId": "lib-uuid-123",
  "userId": "KCL-00001",
  "fullName": "John Mark Santos",
  "logoutTime": 1730203200,
  "status": "logged_out",
  "actionCount": 2,
  "actionType": "EVEN"
}
```

### 4. Check Forgotten Logouts

```http
GET /api/library/forgotten-logouts
```

**Response:**
```json
{
  "forgotten": [
    {
      "userId": "KCL-00001",
      "fullName": "John Mark Santos",
      "loginTime": 1730160000
    }
  ],
  "count": 1
}
```

---

## 📢 Notification System

### Login Notification (to ALL Admins)

```json
{
  "id": "notif_123",
  "user_id": "KCL-00002",
  "title": "Library Activity",
  "body": "John Mark Santos (KCL-00001) logged into the library",
  "type": "library_login",
  "meta": {
    "userId": "KCL-00001",
    "userType": "admin",
    "action": "login",
    "actionCount": 1,
    "actionType": "ODD"
  },
  "created_at": 1730188800,
  "read": false
}
```

### Logout Notification (to ALL Admins)

```json
{
  "id": "notif_124",
  "user_id": "KCL-00002",
  "title": "Library Activity",
  "body": "John Mark Santos (KCL-00001) logged out from the library",
  "type": "library_logout",
  "meta": {
    "userId": "KCL-00001",
    "action": "logout",
    "actionCount": 2,
    "actionType": "EVEN"
  },
  "created_at": 1730203200,
  "read": false
}
```

### Forgotten Logout Notification (to ALL Admins + User)

**To Admins:**
```json
{
  "title": "Library Activity",
  "body": "John Mark Santos (KCL-00001) forgot to logout from the library",
  "type": "forgotten_logout"
}
```

**To User:**
```json
{
  "title": "Logout Reminder",
  "body": "Hi John Mark Santos! You forgot to logout from the library. Please logout before leaving. The library closes at 5 PM.",
  "type": "forgotten_logout",
  "action_required": true
}
```

---

## 📊 Activity Log Format

### Login Activity

```sql
INSERT INTO activity_log (
    actor_id, actor_name, event, details, source, timestamp
) VALUES (
    'KCL-00001', 'John Mark Santos', 'LIBRARY LOGIN',
    'Method: manual, Action #1 (ODD)', 'MIRROR', NOW()
);
```

### Logout Activity

```sql
INSERT INTO activity_log (
    actor_id, actor_name, event, details, source, timestamp
) VALUES (
    'KCL-00001', 'John Mark Santos', 'LIBRARY LOGOUT',
    'Session ended, Action #2 (EVEN)', 'MIRROR', NOW()
);
```

---

## 🎯 Frontend Implementation

### Button State Logic

```typescript
// Check if typed user ID has active session
useEffect(() => {
  const checkTypedUserSession = async () => {
    if (!formData.id || formData.id.trim() === '') {
      setIsUserLoggedInLibrary(false); // Blue button
      return;
    }

    // Check backend for this specific user
    const hasActiveSession = await checkUserSessionStatus(formData.id);
    setIsUserLoggedInLibrary(hasActiveSession); // Green if true, Blue if false
  };

  checkTypedUserSession();
}, [formData.id]);
```

### Button Rendering

```tsx
<Button
  type="submit"
  className={`w-full ${
    isUserLoggedInLibrary
      ? 'bg-green-600 hover:bg-green-700'
      : 'bg-blue-600 hover:bg-blue-700'
  }`}
>
  {isUserLoggedInLibrary ? 'Logout from Library' : 'Login to Library'}
</Button>
```

---

## ✅ Testing Scenarios

### Scenario 1: First Time Login

1. User types ID: **KCL-00001**
2. System checks DB → No active session
3. Button shows: **Blue "Login to Library"**
4. User enters password and clicks
5. System creates session with action_count = 1 (ODD)
6. All admins notified
7. Welcome message shown
8. Redirect to mirror login

### Scenario 2: User Already Logged In

1. User types ID: **KCL-00001**
2. System checks DB → Active session found
3. Button shows: **Green "Logout from Library"**
4. User clicks (no password needed)
5. System updates session with action_count = 2 (EVEN)
6. All admins notified
7. Logout confirmation shown
8. Redirect to mirror login

### Scenario 3: Multiple Users

1. User A (KCL-00001) logs in → Action #1 (ODD)
2. User B (KC-23-A-00762) logs in → Action #1 (ODD)
3. User A types ID → Green button (has session)
4. User B types ID → Green button (has session)
5. User C (KC-23-A-00123) types ID → Blue button (no session)
6. Each user operates independently

### Scenario 4: Forgotten Logout

1. User logs in at 9:00 AM → Action #1 (ODD)
2. User forgets to logout
3. At 5:00 PM, cron job runs
4. System detects active session > 8 hours
5. Notifies ALL admins
6. Notifies user with warning
7. User can still logout manually

---

## 🔧 Setup Instructions

### 1. Update Database

```bash
cd python-backend
mysql -u root -p jrmsu_library < create_missing_tables.sql
```

### 2. Restart Backend

```bash
python app.py
```

**Expected output:**
```
✅ Library session endpoints loaded
✅ Library book endpoints loaded
🚀 Backend running at http://localhost:5000
```

### 3. Test Frontend

```bash
cd mirror-login-page
npm run dev
```

**Open:** http://localhost:8081

---

## 📝 Summary

**✅ Implemented:**
1. Database-backed session tracking
2. Odd/Even action counting system
3. Dynamic button color (Blue/Green)
4. Session persistence across restarts
5. Notifications to ALL admins
6. Activity log with action summaries
7. Multiple concurrent user support
8. Forgotten logout detection
9. Backend API endpoints
10. Frontend session checking

**🎯 Key Features:**
- ODD actions = Login (1, 3, 5, ...)
- EVEN actions = Logout (2, 4, 6, ...)
- Blue button = No session
- Green button = Has session
- All events notify admins
- Sessions survive page refresh

**The mirror login system is now production-ready! 🎉**
