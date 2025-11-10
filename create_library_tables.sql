-- Create library_sessions table for tracking all login/logout sessions
CREATE TABLE IF NOT EXISTS library_sessions (
  session_id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  user_type ENUM('student', 'admin') NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  login_time DATETIME NOT NULL,
  logout_time DATETIME NULL,
  method ENUM('manual', 'qr') NOT NULL DEFAULT 'manual',
  status ENUM('inside_library', 'logged_out') NOT NULL DEFAULT 'inside_library',
  action_count INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_status (user_id, status),
  KEY idx_status (status),
  KEY idx_login_time (login_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create active_sessions table for real-time tracking of currently logged-in users
CREATE TABLE IF NOT EXISTS active_sessions (
  session_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(20) NOT NULL,
  fullname VARCHAR(100) NOT NULL,
  usertype ENUM('Student','Admin') NOT NULL,
  login_time DATETIME NOT NULL,
  logout_time DATETIME NULL,
  status ENUM('active','logged_out') NOT NULL DEFAULT 'active',
  login_method ENUM('manual','qrcode') NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_active (status),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  actor_id VARCHAR(50) NOT NULL,
  actor_name VARCHAR(100) NOT NULL,
  event VARCHAR(50) NOT NULL,
  details TEXT,
  source VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
  timestamp DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_actor (actor_id),
  KEY idx_event (event),
  KEY idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;