-- Migration: Add app_members table for newsletter/member subscriptions (cross-app)
-- Run in PlanetScale development branch first, then promote to main
--
-- Shared across applications (eplanner, to-lgbtq, etc.). app_name/tenant_key
-- are always derived server-side from request (same pattern as app_events).
-- type='NA' + status='passive' for signup-intent CTAs; type='Weekly' for newsletter opt-in.

CREATE TABLE app_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  app_name VARCHAR(100) NOT NULL,
  tenant_key VARCHAR(100) NULL,
  email VARCHAR(255) NULL,
  name VARCHAR(255) NULL,
  phone VARCHAR(20) NULL,
  session_id VARCHAR(255) NULL,
  type ENUM('NA','Weekly') NOT NULL DEFAULT 'NA',
  status ENUM('passive','active','opt-out','delete') NOT NULL DEFAULT 'passive',
  consent_metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_app_tenant_email_type (app_name, tenant_key, email, type),
  INDEX idx_app_tenant_session_type (app_name, tenant_key, session_id, type),
  UNIQUE KEY uk_app_tenant_email_type (app_name, tenant_key, email, type)
);

-- Note: UNIQUE allows multiple rows with NULL email (one per session for NA type).
-- Application enforces one Weekly row per (app_name, tenant_key, email) via upsert logic.
