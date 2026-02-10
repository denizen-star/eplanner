-- Migration: Add app_member_id and session_id to ep_signups for newsletter linkage
-- Run in PlanetScale development branch first, then promote to main
--
-- app_member_id: set after newsletter opt-in (upsertWeeklyMember returns member id)
-- session_id: stored at signup time for analytics/identity

ALTER TABLE ep_signups
  ADD COLUMN app_member_id BIGINT NULL AFTER metadata,
  ADD COLUMN session_id VARCHAR(255) NULL AFTER app_member_id;

CREATE INDEX idx_signups_app_member_id ON ep_signups (app_member_id);
