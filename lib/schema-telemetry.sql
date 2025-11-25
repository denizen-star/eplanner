-- Telemetry table: Stores analytics and device/location information
-- Run this in PlanetScale development branch first, then promote to main
-- Note: Foreign keys removed due to PlanetScale limitations
-- Application code handles referential integrity

CREATE TABLE telemetry (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(20) NOT NULL,
  run_id VARCHAR(7),
  signup_id BIGINT,
  session_id VARCHAR(255),
  ip_address VARCHAR(45),
  ip_geolocation JSON,
  device_info JSON,
  session_info JSON,
  page_url TEXT,
  referrer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type (event_type),
  INDEX idx_run_id (run_id),
  INDEX idx_signup_id (signup_id),
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at)
  -- FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE SET NULL
  -- FOREIGN KEY (signup_id) REFERENCES signups(id) ON DELETE SET NULL
  -- Removed: PlanetScale may have restrictions on foreign keys
);

