-- The email-notifications Edge Function reads notification preferences, audits,
-- and audit scores server-side via the service_role admin client (PostgREST).
--
-- In this project tables carry no default service_role privileges: migration
-- 20250707140000 granted business tables to authenticated only, and
-- 20250707160000 added service_role grants for exactly the tables the payment
-- functions touch (workspaces, subscriptions). service_role bypasses RLS but
-- NOT table-level GRANTs, so selects on any other table fail with Postgres
-- 42501 ("permission denied") before RLS is ever evaluated.
--
-- email-notifications needs:
--   - notification_preferences: gate sends on the user's toggles
--   - audits: verify ownership/status, find previous audit for score-drop
--   - audit_scores: resolve Growth Score for email content

grant select on table public.notification_preferences to service_role;

grant select on table public.audits to service_role;

grant select on table public.audit_scores to service_role;
