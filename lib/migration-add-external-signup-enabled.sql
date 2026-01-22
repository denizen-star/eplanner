-- Migration: Add external_signup_enabled column to ep_events table
-- Run this in PlanetScale development branch first, then promote to main
--
-- When true, coordinator has marked the event website URL as the external
-- signup destination (e.g. Ticketmaster, Eventbrite). Attendees see the
-- external signup notice + checkbox; submit opens that URL in a new tab.

ALTER TABLE ep_events
ADD COLUMN external_signup_enabled BOOLEAN DEFAULT FALSE AFTER event_instagram;

CREATE INDEX idx_external_signup_enabled ON ep_events (external_signup_enabled);
