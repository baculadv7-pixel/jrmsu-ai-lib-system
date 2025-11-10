-- Add profile_picture column to admins and students tables
-- Run this file: mysql -u root -p jrmsu_library < add_profile_picture_column.sql

USE jrmsu_library;

-- Add profile_picture column to admins table
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS profile_picture LONGTEXT COMMENT 'Base64 encoded profile picture' 
AFTER account_status;

-- Add profile_picture column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS profile_picture LONGTEXT COMMENT 'Base64 encoded profile picture' 
AFTER account_status;

-- Verify the columns were added
DESCRIBE admins;
DESCRIBE students;

SELECT 'Profile picture columns added successfully!' AS Status;
