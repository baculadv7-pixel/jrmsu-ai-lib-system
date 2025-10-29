-- Notifications Table (Actionable items in Notification Bell)
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    details JSON,
    source ENUM('MAIN', 'MIRROR') NOT NULL DEFAULT 'MAIN',
    target_role VARCHAR(20),  -- 'admin' for all admins, NULL for specific user
    target_user_id VARCHAR(50),  -- Specific user ID, NULL for all admins
    read_flag BOOLEAN DEFAULT FALSE,
    action_required BOOLEAN DEFAULT FALSE,
    action_type VARCHAR(50),  -- 'grant_decline', 'view_profile', 'download_qr', etc.
    action_payload JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_target_role (target_role),
    INDEX idx_target_user (target_user_id),
    INDEX idx_created (created_at),
    INDEX idx_read (read_flag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Log Table (Read-only audit trail in Recent Activity)
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    summary VARCHAR(255) NOT NULL,
    details JSON,
    source ENUM('MAIN', 'MIRROR') NOT NULL DEFAULT 'MAIN',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification Deduplication Tracking
CREATE TABLE IF NOT EXISTS notification_dedup (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_key VARCHAR(255) NOT NULL,  -- Unique key for dedup (e.g., 'welcome_KC-23-A-00001')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_event (user_id, event_type, event_key),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jose AI Message Templates (for variation)
CREATE TABLE IF NOT EXISTS jose_message_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    template TEXT NOT NULL,
    variables JSON,  -- List of variables like {userId}, {fullName}, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Jose AI templates
INSERT INTO jose_message_templates (event_type, template, variables) VALUES
-- Welcome messages
('welcome_new_user', 'Welcome aboard, {fullName}! Your account {userId} is now active and ready to use.', '["userId", "fullName"]'),
('welcome_new_user', 'Hello {fullName}! Your library account {userId} has been successfully created.', '["userId", "fullName"]'),
('welcome_new_user', 'Great to have you here, {fullName}! Account {userId} is all set.', '["userId", "fullName"]'),
('welcome_new_user', '{fullName}, welcome to JRMSU Library! Your account {userId} is ready.', '["userId", "fullName"]'),

-- Password reset requests
('password_reset_request', 'Password reset requested by {fullName} ({userId}) at {timestamp}. Action required.', '["userId", "fullName", "timestamp"]'),
('password_reset_request', '{fullName} ({userId}) has requested a password reset at {timestamp}. Please review.', '["userId", "fullName", "timestamp"]'),
('password_reset_request', 'User {userId} - {fullName} initiated password recovery at {timestamp}.', '["userId", "fullName", "timestamp"]'),
('password_reset_request', 'Password reset request received from {fullName} ({userId}) at {timestamp}.', '["userId", "fullName", "timestamp"]'),

-- Student registration
('student_registered', 'New student {fullName} ({userId}) registered successfully at {timestamp}.', '["userId", "fullName", "timestamp"]'),
('student_registered', 'Student account created: {userId} - {fullName} at {timestamp}.', '["userId", "fullName", "timestamp"]'),
('student_registered', 'Welcome new student {fullName} ({userId}) who joined at {timestamp}.', '["userId", "fullName", "timestamp"]'),
('student_registered', '{fullName} ({userId}) has joined as a student at {timestamp}.', '["userId", "fullName", "timestamp"]'),

-- Admin registration
('admin_registered', 'New administrator {fullName} ({userId}) registered successfully at {timestamp}.', '["userId", "fullName", "timestamp"]'),
('admin_registered', 'Admin account created: {userId} - {fullName} at {timestamp}.', '["userId", "fullName", "timestamp"]'),
('admin_registered', 'Welcome new admin {fullName} ({userId}) who joined at {timestamp}.', '["userId", "fullName", "timestamp"]'),
('admin_registered', '{fullName} ({userId}) has joined as an administrator at {timestamp}.', '["userId", "fullName", "timestamp"]'),

-- Library login (manual)
('library_login_manual', '{userId} logged into the library using manual authentication at {timestamp}.', '["userId", "timestamp"]'),
('library_login_manual', 'Library access: {userId} entered via manual login at {timestamp}.', '["userId", "timestamp"]'),
('library_login_manual', '{userId} successfully logged in manually at {timestamp}.', '["userId", "timestamp"]'),
('library_login_manual', 'Manual login completed by {userId} at {timestamp}.', '["userId", "timestamp"]'),

-- Library logout (manual)
('library_logout_manual', '{userId} logged out from the library at {timestamp}.', '["userId", "timestamp"]'),
('library_logout_manual', 'Library session ended for {userId} at {timestamp}.', '["userId", "timestamp"]'),
('library_logout_manual', '{userId} exited the library at {timestamp}.', '["userId", "timestamp"]'),
('library_logout_manual', 'Manual logout completed by {userId} at {timestamp}.', '["userId", "timestamp"]'),

-- Library login (QR)
('library_login_qr', '{userId} logged into the library using QR code at {timestamp}.', '["userId", "timestamp"]'),
('library_login_qr', 'QR code scan: {userId} entered the library at {timestamp}.', '["userId", "timestamp"]'),
('library_login_qr', '{userId} accessed the library via QR authentication at {timestamp}.', '["userId", "timestamp"]'),
('library_login_qr', 'QR login completed by {userId} at {timestamp}.', '["userId", "timestamp"]'),

-- Library logout (QR)
('library_logout_qr', '{userId} logged out from the library (QR session) at {timestamp}.', '["userId", "timestamp"]'),
('library_logout_qr', 'QR session ended for {userId} at {timestamp}.', '["userId", "timestamp"]'),
('library_logout_qr', '{userId} exited the library (QR code) at {timestamp}.', '["userId", "timestamp"]'),
('library_logout_qr', 'QR logout completed by {userId} at {timestamp}.', '["userId", "timestamp"]'),

-- Book reserved
('book_reserved', '{userId} reserved "{bookTitle}" ({bookId}) at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),
('book_reserved', 'Reservation created: "{bookTitle}" ({bookId}) by {userId} at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),
('book_reserved', '{userId} placed a hold on "{bookTitle}" ({bookId}) at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),
('book_reserved', 'Book "{bookTitle}" ({bookId}) reserved by {userId} at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),

-- Book borrowed
('book_borrowed', '{userId} borrowed "{bookTitle}" ({bookId}) at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),
('book_borrowed', 'Book checked out: "{bookTitle}" ({bookId}) by {userId} at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),
('book_borrowed', '{userId} took out "{bookTitle}" ({bookId}) at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),
('book_borrowed', '"{bookTitle}" ({bookId}) borrowed by {userId} at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),

-- Book returned
('book_returned', '{userId} returned "{bookTitle}" ({bookId}) at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),
('book_returned', 'Book returned: "{bookTitle}" ({bookId}) by {userId} at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),
('book_returned', '{userId} checked in "{bookTitle}" ({bookId}) at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),
('book_returned', '"{bookTitle}" ({bookId}) returned by {userId} at {timestamp}.', '["userId", "bookId", "bookTitle", "timestamp"]'),

-- Book overdue
('book_overdue', 'OVERDUE: {userId} has not returned "{bookTitle}" ({bookId}) since {borrowedTime}. Please remind the student.', '["userId", "bookId", "bookTitle", "borrowedTime"]'),
('book_overdue', 'Overdue alert: "{bookTitle}" ({bookId}) - {userId} - borrowed {borrowedTime}.', '["userId", "bookId", "bookTitle", "borrowedTime"]'),
('book_overdue', '{userId} has overdue book "{bookTitle}" ({bookId}) from {borrowedTime}. Action needed.', '["userId", "bookId", "bookTitle", "borrowedTime"]'),
('book_overdue', 'Book "{bookTitle}" ({bookId}) is overdue. Borrowed by {userId} on {borrowedTime}.', '["userId", "bookId", "bookTitle", "borrowedTime"]');
