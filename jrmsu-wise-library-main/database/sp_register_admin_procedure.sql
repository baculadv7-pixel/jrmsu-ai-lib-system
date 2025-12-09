-- MariaDB-safe definition of sp_register_admin matching AdminDB.register_admin (27 parameters)
-- Import this file into the jrmsu_library database via phpMyAdmin or mysql CLI.

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_register_admin$$

CREATE PROCEDURE sp_register_admin(
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
    DECLARE v_exists_id INT DEFAULT 0;
    DECLARE v_exists_email INT DEFAULT 0;

    -- Check duplicate admin_id
    SELECT COUNT(*) INTO v_exists_id
    FROM admins
    WHERE admin_id = p_admin_id OR id = p_admin_id;

    -- Check duplicate email
    SELECT COUNT(*) INTO v_exists_email
    FROM admins
    WHERE email = p_email;

    IF v_exists_id > 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Admin ID already exists';
    ELSEIF v_exists_email > 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Email already registered';
    ELSE
        -- Insert admin row
        INSERT INTO admins (
            id, admin_id,
            first_name, middle_name, last_name, suffix,
            age, birthdate, gender,
            email, phone,
            position,
            street, barangay, municipality, province, region, country, zip_code,
            current_street, current_barangay, current_municipality,
            current_province, current_region, current_country, current_zip, current_landmark,
            same_as_current,
            password_hash,
            account_status
        ) VALUES (
            p_admin_id, p_admin_id,
            p_first_name, p_middle_name, p_last_name, p_suffix,
            NULL, p_birthdate, p_gender,
            p_email, p_phone,
            p_position,
            p_street, p_barangay, p_municipality, p_province, p_region, 'Philippines', p_zip_code,
            p_current_street, p_current_barangay, p_current_municipality,
            p_current_province, p_current_region, 'Philippines', p_current_zip, p_current_landmark,
            p_same_as_current,
            p_password_hash,
            'active'
        );

        -- Record permanent usage in used_ids
        INSERT INTO used_ids (id, user_type, last_status)
        VALUES (p_admin_id, 'admin', 'active')
        ON DUPLICATE KEY UPDATE
            user_type = VALUES(user_type),
            last_status = 'active',
            last_updated_at = CURRENT_TIMESTAMP;

        SET p_success = TRUE;
        SET p_message = CONCAT('Admin ', p_admin_id, ' registered successfully');
    END IF;
END$$

DELIMITER ;
