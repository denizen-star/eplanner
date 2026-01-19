-- Update existing events to be public
-- Run this in PlanetScale production database

UPDATE ep_events 
SET is_public = TRUE 
WHERE id IN (
  'Fmc44zz',
  'U3S8hvD',
  'OlYwQUd',
  'UsLPL2v',
  'GGeCO6p',
  '1jGVtgy',
  'JX6XeG8',
  'JMS1Uy4'
);
