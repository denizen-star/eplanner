-- Migration: Add Payment Terms fields to ep_events and ep_signups
-- Run in PlanetScale development branch first, then promote to main
--
-- Event fields: payment_info_enabled, payment_mode, total_event_cost, payment_due_date, collection_locked
-- Signup field: amount_due (fixed: stored at signup; split: populated when collection locked)

-- 1. Add payment columns to ep_events
ALTER TABLE ep_events
  ADD COLUMN payment_info_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN payment_mode VARCHAR(20) NULL,
  ADD COLUMN total_event_cost DECIMAL(10,2) NULL,
  ADD COLUMN payment_due_date DATE NULL,
  ADD COLUMN collection_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN collection_locked_at TIMESTAMP NULL;

-- 2. Add amount_due to ep_signups
ALTER TABLE ep_signups
  ADD COLUMN amount_due DECIMAL(10,2) NULL;
