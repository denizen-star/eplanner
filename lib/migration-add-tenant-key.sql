-- Migration: Add tenant_key to ep_events and create ep_tenants table
-- Run in PlanetScale development branch first, then promote to main
--
-- Adds:
-- - tenant_key on ep_events for per-subdomain isolation
-- - ep_tenants table for branding config (favicon, logo, hero CTAs, sender email override)

-- 1. Add tenant_key to ep_events (nullable for backfill, then we backfill)
ALTER TABLE ep_events
ADD COLUMN tenant_key VARCHAR(100) NULL AFTER app_name;

-- 2. Backfill existing events
UPDATE ep_events
SET tenant_key = CASE
  WHEN app_name = 'to-lgbtq' THEN 'lgbtq-hub:to'
  ELSE 'eplanner:default'
END
WHERE tenant_key IS NULL;

-- 3. Index for filtering
CREATE INDEX idx_tenant_key ON ep_events (tenant_key);
CREATE INDEX idx_tenant_key_date_time ON ep_events (tenant_key, date_time);

-- 4. ep_tenants table: per-subdomain branding + optional sender email override
CREATE TABLE ep_tenants (
  tenant_key VARCHAR(100) PRIMARY KEY,
  product VARCHAR(50) NOT NULL,
  subdomain VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NULL,
  config_json JSON NULL,
  sender_email VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product (product),
  INDEX idx_is_active (is_active)
);
