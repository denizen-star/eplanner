-- Migration: Add is_public, end_time, place_name, and link fields to ep_events table
-- Run this in PlanetScale development branch first, then promote to main
-- 
-- This migration adds:
-- - is_public: Boolean flag to indicate if event is public (visible in calendar) or private
-- - end_time: Optional end time for the event
-- - place_name: Optional location name (e.g., "Gaythering") separate from address
-- - signup_link: Full URL to signup page
-- - manage_link: Full URL to management page
-- - event_view_link: Full URL to event view page

-- Add is_public column (BOOLEAN, default TRUE)
ALTER TABLE ep_events 
ADD COLUMN is_public BOOLEAN DEFAULT TRUE AFTER status;

-- Add end_time column (DATETIME, nullable)
ALTER TABLE ep_events 
ADD COLUMN end_time DATETIME NULL AFTER date_time;

-- Add place_name column (VARCHAR(255), nullable)
ALTER TABLE ep_events 
ADD COLUMN place_name VARCHAR(255) NULL AFTER location;

-- Add signup_link column (VARCHAR(500), nullable)
ALTER TABLE ep_events 
ADD COLUMN signup_link VARCHAR(500) NULL AFTER place_name;

-- Add manage_link column (VARCHAR(500), nullable)
ALTER TABLE ep_events 
ADD COLUMN manage_link VARCHAR(500) NULL AFTER signup_link;

-- Add event_view_link column (VARCHAR(500), nullable)
ALTER TABLE ep_events 
ADD COLUMN event_view_link VARCHAR(500) NULL AFTER manage_link;

-- Add index for efficient calendar queries (filtering public events by date)
CREATE INDEX idx_is_public_date_time ON ep_events (is_public, date_time);
