-- =====================================================
-- JRMSU Library Admin Registration Database Schema
-- Enhanced version with Current/Permanent Address support
-- =====================================================

-- =====================================================
-- Admins Table (Enhanced)
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
    -- Primary Identification
    id VARCHAR(50) PRIMARY KEY,  -- Admin ID (KCL-00001)
    admin_id VARCHAR(50) UNIQUE NOT NULL,  -- Same as id
    
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
    
    -- Position Information
    position VARCHAR(100) NOT NULL,  -- Admin role/position (Librarian, Assistant, etc.)
    
    -- Permanent Address (Official/Home address from registration)
    street VARCHAR(200),
    barangay VARCHAR(100) NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    country VARCHAR(50) DEFAULT 'Philippines',
    zip_code VARCHAR(10) NOT NULL,
    
    -- Current Address (Where admin currently resides)
    current_street VARCHAR(200),
    current_barangay VARCHAR(100),
    current_municipality VARCHAR(100),
    current_province VARCHAR(100),
    current_region VARCHAR(100),
    current_country VARCHAR(50) DEFAULT 'Philippines',
    current_zip VARCHAR(10),
    current_landmark TEXT,  -- Notes/Landmark for current address
    
    -- Address Management
    same_as_current BOOLEAN DEFAULT FALSE,  -- Indicates if current == permanent
    
    -- Complete address strings (for display/legacy)
    address TEXT GENERATED ALWAYS AS (
        CONCAT_WS(', ',
            NULLIF(street, ''),
            barangay,
            municipality,
            province,
            region,
            country,
            zip_code
        )
    ) STORED,
    
    current_address TEXT GENERATED ALWAYS AS (
        CONCAT_WS(', ',
            NULLIF(current_street, ''),
            NULLIF(current_barangay, ''),
            NULLIF(current_municipality, ''),
            NULLIF(current_province, ''),
            NULLIF(current_region, ''),
            NULLIF(current_country, 'Philippines'),
            NULLIF(current_zip, '')
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
    system_tag VARCHAR(50) DEFAULT 'JRMSU-KCL',  -- Admin system tag
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
    
    -- Indexes for performance
    INDEX idx_admin_email (email),
    INDEX idx_admin_position (position),
    INDEX idx_admin_created (created_at),
    INDEX idx_admin_name (last_name, first_name)
);

-- =====================================================
-- Function: Calculate Age from Birthdate
-- =====================================================
DELIMITER //
CREATE FUNCTION IF NOT EXISTS calculate_admin_age_from_birthdate(birthdate DATE)
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
-- Trigger: Auto-calculate age and sync addresses
-- =====================================================
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_admin_insert
BEFORE INSERT ON admins
FOR EACH ROW
BEGIN
    -- Auto-calculate age if not provided
    IF NEW.age IS NULL AND NEW.birthdate IS NOT NULL THEN
        SET NEW.age = calculate_admin_age_from_birthdate(NEW.birthdate);
    END IF;
    
    -- Copy permanent address to current if same_as_current is true
    IF NEW.same_as_current = TRUE THEN
        SET NEW.current_street = NEW.street;
        SET NEW.current_barangay = NEW.barangay;
        SET NEW.current_municipality = NEW.municipality;
        SET NEW.current_province = NEW.province;
        SET NEW.current_region = NEW.region;
        SET NEW.current_country = NEW.country;
        SET NEW.current_zip = NEW.zip_code;
    END IF;
END //
DELIMITER ;

-- =====================================================
-- Trigger: Auto-update on modification
-- =====================================================
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_admin_update
BEFORE UPDATE ON admins
FOR EACH ROW
BEGIN
    -- Recalculate age if birthdate changes
    IF NEW.birthdate != OLD.birthdate THEN
        SET NEW.age = calculate_admin_age_from_birthdate(NEW.birthdate);
    END IF;
    
    -- Sync current address if same_as_current is enabled
    IF NEW.same_as_current = TRUE THEN
        IF NEW.street != OLD.street OR
           NEW.barangay != OLD.barangay OR
           NEW.municipality != OLD.municipality OR
           NEW.province != OLD.province OR
           NEW.region != OLD.region OR
           NEW.zip_code != OLD.zip_code THEN
            
            SET NEW.current_street = NEW.street;
            SET NEW.current_barangay = NEW.barangay;
            SET NEW.current_municipality = NEW.municipality;
            SET NEW.current_province = NEW.province;
            SET NEW.current_region = NEW.region;
            SET NEW.current_country = NEW.country;
            SET NEW.current_zip = NEW.zip_code;
        END IF;
    END IF;
    
    -- Update timestamp
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- =====================================================
-- View: Admin Profile Summary
-- =====================================================
CREATE OR REPLACE VIEW v_admin_profiles AS
SELECT 
    id,
    admin_id,
    full_name,
    email,
    phone,
    gender,
    age,
    birthdate,
    position,
    address as permanent_address,
    current_address,
    same_as_current,
    two_factor_enabled,
    account_status,
    created_at,
    last_login
FROM admins;

-- =====================================================
-- Stored Procedure: Register New Admin
-- =====================================================
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_register_admin(
    IN p_admin_id VARCHAR(50),
    IN p_first_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_suffix VARCHAR(20),
    IN p_birthdate DATE,
    IN p_gender VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_position VARCHAR(100),
    IN p_street VARCHAR(200),
    IN p_barangay VARCHAR(100),
    IN p_municipality VARCHAR(100),
    IN p_province VARCHAR(100),
    IN p_region VARCHAR(100),
    IN p_zip_code VARCHAR(10),
    IN p_current_street VARCHAR(200),
    IN p_current_barangay VARCHAR(100),
    IN p_current_municipality VARCHAR(100),
    IN p_current_province VARCHAR(100),
    IN p_current_region VARCHAR(100),
    IN p_current_zip VARCHAR(10),
    IN p_current_landmark TEXT,
    IN p_same_as_current BOOLEAN,
    IN p_password_hash VARCHAR(255),
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE admin_exists INT;
    DECLARE email_exists INT;
    DECLARE calculated_age INT;
    
    -- Check if admin ID already exists
    SELECT COUNT(*) INTO admin_exists FROM admins WHERE admin_id = p_admin_id;
    
    IF admin_exists > 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Admin ID already exists';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Admin ID already exists';
    END IF;
    
    -- Check if email already exists
    SELECT COUNT(*) INTO email_exists FROM admins WHERE email = p_email;
    
    IF email_exists > 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Email already registered';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already registered';
    END IF;
    
    -- Calculate age
    SET calculated_age = calculate_admin_age_from_birthdate(p_birthdate);
    
    -- Insert new admin
    INSERT INTO admins (
        id, admin_id,
        first_name, middle_name, last_name, suffix,
        age, birthdate, gender,
        email, phone,
        position,
        street, barangay, municipality, province, region, country, zip_code,
        current_street, current_barangay, current_municipality,
        current_province, current_region, current_country, current_zip,
        current_landmark,
        same_as_current,
        password_hash,
        account_status
    ) VALUES (
        p_admin_id, p_admin_id,
        p_first_name, p_middle_name, p_last_name, p_suffix,
        calculated_age, p_birthdate, p_gender,
        p_email, p_phone,
        p_position,
        p_street, p_barangay, p_municipality, p_province, p_region, 'Philippines', p_zip_code,
        p_current_street, p_current_barangay, p_current_municipality,
        p_current_province, p_current_region, 'Philippines', p_current_zip,
        p_current_landmark,
        p_same_as_current,
        p_password_hash,
        'active'
    );
    
    SET p_success = TRUE;
    SET p_message = CONCAT('Admin ', p_admin_id, ' registered successfully');
END //
DELIMITER ;

-- =====================================================
-- Stored Procedure: Update Admin Profile
-- =====================================================
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_update_admin_profile(
    IN p_admin_id VARCHAR(50),
    IN p_first_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_suffix VARCHAR(20),
    IN p_gender VARCHAR(20),
    IN p_age INTEGER,
    IN p_birthdate DATE,
    IN p_email VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_street VARCHAR(200),
    IN p_barangay VARCHAR(100),
    IN p_municipality VARCHAR(100),
    IN p_province VARCHAR(100),
    IN p_region VARCHAR(100),
    IN p_zip_code VARCHAR(10),
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
    DECLARE admin_exists INT;
    
    -- Check if admin exists
    SELECT COUNT(*) INTO admin_exists FROM admins WHERE admin_id = p_admin_id;
    
    IF admin_exists = 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Admin not found';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Admin not found';
    END IF;
    
    -- Update admin profile (editable fields only - NOT position or admin_id)
    UPDATE admins SET
        first_name = p_first_name,
        middle_name = p_middle_name,
        last_name = p_last_name,
        suffix = p_suffix,
        gender = p_gender,
        age = p_age,
        birthdate = p_birthdate,
        email = p_email,
        phone = p_phone,
        street = p_street,
        barangay = p_barangay,
        municipality = p_municipality,
        province = p_province,
        region = p_region,
        zip_code = p_zip_code,
        current_street = p_current_street,
        current_barangay = p_current_barangay,
        current_municipality = p_current_municipality,
        current_province = p_current_province,
        current_region = p_current_region,
        current_zip = p_current_zip,
        current_landmark = p_current_landmark
    WHERE admin_id = p_admin_id;
    
    SET p_success = TRUE;
    SET p_message = 'Admin profile updated successfully';
END //
DELIMITER ;

-- =====================================================
-- Comments & Documentation
-- =====================================================
-- COMMENT ON TABLE admins IS 'Complete admin information with current and permanent addresses';
-- COMMENT ON COLUMN admins.same_as_current IS 'TRUE if current address is same as permanent address';
-- COMMENT ON COLUMN admins.position IS 'Admin role/position - READ ONLY after registration';
