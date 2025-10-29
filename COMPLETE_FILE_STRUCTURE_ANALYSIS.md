# JRMSU AI Library System - Complete File Structure Analysis

**Generated:** October 29, 2025  
**System Version:** Phase 2  
**Analysis Date:** Complete system audit

---

## System Overview

The JRMSU AI Library System consists of **three main components**:

1. **Root System** - Project documentation and configuration
2. **Main System** (`jrmsu-wise-library-main`) - Primary library management application
3. **Mirror Login Page** (`mirror-login-page`) - Library entry/exit kiosk system

---

## ROOT SYSTEM STRUCTURE

**Location:** `C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system`

### Root Files

- Barangay List.xlsx (968 KB)
- COMPLETE_IMPLEMENTATION_SUMMARY.md (14 KB)
- DEEP_CHECK_ANALYSIS_REPORT.md (17 KB)
- Design and command.txt (4 KB)
- First Admin Info.txt (783 bytes)
- JRMSU AI-Library System.txt (13 KB)
- MIRROR_LOGIN_INTEGRATION_CHECKLIST.md (13 KB)
- MetroManilaZipCodes.xlsx (27 KB)
- QUICKSTART_MIRROR_LOGIN.md (12 KB)
- Region and Province.xlsx (19 KB)
- STUDENT_REGISTRATION_BACKEND_IMPLEMENTATION.md (19 KB)
- provinceZip.xlsx (56 KB)

### Root Directories

- ai_server/ - AI chat server with LLaMA 3 integration
- jrmsu-wise-library-main/ - Main System
- mirror-login-page/ - Mirror System
- python-backend/ - Backend API

---

## MAIN SYSTEM: jrmsu-wise-library-main

**Location:** `jrmsu-ai-lib-system\jrmsu-wise-library-main`  
**Port:** 8080  
**Framework:** React + Vite + TypeScript  
**UI Library:** shadcn/ui + Radix UI  
**Backend:** Python Flask (Port 5000)

### Package Configuration

**package.json:**
- Name: vite_react_shadcn_ts
- Type: module
- Scripts: dev, build, preview, test

**Key Dependencies:**
- React 18.3.1
- React Router DOM 6.30.1
- Radix UI components (complete suite)
- TanStack React Query 5.83.0
- Supabase JS 2.75.0
- Socket.IO Client 4.8.1
- html5-qrcode 2.3.8
- qrcode.react 4.2.0
- otplib 12.0.1 (2FA)
- jsPDF 3.0.3
- Recharts 2.15.4
- Zod 3.25.76
- Lucide React 0.462.0

### Source Structure (src/)

#### Pages (src/pages/)
- AdminManagement.tsx - Admin user management
- AppAdminQRs.tsx - QR code management for admins
- BookManagement.tsx - Book CRUD operations
- Books.tsx - Book catalog/search
- Dashboard.tsx - Main dashboard
- EnhancedProfile.tsx - Enhanced profile view
- ForgotPassword.tsx - Password reset flow
- History.tsx - Activity history
- Index.tsx - Landing page
- Login.tsx - Main login page
- NotFound.tsx - 404 page
- Profile.tsx - User profile
- Registration.tsx - Registration wrapper
- RegistrationInstitution.tsx - Phase 3 (Institution info)
- RegistrationPersonal.tsx - Phase 2 (Personal info)
- RegistrationSecurity.tsx - Phase 4 (Security setup)
- RegistrationSelect.tsx - Phase 1 (Account type)
- Reports.tsx - System reports
- SecurityDemo.tsx - Security testing
- Settings.tsx - User settings
- StudentManagement.tsx - Student user management

#### Components (src/components/)

**Layout Components:**
- Layout/AIAssistant.tsx - AI chat assistant
- Layout/Navbar.tsx - Top navigation
- Layout/Sidebar.tsx - Side navigation
- Layout/layout-example.tsx - Layout template
- Layout/navigation-bar.tsx - Navigation component

**Authentication Components:**
- auth/ForgotPasswordOverlay.tsx - Password reset overlay
- auth/QRCodeLogin.tsx - QR code login
- auth/TwoFASetup.tsx - 2FA configuration
- auth/WelcomeMessage.tsx - Welcome screen

**Notification Components:**
- notifications/AdminActionOverlay.tsx - Admin action notifications
- notifications/NotificationPanel.tsx - Notification center

**Common Components:**
- common/ErrorBoundary.tsx - Error handling

**UI Components** (src/components/ui/) - 50+ shadcn/ui components

#### Services (src/services/)
- activity.ts - Activity logging
- address.ts - Address/location services
- adminApi.ts - Admin API calls
- adminNotifications.ts - Admin notification system
- aiNotificationService.ts - AI-powered notifications
- aiSearchService.ts - AI search functionality
- aiService.ts - AI assistant service
- authReset.ts - Password reset logic
- books.ts - Book management API
- borrow.ts - Borrowing operations
- borrowingRules.ts - Borrowing rules engine
- database.ts - Database utilities
- notifications.ts - Notification service
- notificationsApi.ts - Notification API
- preferences.ts - User preferences
- pythonApi.ts - Python backend API
- qr.ts - QR code utilities
- qrcode.ts - QR code generation
- reports.ts - Report generation
- reservations.ts - Book reservations
- stats.ts - Statistics service
- studentApi.ts - Student API calls

#### Assets (src/assets/)
- JRMSU-KCL-removebg-preview.png - Admin logo
- JRMSU-KCS-removebg-preview.png - Student logo
- JRMSU-LIBRARY-removebg-preview.png - Library logo
- jrmsu-logo.jpg - Main logo

### Python Backend (python-backend/)

**Backend Files:**
- app.py (1,485 lines) - Main Flask application
- app_mysql.py - MySQL version
- db.py - Database connection utilities
- mirror_login_api.py (475 lines) - Mirror login endpoints
- qr_detector.py - QR code detection
- twofa.py - 2FA implementation
- data.json - Development data store
- requirements.txt - Python dependencies
- install.bat - Installation script

**Python Dependencies (requirements.txt):**
- opencv-python==4.10.0.84
- pyzbar==0.1.9
- numpy==1.26.4
- Pillow==10.0.1
- pyotp==2.9.0
- qrcode==7.4.2
- Flask==3.0.3
- Flask-Limiter==3.8.0
- bleach==6.1.0
- requests==2.32.3
- Flask-SocketIO==5.3.6
- eventlet==0.35.2
- Flask-Cors==4.0.0
- mysql-connector-python==8.2.0
- bcrypt==4.1.2
- python-dotenv==1.0.0

### Database Schemas (database/)

**Schema Files:**
- admin_registration_schema.sql (385 lines)
- student_registration_schema.sql (452 lines)
- ai_chat_schema.sql
- qr_login_schema.sql

**Admin Table Structure:**
- Primary ID: admin_id (KCL-00001 format)
- Personal: first_name, middle_name, last_name, suffix, age, birthdate, gender
- Contact: email, phone
- Position: position/role
- Permanent Address: street, barangay, municipality, province, region, zip_code
- Current Address: current_street, current_barangay, etc.
- Security: password_hash, two_factor_enabled, two_factor_secret
- QR: qr_code_data, qr_code_generated_at
- System: system_tag (JRMSU-KCL), account_status, created_at, updated_at

**Student Table Structure:**
- Primary ID: student_id (KC-23-A-00762 format)
- Personal: Same as admin
- Academic: department, course, year_level, block
- Current Address: current_address_* fields
- Permanent Address: permanent_address_* fields
- Security: Same as admin
- System: system_tag (JRMSU-KCS)

### Documentation Files

- ADMIN_NOTIFICATIONS_COMPLETE_GUIDE.md
- FORGOT_PASSWORD_IMPLEMENTATION.md
- OLLAMA_PORT_11434_GUIDE.md
- README.md

### Startup Scripts

- Start-JRMSU-All.ps1 - Start all services
- Start-Ollama-11434.ps1 - Start Ollama AI server

### Data Files

- data/ - Geographic data
- philippine geography/ - Philippine location data
- video/ - Video assets
- dist/ - Production build
- supabase/ - Supabase configuration

### Testing

- tests/aiService.test.ts
- qr_system_accuracy_test.html
- qr_debug_test.html

---

## MIRROR LOGIN PAGE SYSTEM

**Location:** `jrmsu-ai-lib-system\mirror-login-page`  
**Port:** 8081  
**Framework:** React + Vite + TypeScript  
**Purpose:** Library entry/exit kiosk interface

### Package Configuration

**package.json:**
- Name: jrmsu-mirror-login
- Version: 1.0.0
- Type: module

**Key Dependencies:**
- React 18.3.1
- React Router DOM 6.30.1
- html5-qrcode 2.3.8 (QR scanning)
- otplib 12.0.1 (TOTP)
- Radix UI (minimal set)
- Lucide React 0.462.0
- Zod 3.25.76

### Source Structure

#### Pages (src/pages/)
- LibraryEntry.tsx (394 lines) - Main entry/exit page

**Features:**
- Manual login (ID + Password)
- QR code login
- 2FA support
- Student/Admin role switching
- Forgot password integration

#### Components (src/components/)

**Authentication:**
- auth/ForgotPasswordOverlay.tsx

**QR Components:**
- qr/QRCodeDisplay.tsx - Display QR codes
- qr/QRScanner.tsx - Scan QR codes
- qr/StableQRCode.tsx - Stable QR rendering

**UI Components** (src/components/ui/) - 50+ shadcn/ui components (full set)

#### Utilities (src/utils/)
- totp.ts - TOTP verification utilities

#### Assets
- jrmsu-logo.jpg - JRMSU logo

### Documentation

- ALL_FIXED_SUMMARY.md
- ANSWERS_AND_NEXT_STEPS.md
- BACKEND_ENDPOINTS_NEEDED.md
- CLEANUP_PLAN.md
- COLOR_AND_LOGIN_FIX.md
- COMPREHENSIVE_IMPLEMENTATION_PLAN.md
- DATABASE_SYNC_CONFIRMATION.md
- FINAL_STATUS.md
- FIX_ERRORS_GUIDE.md
- IMPLEMENTATION_SUMMARY.md
- MANUAL_CLEANUP_GUIDE.md
- QUICK_FIX.md
- SETUP_INSTRUCTIONS.md
- SUCCESS_ALL_FIXED.md

### Utility Scripts

- cleanup.ps1 - Cleanup script
- copy-logo.bat - Copy logo files
- STOP_PORT_8081.bat - Stop development server

### Configuration Files

- vite.config.ts - Vite configuration
- tsconfig.json - TypeScript config
- tsconfig.node.json - Node TypeScript config
- tailwind.config.ts - Tailwind CSS config
- postcss.config.js - PostCSS config
- index.html - HTML entry point

---

## AI SERVER

**Location:** `jrmsu-ai-lib-system\ai_server`  
**Port:** 5000 (AI endpoints)  
**Framework:** Flask + LLaMA 3

### Files
- app.py (64 lines) - AI chat server with emotion detection

**Features:**
- LLaMA 3 integration via Ollama
- Sentiment analysis with TextBlob
- MySQL logging of AI interactions
- Emotion detection (positive/negative/neutral)

**Dependencies:**
- Flask
- mysql-connector-python
- textblob
- subprocess (for Ollama)

---

## KEY SYSTEM INTEGRATIONS

### Port Allocation
- **8080** - Main system frontend (jrmsu-wise-library-main)
- **8081** - Mirror login page
- **5000** - Python backend API
- **11434** - Ollama AI server

### Database Integration
- **MySQL** - Primary database
- Tables: admins, students, books, borrows, reservations, library_sessions
- Schemas defined in database/ folder

### API Endpoints

**Main Backend (Port 5000):**
- /api/auth/login - User authentication
- /api/auth/register - User registration
- /api/auth/reset-password - Password reset
- /api/library/* - Library operations
- /api/admin/* - Admin management
- /api/student/* - Student management
- /api/books/* - Book management
- /api/borrow/* - Borrowing operations
- /api/notifications/* - Notification system

**AI Server (Port 5000):**
- /ai/chat - AI chat interactions

### Authentication System
- **Manual Login** - ID + Password
- **QR Code Login** - Scan user QR code
- **2FA Support** - TOTP-based two-factor authentication
- **Password Reset** - Email-based reset with 6-digit code

### User Types
1. **Students** - ID format: KC-23-A-00762
   - System tag: JRMSU-KCS
   - Logo: JRMSU-KCS-removebg-preview.png
   
2. **Admins** - ID format: KCL-00001
   - System tag: JRMSU-KCL
   - Logo: JRMSU-KCL-removebg-preview.png

---

## TECHNOLOGY STACK SUMMARY

### Frontend
- **Framework:** React 18.3.1
- **Build Tool:** Vite 5.4.19
- **Language:** TypeScript 5.8.3
- **Styling:** Tailwind CSS 3.4.17
- **UI Components:** shadcn/ui + Radix UI
- **Icons:** Lucide React 0.462.0
- **Routing:** React Router DOM 6.30.1
- **State Management:** TanStack React Query 5.83.0
- **Forms:** React Hook Form 7.61.1 + Zod 3.25.76

### Backend
- **Framework:** Flask 3.0.3
- **Database:** MySQL 8.2.0
- **Authentication:** bcrypt 4.1.2
- **2FA:** pyotp 2.9.0
- **QR Codes:** qrcode 7.4.2, pyzbar 0.1.9
- **WebSockets:** Flask-SocketIO 5.3.6
- **AI:** Ollama (LLaMA 3)

### Development Tools
- **Linting:** ESLint 9.32.0
- **Testing:** Vitest 2.1.5
- **Package Manager:** npm/bun

---

## FILE COUNT SUMMARY

### Main System (jrmsu-wise-library-main)
- **Pages:** 21 files
- **Components:** 50+ UI components + custom components
- **Services:** 22 service files
- **Backend:** 11 Python files
- **Database Schemas:** 4 SQL files
- **Total Lines (Backend):** ~2,000+ lines

### Mirror Login Page
- **Pages:** 1 main page (394 lines)
- **Components:** 50+ UI components + 3 QR components
- **Documentation:** 14 markdown files
- **Total:** Minimal, focused system

### Root System
- **Documentation:** 11 files
- **Data Files:** 4 Excel files
- **AI Server:** 1 Python file (64 lines)

---

## DEPLOYMENT NOTES

### Prerequisites
1. Node.js (for frontend)
2. Python 3.x (for backend)
3. MySQL 8.x (for database)
4. Ollama (for AI features)

### Installation Steps
1. Install Python dependencies: `pip install -r requirements.txt`
2. Install Node dependencies: `npm install` (in both frontend folders)
3. Set up MySQL database using schema files
4. Configure environment variables
5. Start Ollama server on port 11434
6. Start Python backend on port 5000
7. Start main frontend on port 8080
8. Start mirror frontend on port 8081

### Environment Variables
- EMAIL_ENABLED - Enable email notifications
- SMTP_SERVER - Email server
- SENDER_EMAIL - Sender email address
- SENDER_PASSWORD - Email password
- ALLOWED_ORIGINS - CORS origins

---

## SYSTEM STATUS

### Completed Features
- User registration (Admin & Student)
- Login system (Manual & QR)
- 2FA authentication
- Password reset flow
- Profile management
- Book management
- Borrowing system
- Reservation system
- Admin notifications
- AI chat assistant
- QR code generation
- Address management (Current/Permanent)

### Pending Features (from memories)
- Mirror login workflows (Reserved book pickup, Book return, Cancel reservation, Logout with borrowed books, Forgotten logout at 5 PM)
- Library session tracking
- Return time activation
- Cron job for 5 PM logout checks

---

## CONCLUSION

The JRMSU AI Library System is a comprehensive library management solution with:
- **2 frontend applications** (Main + Mirror)
- **2 backend servers** (Flask API + AI Server)
- **Complete authentication system** (Manual, QR, 2FA)
- **Dual user types** (Students & Admins)
- **AI integration** (LLaMA 3 chat assistant)
- **Modern tech stack** (React, TypeScript, Flask, MySQL)
- **Production-ready features** (Error handling, validation, notifications)

Total estimated lines of code: **20,000+ lines** across all systems.
