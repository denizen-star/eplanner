-- Migration: Add app_name column to ep_events table
-- Run this in PlanetScale development branch first, then promote to main
-- 
-- This migration adds:
-- - app_name: VARCHAR(50) to identify which app/domain created the event
--   - 'eplanner' for events created on eplanner.kervinapps.com
--   - 'to-lgbtq' for events created on to-lgbtq.kervinapps.com
--   - Defaults to 'eplanner' for backward compatibility

-- Add app_name column (VARCHAR(50), default 'eplanner')
ALTER TABLE ep_events 
ADD COLUMN app_name VARCHAR(50) DEFAULT 'eplanner' AFTER is_public;

-- Add index for efficient filtering by app_name
CREATE INDEX idx_app_name ON ep_events (app_name);

-- Update existing events to have app_name = 'eplanner' (default)
UPDATE ep_events 
SET app_name = 'eplanner' 
WHERE app_name IS NULL;
