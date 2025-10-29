# JRMSU AI Library System - Detailed Component Inventory

**Generated:** October 29, 2025  
**Purpose:** Complete inventory of all components, services, and utilities

---

## MAIN SYSTEM COMPONENTS (jrmsu-wise-library-main)

### UI Components Library (src/components/ui/)

**Total Count:** 50+ shadcn/ui components

#### Form & Input Components
1. **accordion.tsx** - Collapsible content sections
2. **alert-dialog.tsx** - Modal confirmation dialogs
3. **aspect-ratio.tsx** - Maintain aspect ratios
4. **avatar.tsx** - User profile images
5. **button.tsx** - Interactive buttons
6. **calendar.tsx** - Date picker calendar
7. **card.tsx** - Content containers
8. **checkbox.tsx** - Checkbox inputs
9. **collapsible.tsx** - Expandable sections
10. **command.tsx** - Command palette
11. **dialog.tsx** - Modal dialogs
12. **dropdown-menu.tsx** - Dropdown menus
13. **form.tsx** - Form wrapper
14. **input.tsx** - Text inputs
15. **input-otp.tsx** - OTP input fields
16. **label.tsx** - Form labels
17. **radio-group.tsx** - Radio button groups
18. **select.tsx** - Select dropdowns
19. **slider.tsx** - Range sliders
20. **switch.tsx** - Toggle switches
21. **textarea.tsx** - Multi-line text inputs

#### Navigation Components
22. **breadcrumb.tsx** - Breadcrumb navigation
23. **context-menu.tsx** - Right-click menus
24. **menubar.tsx** - Menu bar
25. **navigation-menu.tsx** - Navigation menus
26. **pagination.tsx** - Page navigation
27. **tabs.tsx** - Tabbed interfaces

#### Feedback Components
28. **alert.tsx** - Alert messages
29. **badge.tsx** - Status badges
30. **progress.tsx** - Progress bars
31. **skeleton.tsx** - Loading skeletons
32. **sonner.tsx** - Toast notifications
33. **toast.tsx** - Toast system
34. **toaster.tsx** - Toast container
35. **tooltip.tsx** - Hover tooltips

#### Layout Components
36. **carousel.tsx** - Image carousels
37. **drawer.tsx** - Side drawers
38. **hover-card.tsx** - Hover cards
39. **popover.tsx** - Popover menus
40. **resizable.tsx** - Resizable panels
41. **scroll-area.tsx** - Scrollable areas
42. **separator.tsx** - Visual separators
43. **sheet.tsx** - Side sheets
44. **sidebar.tsx** - Sidebar component

#### Data Display Components
45. **chart.tsx** - Chart components
46. **table.tsx** - Data tables

#### Utility Components
47. **toggle.tsx** - Toggle buttons
48. **toggle-group.tsx** - Toggle button groups
49. **ai-assistant.tsx** - AI assistant widget

---

## MIRROR SYSTEM COMPONENTS (mirror-login-page)

### UI Components Library (src/components/ui/)

**Total Count:** 50+ shadcn/ui components (same as main system)

All components from main system are available in mirror system.

### Custom Components (src/components/)

#### Authentication Components
1. **auth/ForgotPasswordOverlay.tsx**
   - Password reset overlay
   - Email verification
   - Code input
   - New password form

#### QR Components
2. **qr/QRCodeDisplay.tsx**
   - Display QR codes
   - Download QR functionality
   - Regenerate QR codes

3. **qr/QRScanner.tsx**
   - Camera-based QR scanning
   - html5-qrcode integration
   - Real-time scanning feedback

4. **qr/StableQRCode.tsx**
   - Stable QR code rendering
   - Prevents flickering
   - Optimized performance

---

## SERVICE LAYER INVENTORY

### Main System Services (src/services/)

#### Authentication & Security Services
1. **authReset.ts**
   - Password reset logic
   - Email verification
   - Token management
   - Reset code validation

#### User Management Services
2. **adminApi.ts**
   - Admin CRUD operations
   - Admin profile updates
   - Admin search/filter
   - Admin status management

3. **studentApi.ts**
   - Student CRUD operations
   - Student profile updates
   - Student search/filter
   - Student status management

#### Book Management Services
4. **books.ts**
   - Book CRUD operations
   - Book search/filter
   - Book availability check
   - Book categorization

5. **borrow.ts**
   - Borrowing operations
   - Return operations
   - Borrow history
   - Overdue tracking

6. **reservations.ts**
   - Book reservation
   - Reservation cancellation
   - Reservation status
   - Reservation queue

7. **borrowingRules.ts**
   - Borrowing limits
   - Duration rules
   - Fine calculations
   - Eligibility checks

#### Notification Services
8. **notifications.ts**
   - User notifications
   - Notification preferences
   - Mark as read/unread
   - Notification history

9. **notificationsApi.ts**
   - Notification API calls
   - Real-time updates
   - Notification delivery

10. **adminNotifications.ts**
    - Admin-specific notifications
    - System alerts
    - User action notifications
    - Broadcast messages

11. **aiNotificationService.ts**
    - AI-generated notifications
    - Smart notification timing
    - Personalized messages
    - Emotion-aware notifications

#### AI Services
12. **aiService.ts**
    - AI chat functionality
    - Query processing
    - Response generation
    - Context management

13. **aiSearchService.ts**
    - AI-powered search
    - Semantic search
    - Search suggestions
    - Result ranking

#### Data & Analytics Services
14. **activity.ts**
    - Activity logging
    - User activity tracking
    - System events
    - Audit trail

15. **stats.ts**
    - Statistics generation
    - Dashboard metrics
    - Usage analytics
    - Trend analysis

16. **reports.ts**
    - Report generation
    - Export functionality
    - Custom reports
    - Scheduled reports

#### Utility Services
17. **database.ts**
    - Database utilities
    - Query helpers
    - Connection management
    - Error handling

18. **pythonApi.ts**
    - Python backend integration
    - API call wrappers
    - Error handling
    - Response parsing

19. **address.ts**
    - Address validation
    - Region/Province/Municipality data
    - Zip code lookup
    - Address formatting

20. **preferences.ts**
    - User preferences
    - System settings
    - Theme management
    - Language settings

#### QR & Security Services
21. **qr.ts**
    - QR code utilities
    - QR validation
    - QR data extraction

22. **qrcode.ts**
    - QR code generation
    - QR customization
    - Logo embedding
    - Error correction

---

## PYTHON BACKEND MODULES

### Main Backend (python-backend/)

#### Core Modules
1. **app.py** (1,485 lines)
   - Main Flask application
   - Route definitions
   - Middleware setup
   - Error handlers
   - Email service
   - Socket.IO integration
   - Activity logging
   - Password reset flow

2. **app_mysql.py**
   - MySQL-specific implementation
   - Database connection
   - Query execution

3. **db.py**
   - Database utilities
   - StudentDB class
   - AdminDB class
   - Query helpers

#### Feature Modules
4. **mirror_login_api.py** (475 lines)
   - Library access endpoints
   - User status checking
   - Reserved book pickup
   - Book return workflow
   - Reservation cancellation
   - Return time activation
   - Forgotten logout checks
   - Admin notifications

5. **twofa.py**
   - TOTP generation
   - TOTP verification
   - Secret key generation
   - QR code URI generation

6. **qr_detector.py**
   - QR code detection
   - Image processing
   - Barcode scanning
   - Data extraction

---

## DATABASE SCHEMA DETAILS

### Admin Schema (admin_registration_schema.sql)

**Tables:**
1. **admins** - Main admin table
2. **admin_activity_log** - Admin activity tracking
3. **admin_sessions** - Login sessions
4. **admin_2fa_backup_codes** - 2FA backup codes

**Indexes:**
- idx_admin_email
- idx_admin_position
- idx_admin_status
- idx_admin_created

**Triggers:**
- update_admin_timestamp
- log_admin_changes

### Student Schema (student_registration_schema.sql)

**Tables:**
1. **students** - Main student table
2. **student_activity_log** - Student activity tracking
3. **student_sessions** - Login sessions
4. **student_2fa_backup_codes** - 2FA backup codes

**Indexes:**
- idx_student_email
- idx_student_department
- idx_student_year_level
- idx_student_status
- idx_student_created

**Triggers:**
- update_student_timestamp
- log_student_changes

### QR Login Schema (qr_login_schema.sql)

**Tables:**
1. **qr_login_attempts** - QR login tracking
2. **qr_codes** - Generated QR codes
3. **qr_scan_log** - QR scan history

### AI Chat Schema (ai_chat_schema.sql)

**Tables:**
1. **ai_logs** - AI chat logs
2. **ai_conversations** - Conversation threads
3. **ai_feedback** - User feedback on AI responses

**Fields in ai_logs:**
- user_id
- message
- ai_response
- emotion_detected
- timestamp

---

## UTILITY FILES & HELPERS

### Main System Utilities

1. **src/lib/utils.ts**
   - cn() - Class name merger
   - Tailwind utilities
   - Common helpers

2. **src/vite-env.d.ts**
   - TypeScript definitions
   - Environment types

### Mirror System Utilities

1. **src/utils/totp.ts**
   - TOTP generation
   - TOTP verification
   - Time-based validation

2. **src/lib/utils.ts**
   - Same as main system

---

## CONFIGURATION FILES

### Main System Configuration

1. **vite.config.ts**
   - Vite build configuration
   - Plugin setup
   - Path aliases
   - Server settings

2. **tsconfig.json**
   - TypeScript compiler options
   - Module resolution
   - Path mappings

3. **tsconfig.app.json**
   - App-specific TS config
   - Include/exclude patterns

4. **tsconfig.node.json**
   - Node-specific TS config
   - Server-side types

5. **tailwind.config.ts**
   - Tailwind CSS configuration
   - Theme customization
   - Plugin setup
   - Color schemes

6. **postcss.config.js**
   - PostCSS plugins
   - Autoprefixer
   - Tailwind integration

7. **components.json**
   - shadcn/ui configuration
   - Component paths
   - Style preferences

8. **eslint.config.js**
   - ESLint rules
   - Code style enforcement

### Mirror System Configuration

Same configuration files as main system with adjusted paths.

---

## ASSET INVENTORY

### Main System Assets (src/assets/)

1. **JRMSU-KCL-removebg-preview.png**
   - Admin system logo
   - Used in QR codes
   - Used in profile pages

2. **JRMSU-KCS-removebg-preview.png**
   - Student system logo
   - Used in QR codes
   - Used in profile pages

3. **JRMSU-LIBRARY-removebg-preview.png**
   - General library logo
   - Used in headers
   - Used in documents

4. **jrmsu-logo.jpg**
   - Main JRMSU logo
   - Used in login pages
   - Used in headers

### Mirror System Assets (src/assets/)

1. **jrmsu-logo.jpg**
   - Same as main system

---

## DOCUMENTATION INVENTORY

### Root Documentation
1. COMPLETE_IMPLEMENTATION_SUMMARY.md
2. DEEP_CHECK_ANALYSIS_REPORT.md
3. MIRROR_LOGIN_INTEGRATION_CHECKLIST.md
4. QUICKSTART_MIRROR_LOGIN.md
5. STUDENT_REGISTRATION_BACKEND_IMPLEMENTATION.md

### Main System Documentation
1. ADMIN_NOTIFICATIONS_COMPLETE_GUIDE.md
2. FORGOT_PASSWORD_IMPLEMENTATION.md
3. OLLAMA_PORT_11434_GUIDE.md
4. README.md

### Mirror System Documentation
1. ALL_FIXED_SUMMARY.md
2. ANSWERS_AND_NEXT_STEPS.md
3. BACKEND_ENDPOINTS_NEEDED.md
4. CLEANUP_PLAN.md
5. COLOR_AND_LOGIN_FIX.md
6. COMPREHENSIVE_IMPLEMENTATION_PLAN.md
7. DATABASE_SYNC_CONFIRMATION.md
8. FINAL_STATUS.md
9. FIX_ERRORS_GUIDE.md
10. IMPLEMENTATION_SUMMARY.md
11. MANUAL_CLEANUP_GUIDE.md
12. QUICK_FIX.md
13. SETUP_INSTRUCTIONS.md
14. SUCCESS_ALL_FIXED.md

---

## SCRIPT INVENTORY

### PowerShell Scripts

1. **Start-JRMSU-All.ps1**
   - Start all services
   - Main system
   - Mirror system
   - Python backend
   - AI server

2. **Start-Ollama-11434.ps1**
   - Start Ollama server
   - Port 11434
   - LLaMA 3 model

3. **cleanup.ps1** (Mirror)
   - Clean build files
   - Remove node_modules
   - Reset environment

### Batch Scripts

1. **install.bat** (Backend)
   - Install Python dependencies
   - Setup virtual environment

2. **copy-logo.bat** (Mirror)
   - Copy logo files
   - Setup assets

3. **STOP_PORT_8081.bat** (Mirror)
   - Stop development server
   - Kill port 8081 process

---

## PYTHON SCRIPTS

### Data Management Scripts

1. **add_ilocos_municipalities.py**
   - Add Ilocos region data
   - Municipality updates

2. **analyze_municipalities.py**
   - Analyze geographic data
   - Data validation

3. **cleanup_duplicates.py**
   - Remove duplicate entries
   - Data cleaning

4. **create_clean_geographic_data.py**
   - Generate clean data
   - Format standardization

5. **create_standardized_regions.py**
   - Standardize region data
   - Consistent naming

6. **update_region1_data.py**
   - Update Region 1 data
   - Ilocos region

7. **update_region2_data.py**
   - Update Region 2 data
   - Cagayan Valley

8. **validate_ilocos_additions.py**
   - Validate new data
   - Error checking

---

## TEST FILES

### Main System Tests

1. **tests/aiService.test.ts**
   - AI service unit tests
   - Mock responses
   - Error handling tests

2. **qr_system_accuracy_test.html**
   - QR system testing
   - Accuracy validation
   - Performance testing

3. **qr_debug_test.html**
   - QR debugging
   - Visual testing
   - Error diagnosis

---

## DATA FILES

### Geographic Data

1. **Barangay List.xlsx** (968 KB)
   - Complete barangay list
   - All regions

2. **Region and Province.xlsx** (19 KB)
   - Region data
   - Province mapping

3. **MetroManilaZipCodes.xlsx** (27 KB)
   - Metro Manila zip codes
   - City mapping

4. **provinceZip.xlsx** (56 KB)
   - Province zip codes
   - Complete mapping

### Text Data Files

1. **philippine geography/Region Province CityMunicipality Zipcode.txt**
   - Complete geographic data
   - Text format

2. **philippine geography/Barangay list.txt**
   - Barangay data
   - Text format

---

## BUILD & DISTRIBUTION

### Main System Build

**Output Directory:** dist/
- index.html
- assets/ (JS, CSS bundles)
- favicon.ico
- robots.txt
- placeholder.svg

### Mirror System Build

**Output Directory:** dist/
- Similar structure to main system
- Optimized for kiosk deployment

---

## TOTAL COMPONENT COUNT

### Frontend Components
- **UI Components:** 50+ (shadcn/ui)
- **Custom Components:** 15+ (main system)
- **Custom Components:** 4 (mirror system)
- **Pages:** 21 (main) + 1 (mirror)

### Backend Modules
- **Python Files:** 11
- **Service Files:** 22 (TypeScript)

### Database Objects
- **Tables:** 10+
- **Indexes:** 20+
- **Triggers:** 4+

### Configuration Files
- **TypeScript Configs:** 3 per system
- **Build Configs:** 2 per system
- **Style Configs:** 2 per system

### Documentation Files
- **Root:** 5 files
- **Main System:** 4 files
- **Mirror System:** 14 files

### Scripts
- **PowerShell:** 3 files
- **Batch:** 3 files
- **Python Data Scripts:** 8 files

### Total Estimated Files: **300+ files**
### Total Estimated Lines of Code: **25,000+ lines**

---

## COMPONENT DEPENDENCIES

### Critical Dependencies
1. React ecosystem (React, React DOM, React Router)
2. Radix UI primitives (50+ components)
3. Flask ecosystem (Flask, Flask-CORS, Flask-SocketIO)
4. MySQL connector
5. QR code libraries (html5-qrcode, qrcode.react, pyzbar)
6. Authentication libraries (bcrypt, pyotp, otplib)
7. AI integration (Ollama, LLaMA 3)

### Development Dependencies
1. TypeScript compiler
2. Vite bundler
3. ESLint
4. Vitest
5. Tailwind CSS
6. PostCSS

---

## MAINTENANCE NOTES

### Regular Updates Required
- Node packages (monthly)
- Python packages (monthly)
- Security patches (as needed)
- Database schema migrations (as needed)

### Backup Requirements
- Database (daily)
- User uploads (daily)
- Configuration files (weekly)
- Documentation (on changes)

---

## CONCLUSION

This inventory provides a complete overview of all components, services, utilities, and files in the JRMSU AI Library System. The system is well-organized with clear separation of concerns and comprehensive documentation.
