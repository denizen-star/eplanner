-- Migration: Add coordinator_email column to ep_events table
-- Run this in PlanetScale development branch first, then promote to main
-- 
-- This migration adds a coordinator_email field to store the email address
-- of the event coordinator. This email will be used to send confirmation
-- emails when events are created, when people sign up, and when events are updated.

-- Add coordinator_email column (VARCHAR(255), NOT NULL)
-- Note: For existing records, you may need to update them with a valid email
-- before setting NOT NULL constraint. If you have existing events, run:
-- UPDATE ep_events SET coordinator_email = 'default@example.com' WHERE coordinator_email IS NULL;
-- Then uncomment the NOT NULL constraint below.

ALTER TABLE ep_events 
ADD COLUMN coordinator_email VARCHAR(255) NULL;

-- After updating existing records with valid emails, uncomment this to make it required:
-- ALTER TABLE ep_events 
-- MODIFY COLUMN coordinator_email VARCHAR(255) NOT NULL;

-- Optional: Add index for faster lookups if needed
-- CREATE INDEX idx_coordinator_email ON ep_events(coordinator_email);
