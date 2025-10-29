# 🔧 Database Setup Fix - Missing Tables

## ❌ Problem

Backend is running but showing errors:
```
Database query error: 1146 (42S02): Table 'jrmsu_library.admins' doesn't exist
Database query error: 1146 (42S02): Table 'jrmsu_library.students' doesn't exist
Database query error: 1146 (42S02): Table 'jrmsu_library.reservations' doesn't exist
Database query error: 1146 (42S02): Table 'jrmsu_library.v_student_profiles' doesn't exist
```

## ✅ Solution

Run the database setup script to create all missing tables.

---

## 🚀 Quick Fix (Windows)

### Option 1: Using Batch Script

```bash
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\python-backend"

setup_database.bat
```

**Enter your MySQL root password when prompted.**

### Option 2: Manual MySQL Command

```bash
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\python-backend"

mysql -u root -p jrmsu_library < create_missing_tables.sql
```

**Enter your MySQL root password when prompted.**

---

## 📋 Tables Created

The script creates the following tables:

### 1. **admins**
- Stores admin user accounts
- Fields: admin_id, name, email, position, addresses, password, 2FA, QR code
- Sample admin: KCL-00001 (John Mark Santos)

### 2. **students**
- Stores student user accounts
- Fields: student_id, name, email, academic info, addresses, password, 2FA, QR code

### 3. **reservations**
- Stores book reservations
- Fields: reservation_id, user_id, book_id, status, timestamps
- Supports cancellation tracking

### 4. **library_sessions**
- Tracks library entry/exit
- Fields: session_id, user_id, login_time, logout_time, method (manual/QR), status

### 5. **borrow_records**
- Tracks book borrowing
- Fields: borrow_id, user_id, book_id, borrowed_at, due_date, returned_at, status

### 6. **v_student_profiles** (VIEW)
- Virtual view of active student profiles
- Used for quick queries

---

## 🧪 Verify Setup

After running the script, verify tables exist:

```sql
mysql -u root -p

USE jrmsu_library;

SHOW TABLES;
```

**Expected output:**
```
+---------------------------+
| Tables_in_jrmsu_library   |
+---------------------------+
| admins                    |
| borrow_records            |
| library_sessions          |
| notifications             |
| activity_log              |
| reservations              |
| students                  |
| v_student_profiles        |
+---------------------------+
```

---

## 🔄 Test Backend

After database setup, restart the backend:

```bash
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\python-backend"

.venv\Scripts\activate

python app.py
```

**Expected output:**
```
✅ Library endpoints registered
✅ Library endpoints loaded
🚀 Backend running at http://localhost:5000
```

**No more database errors!**

---

## 🔐 Sample Admin Account

The script creates a test admin account:

- **Admin ID:** KCL-00001
- **Name:** John Mark Santos
- **Email:** admin@jrmsu.edu.ph
- **Password:** `admin123` (hashed with bcrypt)
- **Position:** Librarian

**You can use this to test login functionality.**

---

## 📊 Database Schema Overview

```
jrmsu_library
├── admins              (Admin user accounts)
├── students            (Student user accounts)
├── reservations        (Book reservations)
├── library_sessions    (Entry/exit tracking)
├── borrow_records      (Book borrowing)
├── notifications       (Notification system)
├── activity_log        (Recent activity)
└── v_student_profiles  (Active students view)
```

---

## 🛠️ Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"

**Solution:** Check your MySQL root password

```bash
mysql -u root -p
# Enter correct password
```

### Error: "Database 'jrmsu_library' doesn't exist"

**Solution:** Create the database first

```sql
mysql -u root -p

CREATE DATABASE jrmsu_library CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE jrmsu_library;

SOURCE create_missing_tables.sql;
```

### Error: "Table already exists"

**Solution:** The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times. Existing tables won't be affected.

### Backend still shows errors

**Solution:**
1. Stop the backend (Ctrl+C)
2. Run the database setup
3. Restart the backend

```bash
# Stop backend
Ctrl+C

# Setup database
setup_database.bat

# Restart backend
python app.py
```

---

## ✅ Success Indicators

After successful setup, you should see:

1. **No database errors** in backend console
2. **Tables listed** in MySQL
3. **Sample admin** can login
4. **Library entry/exit** works without errors
5. **Notifications** can be created

---

## 📝 Next Steps

After database setup:

1. ✅ Test admin login at http://localhost:8080
2. ✅ Test mirror page at http://localhost:8081
3. ✅ Register new students
4. ✅ Test book reservations
5. ✅ Test notifications

---

## 🎯 Summary

**Files Created:**
- ✅ `create_missing_tables.sql` - SQL script to create tables
- ✅ `setup_database.bat` - Windows batch script for easy setup

**Commands:**
```bash
# Quick setup
setup_database.bat

# Or manual
mysql -u root -p jrmsu_library < create_missing_tables.sql

# Verify
mysql -u root -p
USE jrmsu_library;
SHOW TABLES;

# Restart backend
python app.py
```

**Database is now ready! 🎉**
