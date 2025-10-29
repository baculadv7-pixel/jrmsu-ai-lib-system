# Mirror Login Page - Implementation Plan

## Overview
Create a complete mirror/copy of the main login system for **library entry/exit management** with additional book pickup/return workflows.

---

## Directory Structure

```
mirror-login-page/
├── src/
│   ├── pages/
│   │   └── LibraryEntry.tsx          # Main library entry page (mirrored from Login.tsx)
│   ├── components/
│   │   ├── auth/
│   │   │   ├── QRCodeLogin.tsx       # QR scanner (mirrored)
│   │   │   └── WelcomeMessage.tsx    # Welcome overlay (mirrored)
│   │   ├── library/
│   │   │   ├── BookPickupDialog.tsx  # "Do you have the book?" dialog
│   │   │   ├── BookScannerDialog.tsx # Book QR scanner
│   │   │   ├── BookReturnDialog.tsx  # Book return confirmation
│   │   │   └── LogoutBookScan.tsx    # Scan books before logout
│   │   └── ui/                       # Shadcn components (copied)
│   ├── context/
│   │   ├── AuthContext.tsx           # Auth context (mirrored)
│   │   └── LibrarySessionContext.tsx # Library session tracking
│   ├── services/
│   │   ├── database.ts               # Database service (mirrored)
│   │   ├── qr.ts                     # QR utilities (mirrored)
│   │   ├── libraryApi.ts             # Library-specific API calls
│   │   └── aiWarnings.ts             # AI-generated warning messages
│   ├── hooks/
│   │   └── use-toast.ts              # Toast notifications (mirrored)
│   ├── lib/
│   │   └── utils.ts                  # Utilities (mirrored)
│   ├── assets/
│   │   └── jrmsu-logo.jpg            # Logo (copied)
│   ├── App.tsx                       # Main app component
│   └── main.tsx                      # Entry point
├── public/
├── package.json                      # Dependencies (same as main)
├── vite.config.ts                    # Vite config (port 8081)
├── tailwind.config.ts                # Tailwind config (copied)
├── tsconfig.json                     # TypeScript config (copied)
└── index.html                        # HTML entry point
```

---

## Features to Implement

### 1. **Mirrored Login Features** (Same as Main)
- ✅ Manual login (ID + Password)
- ✅ QR code login
- ✅ 2FA authentication (if enabled)
- ✅ Student/Admin role switching
- ✅ ID validation (KC-23-A-00762, KCL-00001)
- ✅ Welcome message overlay
- ✅ Same UI/design components

### 2. **New Library Entry Features**

#### A. Reserved Book Pickup Flow
```
Login → Detect Reservation → "Do you have the book?" Dialog
  ├─ YES → Book QR Scanner → Mark as Borrowed → Notify Admins → Redirect to Login
  └─ NO → "Scan the book when you get it during logout" → OK → Redirect to Login
```

#### B. Book Return Flow
```
Login → Detect Borrowed Books → "Do you want to return the book?" Dialog
  └─ YES → Book QR Scanner → Mark as Returned → Notify Admins → User must logout
```

#### C. Logout with Borrowed Books
```
Logout Attempt → Detect Borrowed Books → "Scan your borrowed book QR codes to activate return time"
  └─ Scan Books → Activate Return Time → Auto Logout
```

#### D. Cancel Reservation During Checkout
```
At Book Scanner → "Cancel Borrow Book and Logout?" Button
  └─ CANCEL → Cancel Reservation → Notify Admins → Logout
```

#### E. Forgotten Logout (5 PM Auto-Check)
```
Cron Job (5 PM) → Check Active Sessions → Generate AI Warning
  ├─ Notify ALL Admins
  └─ Notify User (Student/Admin)
```

---

## Backend API Endpoints (to be added to python-backend/app.py)

### Library Session Management
```python
POST   /api/library/login              # Track library entry
POST   /api/library/logout             # Track library exit
GET    /api/library/user-status/:id    # Check user's library status
GET    /api/library/active-sessions    # List all active sessions
```

### Book Management
```python
GET    /api/library/user-reservations/:id    # Get user's reserved books
GET    /api/library/user-borrowed/:id        # Get user's borrowed books
POST   /api/library/borrow-book              # Mark book as borrowed
POST   /api/library/return-book              # Mark book as returned
POST   /api/library/cancel-reservation       # Cancel reservation
POST   /api/library/activate-return-time     # Activate return time on logout
```

### Notifications
```python
POST   /api/library/notify-admins            # Notify all admins
POST   /api/library/notify-user              # Notify specific user
GET    /api/library/forgotten-logouts        # Check for forgotten logouts (5 PM)
```

### AI Integration
```python
POST   /api/ai/generate-logout-warning       # Generate varied warning messages
```

---

## Database Schema Updates

### New Table: library_sessions
```sql
CREATE TABLE library_sessions (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  user_type ENUM('student', 'admin') NOT NULL,
  login_time DATETIME NOT NULL,
  logout_time DATETIME NULL,
  status ENUM('active', 'logged_out') DEFAULT 'active',
  has_borrowed_books BOOLEAN DEFAULT FALSE,
  has_reservations BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES students(student_id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_login_time (login_time)
);
```

### Update Table: borrow_records
```sql
ALTER TABLE borrow_records ADD COLUMN return_time_activated BOOLEAN DEFAULT FALSE;
ALTER TABLE borrow_records ADD COLUMN scan_time DATETIME NULL;
ALTER TABLE borrow_records ADD COLUMN scanned_at_logout BOOLEAN DEFAULT FALSE;
```

### Update Table: reservations
```sql
ALTER TABLE reservations ADD COLUMN cancelled_at DATETIME NULL;
ALTER TABLE reservations ADD COLUMN cancelled_by VARCHAR(50) NULL;
ALTER TABLE reservations ADD COLUMN cancellation_reason TEXT NULL;
```

---

## Technology Stack (Same as Main)

### Frontend
- **Framework:** React 18.3.1 + TypeScript
- **Build Tool:** Vite 5.4.19
- **UI Library:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS 3.4.17
- **QR Code:** html5-qrcode 2.3.8, qrcode.react 4.2.0
- **Routing:** react-router-dom 6.30.1
- **State:** React Context API
- **Icons:** lucide-react 0.462.0

### Backend
- **Framework:** Python Flask
- **Database:** MySQL
- **Authentication:** bcrypt, JWT
- **2FA:** pyotp (TOTP)
- **AI:** Ollama (LLaMA 3) on port 11434

### Ports
- **Mirror Frontend:** 8081 (different from main: 8080)
- **Backend API:** 5000 (shared with main)
- **AI Server:** 11434 (shared with main)

---

## Implementation Steps

### Phase 1: Setup & Mirror Core Files ✅
1. ✅ Create directory structure
2. ✅ Copy package.json and install dependencies
3. ✅ Copy configuration files (vite, tailwind, tsconfig)
4. ✅ Copy UI components from shadcn
5. ✅ Copy assets (logo, images)
6. ✅ Mirror Login.tsx → LibraryEntry.tsx
7. ✅ Mirror QRCodeLogin.tsx
8. ✅ Mirror WelcomeMessage.tsx
9. ✅ Mirror AuthContext.tsx
10. ✅ Mirror database.ts, qr.ts services

### Phase 2: Add Library-Specific Components
1. Create BookPickupDialog.tsx
2. Create BookScannerDialog.tsx
3. Create BookReturnDialog.tsx
4. Create LogoutBookScan.tsx
5. Create LibrarySessionContext.tsx
6. Create libraryApi.ts service
7. Create aiWarnings.ts service

### Phase 3: Backend Implementation
1. Add library session endpoints
2. Add book management endpoints
3. Add notification endpoints
4. Add AI warning generation
5. Create database migrations
6. Update existing tables

### Phase 4: Integration & Workflows
1. Implement reserved book pickup flow
2. Implement book return flow
3. Implement logout with borrowed books
4. Implement cancel reservation
5. Implement 5 PM forgotten logout check
6. Connect all admin notifications

### Phase 5: Testing & Deployment
1. Test manual login flow
2. Test QR code login flow
3. Test book pickup/return workflows
4. Test logout scenarios
5. Test 5 PM notification system
6. Update documentation

---

## UI/UX Design (Mirrored from Main)

### Color Scheme
- Primary: JRMSU Blue
- Secondary: JRMSU Gold
- Background: Gradient (from-background via-background to-primary/5)
- Cards: shadow-jrmsu

### Components
- Card with JRMSU logo header
- Student/Admin tabs (same as main)
- Manual Login / QR Code buttons
- ID and Password inputs with validation
- 2FA dialog (if enabled)
- Welcome message overlay
- Book-related dialogs (new)

### Styling Classes (Same as Main)
```css
.shadow-jrmsu
.shadow-jrmsu-gold
.bg-gradient-to-br from-background via-background to-primary/5
.text-primary
.text-muted-foreground
```

---

## Admin Notifications (ALL Admins Receive)

1. ✅ Library entry (user logged in)
2. ✅ Library exit (user logged out)
3. ✅ Book borrowed (reserved book picked up)
4. ✅ Book returned
5. ✅ Reservation cancelled during logout
6. ✅ Return time activated (book scanned at logout)
7. ✅ Forgotten logout warning (5 PM)
8. ✅ Password reset requests (existing)

---

## AI Warning Messages (5 PM Forgotten Logout)

### Prompt for AI (Jose)
```
Generate a polite but firm warning message for a library user who forgot to logout. 
The message should:
- Be unique each time (no repetition)
- Mention the user's name
- Remind them to logout before leaving
- Mention library closing time (5 PM)
- Be professional but friendly
- Vary in tone and wording
- Be 2-3 sentences long

User: {full_name}
User Type: {student/admin}
Login Time: {time}
```

### Example Variations
1. "Hi Juan! We noticed you're still logged in at the library. Please remember to logout before leaving. The library closes at 5 PM."
2. "Hello Maria! You forgot to logout from the library system. Kindly logout before you leave to help us track library usage accurately."
3. "Good afternoon Pedro! Your library session is still active. Please logout before leaving the premises. Thank you!"

---

## Security Considerations

1. ✅ Same authentication as main (bcrypt, JWT)
2. ✅ 2FA support (if enabled)
3. ✅ Session timeout (30 minutes)
4. ✅ QR code validation
5. ✅ Book QR code verification
6. ✅ Admin-only notifications
7. ✅ Audit trail for all library activities

---

## Next Steps

1. Start with Phase 1: Setup & Mirror Core Files
2. Copy all necessary files from main to mirror
3. Update port configuration (8081)
4. Test basic login functionality
5. Proceed to Phase 2: Library-specific features

---

**Status:** Ready to implement
**Estimated Time:** 4-6 hours for complete implementation
**Priority:** High
