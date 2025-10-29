-- Create missing database tables for JRMSU Library System
-- Run this file: mysql -u root -p jrmsu_library < create_missing_tables.sql

USE jrmsu_library;

-- ============================================
-- ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    full_name VARCHAR(255) GENERATED ALWAYS AS (CONCAT_WS(' ', first_name, middle_name, last_name, suffix)) STORED,
    age INT,
    birthdate DATE,
    gender ENUM('Male', 'Female') NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    position VARCHAR(100),
    street VARCHAR(255),
    barangay VARCHAR(100),
    municipality VARCHAR(100),
    province VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Philippines',
    zip_code VARCHAR(20),
    current_street VARCHAR(255),
    current_barangay VARCHAR(100),
    current_municipality VARCHAR(100),
    current_province VARCHAR(100),
    current_region VARCHAR(100),
    current_country VARCHAR(100) DEFAULT 'Philippines',
    current_zip VARCHAR(20),
    current_landmark TEXT,
    same_as_current BOOLEAN DEFAULT FALSE,
    permanent_address TEXT,
    current_address TEXT,
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(100),
    qr_code_data TEXT,
    qr_code_generated_at DATETIME,
    system_tag VARCHAR(50) DEFAULT 'JRMSU-KCL',
    account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_email (email),
    INDEX idx_account_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STUDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),
    full_name VARCHAR(255) GENERATED ALWAYS AS (CONCAT_WS(' ', first_name, middle_name, last_name, suffix)) STORED,
    age INT,
    birthdate DATE,
    gender ENUM('Male', 'Female') NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    college_department VARCHAR(100),
    course_major VARCHAR(100),
    year_level VARCHAR(20),
    block VARCHAR(20),
    street VARCHAR(255),
    barangay VARCHAR(100),
    municipality VARCHAR(100),
    province VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Philippines',
    zip_code VARCHAR(20),
    current_address_street VARCHAR(255),
    current_address_barangay VARCHAR(100),
    current_address_municipality VARCHAR(100),
    current_address_province VARCHAR(100),
    current_address_region VARCHAR(100),
    current_address_zip VARCHAR(20),
    current_address_landmark TEXT,
    permanent_address_street VARCHAR(255),
    permanent_address_barangay VARCHAR(100),
    permanent_address_municipality VARCHAR(100),
    permanent_address_province VARCHAR(100),
    permanent_address_region VARCHAR(100),
    permanent_address_zip VARCHAR(20),
    same_as_current BOOLEAN DEFAULT FALSE,
    permanent_address TEXT,
    current_address TEXT,
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(100),
    qr_code_data TEXT,
    qr_code_generated_at DATETIME,
    system_tag VARCHAR(50) DEFAULT 'JRMSU-KCS',
    account_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_email (email),
    INDEX idx_account_status (account_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- RESERVATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    user_type ENUM('student', 'admin') NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    book_title VARCHAR(255),
    reserved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    status ENUM('pending', 'fulfilled', 'cancelled', 'expired') DEFAULT 'pending',
    cancelled_at DATETIME,
    cancelled_by VARCHAR(50),
    cancellation_reason TEXT,
    fulfilled_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    INDEX idx_status (status),
    INDEX idx_reserved_at (reserved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STUDENT PROFILES VIEW
-- ============================================
CREATE OR REPLACE VIEW v_student_profiles AS
SELECT 
    s.id,
    s.student_id,
    s.first_name,
    s.middle_name,
    s.last_name,
    s.suffix,
    s.full_name,
    s.age,
    s.birthdate,
    s.gender,
    s.email,
    s.phone,
    s.college_department,
    s.course_major,
    s.year_level,
    s.block,
    s.permanent_address,
    s.current_address,
    s.account_status,
    s.created_at
FROM students s
WHERE s.account_status = 'active';

-- ============================================
-- LIBRARY SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS library_sessions (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- BORROW RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS borrow_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    borrow_id VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    user_type ENUM('student', 'admin') NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    book_title VARCHAR(255),
    borrowed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATETIME,
    returned_at DATETIME,
    status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
    return_time_activated BOOLEAN DEFAULT FALSE,
    scan_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert sample admin for testing
-- ============================================
INSERT INTO admins (
    admin_id, first_name, middle_name, last_name, 
    email, phone, position, gender, password_hash
) VALUES (
    'KCL-00001', 'John', 'Mark', 'Santos',
    'admin@jrmsu.edu.ph', '09123456789', 'Librarian', 'Male',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEg7dO'
) ON DUPLICATE KEY UPDATE admin_id = admin_id;

-- ============================================
-- Success message
-- ============================================
SELECT 'Database tables created successfully!' AS status;
SELECT TABLE_NAME FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'jrmsu_library' 
ORDER BY TABLE_NAME;
