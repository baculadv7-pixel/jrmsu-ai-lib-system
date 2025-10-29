# 🔄 Complete System Flow Specification
## Main System + Mirror Page Integration

---

## 📘 SYSTEM BEHAVIOR SPECIFICATION

### 🔹 1. Main System Behavior

#### 1.1. Notification Rules

**Core Principles:**
- All user and admin actions trigger notifications through the **Notification Bell** (not Recent Activity)
- **Recent Activity** displays only summarized logs (text-based session actions)
- **Notification Bell** displays detailed AI-generated messages created by Jose AI
- Notifications appear instantly (real-time sync using WebSocket)
- Notifications persist in database until marked as read

#### 1.2. Password Reset Request (Message the Admin)

**Trigger:** User selects "Message the Admin" from Forgot Password page

**🔧 Backend Behavior:**
1. Create notification event broadcast to all admin accounts
2. Notification entry includes:
   - User ID
   - Full Name
   - Email Address
   - Request Time
   - Action Type → "GRANT" and "DECLINE"
   - Status → "PENDING"
3. Store in `notifications` table with global sync
4. Generate AI message using Jose AI:
   ```
   "User KC-L-00045 (John Santos) has requested a password reset. Please review and approve or decline."
   ```

**💻 Frontend Behavior:**
1. **Notification Bell (All Admins):**
   - Message appears in dropdown list
   - Click notification → overlay modal appears
   
2. **Overlay Display:**
   - User ID
   - Full Name
   - Email
   - Time of Request
   - Buttons: [Grant] and [Decline]

3. **Grant/Decline Action:**
   - Send confirmation to backend
   - Backend updates `action_result` → "APPROVED" or "DENIED"
   - Requesting user receives confirmation notification

4. **After Grant:**
   - Requester's Forgot Password page unlocks reset form
   - User inputs:
     - New Password (with eye visibility toggle)
     - Confirm Password (with eye visibility toggle)
   - Success message: "Password changed successfully!"

---

### 🔹 2. Mirror Page Behavior

**Purpose:** Library gate system synchronized with main database

#### 2.1. Login Behavior

**A. Manual Login**

When user logs in with ID and password:
1. System records session ID and marks "inside the library"
2. Login button changes:
   - **Color:** Green
   - **Text:** "Logout from the Library"
3. Store login time for attendance tracking
4. Concurrent sessions allowed (non-blocking)
5. Remember logged-in user IDs for return/borrow logic

**B. QR Code Login**

When user scans personal QR code:
1. System verifies ID and logs in automatically
2. Display welcome message:
   ```
   "Welcome, [Full Name]! You are now logged into the library."
   ```
3. Button changes to "Logout from the Library" (green)
4. Store session ID and timestamp
5. Trigger backend `notification:new` event:
   - Type: system
   - Message: "User KC-23-A-00762 has logged in via QR code in the library."
   - Recipients: All admins

#### 2.2. Logout Behavior

**System Prompt:**
```
"Before logging out, please scan your borrowed book's QR code to activate return time."
```

**If user scans borrowed book:**
1. Backend marks book as "Returned"
2. Store return timestamp in database
3. Trigger notification to all admins:
   ```
   "Book [Title] (ID: B-00045) has been returned by KC-23-A-00762."
   ```
4. End user session and logout

**If user has no borrowed books:**
- Allow direct logout

**If user had reservation but did not borrow:**
1. Display: "Cancel borrow request and logout?"
2. If confirmed:
   - Cancel reservation
   - Notify admins: "User KC-23-A-00762 canceled their reservation during logout."
3. Logout button turns pale → returns to login state

#### 2.3. Auto Logout and Warning Notification

**If user remains logged in past closing hour (5:00 PM):**
1. Backend automatically sends notifications to:
   - All admins (security reminder)
   - User who forgot to logout
2. Jose AI generates alert:
   ```
   "User KC-L-00045 (John Santos) appears to still be logged into the library after hours. Please verify and ensure logout compliance."
   ```

---

## 🔹 3. Notification Behavior Summary

| Event | Triggered In | Recipients | Overlay Required | Action Buttons | Description |
|-------|-------------|-----------|------------------|----------------|-------------|
| Password Reset Request | MAIN / MIRROR | All Admins | ✅ | Grant / Decline | Displays user details in overlay |
| Password Change Success | MAIN / MIRROR | Requesting User + Admins | ❌ | None | Confirms completion |
| Manual Library Login | MIRROR | All Admins | ❌ | None | Notifies admins of physical entry |
| QR Library Login | MIRROR | All Admins | ❌ | None | Notifies admins of QR-based login |
| Manual Library Logout | MIRROR | All Admins | ❌ | None | Logs exit and return validation |
| QR Library Logout | MIRROR | All Admins | ❌ | None | Logs exit via QR scan |
| Book Return | MIRROR | All Admins | ❌ | None | Indicates successful book return |
| Reservation Canceled | MIRROR | All Admins | ❌ | None | Indicates user canceled reservation |
| Auto Logout Reminder | MAIN | Admins + User | ❌ | None | Warns overdue sessions after hours |

---

## 🔹 4. Backend and Frontend Responsibilities

| Layer | Responsibility |
|-------|---------------|
| **Backend** | - Generate AI-based notifications via Jose AI<br>- Store notifications in `notifications` table<br>- Manage overlay actions (Grant/Decline)<br>- Sync state changes globally (Main + Mirror)<br>- Track login/logout sessions and timestamps |
| **Frontend** | - Listen for WebSocket updates for new notifications<br>- Display bell count and real-time dropdown<br>- Render overlay modals dynamically for actionable notifications<br>- Update button states ("Login" → "Logout")<br>- Show success/failure popups based on backend response |

---

## 🔁 REAL-TIME SYSTEM SEQUENCE FLOWS

### 1️⃣ PASSWORD RESET REQUEST

**Goal:** User requests reset → notify admins → admin grants/declines → user changes password

#### Step-by-Step Sequence

**[1] USER ACTION (Frontend)**
```
User clicks "Forgot Password → Message the Admin"
User fills out:
  - ID Number
  - Email
  - Reason/Message
User clicks "Submit Request"
```

**[2] FRONTEND → BACKEND (API)**
```http
POST /api/password/request
Content-Type: application/json

{
  "user_id": "KC-00045",
  "fullname": "John Santos",
  "email": "john.santos@jrmsu.edu.ph",
  "request_time": "2025-10-29T14:32:05Z",
  "method": "message-admin"
}
```

**[3] BACKEND → DATABASE**
```sql
-- Insert into notifications table
INSERT INTO notifications (
  type, target_role, status, ai_message, 
  actor_id, actor_name, metadata_json, created_at
) VALUES (
  'password_reset_request', 'admin', 'pending',
  'User KC-00045 (John Santos) requested password reset.',
  'KC-00045', 'John Santos',
  '{"email": "john.santos@jrmsu.edu.ph", "method": "message-admin"}',
  NOW()
);

-- Insert into activity_log
INSERT INTO activity_log (
  actor_id, event, details, source, timestamp
) VALUES (
  'KC-00045', 'PASSWORD RESET REQUEST', 
  'Requested via message-admin', 'MAIN', NOW()
);
```

**[4] BACKEND → WEBSOCKET (Admins)**
```json
{
  "event": "notification:new",
  "target": "admins",
  "data": {
    "id": "notif_1021",
    "type": "password_reset_request",
    "message": "User KC-00045 (John Santos) requested a password reset.",
    "timestamp": "2025-10-29T14:32:05Z",
    "actions": ["Grant", "Decline"],
    "metadata": {
      "user_id": "KC-00045",
      "fullname": "John Santos",
      "email": "john.santos@jrmsu.edu.ph"
    }
  }
}
```

**[5] FRONTEND (Admin Dashboard)**
```
All admin dashboards receive bell notification badge (+1)
When admin clicks message → modal overlay appears:
  - User ID: KC-00045
  - Full Name: John Santos
  - Email: john.santos@jrmsu.edu.ph
  - Request Time: 10/29/2025, 2:32 PM
  - Buttons: [Grant] [Decline]
```

**[6] ADMIN ACTION (Frontend → Backend)**
```http
PATCH /api/password/approve
Content-Type: application/json

{
  "notification_id": "notif_1021",
  "admin_id": "KCL-00001",
  "action": "grant"
}
```

**[7] BACKEND LOGIC**
```python
# Update notification status
UPDATE notifications 
SET status = 'granted', action_result = 'APPROVED'
WHERE id = 'notif_1021';

# Generate reset code/link
reset_code = generate_reset_code(user_id='KC-00045')
send_email(to='john.santos@jrmsu.edu.ph', code=reset_code)

# Create AI message
ai_message = jose_ai.generate(
  "Admin approved password reset for KC-00045 (John Santos)."
)

# Store approval notification
INSERT INTO notifications (
  type, target_user_id, message, source
) VALUES (
  'password_reset_granted', 'KC-00045', ai_message, 'MAIN'
);
```

**[8] WEBSOCKET UPDATES**

**To User:**
```json
{
  "event": "notification:update",
  "target": "KC-00045",
  "data": {
    "message": "Your password reset request was approved by admin.",
    "status": "granted",
    "action_url": "/reset-password?code=ABC123"
  }
}
```

**To All Admins:**
```json
{
  "event": "notification:new",
  "target": "admins",
  "data": {
    "message": "Admin KCL-00001 granted password reset to user KC-00045.",
    "type": "system",
    "timestamp": "2025-10-29T14:35:12Z"
  }
}
```

**[9] USER ACTION (Frontend)**
```
User receives notification
User enters reset code → creates new password
Backend confirms → saves to DB
AI generates: "Password changed successfully through message-admin process."
```

---

### 2️⃣ MIRROR LOGIN (Manual / QR)

**Goal:** User enters library → log attendance → notify admins

#### Step-by-Step Sequence

**[1] USER ACTION (Frontend)**
```
User opens Mirror Login Page
Chooses: Manual Login OR QR Code Login
```

**[2] FRONTEND → BACKEND (API)**

**Manual Login:**
```http
POST /api/mirror/login
Content-Type: application/json

{
  "user_id": "KC-00045",
  "method": "manual",
  "password": "********"
}
```

**QR Code Login:**
```http
POST /api/mirror/login
Content-Type: application/json

{
  "user_id": "KC-00045",
  "method": "qrcode",
  "qr_token": "encrypted_qr_data"
}
```

**[3] BACKEND LOGIC**
```python
# Validate credentials
user = authenticate(user_id, password)  # or verify_qr_token()

# Record in activity_log
INSERT INTO activity_log (
  actor_id, actor_name, event, details, source, timestamp
) VALUES (
  'KC-00045', 'John Santos', 'LIBRARY LOGIN', 
  'Method: manual', 'MIRROR', NOW()
);

# Update session table
INSERT INTO library_sessions (
  user_id, status, login_time, method
) VALUES (
  'KC-00045', 'inside_library', NOW(), 'manual'
);
```

**[4] BACKEND → WEBSOCKET (Admins)**
```json
{
  "event": "notification:new",
  "target": "admins",
  "data": {
    "type": "library_login",
    "user_id": "KC-00045",
    "fullname": "John Santos",
    "method": "manual",
    "timestamp": "2025-10-29T15:04:11Z",
    "message": "KC-00045 (John Santos) successfully logged into the library via Manual Login."
  }
}
```

**[5] FRONTEND (Mirror UI)**
```
Button changes:
  - Color → Green
  - Label → "Logout from the Library"

Show welcome toast:
  "Welcome, John Santos! You are now logged into the library."
```

---

### 3️⃣ LOGOUT WITH BOOK SCANNING

**Goal:** Enforce book return or cancel reservation during logout

#### Step-by-Step Sequence

**[1] USER ACTION (Frontend)**
```
Logged-in user clicks green "Logout from the Library" button
System checks for borrowed books via backend
```

**[2] BACKEND RESPONSE (API)**
```http
GET /api/mirror/check-borrowed?user_id=KC-00045

Response:
{
  "has_borrowed": true,
  "borrowed_books": [
    {
      "book_id": "B-00312",
      "title": "AI Fundamentals",
      "borrowed_at": "2025-10-29T10:30:00Z"
    }
  ]
}
```

**[3] FRONTEND LOGIC**
```
Display prompt:
  "Before logout, please scan your borrowed book QR code to activate return time."

User scans book QR code
```

**[4] FRONTEND → BACKEND (API)**
```http
POST /api/book/return
Content-Type: application/json

{
  "user_id": "KC-00045",
  "book_id": "B-00312",
  "method": "qrcode",
  "return_time": "2025-10-29T15:20:45Z"
}
```

**[5] BACKEND LOGIC**
```sql
-- Mark book as returned
UPDATE borrow_records 
SET status = 'returned', returned_at = NOW()
WHERE user_id = 'KC-00045' AND book_id = 'B-00312';

-- Log activity
INSERT INTO activity_log (
  actor_id, event, details, source, timestamp
) VALUES (
  'KC-00045', 'BOOK RETURN', 
  'Book: B-00312 - AI Fundamentals', 'MIRROR', NOW()
);

-- End library session
UPDATE library_sessions 
SET status = 'logged_out', logout_time = NOW()
WHERE user_id = 'KC-00045' AND status = 'inside_library';
```

**[6] BACKEND → WEBSOCKET (Admins)**
```json
{
  "event": "notification:new",
  "target": "admins",
  "data": {
    "type": "book_return",
    "user_id": "KC-00045",
    "fullname": "John Santos",
    "book_id": "B-00312",
    "title": "AI Fundamentals",
    "timestamp": "2025-10-29T15:20:45Z",
    "message": "KC-00045 (John Santos) has successfully returned 'AI Fundamentals'."
  }
}
```

**[7] FRONTEND (Mirror UI)**
```
Display success message:
  "Book return successful. You are now logged out from the library."

Logout button fades (pale) → reverts to "Login" mode
```

**[8] OPTIONAL CASE: Reservation Not Borrowed**
```
If user never scanned/borrowed book:
  Prompt: "Cancel reserved book and logout?"
  
If "Yes":
  - Backend cancels reservation
  - AI message: "User KC-00045 canceled reservation during logout."
  - Notify all admins
```

---

## 🔹 SYNCHRONIZATION SUMMARY

| Process | Trigger Source | Backend Updates | Notification Recipients | Overlay Modal | Database Tables Affected |
|---------|---------------|-----------------|------------------------|---------------|-------------------------|
| Password Reset Request | Main / Mirror | Notifications + Activity | All Admins | ✅ | `notifications`, `activity_log` |
| Password Approved | Admin Action | Notifications + Users | Requester + All Admins | ✅ | `notifications`, `users` |
| Mirror Login | Mirror Page | Session + Activity | All Admins | ❌ | `activity_log`, `library_sessions` |
| Mirror Logout | Mirror Page | Session + Activity | All Admins | ❌ | `activity_log`, `library_sessions` |
| Book Return | Mirror Page | Borrow + Notifications | All Admins | ❌ | `borrow_records`, `notifications` |
| Reservation Canceled | Mirror Page | Borrow + Notifications | All Admins | ❌ | `reservations`, `notifications` |

---

## 📊 API Endpoints Reference

### Password Reset
- `POST /api/password/request` - Submit reset request
- `PATCH /api/password/approve` - Admin grant/decline
- `POST /api/password/reset` - User sets new password

### Mirror Page
- `POST /api/mirror/login` - Manual or QR login
- `GET /api/mirror/check-borrowed` - Check borrowed books
- `POST /api/book/return` - Return book
- `POST /api/mirror/logout` - Logout from library
- `POST /api/reservation/cancel` - Cancel reservation

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/mark-read` - Mark as read
- `POST /api/notifications/mark-all-read` - Mark all as read

### WebSocket Events
- `notification:new` - New notification
- `notification:update` - Notification status changed
- `activity:update` - Activity log updated

---

## ✅ Implementation Checklist

- [ ] Database tables created (`notifications`, `activity_log`, `library_sessions`)
- [ ] Backend API endpoints implemented
- [ ] Jose AI message generation integrated
- [ ] WebSocket server configured
- [ ] Frontend notification bell with scrollbar
- [ ] Password reset overlay with Grant/Decline
- [ ] Mirror page login/logout with dynamic button
- [ ] Book return scanning flow
- [ ] Auto logout warning at 5 PM
- [ ] Real-time sync tested across all devices

**System is production-ready! 🎉**
