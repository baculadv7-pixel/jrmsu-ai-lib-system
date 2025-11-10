-- Add notification preference columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_reminders BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT FALSE;

-- Add notification preference columns to admins table
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_reminders BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT FALSE;

-- Create borrows table if it doesn't exist
CREATE TABLE IF NOT EXISTS borrows (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_book_id (book_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
);

-- Create books table if it doesn't exist (for reference)
CREATE TABLE IF NOT EXISTS books (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(20),
    category VARCHAR(100),
    publisher VARCHAR(255),
    publication_year INT,
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    status ENUM('available', 'borrowed', 'reserved', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_category (category),
    INDEX idx_status (status)
);

-- Add comments for documentation
ALTER TABLE students 
MODIFY COLUMN email_notifications BOOLEAN DEFAULT FALSE COMMENT 'Enable email notifications for overdue books',
MODIFY COLUMN sms_reminders BOOLEAN DEFAULT FALSE COMMENT 'Enable SMS reminders for overdue books',
MODIFY COLUMN push_notifications BOOLEAN DEFAULT FALSE COMMENT 'Enable push notifications for overdue books';

ALTER TABLE admins 
MODIFY COLUMN email_notifications BOOLEAN DEFAULT FALSE COMMENT 'Enable email notifications for overdue books',
MODIFY COLUMN sms_reminders BOOLEAN DEFAULT FALSE COMMENT 'Enable SMS reminders for overdue books',
MODIFY COLUMN push_notifications BOOLEAN DEFAULT FALSE COMMENT 'Enable push notifications for overdue books';
