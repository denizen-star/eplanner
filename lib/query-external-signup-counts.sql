-- Example queries for tracking eplanner (in-app) vs outside-ticketed signups
-- Requires migration-add-external-signup.sql to be applied first.

-- Per run: total, in-app, and external signups
SELECT
  run_id,
  COUNT(*) AS total,
  SUM(NOT external_signup) AS in_app,
  SUM(external_signup) AS external
FROM ep_signups
GROUP BY run_id;

-- All signups with external flag (for export or filtering)
SELECT id, run_id, name, email, waiver_accepted, external_signup, signed_at
FROM ep_signups
ORDER BY signed_at DESC;

-- Events that have at least one external signup
SELECT DISTINCT e.id, e.title, e.planner_name, e.date_time
FROM ep_events e
JOIN ep_signups s ON s.run_id = e.id
WHERE s.external_signup = TRUE;
