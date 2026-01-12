-- Check if columns exist in ep_events table
-- Run this to see the current table structure

DESCRIBE ep_events;

-- Or use this to check for specific columns:
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'ep_events' 
AND COLUMN_NAME IN ('picture', 'description');







