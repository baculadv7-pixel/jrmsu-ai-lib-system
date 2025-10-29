# 📊 Registration Database Structure - Complete Guide

## 🗄️ Database Location

**Database Name:** `jrmsu_library`

**SQL File:** `python-backend/create_missing_tables.sql`

**Connection:**
```
Host: localhost
Port: 3306 (default MySQL)
Database: jrmsu_library
User: root
```

---

## 📋 Registration Flow

### Phase 1: Account Type Selection
**URL:** http://localhost:8080/register

**Choices:**
- Register as Admin
- Register as Student

**Data Stored:** User type selection (stored in session/state)

---

### Phase 2: Personal Information
**URL:** http://localhost:8080/register/personal

**Fields Collected:**

#### Common Fields (Both Admin & Student)
1. **Personal Details:**
   - `first_name` - VARCHAR(100) NOT NULL
   - `middle_name` - VARCHAR(100)
   - `last_name` - VARCHAR(100) NOT NULL
   - `suffix` - VARCHAR(20) (Jr., Sr., II, etc.)
   - `full_name` - VARCHAR(255) GENERATED (Auto-computed)
   - `age` - INT
   - `birthdate` - DATE
   - `gender` - ENUM('Male', 'Female') NOT NULL
   - `email` - VARCHAR(255) UNIQUE NOT NULL
   - `phone` - VARCHAR(20)

2. **Permanent Address:**
   - `street` / `permanent_address_street` - VARCHAR(255)
   - `barangay` / `permanent_address_barangay` - VARCHAR(100)
   - `municipality` / `permanent_address_municipality` - VARCHAR(100)
   - `province` / `permanent_address_province` - VARCHAR(100)
   - `region` / `permanent_address_region` - VARCHAR(100)
   - `country` - VARCHAR(100) DEFAULT 'Philippines'
   - `zip_code` / `permanent_address_zip` - VARCHAR(20)

3. **Current Address:**
   - `current_street` / `current_address_street` - VARCHAR(255)
   - `current_barangay` / `current_address_barangay` - VARCHAR(100)
   - `current_municipality` / `current_address_municipality` - VARCHAR(100)
   - `current_province` / `current_address_province` - VARCHAR(100)
   - `current_region` / `current_address_region` - VARCHAR(100)
   - `current_country` - VARCHAR(100) DEFAULT 'Philippines'
   - `current_zip` / `current_address_zip` - VARCHAR(20)
   - `current_landmark` / `current_address_landmark` - TEXT
   - `same_as_current` - BOOLEAN DEFAULT FALSE

4. **Computed Address Fields:**
   - `permanent_address` - TEXT (Full address string)
   - `current_address` - TEXT (Full address string)

---

### Phase 3: Institutional Information
**URL:** http://localhost:8080/register/institution

#### For ADMIN:
1. **Admin ID:**
   - `admin_id` - VARCHAR(50) UNIQUE NOT NULL
   - Format: KCL-00001

2. **Position:**
   - `position` - VARCHAR(100)
   - Examples: Admin, Librarian, Staff, Supervisor

3. **Contact:**
   - Email confirmation (already collected in Phase 2)
   - Phone confirmation (already collected in Phase 2)

#### For STUDENT:
1. **Student ID:**
   - `student_id` - VARCHAR(50) UNIQUE NOT NULL
   - Format: KC-YY-B-XXXXX (e.g., KC-23-A-00762)

2. **Academic Information:**
   - `college_department` - VARCHAR(100)
   - `course_major` - VARCHAR(100)
   - `year_level` - VARCHAR(20)
   - `block` - VARCHAR(20) (Auto-extracted from Student ID)

---

### Phase 4: Security Setup
**URL:** http://localhost:8080/register/security

**Fields Collected:**

1. **Password:**
   - `password_hash` - VARCHAR(255) NOT NULL
   - Requirements: Min 8 chars, 1 uppercase, 1 number
   - Stored as bcrypt hash

2. **Two-Factor Authentication:**
   - `two_factor_enabled` - BOOLEAN DEFAULT FALSE
   - `two_factor_secret` - VARCHAR(100)

3. **QR Code:**
   - `qr_code_data` - TEXT
   - `qr_code_generated_at` - DATETIME
   - Auto-generated on registration

4. **System Tag:**
   - Admin: `system_tag` = 'JRMSU-KCL'
   - Student: `system_tag` = 'JRMSU-KCS'

5. **Account Status:**
   - `account_status` - ENUM('active', 'inactive', 'suspended')
   - Default: 'active'

6. **Timestamps:**
   - `created_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - `updated_at` - TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

---

## 📊 ADMINS Table Structure

```sql
CREATE TABLE IF NOT EXISTS admins (
    -- Primary Key
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Unique Identifiers
    admin_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Personal Information (Phase 2)
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    full_name VARCHAR(255) GENERATED ALWAYS AS (CONCAT_WS(' ', first_name, middle_name, last_name, suffix)) STORED,
    age INT,
    birthdate DATE,
    gender ENUM('Male', 'Female') NOT NULL,
    phone VARCHAR(20),
    
    -- Position (Phase 3)
    position VARCHAR(100),
    
    -- Permanent Address (Phase 2)
    street VARCHAR(255),
    barangay VARCHAR(100),
    municipality VARCHAR(100),
    province VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Philippines',
    zip_code VARCHAR(20),
    
    -- Current Address (Phase 2)
    current_street VARCHAR(255),
    current_barangay VARCHAR(100),
    current_municipality VARCHAR(100),
    current_province VARCHAR(100),
    current_region VARCHAR(100),
    current_country VARCHAR(100) DEFAULT 'Philippines',
    current_zip VARCHAR(20),
    current_landmark TEXT,
    same_as_current BOOLEAN DEFAULT FALSE,
    
    -- Computed Addresses
    permanent_address TEXT,
    current_address TEXT,
    
    -- Security (Phase 4)
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(100),
    qr_code_data TEXT,
    qr_code_generated_at DATETIME,
    system_tag VARCHAR(50) DEFAULT 'JRMSU-KCL',
    account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_admin_id (admin_id),
    INDEX idx_email (email),
    INDEX idx_account_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Total Fields:** 38 columns

---

## 📊 STUDENTS Table Structure

```sql
CREATE TABLE IF NOT EXISTS students (
    -- Primary Key
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Unique Identifiers
    student_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    
    -- Personal Information (Phase 2)
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    full_name VARCHAR(255) GENERATED ALWAYS AS (CONCAT_WS(' ', first_name, middle_name, last_name, suffix)) STORED,
    age INT,
    birthdate DATE,
    gender ENUM('Male', 'Female') NOT NULL,
    phone VARCHAR(20),
    
    -- Academic Information (Phase 3)
    college_department VARCHAR(100),
    course_major VARCHAR(100),
    year_level VARCHAR(20),
    block VARCHAR(20),
    
    -- Permanent Address (Phase 2) - OLD SCHEMA
    street VARCHAR(255),
    barangay VARCHAR(100),
    municipality VARCHAR(100),
    province VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Philippines',
    zip_code VARCHAR(20),
    
    -- Current Address (Phase 2) - NEW SCHEMA
    current_address_street VARCHAR(255),
    current_address_barangay VARCHAR(100),
    current_address_municipality VARCHAR(100),
    current_address_province VARCHAR(100),
    current_address_region VARCHAR(100),
    current_address_zip VARCHAR(20),
    current_address_landmark TEXT,
    
    -- Permanent Address (Phase 2) - NEW SCHEMA
    permanent_address_street VARCHAR(255),
    permanent_address_barangay VARCHAR(100),
    permanent_address_municipality VARCHAR(100),
    permanent_address_province VARCHAR(100),
    permanent_address_region VARCHAR(100),
    permanent_address_zip VARCHAR(20),
    same_as_current BOOLEAN DEFAULT FALSE,
    
    -- Computed Addresses
    permanent_address TEXT,
    current_address TEXT,
    
    -- Security (Phase 4)
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(100),
    qr_code_data TEXT,
    qr_code_generated_at DATETIME,
    system_tag VARCHAR(50) DEFAULT 'JRMSU-KCS',
    account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_student_id (student_id),
    INDEX idx_email (email),
    INDEX idx_account_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Total Fields:** 46 columns

---

## 🔑 Key Differences

### ADMIN vs STUDENT

| Field | Admin | Student |
|-------|-------|---------|
| **ID Field** | `admin_id` (KCL-00001) | `student_id` (KC-23-A-00762) |
| **Position/Academic** | `position` | `college_department`, `course_major`, `year_level`, `block` |
| **System Tag** | JRMSU-KCL | JRMSU-KCS |
| **Address Schema** | Simpler (street, current_street) | Detailed (permanent_address_street, current_address_street) |

---

## 📝 Field Mapping by Phase

### Phase 1: Account Type
- User type stored in session (not in database yet)

### Phase 2: Personal Information
**Admin:**
- first_name, middle_name, last_name, suffix
- age, birthdate, gender
- email, phone
- street, barangay, municipality, province, region, country, zip_code (permanent)
- current_street, current_barangay, current_municipality, current_province, current_region, current_country, current_zip, current_landmark
- same_as_current

**Student:**
- first_name, middle_name, last_name, suffix
- age, birthdate, gender
- email, phone
- permanent_address_street, permanent_address_barangay, permanent_address_municipality, permanent_address_province, permanent_address_region, permanent_address_zip
- current_address_street, current_address_barangay, current_address_municipality, current_address_province, current_address_region, current_address_zip, current_address_landmark
- same_as_current

### Phase 3: Institutional
**Admin:**
- admin_id
- position

**Student:**
- student_id
- college_department
- course_major
- year_level
- block

### Phase 4: Security
**Both:**
- password_hash
- two_factor_enabled
- two_factor_secret
- qr_code_data
- qr_code_generated_at
- system_tag
- account_status
- created_at
- updated_at

---

## 🗂️ Database File Location

**SQL Schema:**
```
C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\python-backend\create_missing_tables.sql
```

**To Create Tables:**
```bash
mysql -u root -p jrmsu_library < create_missing_tables.sql
```

---

## 📊 Summary

### ADMINS Table
- **Total Columns:** 38
- **Unique Keys:** admin_id, email
- **Generated Fields:** full_name
- **Default Values:** country='Philippines', system_tag='JRMSU-KCL', account_status='active'

### STUDENTS Table
- **Total Columns:** 46
- **Unique Keys:** student_id, email
- **Generated Fields:** full_name
- **Default Values:** country='Philippines', system_tag='JRMSU-KCS', account_status='active'

### Registration Phases
1. **Phase 1:** Account type selection (admin/student)
2. **Phase 2:** Personal info + addresses (25+ fields)
3. **Phase 3:** Institutional info (2-4 fields)
4. **Phase 4:** Security setup (6+ fields)

**All data is saved to database ONLY after Phase 4 "Finish" button is clicked!**
