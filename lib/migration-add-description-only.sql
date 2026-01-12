-- Migration: Add description column only (picture already exists)
-- Run this in PlanetScale development branch first, then promote to main

-- Check if description column exists first, then add it
-- Note: If you get "Duplicate column" error, the column already exists

ALTER TABLE ep_events 
ADD COLUMN description TEXT NULL;







