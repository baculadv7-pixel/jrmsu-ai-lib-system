# 📊 UML Sequence Diagrams
## Visual System Flow Documentation

---

## 1️⃣ PASSWORD RESET REQUEST FLOW

```
┌──────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐
│ User │  │ Frontend │  │ Backend │  │ Database │  │ WebSocket│  │ Admin UI  │
└──┬───┘  └────┬─────┘  └────┬────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘
   │           │              │            │             │              │
   │ Click "Message Admin"    │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │ Fill form (ID, Email)    │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │ Submit    │              │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │           │ POST /api/password/request              │              │
   │           ├─────────────>│            │             │              │
   │           │              │            │             │              │
   │           │              │ INSERT notifications     │              │
   │           │              ├───────────>│             │              │
   │           │              │            │             │              │
   │           │              │ INSERT activity_log      │              │
   │           │              ├───────────>│             │              │
   │           │              │            │             │              │
   │           │              │ Generate AI message      │              │
   │           │              │ (Jose AI)  │             │              │
   │           │              │            │             │              │
   │           │              │ Emit notification:new    │              │
   │           │              ├────────────┼────────────>│              │
   │           │              │            │             │              │
   │           │              │            │             │ Broadcast    │
   │           │              │            │             ├─────────────>│
   │           │              │            │             │              │
   │           │ 200 OK       │            │             │              │
   │           │<─────────────┤            │             │              │
   │           │              │            │             │              │
   │ Success   │              │            │             │              │
   │<──────────┤              │            │             │              │
   │           │              │            │             │              │
   │           │              │            │             │  Bell badge +1
   │           │              │            │             │<─────────────┤
   │           │              │            │             │              │
   │           │              │            │             │  Click notification
   │           │              │            │             │<─────────────┤
   │           │              │            │             │              │
   │           │              │            │             │  Open overlay
   │           │              │            │             │  [Grant] [Decline]
   │           │              │            │             │              │
   │           │              │            │             │  Click "Grant"
   │           │              │            │             ├─────────────>│
   │           │              │            │             │              │
   │           │              │ PATCH /api/password/approve            │
   │           │              │<───────────┼─────────────┼──────────────┤
   │           │              │            │             │              │
   │           │              │ UPDATE notifications     │              │
   │           │              ├───────────>│             │              │
   │           │              │ status='granted'         │              │
   │           │              │            │             │              │
   │           │              │ Generate reset code      │              │
   │           │              │            │             │              │
   │           │              │ Send email to user       │              │
   │           │              │            │             │              │
   │           │              │ Emit notification:update │              │
   │           │              ├────────────┼────────────>│              │
   │           │              │            │             │              │
   │           │              │            │             │ To User      │
   │           │              │            │             ├─────────────>│
   │ Notification: "Approved" │            │             │              │
   │<─────────┼───────────────┼────────────┼─────────────┤              │
   │           │              │            │             │              │
   │ Enter reset code         │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │ New password             │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │           │ POST /api/password/reset │             │              │
   │           ├─────────────>│            │             │              │
   │           │              │            │             │              │
   │           │              │ UPDATE users             │              │
   │           │              ├───────────>│             │              │
   │           │              │ password_hash            │              │
   │           │              │            │             │              │
   │           │ 200 OK       │            │             │              │
   │           │<─────────────┤            │             │              │
   │           │              │            │             │              │
   │ "Password changed!"      │            │             │              │
   │<──────────┤              │            │             │              │
   │           │              │            │             │              │
```

---

## 2️⃣ MIRROR LOGIN FLOW (Manual & QR)

```
┌──────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐
│ User │  │ Mirror   │  │ Backend │  │ Database │  │ WebSocket│  │ Admin UI  │
│      │  │ Frontend │  │         │  │          │  │          │  │           │
└──┬───┘  └────┬─────┘  └────┬────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘
   │           │              │            │             │              │
   │ Open Mirror Login Page   │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │ Choose: Manual OR QR     │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │ ┌─────────────────────────────────────────────────┐ │              │
   │ │ MANUAL LOGIN PATH                               │ │              │
   │ └─────────────────────────────────────────────────┘ │              │
   │           │              │            │             │              │
   │ Enter ID + Password      │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │ Click "Login"            │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │           │ POST /api/mirror/login   │             │              │
   │           │ {user_id, password, method: "manual"}  │              │
   │           ├─────────────>│            │             │              │
   │           │              │            │             │              │
   │           │              │ Authenticate            │              │
   │           │              │            │             │              │
   │           │              │ INSERT activity_log     │              │
   │           │              ├───────────>│             │              │
   │           │              │ event: "LIBRARY LOGIN"  │              │
   │           │              │            │             │              │
   │           │              │ INSERT library_sessions │              │
   │           │              ├───────────>│             │              │
   │           │              │ status: "inside_library"│              │
   │           │              │            │             │              │
   │           │              │ Emit notification:new   │              │
   │           │              ├────────────┼────────────>│              │
   │           │              │            │             │              │
   │           │              │            │             │ Broadcast    │
   │           │              │            │             ├─────────────>│
   │           │              │            │             │              │
   │           │              │            │             │  Bell +1     │
   │           │              │            │             │  "KC-00045   │
   │           │              │            │             │   logged in" │
   │           │              │            │             │              │
   │           │ 200 OK       │            │             │              │
   │           │ {session_id} │            │             │              │
   │           │<─────────────┤            │             │              │
   │           │              │            │             │              │
   │ Welcome toast            │            │             │              │
   │ "Welcome, John Santos!"  │            │             │              │
   │<──────────┤              │            │             │              │
   │           │              │            │             │              │
   │ Button changes:          │            │             │              │
   │ - Color: GREEN           │            │             │              │
   │ - Text: "Logout from Library"        │             │              │
   │<──────────┤              │            │             │              │
   │           │              │            │             │              │
   │ ┌─────────────────────────────────────────────────┐ │              │
   │ │ QR CODE LOGIN PATH                              │ │              │
   │ └─────────────────────────────────────────────────┘ │              │
   │           │              │            │             │              │
   │ Scan QR Code             │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │           │ POST /api/mirror/login   │             │              │
   │           │ {user_id, method: "qrcode", qr_token}  │              │
   │           ├─────────────>│            │             │              │
   │           │              │            │             │              │
   │           │              │ Verify QR token         │              │
   │           │              │            │             │              │
   │           │              │ (Same flow as manual)   │              │
   │           │              │            │             │              │
```

---

## 3️⃣ MIRROR LOGOUT WITH BOOK RETURN FLOW

```
┌──────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐
│ User │  │ Mirror   │  │ Backend │  │ Database │  │ WebSocket│  │ Admin UI  │
│      │  │ Frontend │  │         │  │          │  │          │  │           │
└──┬───┘  └────┬─────┘  └────┬────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘
   │           │              │            │             │              │
   │ Click "Logout from Library" (GREEN)  │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │           │ GET /api/mirror/check-borrowed         │              │
   │           │ ?user_id=KC-00045        │             │              │
   │           ├─────────────>│            │             │              │
   │           │              │            │             │              │
   │           │              │ SELECT FROM borrow_records             │
   │           │              ├───────────>│             │              │
   │           │              │ WHERE user_id AND status='borrowed'    │
   │           │              │            │             │              │
   │           │ 200 OK       │            │             │              │
   │           │ {has_borrowed: true,     │             │              │
   │           │  borrowed_books: [...]}  │             │              │
   │           │<─────────────┤            │             │              │
   │           │              │            │             │              │
   │ Prompt:                  │            │             │              │
   │ "Please scan borrowed    │            │             │              │
   │  book QR to return"      │            │             │              │
   │<──────────┤              │            │             │              │
   │           │              │            │             │              │
   │ Scan book QR code        │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │           │ POST /api/book/return    │             │              │
   │           │ {user_id, book_id, method: "qrcode"}   │              │
   │           ├─────────────>│            │             │              │
   │           │              │            │             │              │
   │           │              │ UPDATE borrow_records   │              │
   │           │              ├───────────>│             │              │
   │           │              │ status='returned'       │              │
   │           │              │ returned_at=NOW()       │              │
   │           │              │            │             │              │
   │           │              │ INSERT activity_log     │              │
   │           │              ├───────────>│             │              │
   │           │              │ event: "BOOK RETURN"    │              │
   │           │              │            │             │              │
   │           │              │ UPDATE library_sessions │              │
   │           │              ├───────────>│             │              │
   │           │              │ status='logged_out'     │              │
   │           │              │ logout_time=NOW()       │              │
   │           │              │            │             │              │
   │           │              │ Emit notification:new   │              │
   │           │              ├────────────┼────────────>│              │
   │           │              │ "Book returned by KC-00045"            │
   │           │              │            │             │              │
   │           │              │            │             │ Broadcast    │
   │           │              │            │             ├─────────────>│
   │           │              │            │             │              │
   │           │              │            │             │  Bell +1     │
   │           │              │            │             │  "KC-00045   │
   │           │              │            │             │   returned   │
   │           │              │            │             │   book"      │
   │           │              │            │             │              │
   │           │ 200 OK       │            │             │              │
   │           │<─────────────┤            │             │              │
   │           │              │            │             │              │
   │ Success message:         │            │             │              │
   │ "Book return successful. │            │             │              │
   │  You are now logged out."│            │             │              │
   │<──────────┤              │            │             │              │
   │           │              │            │             │              │
   │ Button changes:          │            │             │              │
   │ - Color: PALE/DISABLED   │            │             │              │
   │ - Text: "Login to Library"           │             │              │
   │<──────────┤              │            │             │              │
   │           │              │            │             │              │
   │ ┌─────────────────────────────────────────────────┐ │              │
   │ │ ALTERNATIVE: No Borrowed Books                  │ │              │
   │ └─────────────────────────────────────────────────┘ │              │
   │           │              │            │             │              │
   │ If has_borrowed: false   │            │             │              │
   │ → Direct logout          │            │             │              │
   │           │              │            │             │              │
   │ ┌─────────────────────────────────────────────────┐ │              │
   │ │ ALTERNATIVE: Reservation Not Borrowed           │ │              │
   │ └─────────────────────────────────────────────────┘ │              │
   │           │              │            │             │              │
   │ Prompt: "Cancel reservation and logout?"          │              │
   │<──────────┤              │            │             │              │
   │           │              │            │             │              │
   │ Click "Yes"              │            │             │              │
   ├──────────>│              │            │             │              │
   │           │              │            │             │              │
   │           │ POST /api/reservation/cancel           │              │
   │           ├─────────────>│            │             │              │
   │           │              │            │             │              │
   │           │              │ UPDATE reservations     │              │
   │           │              ├───────────>│             │              │
   │           │              │ status='cancelled'      │              │
   │           │              │            │             │              │
   │           │              │ Emit notification:new   │              │
   │           │              ├────────────┼────────────>│              │
   │           │              │ "Reservation cancelled" │              │
   │           │              │            │             │              │
```

---

## 4️⃣ AUTO LOGOUT WARNING (5 PM)

```
┌──────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────┐
│ Cron Job │  │ Backend │  │ Database │  │ WebSocket│  │ Admin UI  │  │ User │
└────┬─────┘  └────┬────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──┬───┘
     │             │            │             │              │            │
     │ 5:00 PM     │            │             │              │            │
     │ Trigger     │            │             │              │            │
     ├────────────>│            │             │              │            │
     │             │            │             │              │            │
     │             │ SELECT FROM library_sessions            │            │
     │             │ WHERE status='inside_library'           │            │
     │             │ AND login_time < (NOW() - 8 hours)      │            │
     │             ├───────────>│             │              │            │
     │             │            │             │              │            │
     │             │ Results:   │             │              │            │
     │             │ [KC-00045, KC-00123]     │              │            │
     │             │<───────────┤             │              │            │
     │             │            │             │              │            │
     │             │ FOR EACH user:          │              │            │
     │             │            │             │              │            │
     │             │ Generate AI warning     │              │            │
     │             │ (Jose AI - unique msg)  │              │            │
     │             │            │             │              │            │
     │             │ INSERT notifications    │              │            │
     │             ├───────────>│             │              │            │
     │             │ target: ALL_ADMINS      │              │            │
     │             │ type: 'security'        │              │            │
     │             │            │             │              │            │
     │             │ INSERT notifications    │              │            │
     │             ├───────────>│             │              │            │
     │             │ target: KC-00045        │              │            │
     │             │ type: 'warning'         │              │            │
     │             │            │             │              │            │
     │             │ Emit notification:new   │              │            │
     │             ├────────────┼────────────>│              │            │
     │             │            │             │              │            │
     │             │            │             │ To Admins    │            │
     │             │            │             ├─────────────>│            │
     │             │            │             │              │            │
     │             │            │             │  Bell +1     │            │
     │             │            │             │  "KC-00045   │            │
     │             │            │             │   still in   │            │
     │             │            │             │   library"   │            │
     │             │            │             │              │            │
     │             │            │             │ To User      │            │
     │             │            │             ├──────────────┼───────────>│
     │             │            │             │              │            │
     │             │            │             │              │  Notification
     │             │            │             │              │  "Please   │
     │             │            │             │              │   logout"  │
     │             │            │             │              │            │
```

---

## 📊 LEGEND

```
┌──────┐
│Actor │  = System component or user
└──────┘

   │      = Lifeline (component is active)
   
   ├───>  = Synchronous message (request)
   
   <───┤  = Response
   
   ┌───┐
   │Box│  = Note or alternative flow
   └───┘
```

---

## 🎯 KEY TAKEAWAYS

### Password Reset Flow
1. User submits request → Backend stores → WebSocket notifies all admins
2. Admin clicks notification → Overlay opens → Grant/Decline
3. Backend processes → Notifies user → User resets password

### Mirror Login Flow
1. User enters credentials (manual or QR) → Backend authenticates
2. Backend creates session → Stores in database → Notifies admins
3. Frontend updates button to green "Logout from Library"

### Mirror Logout Flow
1. User clicks logout → Backend checks borrowed books
2. If borrowed: Prompt to scan book QR → Return book → Logout
3. If reservation: Prompt to cancel → Cancel → Logout
4. Backend updates session → Notifies admins

### Auto Logout Warning
1. Cron job runs at 5 PM → Checks active sessions
2. Generates AI warnings → Notifies admins + users
3. Security alert for compliance

---

## ✅ IMPLEMENTATION NOTES

**All flows use:**
- RESTful API endpoints
- WebSocket for real-time updates
- Database persistence
- Jose AI for unique messages
- Notification bell for admins
- Activity log for audit trail

**Responsive design ensures:**
- Mobile, tablet, desktop compatibility
- Vertical scrollbar for long lists
- Dynamic button states
- Real-time badge updates

**System is production-ready! 🎉**
