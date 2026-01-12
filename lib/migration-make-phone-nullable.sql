-- Migration: Make phone column nullable in ep_signups and ep_waivers tables
-- Run this in PlanetScale development branch first, then promote to main
-- 
-- This migration makes the phone/participant_phone columns nullable to support
-- the new validation logic where at least one of phone or email is required
-- (but not necessarily both).

-- Make phone nullable in ep_signups table
ALTER TABLE ep_signups 
MODIFY COLUMN phone VARCHAR(20) NULL;

-- Make participant_phone nullable in ep_waivers table
ALTER TABLE ep_waivers 
MODIFY COLUMN participant_phone VARCHAR(20) NULL;
