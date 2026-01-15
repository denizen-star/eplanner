-- App Events table: Shared analytics table for cross-app telemetry tracking
-- Run this in PlanetScale development branch first, then promote to main
-- Note: Foreign keys removed due to PlanetScale limitations
-- Application code handles referential integrity
-- This table is shared across multiple applications (eplanner, gayrunclub, etc.)

CREATE TABLE app_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  app_name VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(255),
  
  -- Event information
  event_type VARCHAR(50) NOT NULL,
  page_category VARCHAR(100),
  page_url TEXT,
  
  -- Article/Content context (for event views, reads, etc.)
  article_id VARCHAR(255),
  article_slug VARCHAR(255),
  article_context JSON,
  
  -- User interaction details
  cta_type VARCHAR(100),
  depth_percent DECIMAL(5,2),
  referrer TEXT,
  
  -- Device and location information
  device_info JSON,
  ip_address VARCHAR(45),
  ip_geolocation JSON,
  user_agent TEXT,
  
  -- Indexes for common queries
  INDEX idx_app_name (app_name),
  INDEX idx_event_type (event_type),
  INDEX idx_page_category (page_category),
  INDEX idx_session_id (session_id),
  INDEX idx_article_id (article_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_app_name_timestamp (app_name, timestamp)
);
