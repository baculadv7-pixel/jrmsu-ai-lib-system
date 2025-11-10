-- AI Chat System Database Schema
-- Phase 7: Database Schema for Chat History and AI Sessions
-- JRMSU Library System - Jose AI Assistant

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS jrmsu_library;
USE jrmsu_library;

-- ==================================================
-- Table: ai_chat_sessions
-- Stores AI chat session metadata
-- ==================================================
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_role ENUM('student', 'admin', 'guest') DEFAULT 'student',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    message_count INT DEFAULT 0,
    status ENUM('active', 'ended', 'archived') DEFAULT 'active',
    INDEX idx_user_id (user_id),
    INDEX idx_started_at (started_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================
-- Table: ai_chat_history
-- Stores all chat messages between users and Jose
-- ==================================================
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id VARCHAR(100) PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content TEXT NOT NULL,
    emotion VARCHAR(50) NULL,
    emotion_confidence DECIMAL(5,2) NULL,
    emotion_tone ENUM('positive', 'negative', 'neutral') NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON NULL COMMENT 'Additional context: page visited, action taken, etc.',
    
    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_role (role),
    FULLTEXT INDEX ft_content (content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================
-- Table: ai_emotion_logs
-- Dedicated table for emotion analysis tracking
-- ==================================================
CREATE TABLE IF NOT EXISTS ai_emotion_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    detected_emotion VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,2) NOT NULL,
    tone ENUM('positive', 'negative', 'neutral') NOT NULL,
    keywords TEXT NULL COMMENT 'Emotion-triggering keywords detected',
    context TEXT NULL COMMENT 'Message context that influenced detection',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (message_id) REFERENCES ai_chat_history(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_detected_at (detected_at),
    INDEX idx_emotion (detected_emotion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================
-- Table: ai_notifications
-- AI-generated smart notifications and recommendations
-- ==================================================
CREATE TABLE IF NOT EXISTS ai_notifications (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    type ENUM('recommendation', 'reminder', 'alert', 'insight', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    action_url VARCHAR(500) NULL COMMENT 'Optional URL for call-to-action',
    metadata JSON NULL COMMENT 'Additional notification context',
    
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================
-- Table: ai_search_history
-- Tracks AI-enhanced search queries and results
-- ==================================================
CREATE TABLE IF NOT EXISTS ai_search_history (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    query TEXT NOT NULL,
    ai_enhanced BOOLEAN DEFAULT FALSE,
    results_count INT DEFAULT 0,
    top_result_id VARCHAR(50) NULL COMMENT 'Book ID of top result',
    clicked_result_id VARCHAR(50) NULL COMMENT 'Book ID user clicked',
    search_duration_ms INT NULL,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_searched_at (searched_at),
    INDEX idx_ai_enhanced (ai_enhanced),
    FULLTEXT INDEX ft_query (query)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================
-- Table: ai_command_logs
-- Logs admin commands executed via AI assistant
-- ==================================================
CREATE TABLE IF NOT EXISTS ai_command_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    admin_id VARCHAR(50) NOT NULL,
    command_type VARCHAR(100) NOT NULL COMMENT 'backup, report, qr_regenerate, etc.',
    command_text TEXT NOT NULL,
    ai_interpretation TEXT NULL COMMENT 'How AI understood the command',
    status ENUM('pending', 'confirmed', 'executed', 'failed', 'cancelled') NOT NULL,
    requires_2fa BOOLEAN DEFAULT FALSE,
    twofa_verified BOOLEAN DEFAULT FALSE,
    executed_at TIMESTAMP NULL,
    result_summary TEXT NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_command_type (command_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================
-- Table: ai_user_preferences
-- User preferences for AI assistant behavior
-- ==================================================
CREATE TABLE IF NOT EXISTS ai_user_preferences (
    user_id VARCHAR(50) PRIMARY KEY,
    ai_enabled BOOLEAN DEFAULT TRUE,
    chat_history_enabled BOOLEAN DEFAULT TRUE,
    emotion_detection_enabled BOOLEAN DEFAULT TRUE,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    voice_input_enabled BOOLEAN DEFAULT FALSE,
    personalized_recommendations BOOLEAN DEFAULT TRUE,
    data_retention_days INT DEFAULT 90 COMMENT 'Auto-delete chat history after N days',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================
-- Table: ai_analytics
-- Aggregated analytics for AI usage and performance
-- ==================================================
CREATE TABLE IF NOT EXISTS ai_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    metric_type VARCHAR(100) NOT NULL COMMENT 'sessions, messages, searches, commands, etc.',
    metric_value INT NOT NULL,
    user_role ENUM('student', 'admin', 'guest', 'all') DEFAULT 'all',
    metadata JSON NULL COMMENT 'Additional metric details',
    
    UNIQUE KEY unique_metric (date, metric_type, user_role),
    INDEX idx_date (date),
    INDEX idx_metric_type (metric_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================
-- Views for common queries
-- ==================================================

-- View: Recent AI activity summary
CREATE OR REPLACE VIEW v_recent_ai_activity AS
SELECT 
    s.id AS session_id,
    s.user_id,
    s.user_role,
    s.started_at,
    s.message_count,
    COUNT(h.id) AS total_messages,
    MAX(h.timestamp) AS last_message_at,
    AVG(CASE WHEN h.role = 'user' THEN 
        (SELECT confidence FROM ai_emotion_logs WHERE message_id = h.id LIMIT 1)
    END) AS avg_user_emotion_confidence
FROM ai_chat_sessions s
LEFT JOIN ai_chat_history h ON s.id = h.session_id
WHERE s.started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY s.id, s.user_id, s.user_role, s.started_at, s.message_count;

-- View: Popular searches
CREATE OR REPLACE VIEW v_popular_searches AS
SELECT 
    query,
    COUNT(*) AS search_count,
    AVG(results_count) AS avg_results,
    SUM(CASE WHEN clicked_result_id IS NOT NULL THEN 1 ELSE 0 END) AS click_through_count,
    MAX(searched_at) AS last_searched
FROM ai_search_history
WHERE searched_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY query
ORDER BY search_count DESC
LIMIT 50;

-- View: Unread AI notifications per user
CREATE OR REPLACE VIEW v_unread_ai_notifications AS
SELECT 
    user_id,
    COUNT(*) AS unread_count,
    SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) AS high_priority_count,
    MAX(created_at) AS latest_notification_at
FROM ai_notifications
WHERE is_read = FALSE
GROUP BY user_id;

-- ==================================================
-- Stored Procedures
-- ==================================================

-- Procedure: Clean old chat history based on user preferences
DELIMITER //
CREATE PROCEDURE sp_cleanup_old_chat_history()
BEGIN
    -- Delete chat history older than user's retention preference
    DELETE h FROM ai_chat_history h
    INNER JOIN ai_user_preferences p ON h.user_id = p.user_id
    WHERE h.timestamp < DATE_SUB(NOW(), INTERVAL p.data_retention_days DAY)
    AND p.chat_history_enabled = TRUE;
    
    -- Archive old sessions
    UPDATE ai_chat_sessions 
    SET status = 'archived'
    WHERE ended_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
    AND status = 'ended';
END //
DELIMITER ;

-- Procedure: Get user chat history
DELIMITER //
CREATE PROCEDURE sp_get_user_chat_history(
    IN p_user_id VARCHAR(50),
    IN p_limit INT
)
BEGIN
    SELECT 
        h.id,
        h.role,
        h.content,
        h.emotion,
        h.timestamp,
        h.metadata
    FROM ai_chat_history h
    INNER JOIN ai_chat_sessions s ON h.session_id = s.id
    WHERE s.user_id = p_user_id
    ORDER BY h.timestamp DESC
    LIMIT p_limit;
END //
DELIMITER ;

-- ==================================================
-- Triggers
-- ==================================================

-- Trigger: Update session message count on new message
DELIMITER //
CREATE TRIGGER tr_update_session_count
AFTER INSERT ON ai_chat_history
FOR EACH ROW
BEGIN
    UPDATE ai_chat_sessions
    SET message_count = message_count + 1,
        last_activity = NOW()
    WHERE id = NEW.session_id;
END //
DELIMITER ;

-- Trigger: Mark notification read timestamp
DELIMITER //
CREATE TRIGGER tr_notification_read_timestamp
BEFORE UPDATE ON ai_notifications
FOR EACH ROW
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        SET NEW.read_at = NOW();
    END IF;
END //
DELIMITER ;

-- ==================================================
-- Initial Data & Indexes
-- ==================================================

-- Create default AI preferences for system
INSERT IGNORE INTO ai_user_preferences (user_id, ai_enabled) VALUES ('system', TRUE);

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON jrmsu_library.ai_* TO 'library_app'@'localhost';

-- ==================================================
-- Cleanup Event (Optional - runs daily)
-- ==================================================
CREATE EVENT IF NOT EXISTS ev_daily_ai_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    CALL sp_cleanup_old_chat_history();

-- ==================================================
-- End of AI Chat Schema
-- ==================================================
