-- Migration: Add picture and description columns to ep_events table
-- Run this in PlanetScale development branch first, then promote to main

-- Add picture column (TEXT, nullable)
ALTER TABLE ep_events 
ADD COLUMN picture TEXT NULL;

-- Add description column (TEXT, nullable)
ALTER TABLE ep_events 
ADD COLUMN description TEXT NULL;

