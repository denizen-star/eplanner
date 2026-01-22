-- Migration: Add event_website and event_instagram columns to ep_events table
-- Run this in PlanetScale development branch first, then promote to main

ALTER TABLE ep_events
ADD COLUMN event_website VARCHAR(500) NULL,
ADD COLUMN event_instagram VARCHAR(500) NULL;

-- Add indexes for potential future filtering/searching
CREATE INDEX idx_event_website ON ep_events(event_website(255));
CREATE INDEX idx_event_instagram ON ep_events(event_instagram(255));
