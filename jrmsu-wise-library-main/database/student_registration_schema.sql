-- =====================================================
-- JRMSU Library Student Registration Database Schema
-- Enhanced version with Current/Permanent Address support
-- =====================================================

-- =====================================================
-- Students Table (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS students (
    -- Primary Identification
    id VARCHAR(50) PRIMARY KEY,  -- Student ID (KC-23-A-00762)
    student_id VARCHAR(50) UNIQUE NOT NULL,  -- Same as id
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),  -- Jr., Sr., II, etc.
    full_name VARCHAR(300) GENERATED ALWAYS AS (
        TRIM(CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name, ' ', COALESCE(suffix, '')))
    ) STORED,
    
    age INTEGER CHECK (age >= 16 AND age <= 100),
    birthdate DATE NOT NULL CHECK (birthdate <= CURRENT_DATE),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female')),
    
    -- Contact Information
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Academic Information
    department VARCHAR(100) NOT NULL,  -- CTE, CBA, CAFSE, SCJE, CCS
    course VARCHAR(200),  -- Course/Major (not required for SCJE)
    year_level VARCHAR(10) NOT NULL,  -- 1, 2, 3, 4
    block VARCHAR(5),  -- Extracted from Student ID (A, B, C, D, E, F)
    
    -- Current Address (Where student currently resides)
    current_address_street VARCHAR(200),
    current_address_barangay VARCHAR(100) NOT NULL,
    current_address_municipality VARCHAR(100) NOT NULL,
    current_address_province VARCHAR(100) NOT NULL,
    current_address_region VARCHAR(100) NOT NULL,
    current_address_country VARCHAR(50) DEFAULT 'Philippines',
    current_address_zip VARCHAR(10) NOT NULL,
    current_address_landmark TEXT,  -- Notes/Landmark
    
    -- Permanent Address (Official/Home address)
    permanent_address_street VARCHAR(200),
    permanent_address_barangay VARCHAR(100) NOT NULL,
    permanent_address_municipality VARCHAR(100) NOT NULL,
    permanent_address_province VARCHAR(100) NOT NULL,
    permanent_address_region VARCHAR(100) NOT NULL,
    permanent_address_country VARCHAR(50) DEFAULT 'Philippines',
    permanent_address_zip VARCHAR(10) NOT NULL,
    permanent_address_notes TEXT,  -- Additional notes
    
    -- Address Management
    same_as_current BOOLEAN DEFAULT FALSE,  -- Indicates if current == permanent
    
    -- Complete address strings (for display/legacy)
    current_address_full TEXT GENERATED ALWAYS AS (
        CONCAT_WS(', ',
            NULLIF(current_address_street, ''),
            current_address_barangay,
            current_address_municipality,
            current_address_province,
            current_address_region,
            current_address_country,
            current_address_zip
        )
    ) STORED,
    
    permanent_address_full TEXT GENERATED ALWAYS AS (
        CONCAT_WS(', ',
            NULLIF(permanent_address_street, ''),
            permanent_address_barangay,
            permanent_address_municipality,
            permanent_address_province,
            permanent_address_region,
            permanent_address_country,
            permanent_address_zip
        )
    ) STORED,
    
    -- Security & Authentication
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    
    -- QR Code Data
    qr_code_data TEXT,
    qr_code_generated_at TIMESTAMP,
    qr_code_last_regenerated TIMESTAMP,
    
    -- System Fields
    system_tag VARCHAR(50) DEFAULT 'JRMSU-KCS',  -- Student system tag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
    
    -- Indexes for performance
    INDEX idx_student_email (email),
    INDEX idx_student_department (department),
    INDEX idx_student_year (year_level),
    INDEX idx_student_created (created_at),
    INDEX idx_student_name (last_name, first_name),
    INDEX idx_student_block (block)
);

-- =====================================================
-- Function: Extract Block from Student ID
-- =====================================================
DELIMITER //
CREATE FUNCTION extract_block_from_student_id(student_id VARCHAR(50))
RETURNS VARCHAR(5)
DETERMINISTIC
BEGIN
    DECLARE block_value VARCHAR(5);
    
    -- Extract block from format: KC-23-A-00762
    -- Block is the 3rd segment (A, B, C, D, E, F)
    IF student_id REGEXP '^KC-[0-9]{2}-[A-F]-[0-9]{5}$' THEN
        SET block_value = SUBSTRING_INDEX(SUBSTRING_INDEX(student_id, '-', 3), '-', -1);
        RETURN block_value;
    END IF;
    
    RETURN NULL;
END //
DELIMITER ;

-- =====================================================
-- Function: Calculate Age from Birthdate
-- =====================================================
DELIMITER //
CREATE FUNCTION calculate_age_from_birthdate(birthdate DATE)
RETURNS INTEGER
DETERMINISTIC
BEGIN
    DECLARE calculated_age INTEGER;
    
    SET calculated_age = TIMESTAMPDIFF(YEAR, birthdate, CURDATE());
    
    -- Adjust if birthday hasn't occurred this year yet
    IF DATE_FORMAT(birthdate, '%m%d') > DATE_FORMAT(CURDATE(), '%m%d') THEN
        SET calculated_age = calculated_age - 1;
    END IF;
    
    RETURN calculated_age;
END //
DELIMITER ;

-- =====================================================
-- Trigger: Auto-extract block from Student ID
-- =====================================================
DELIMITER //
CREATE TRIGGER before_student_insert
BEFORE INSERT ON students
FOR EACH ROW
BEGIN
    -- Auto-extract block if not provided
    IF NEW.block IS NULL OR NEW.block = '' THEN
        SET NEW.block = extract_block_from_student_id(NEW.student_id);
    END IF;
    
    -- Auto-calculate age if not provided
    IF NEW.age IS NULL AND NEW.birthdate IS NOT NULL THEN
        SET NEW.age = calculate_age_from_birthdate(NEW.birthdate);
    END IF;
    
    -- Copy current address to permanent if same_as_current is true
    IF NEW.same_as_current = TRUE THEN
        SET NEW.permanent_address_street = NEW.current_address_street;
        SET NEW.permanent_address_barangay = NEW.current_address_barangay;
        SET NEW.permanent_address_municipality = NEW.current_address_municipality;
        SET NEW.permanent_address_province = NEW.current_address_province;
        SET NEW.permanent_address_region = NEW.current_address_region;
        SET NEW.permanent_address_country = NEW.current_address_country;
        SET NEW.permanent_address_zip = NEW.current_address_zip;
    END IF;
END //
DELIMITER ;

-- =====================================================
-- Trigger: Auto-update on modification
-- =====================================================
DELIMITER //
CREATE TRIGGER before_student_update
BEFORE UPDATE ON students
FOR EACH ROW
BEGIN
    -- Auto-extract block if student ID changes
    IF NEW.student_id != OLD.student_id THEN
        SET NEW.block = extract_block_from_student_id(NEW.student_id);
    END IF;
    
    -- Recalculate age if birthdate changes
    IF NEW.birthdate != OLD.birthdate THEN
        SET NEW.age = calculate_age_from_birthdate(NEW.birthdate);
    END IF;
    
    -- Sync permanent address if same_as_current is enabled
    IF NEW.same_as_current = TRUE THEN
        IF NEW.current_address_street != OLD.current_address_street OR
           NEW.current_address_barangay != OLD.current_address_barangay OR
           NEW.current_address_municipality != OLD.current_address_municipality OR
           NEW.current_address_province != OLD.current_address_province OR
           NEW.current_address_region != OLD.current_address_region OR
           NEW.current_address_zip != OLD.current_address_zip THEN
            
            SET NEW.permanent_address_street = NEW.current_address_street;
            SET NEW.permanent_address_barangay = NEW.current_address_barangay;
            SET NEW.permanent_address_municipality = NEW.current_address_municipality;
            SET NEW.permanent_address_province = NEW.current_address_province;
            SET NEW.permanent_address_region = NEW.current_address_region;
            SET NEW.permanent_address_country = NEW.current_address_country;
            SET NEW.permanent_address_zip = NEW.current_address_zip;
        END IF;
    END IF;
    
    -- Update timestamp
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- =====================================================
-- View: Student Profile Summary
-- =====================================================
CREATE OR REPLACE VIEW v_student_profiles AS
SELECT 
    id,
    student_id,
    full_name,
    email,
    phone,
    gender,
    age,
    birthdate,
    department,
    course,
    year_level,
    block,
    current_address_full,
    permanent_address_full,
    same_as_current,
    two_factor_enabled,
    account_status,
    created_at,
    last_login
FROM students;

-- =====================================================
-- View: Student Academic Information
-- =====================================================
CREATE OR REPLACE VIEW v_student_academic AS
SELECT 
    id,
    student_id,
    full_name,
    department,
    course,
    year_level,
    block,
    account_status
FROM students
WHERE account_status = 'active'
ORDER BY year_level, block, last_name, first_name;

-- =====================================================
-- Stored Procedure: Register New Student
-- =====================================================
DELIMITER //
CREATE PROCEDURE sp_register_student(
    IN p_student_id VARCHAR(50),
    IN p_first_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_suffix VARCHAR(20),
    IN p_birthdate DATE,
    IN p_gender VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_department VARCHAR(100),
    IN p_course VARCHAR(200),
    IN p_year_level VARCHAR(10),
    IN p_current_street VARCHAR(200),
    IN p_current_barangay VARCHAR(100),
    IN p_current_municipality VARCHAR(100),
    IN p_current_province VARCHAR(100),
    IN p_current_region VARCHAR(100),
    IN p_current_zip VARCHAR(10),
    IN p_current_landmark TEXT,
    IN p_permanent_street VARCHAR(200),
    IN p_permanent_barangay VARCHAR(100),
    IN p_permanent_municipality VARCHAR(100),
    IN p_permanent_province VARCHAR(100),
    IN p_permanent_region VARCHAR(100),
    IN p_permanent_zip VARCHAR(10),
    IN p_permanent_notes TEXT,
    IN p_same_as_current BOOLEAN,
    IN p_password_hash VARCHAR(255),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE student_exists INT;
    DECLARE email_exists INT;
    DECLARE calculated_age INT;
    DECLARE extracted_block VARCHAR(5);
    
    -- Check if student ID already exists
    SELECT COUNT(*) INTO student_exists FROM students WHERE student_id = p_student_id;
    
    IF student_exists > 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Student ID already exists';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student ID already exists';
    END IF;
    
    -- Check if email already exists
    SELECT COUNT(*) INTO email_exists FROM students WHERE email = p_email;
    
    IF email_exists > 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Email already registered';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already registered';
    END IF;
    
    -- Calculate age
    SET calculated_age = calculate_age_from_birthdate(p_birthdate);
    
    -- Extract block from student ID
    SET extracted_block = extract_block_from_student_id(p_student_id);
    
    -- Insert new student
    INSERT INTO students (
        id, student_id,
        first_name, middle_name, last_name, suffix,
        age, birthdate, gender,
        email, phone,
        department, course, year_level, block,
        current_address_street, current_address_barangay, current_address_municipality,
        current_address_province, current_address_region, current_address_country, current_address_zip,
        current_address_landmark,
        permanent_address_street, permanent_address_barangay, permanent_address_municipality,
        permanent_address_province, permanent_address_region, permanent_address_country, permanent_address_zip,
        permanent_address_notes,
        same_as_current,
        password_hash,
        account_status
    ) VALUES (
        p_student_id, p_student_id,
        p_first_name, p_middle_name, p_last_name, p_suffix,
        calculated_age, p_birthdate, p_gender,
        p_email, p_phone,
        p_department, p_course, p_year_level, extracted_block,
        p_current_street, p_current_barangay, p_current_municipality,
        p_current_province, p_current_region, 'Philippines', p_current_zip,
        p_current_landmark,
        p_permanent_street, p_permanent_barangay, p_permanent_municipality,
        p_permanent_province, p_permanent_region, 'Philippines', p_permanent_zip,
        p_permanent_notes,
        p_same_as_current,
        p_password_hash,
        'active'
    );
    
    SET p_success = TRUE;
    SET p_message = CONCAT('Student ', p_student_id, ' registered successfully');
END //
DELIMITER ;

-- =====================================================
-- Stored Procedure: Update Student Profile
-- =====================================================
DELIMITER //
CREATE PROCEDURE sp_update_student_profile(
    IN p_student_id VARCHAR(50),
    IN p_department VARCHAR(100),
    IN p_course VARCHAR(200),
    IN p_year_level VARCHAR(10),
    IN p_block VARCHAR(5),
    IN p_current_street VARCHAR(200),
    IN p_current_barangay VARCHAR(100),
    IN p_current_municipality VARCHAR(100),
    IN p_current_province VARCHAR(100),
    IN p_current_region VARCHAR(100),
    IN p_current_zip VARCHAR(10),
    IN p_current_landmark TEXT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE student_exists INT;
    
    -- Check if student exists
    SELECT COUNT(*) INTO student_exists FROM students WHERE student_id = p_student_id;
    
    IF student_exists = 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Student not found';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student not found';
    END IF;
    
    -- Update student profile (only editable fields)
    UPDATE students SET
        department = p_department,
        course = p_course,
        year_level = p_year_level,
        block = p_block,
        current_address_street = p_current_street,
        current_address_barangay = p_current_barangay,
        current_address_municipality = p_current_municipality,
        current_address_province = p_current_province,
        current_address_region = p_current_region,
        current_address_zip = p_current_zip,
        current_address_landmark = p_current_landmark
    WHERE student_id = p_student_id;
    
    SET p_success = TRUE;
    SET p_message = 'Student profile updated successfully';
END //
DELIMITER ;

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================
-- INSERT INTO students (
--     student_id, first_name, middle_name, last_name,
--     birthdate, gender, email, phone,
--     department, course, year_level,
--     current_address_barangay, current_address_municipality,
--     current_address_province, current_address_region, current_address_zip,
--     permanent_address_barangay, permanent_address_municipality,
--     permanent_address_province, permanent_address_region, permanent_address_zip,
--     same_as_current, password_hash
-- ) VALUES (
--     'KC-23-A-00001', 'Juan', 'Dela', 'Cruz',
--     '2004-05-15', 'Male', 'juan.cruz@jrmsu.edu.ph', '09123456789',
--     'CCS', 'BS Information System', '3',
--     'San Jose', 'Dingras', 'Ilocos Norte', 'Region I - Ilocos Region', '2913',
--     'San Jose', 'Dingras', 'Ilocos Norte', 'Region I - Ilocos Region', '2913',
--     TRUE, '$2b$10$...'
-- );

-- =====================================================
-- Comments & Documentation
-- =====================================================
COMMENT ON TABLE students IS 'Complete student information with current and permanent addresses';
COMMENT ON COLUMN students.same_as_current IS 'TRUE if current address is same as permanent address';
COMMENT ON COLUMN students.block IS 'Extracted from Student ID (A-F), represents class section';
