-- ============================================================================
-- JRMSU Library Entry/Exit System - Database Migration
-- Mirror Login Page Database Schema Updates
-- ============================================================================

USE jrmsu_library;

-- ============================================================================
-- 1. CREATE library_sessions TABLE
-- ============================================================================
-- Tracks all library entry and exit sessions

CREATE TABLE IF NOT EXISTS library_sessions (
  id VARCHAR(50) PRIMARY KEY COMMENT 'Unique session ID (lib-uuid format)',
  user_id VARCHAR(50) NOT NULL COMMENT 'Student ID or Admin ID',
  user_type ENUM('student', 'admin') NOT NULL COMMENT 'Type of user',
  full_name VARCHAR(255) NOT NULL COMMENT 'Full name of user',
  login_time DATETIME NOT NULL COMMENT 'Time user entered library',
  logout_time DATETIME NULL COMMENT 'Time user exited library',
  status ENUM('active', 'logged_out') DEFAULT 'active' COMMENT 'Session status',
  has_borrowed_books BOOLEAN DEFAULT FALSE COMMENT 'User has borrowed books',
  has_reservations BOOLEAN DEFAULT FALSE COMMENT 'User has reserved books',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_login_time (login_time),
  INDEX idx_user_type (user_type),
  
  -- Foreign key constraints (optional - depends on your schema)
  -- FOREIGN KEY (user_id) REFERENCES students(student_id) ON DELETE CASCADE,
  -- FOREIGN KEY (user_id) REFERENCES admins(admin_id) ON DELETE CASCADE
  
  COMMENT 'Library entry/exit session tracking'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. UPDATE borrow_records TABLE
-- ============================================================================
-- Add columns for return time activation and logout scanning

-- Check if columns exist before adding
SET @dbname = DATABASE();
SET @tablename = 'borrow_records';

-- Add return_time_activated column
SET @column_check = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = 'return_time_activated'
);

SET @sql = IF(@column_check = 0,
  'ALTER TABLE borrow_records ADD COLUMN return_time_activated BOOLEAN DEFAULT FALSE COMMENT ''Return time activated at logout''',
  'SELECT ''Column return_time_activated already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add scan_time column
SET @column_check = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = 'scan_time'
);

SET @sql = IF(@column_check = 0,
  'ALTER TABLE borrow_records ADD COLUMN scan_time DATETIME NULL COMMENT ''Time book was scanned at logout''',
  'SELECT ''Column scan_time already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add scanned_at_logout column
SET @column_check = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = 'scanned_at_logout'
);

SET @sql = IF(@column_check = 0,
  'ALTER TABLE borrow_records ADD COLUMN scanned_at_logout BOOLEAN DEFAULT FALSE COMMENT ''Book scanned during logout process''',
  'SELECT ''Column scanned_at_logout already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for performance
ALTER TABLE borrow_records 
ADD INDEX IF NOT EXISTS idx_return_time_activated (return_time_activated),
ADD INDEX IF NOT EXISTS idx_scanned_at_logout (scanned_at_logout);

-- ============================================================================
-- 3. UPDATE reservations TABLE
-- ============================================================================
-- Add columns for reservation cancellation tracking

SET @tablename = 'reservations';

-- Add cancelled_at column
SET @column_check = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = 'cancelled_at'
);

SET @sql = IF(@column_check = 0,
  'ALTER TABLE reservations ADD COLUMN cancelled_at DATETIME NULL COMMENT ''Time reservation was cancelled''',
  'SELECT ''Column cancelled_at already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add cancelled_by column
SET @column_check = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = 'cancelled_by'
);

SET @sql = IF(@column_check = 0,
  'ALTER TABLE reservations ADD COLUMN cancelled_by VARCHAR(50) NULL COMMENT ''User ID who cancelled (student_id or admin_id)''',
  'SELECT ''Column cancelled_by already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add cancellation_reason column
SET @column_check = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname 
  AND TABLE_NAME = @tablename 
  AND COLUMN_NAME = 'cancellation_reason'
);

SET @sql = IF(@column_check = 0,
  'ALTER TABLE reservations ADD COLUMN cancellation_reason TEXT NULL COMMENT ''Reason for cancellation''',
  'SELECT ''Column cancellation_reason already exists'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for performance
ALTER TABLE reservations 
ADD INDEX IF NOT EXISTS idx_cancelled_at (cancelled_at),
ADD INDEX IF NOT EXISTS idx_cancelled_by (cancelled_by);

-- ============================================================================
-- 4. VERIFICATION QUERIES
-- ============================================================================

-- Verify library_sessions table
SELECT 
  'library_sessions' AS table_name,
  COUNT(*) AS column_count
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'library_sessions';

-- Verify borrow_records updates
SELECT 
  'borrow_records' AS table_name,
  COLUMN_NAME,
  COLUMN_TYPE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'borrow_records'
AND COLUMN_NAME IN ('return_time_activated', 'scan_time', 'scanned_at_logout');

-- Verify reservations updates
SELECT 
  'reservations' AS table_name,
  COLUMN_NAME,
  COLUMN_TYPE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'reservations'
AND COLUMN_NAME IN ('cancelled_at', 'cancelled_by', 'cancellation_reason');

-- ============================================================================
-- 5. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample session for testing
/*
INSERT INTO library_sessions (id, user_id, user_type, full_name, login_time, status)
VALUES 
  ('lib-test-001', 'KC-23-A-00001', 'student', 'Test Student', NOW(), 'active'),
  ('lib-test-002', 'KCL-00001', 'admin', 'Test Admin', NOW(), 'active');
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 
  '✅ Migration completed successfully!' AS status,
  NOW() AS completed_at;

SELECT 
  'Next steps:' AS info,
  '1. Verify tables created correctly' AS step_1,
  '2. Test library entry/exit workflows' AS step_2,
  '3. Check admin notifications' AS step_3,
  '4. Monitor session tracking' AS step_4;
