-- Update existing events to set app_name = 'eplanner' (default)
-- This is included in migration-add-app-name.sql but provided separately for reference
-- Run this if you need to update existing events after the migration

UPDATE ep_events 
SET app_name = 'eplanner' 
WHERE app_name IS NULL;
