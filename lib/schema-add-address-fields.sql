-- Migration: Add address component fields to ep_events table
-- Run this in PlanetScale development branch first, then promote to main
-- For existing databases

ALTER TABLE ep_events
ADD COLUMN house_number VARCHAR(50) AFTER status,
ADD COLUMN road VARCHAR(255) AFTER house_number,
ADD COLUMN suburb VARCHAR(255) AFTER road,
ADD COLUMN city VARCHAR(255) AFTER suburb,
ADD COLUMN county VARCHAR(255) AFTER city,
ADD COLUMN state VARCHAR(255) AFTER county,
ADD COLUMN postcode VARCHAR(20) AFTER state,
ADD COLUMN country VARCHAR(255) AFTER postcode,
ADD COLUMN country_code VARCHAR(5) AFTER country,
ADD COLUMN neighbourhood VARCHAR(255) AFTER country_code,
ADD COLUMN city_district VARCHAR(255) AFTER neighbourhood,
ADD COLUMN village VARCHAR(255) AFTER city_district,
ADD COLUMN town VARCHAR(255) AFTER village,
ADD COLUMN municipality VARCHAR(255) AFTER town,
ADD INDEX idx_city (city),
ADD INDEX idx_state (state),
ADD INDEX idx_postcode (postcode);



