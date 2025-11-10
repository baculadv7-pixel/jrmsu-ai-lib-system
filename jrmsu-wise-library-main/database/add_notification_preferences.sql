-- =====================================================
-- Add Notification Preference Columns
-- This migration adds email, SMS, and push notification 
-- preference columns to students and admins tables
-- =====================================================

USE jrmsu_library;

-- Add notification preference columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE COMMENT 'Enable email notifications for overdue books',
ADD COLUMN IF NOT EXISTS sms_reminders BOOLEAN DEFAULT FALSE COMMENT 'Enable SMS reminders for overdue books',
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT FALSE COMMENT 'Enable push notifications for overdue books';

-- Add notification preference columns to admins table
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE COMMENT 'Enable email notifications',
ADD COLUMN IF NOT EXISTS sms_reminders BOOLEAN DEFAULT FALSE COMMENT 'Enable SMS reminders',
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT FALSE COMMENT 'Enable push notifications';

-- Create indexes for faster queries on notification preferences
CREATE INDEX IF NOT EXISTS idx_students_email_notif ON students(email_notifications);
CREATE INDEX IF NOT EXISTS idx_students_sms_notif ON students(sms_reminders);
CREATE INDEX IF NOT EXISTS idx_admins_email_notif ON admins(email_notifications);
CREATE INDEX IF NOT EXISTS idx_admins_sms_notif ON admins(sms_reminders);

-- Update existing records to have email notifications enabled by default
UPDATE students SET email_notifications = TRUE WHERE email_notifications IS NULL;
UPDATE admins SET email_notifications = TRUE WHERE email_notifications IS NULL;

-- Verify the changes
SELECT 'Students table notification columns added successfully' AS Status;
DESCRIBE students;

SELECT 'Admins table notification columns added successfully' AS Status;
DESCRIBE admins;

-- Show sample data
SELECT 
    id, 
    email, 
    email_notifications, 
    sms_reminders, 
    push_notifications 
FROM students 
LIMIT 5;

SELECT 
    id, 
    email, 
    email_notifications, 
    sms_reminders, 
    push_notifications 
FROM admins 
LIMIT 5;
