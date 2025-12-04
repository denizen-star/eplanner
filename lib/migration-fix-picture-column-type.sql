-- Migration: Change picture column from TEXT to LONGTEXT
-- TEXT can only store up to 65KB, which is too small for base64 encoded images
-- LONGTEXT can store up to 4GB, which is sufficient for compressed base64 images
-- Run this in PlanetScale development branch first, then promote to main

ALTER TABLE ep_events 
MODIFY COLUMN picture LONGTEXT NULL;

-- Note: description stays as TEXT since 65KB is plenty for text descriptions

