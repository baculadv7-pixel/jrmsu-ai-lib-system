# 🗄️ DATABASE SETUP GUIDE - MySQL/XAMPP

## 📊 DATABASE INFORMATION

### Database Name
```
jrmsu_library
```

### Database Configuration
```
Host:     localhost
Port:     3306
Database: jrmsu_library
User:     root
Password: (empty by default)
```

---

## 📍 DATABASE LOCATION

### XAMPP MySQL Data Directory
```
C:\xampp\mysql\data\jrmsu_library\
```

This folder contains all the database tables and data files.

### Configuration File Location
```
Backend Config:  jrmsu-wise-library-main\python-backend\db.py
Environment:     jrmsu-wise-library-main\python-backend\.env
```

---

## 🔧 DATABASE CONFIGURATION FILES

### 1. Backend Configuration (db.py)
**File:** `jrmsu-wise-library-main\python-backend\db.py`

```python
# Database configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '3306')),
    'database': os.getenv('DB_NAME', 'jrmsu_library'),  # ← Database name
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'autocommit': False,
    'raise_on_warnings': True,
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci',
    'use_pure': True
}
```

### 2. Environment Variables (.env)
**File:** `jrmsu-wise-library-main\python-backend\.env`

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=jrmsu_library          # ← Database name
DB_USER=root
DB_PASSWORD=                   # Empty by default for XAMPP
```

---

## 📁 DATABASE FILE STRUCTURE

### XAMPP Directory Structure
```
C:\xampp\
├── mysql\
│   ├── bin\
│   │   ├── mysql.exe          # MySQL client
│   │   ├── mysqld.exe         # MySQL server
│   │   └── mysqladmin.exe     # MySQL admin tool
│   ├── data\                  # Database data directory
│   │   ├── jrmsu_library\     # ← Your database folder
│   │   │   ├── students.frm   # Student table structure
│   │   │   ├── students.ibd   # Student table data
│   │   │   ├── admins.frm     # Admin table structure
│   │   │   ├── admins.ibd     # Admin table data
│   │   │   ├── books.frm
│   │   │   ├── books.ibd
│   │   │   ├── library_sessions.frm
│   │   │   ├── library_sessions.ibd
│   │   │   ├── reservations.frm
│   │   │   ├── reservations.ibd
│   │   │   ├── borrow_records.frm
│   │   │   ├── borrow_records.ibd
│   │   │   └── db.opt         # Database options
│   │   ├── mysql\             # System database
│   │   ├── performance_schema\
│   │   └── phpmyadmin\
│   └── my.ini                 # MySQL configuration
└── phpMyAdmin\                # Web interface for MySQL
```

---

## 🗂️ DATABASE TABLES

### Tables in `jrmsu_library` Database

```
┌─────────────────────────────────────────────────────────┐
│  Table Name          │  Description                     │
├─────────────────────────────────────────────────────────┤
│  students            │  Student user accounts           │
│  admins              │  Admin user accounts             │
│  books               │  Book catalog                    │
│  library_sessions    │  Active library sessions         │
│  reservations        │  Book reservations               │
│  borrow_records      │  Book borrowing history          │
│  notifications       │  System notifications            │
│  activity_logs       │  User activity logs              │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 HOW TO ACCESS DATABASE

### Method 1: phpMyAdmin (Easiest)
```
1. Start XAMPP
2. Start Apache and MySQL
3. Open browser: http://localhost/phpmyadmin
4. Click on "jrmsu_library" database
5. View/Edit tables
```

### Method 2: MySQL Command Line
```powershell
# Navigate to MySQL bin directory
cd C:\xampp\mysql\bin

# Connect to MySQL
mysql -u root -p

# Enter password (empty by default, just press Enter)

# Use the database
USE jrmsu_library;

# Show tables
SHOW TABLES;

# View students
SELECT * FROM students;

# View admins
SELECT * FROM admins;
```

### Method 3: MySQL Workbench
```
1. Open MySQL Workbench
2. Create connection:
   - Hostname: localhost
   - Port: 3306
   - Username: root
   - Password: (empty)
3. Connect
4. Select "jrmsu_library" schema
5. Browse tables
```

---

## 📊 DATABASE SCHEMA

### Students Table
```sql
CREATE TABLE students (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    course VARCHAR(100),
    year_level VARCHAR(20),
    department VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(100),
    qr_code_data TEXT,
    system_tag VARCHAR(50) DEFAULT 'JRMSU-KCS',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Admins Table
```sql
CREATE TABLE admins (
    id VARCHAR(50) PRIMARY KEY,
    admin_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(100),
    department VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(100),
    qr_code_data TEXT,
    system_tag VARCHAR(50) DEFAULT 'JRMSU-KCL',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Library Sessions Table
```sql
CREATE TABLE library_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_type ENUM('student', 'admin') NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP NULL,
    status ENUM('active', 'ended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔍 CHECK DATABASE EXISTS

### Using phpMyAdmin
```
1. Open http://localhost/phpmyadmin
2. Look for "jrmsu_library" in left sidebar
3. If exists, you're good!
4. If not, create it (see below)
```

### Using MySQL Command Line
```sql
-- Show all databases
SHOW DATABASES;

-- Check if jrmsu_library exists
-- Should see it in the list
```

---

## 🆕 CREATE DATABASE (If Not Exists)

### Method 1: phpMyAdmin
```
1. Open http://localhost/phpmyadmin
2. Click "New" in left sidebar
3. Database name: jrmsu_library
4. Collation: utf8mb4_unicode_ci
5. Click "Create"
```

### Method 2: MySQL Command Line
```sql
-- Create database
CREATE DATABASE jrmsu_library
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Verify
SHOW DATABASES;

-- Use it
USE jrmsu_library;
```

### Method 3: Run SQL Script
```powershell
# If you have a SQL file with database schema
cd C:\xampp\mysql\bin
mysql -u root -p < path\to\schema.sql
```

---

## 🔧 BACKUP DATABASE

### Using phpMyAdmin
```
1. Open http://localhost/phpmyadmin
2. Click "jrmsu_library" database
3. Click "Export" tab
4. Select "Quick" export method
5. Format: SQL
6. Click "Go"
7. Save file: jrmsu_library_backup.sql
```

### Using MySQL Command Line
```powershell
# Navigate to MySQL bin
cd C:\xampp\mysql\bin

# Backup database
mysqldump -u root -p jrmsu_library > jrmsu_library_backup.sql

# Backup to specific location
mysqldump -u root -p jrmsu_library > "C:\Backups\jrmsu_library_backup.sql"
```

---

## 📥 RESTORE DATABASE

### Using phpMyAdmin
```
1. Open http://localhost/phpmyadmin
2. Click "jrmsu_library" database
3. Click "Import" tab
4. Choose file: jrmsu_library_backup.sql
5. Click "Go"
```

### Using MySQL Command Line
```powershell
# Navigate to MySQL bin
cd C:\xampp\mysql\bin

# Restore database
mysql -u root -p jrmsu_library < jrmsu_library_backup.sql
```

---

## 🔐 DATABASE SECURITY

### Default XAMPP Settings (Development)
```
User:     root
Password: (empty)
Access:   localhost only
```

### For Production (Recommended)
```sql
-- Create new user
CREATE USER 'jrmsu_user'@'localhost' IDENTIFIED BY 'strong_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON jrmsu_library.* TO 'jrmsu_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
```

### Update .env File
```env
DB_USER=jrmsu_user
DB_PASSWORD=strong_password
```

---

## 🧪 TEST DATABASE CONNECTION

### Using Python Script
```python
import mysql.connector

try:
    conn = mysql.connector.connect(
        host='localhost',
        port=3306,
        database='jrmsu_library',
        user='root',
        password=''
    )
    print("✅ Database connection successful!")
    print(f"Database: {conn.database}")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")
```

### Using Backend API
```powershell
# Start backend
cd python-backend
.venv\Scripts\activate
python app.py

# Check if it connects to database
# Should see: ✅ Library endpoints loaded
```

---

## 📍 QUICK REFERENCE

### Database Name
```
jrmsu_library
```

### Physical Location
```
C:\xampp\mysql\data\jrmsu_library\
```

### Access URLs
```
phpMyAdmin:  http://localhost/phpmyadmin
Backend API: http://localhost:5000
```

### Connection Info
```
Host:     localhost
Port:     3306
Database: jrmsu_library
User:     root
Password: (empty)
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] XAMPP MySQL is running
- [ ] Database "jrmsu_library" exists
- [ ] Tables are created (students, admins, etc.)
- [ ] Backend can connect to database
- [ ] phpMyAdmin shows the database
- [ ] Data files exist in C:\xampp\mysql\data\jrmsu_library\

---

**Last Updated:** Oct 29, 2025 1:55 PM  
**Database Name:** jrmsu_library  
**Location:** C:\xampp\mysql\data\jrmsu_library\  
**Status:** ✅ Complete Database Guide
