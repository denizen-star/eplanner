-- Migration: Add external_signup column to ep_signups table
-- Run this in PlanetScale development branch first, then promote to main
--
-- Used to track in-app (eplanner) signups vs outside-ticketed signups.
-- When true, the attendee chose "sign up on coordinator's website" and
-- we opened event_website in a new tab after collecting waiver + contact.

ALTER TABLE ep_signups
ADD COLUMN external_signup BOOLEAN DEFAULT FALSE AFTER waiver_accepted;

CREATE INDEX idx_external_signup ON ep_signups (external_signup);
