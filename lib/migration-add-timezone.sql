-- Migration: Add timezone column to ep_events table
-- Run this in PlanetScale development branch first, then promote to main
-- 
-- This migration adds a timezone field to store the IANA timezone identifier
-- (e.g., "America/New_York", "Europe/London") for the timezone where the event
-- was created. This allows event times to be displayed correctly in the original
-- timezone regardless of the viewer's location.

ALTER TABLE ep_events 
ADD COLUMN timezone VARCHAR(50) NULL AFTER date_time;
