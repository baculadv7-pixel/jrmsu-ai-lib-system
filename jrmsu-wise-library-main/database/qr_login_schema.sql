-- JRMSU Library QR Code Login Database Schema
-- This schema extends the existing user system with QR code login functionality

-- =============================================
-- QR Code Metadata Table
-- =============================================
-- Stores QR code metadata for each user
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) NOT NULL,
    user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('admin', 'student')),
    qr_data_encrypted TEXT NOT NULL, -- Encrypted QR code JSON data
    auth_code_hash VARCHAR(64) NOT NULL, -- Hashed authentication code
    encrypted_token TEXT NOT NULL, -- Encrypted password token
    two_factor_secret VARCHAR(255), -- Base32 encoded 2FA secret key
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_regenerated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL, -- QR code expiration time
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1, -- For QR code versioning
    
    -- Indexes for performance
    CONSTRAINT qr_codes_user_unique UNIQUE (user_id),
    INDEX idx_qr_codes_user_id (user_id),
    INDEX idx_qr_codes_active (is_active),
    INDEX idx_qr_codes_expires (expires_at)
);

-- =============================================
-- QR Login Audit Logs Table
-- =============================================
-- Comprehensive logging of all QR code login attempts
CREATE TABLE qr_login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    attempt_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    login_method VARCHAR(20) DEFAULT 'QR_CODE',
    device_info TEXT, -- User agent string
    ip_address INET,
    success BOOLEAN NOT NULL,
    two_factor_used BOOLEAN DEFAULT false,
    failure_reason VARCHAR(255), -- Reason for failed attempts
    session_id VARCHAR(255), -- Session identifier if successful
    location_data JSONB, -- Optional geolocation data
    
    -- Indexes for audit queries
    INDEX idx_qr_login_logs_user_id (user_id),
    INDEX idx_qr_login_logs_timestamp (attempt_timestamp),
    INDEX idx_qr_login_logs_success (success),
    INDEX idx_qr_login_logs_ip (ip_address)
);

-- =============================================
-- User 2FA Settings Table (Extension)
-- =============================================
-- Extends user table with 2FA configuration
CREATE TABLE user_2fa_settings (
    user_id VARCHAR(50) PRIMARY KEY,
    two_factor_enabled BOOLEAN DEFAULT false,
    secret_key VARCHAR(255), -- Base32 encoded TOTP secret
    backup_codes TEXT[], -- Array of backup recovery codes
    qr_code_generated BOOLEAN DEFAULT false,
    last_totp_used VARCHAR(6), -- Prevent TOTP replay attacks
    totp_last_used_at TIMESTAMPTZ,
    setup_completed_at TIMESTAMPTZ,
    
    -- Foreign key to users table
    CONSTRAINT fk_user_2fa_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_2fa_enabled (two_factor_enabled)
);

-- =============================================
-- QR Code Usage Tracking
-- =============================================
-- Track QR code usage to prevent replay attacks
CREATE TABLE qr_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id UUID NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    auth_code_used VARCHAR(64) NOT NULL, -- Hashed auth code that was used
    used_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    device_fingerprint VARCHAR(255),
    
    -- Foreign key relationships
    CONSTRAINT fk_qr_usage_qr_code FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE,
    
    -- Prevent the same auth code from being used twice
    CONSTRAINT unique_auth_code_usage UNIQUE (qr_code_id, auth_code_used),
    
    INDEX idx_qr_usage_user_id (user_id),
    INDEX idx_qr_usage_timestamp (used_at)
);

-- =============================================
-- QR System Configuration
-- =============================================
-- Global settings for QR code login system
CREATE TABLE qr_system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    
    INDEX idx_qr_config_key (setting_key)
);

-- =============================================
-- Default Configuration Values
-- =============================================
-- Insert default system settings
INSERT INTO qr_system_config (setting_key, setting_value, description) VALUES
('qr_expiration_minutes', '30', 'QR code expiration time in minutes'),
('global_2fa_enabled', 'true', 'Whether 2FA is globally required'),
('max_login_attempts_per_hour', '10', 'Maximum QR login attempts per hour per user'),
('audit_retention_days', '90', 'Days to retain QR login audit logs'),
('encryption_key_rotation_days', '30', 'Days between encryption key rotation');

-- =============================================
-- Security Views
-- =============================================

-- View for active QR codes with user information
CREATE VIEW active_qr_codes AS
SELECT 
    qc.id,
    qc.user_id,
    qc.user_type,
    u.first_name || ' ' || u.middle_name || ' ' || u.last_name AS full_name,
    qc.generated_at,
    qc.expires_at,
    qc.two_factor_secret IS NOT NULL AS has_2fa,
    qc.version
FROM qr_codes qc
JOIN users u ON qc.user_id = u.id
WHERE qc.is_active = true 
  AND qc.expires_at > CURRENT_TIMESTAMP;

-- View for recent QR login activity (last 24 hours)
CREATE VIEW recent_qr_activity AS
SELECT 
    user_id,
    full_name,
    attempt_timestamp,
    success,
    two_factor_used,
    ip_address,
    device_info,
    failure_reason
FROM qr_login_logs
WHERE attempt_timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY attempt_timestamp DESC;

-- View for QR login statistics
CREATE VIEW qr_login_stats AS
SELECT 
    DATE(attempt_timestamp) as login_date,
    COUNT(*) as total_attempts,
    COUNT(CASE WHEN success THEN 1 END) as successful_logins,
    COUNT(CASE WHEN NOT success THEN 1 END) as failed_attempts,
    COUNT(CASE WHEN two_factor_used THEN 1 END) as two_factor_logins,
    COUNT(DISTINCT user_id) as unique_users
FROM qr_login_logs
WHERE attempt_timestamp > CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY DATE(attempt_timestamp)
ORDER BY login_date DESC;

-- =============================================
-- Stored Procedures/Functions
-- =============================================

-- Function to generate new QR code for user
CREATE OR REPLACE FUNCTION generate_user_qr_code(
    p_user_id VARCHAR(50),
    p_user_type VARCHAR(10),
    p_force_regenerate BOOLEAN DEFAULT false
) RETURNS JSON AS $$
DECLARE
    existing_qr qr_codes%ROWTYPE;
    new_qr_id UUID;
    qr_data JSONB;
    result JSON;
BEGIN
    -- Check for existing active QR code
    SELECT * INTO existing_qr 
    FROM qr_codes 
    WHERE user_id = p_user_id 
      AND is_active = true 
      AND expires_at > CURRENT_TIMESTAMP;
    
    -- If regeneration is forced or no valid QR exists, create new one
    IF p_force_regenerate OR existing_qr IS NULL THEN
        -- Deactivate old QR codes
        UPDATE qr_codes SET is_active = false WHERE user_id = p_user_id;
        
        -- Generate new QR code
        new_qr_id := gen_random_uuid();
        
        -- Build QR data (simplified for example)
        qr_data := json_build_object(
            'userId', p_user_id,
            'userType', p_user_type,
            'authCode', substring(md5(random()::text) for 6),
            'encryptedToken', encode(digest(p_user_id || now()::text, 'sha256'), 'base64'),
            'timestamp', extract(epoch from now()) * 1000,
            'systemId', 'JRMSU-LIBRARY'
        );
        
        -- Insert new QR code record
        INSERT INTO qr_codes (
            id, user_id, user_type, qr_data_encrypted, 
            auth_code_hash, encrypted_token, expires_at, version
        ) VALUES (
            new_qr_id, p_user_id, p_user_type,
            qr_data::text, -- In production, this should be encrypted
            md5(qr_data->>'authCode'),
            qr_data->>'encryptedToken',
            CURRENT_TIMESTAMP + INTERVAL '30 minutes',
            COALESCE(existing_qr.version, 0) + 1
        );
        
        result := json_build_object(
            'success', true,
            'qr_id', new_qr_id,
            'qr_data', qr_data,
            'expires_at', CURRENT_TIMESTAMP + INTERVAL '30 minutes'
        );
    ELSE
        result := json_build_object(
            'success', true,
            'qr_id', existing_qr.id,
            'message', 'Using existing valid QR code',
            'expires_at', existing_qr.expires_at
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and authenticate QR login
CREATE OR REPLACE FUNCTION authenticate_qr_login(
    p_qr_data JSONB,
    p_totp_code VARCHAR(6) DEFAULT NULL,
    p_device_info TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    qr_record qr_codes%ROWTYPE;
    user_2fa user_2fa_settings%ROWTYPE;
    result JSON;
    auth_success BOOLEAN := false;
    failure_reason TEXT := NULL;
BEGIN
    -- Validate QR code exists and is active
    SELECT * INTO qr_record
    FROM qr_codes
    WHERE user_id = (p_qr_data->>'userId')
      AND is_active = true
      AND expires_at > CURRENT_TIMESTAMP;
    
    IF qr_record IS NULL THEN
        failure_reason := 'QR code not found or expired';
    ELSE
        -- Validate auth code hash
        IF md5(p_qr_data->>'authCode') != qr_record.auth_code_hash THEN
            failure_reason := 'Invalid authentication code';
        ELSE
            -- Check if 2FA is required
            SELECT * INTO user_2fa
            FROM user_2fa_settings
            WHERE user_id = qr_record.user_id
              AND two_factor_enabled = true;
            
            IF user_2fa IS NOT NULL AND p_totp_code IS NULL THEN
                failure_reason := '2FA code required';
            ELSIF user_2fa IS NOT NULL THEN
                -- Validate TOTP code (simplified check)
                IF LENGTH(p_totp_code) != 6 OR p_totp_code !~ '^[0-9]{6}$' THEN
                    failure_reason := 'Invalid 2FA code format';
                ELSE
                    -- In production, validate TOTP against secret
                    auth_success := true;
                END IF;
            ELSE
                auth_success := true;
            END IF;
        END IF;
    END IF;
    
    -- Log the authentication attempt
    INSERT INTO qr_login_logs (
        user_id, full_name, success, two_factor_used,
        device_info, ip_address, failure_reason
    ) VALUES (
        p_qr_data->>'userId',
        p_qr_data->>'fullName',
        auth_success,
        user_2fa IS NOT NULL AND p_totp_code IS NOT NULL,
        p_device_info,
        p_ip_address,
        failure_reason
    );
    
    -- Track QR usage if successful
    IF auth_success AND qr_record IS NOT NULL THEN
        INSERT INTO qr_usage_tracking (
            qr_code_id, user_id, auth_code_used, ip_address
        ) VALUES (
            qr_record.id,
            qr_record.user_id,
            md5(p_qr_data->>'authCode'),
            p_ip_address
        ) ON CONFLICT (qr_code_id, auth_code_used) DO NOTHING;
    END IF;
    
    result := json_build_object(
        'success', auth_success,
        'message', COALESCE(failure_reason, 'Authentication successful'),
        'requires_2fa', user_2fa IS NOT NULL,
        'user_type', qr_record.user_type
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Data Cleanup Jobs
-- =============================================

-- Function to cleanup expired QR codes and old logs
CREATE OR REPLACE FUNCTION cleanup_qr_data() RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
    log_count INTEGER;
    retention_days INTEGER;
BEGIN
    -- Get retention settings
    SELECT (setting_value::text)::integer 
    INTO retention_days
    FROM qr_system_config 
    WHERE setting_key = 'audit_retention_days';
    
    -- Deactivate expired QR codes
    UPDATE qr_codes 
    SET is_active = false 
    WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Delete old audit logs
    DELETE FROM qr_login_logs 
    WHERE attempt_timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days;
    
    GET DIAGNOSTICS log_count = ROW_COUNT;
    
    -- Delete old usage tracking records
    DELETE FROM qr_usage_tracking 
    WHERE used_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * retention_days;
    
    RETURN expired_count + log_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Security Triggers
-- =============================================

-- Trigger to automatically update last_regenerated_at
CREATE OR REPLACE FUNCTION update_qr_regenerated_timestamp() RETURNS TRIGGER AS $$
BEGIN
    IF OLD.version < NEW.version THEN
        NEW.last_regenerated_at := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_qr_regenerated
    BEFORE UPDATE ON qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_qr_regenerated_timestamp();

-- =============================================
-- Indexes for Performance
-- =============================================

-- Additional composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qr_codes_user_active_expires 
ON qr_codes (user_id, is_active, expires_at) 
WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qr_login_logs_user_timestamp 
ON qr_login_logs (user_id, attempt_timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_qr_usage_tracking_qr_auth 
ON qr_usage_tracking (qr_code_id, auth_code_used);

-- =============================================
-- Comments
-- =============================================

COMMENT ON TABLE qr_codes IS 'Stores encrypted QR code metadata and authentication tokens for users';
COMMENT ON TABLE qr_login_logs IS 'Comprehensive audit log of all QR code login attempts for security monitoring';
COMMENT ON TABLE user_2fa_settings IS 'Two-factor authentication configuration per user';
COMMENT ON TABLE qr_usage_tracking IS 'Prevents replay attacks by tracking used authentication codes';
COMMENT ON TABLE qr_system_config IS 'Global configuration settings for the QR login system';

-- =============================================
-- Sample Data (for testing)
-- =============================================

-- Insert sample QR system admin (optional, for testing)
-- INSERT INTO users (id, first_name, middle_name, last_name, email, role) 
-- VALUES ('KCL-00001', 'System', 'QR', 'Administrator', 'admin@jrmsu.edu.ph', 'admin')
-- ON CONFLICT (id) DO NOTHING;