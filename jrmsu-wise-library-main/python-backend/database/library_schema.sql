-- JRMSU AI Library System - Core Library Schema
-- This schema is designed to match python-backend/library_endpoints.py
-- Tables: books, reservations, borrow_records

-- NOTE:
-- - Adjust ENGINE/CHARSET if needed for your MySQL/MariaDB setup.
-- - Run this file against the SAME database your app.py is using.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- BOOKS TABLE --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS books (
  id                VARCHAR(64)  NOT NULL PRIMARY KEY,  -- e.g. '90909453'
  title             VARCHAR(255) NOT NULL,
  author            VARCHAR(255) NOT NULL,
  category          VARCHAR(255) NOT NULL,
  isbn              VARCHAR(64)  NULL,
  shelf             VARCHAR(64)  NULL,
  total_copies      INT NOT NULL DEFAULT 1,
  available_copies  INT NOT NULL DEFAULT 1,
  status            ENUM('available','unavailable') NOT NULL DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- RESERVATIONS TABLE ------------------------------------------------------

CREATE TABLE IF NOT EXISTS reservations (
  id             VARCHAR(64)  NOT NULL PRIMARY KEY,      -- e.g. 'RV-<timestamp>-<uuid>'
  reservation_id VARCHAR(64)  NULL UNIQUE,               -- optional, but backend tries to fill it
  user_id        VARCHAR(64)  NOT NULL,
  user_type      ENUM('student','admin') NOT NULL DEFAULT 'student',
  book_id        VARCHAR(64)  NOT NULL,
  book_title     VARCHAR(255) NOT NULL,

  status         ENUM('pending','fulfilled','cancelled') NOT NULL DEFAULT 'pending',
  reserved_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at   DATETIME NULL,
  cancelled_at   DATETIME NULL,
  cancelled_by   VARCHAR(64) NULL,

  CONSTRAINT fk_res_book FOREIGN KEY (book_id) REFERENCES books(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  INDEX idx_res_user_book_status (user_id, book_id, status, cancelled_at),
  INDEX idx_res_status (status, cancelled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- BORROW_RECORDS TABLE ----------------------------------------------------

CREATE TABLE IF NOT EXISTS borrow_records (
  id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
  borrow_id             VARCHAR(64) UNIQUE NOT NULL,   -- e.g. 'BR-<timestamp>'
  user_id               VARCHAR(64) NOT NULL,
  user_type             ENUM('student','admin') NOT NULL DEFAULT 'student',
  book_id               VARCHAR(64) NOT NULL,
  book_title            VARCHAR(255) NOT NULL,

  borrowed_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date              DATETIME NOT NULL,
  returned_at           DATETIME NULL,

  status                ENUM('borrowed','returned','overdue') NOT NULL DEFAULT 'borrowed',

  return_time_activated BOOLEAN NOT NULL DEFAULT FALSE,
  scan_time             DATETIME NULL,
  scanned_at_logout     BOOLEAN NOT NULL DEFAULT FALSE,

  CONSTRAINT fk_borrow_book FOREIGN KEY (book_id) REFERENCES books(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  INDEX idx_borrow_user_book_status (user_id, book_id, status, returned_at),
  INDEX idx_borrow_status (status, returned_at),
  INDEX idx_borrow_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


SET FOREIGN_KEY_CHECKS = 1;
