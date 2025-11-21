-- PlanetScale Database Schema for Event Planner
-- Run this in PlanetScale development branch first, then promote to main

-- Runs table: Stores event information
CREATE TABLE runs (
  id VARCHAR(7) PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  location TEXT NOT NULL,
  coordinates JSON,
  planner_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  date_time DATETIME NOT NULL,
  max_participants INT NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_date_time (date_time),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Signups table: Stores participant signups for events
-- Note: Foreign keys removed due to PlanetScale limitations
-- Application code handles referential integrity
CREATE TABLE signups (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  run_id VARCHAR(7) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  instagram VARCHAR(255),
  waiver_accepted BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  INDEX idx_run_id (run_id),
  INDEX idx_signed_at (signed_at)
  -- FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
  -- Removed: PlanetScale may have restrictions on foreign keys
);

-- Waivers table: Stores waiver signatures and text
-- Note: Foreign keys removed due to PlanetScale limitations
-- Application code handles referential integrity
CREATE TABLE waivers (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  run_id VARCHAR(7) NOT NULL,
  signup_id BIGINT NOT NULL,
  participant_name VARCHAR(255) NOT NULL,
  participant_phone VARCHAR(20) NOT NULL,
  waiver_text TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  INDEX idx_run_id (run_id),
  INDEX idx_signup_id (signup_id),
  INDEX idx_timestamp (timestamp)
  -- FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE,
  -- FOREIGN KEY (signup_id) REFERENCES signups(id) ON DELETE CASCADE
  -- Removed: PlanetScale may have restrictions on foreign keys
);

