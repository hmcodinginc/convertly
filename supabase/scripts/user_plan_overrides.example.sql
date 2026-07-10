-- Manual plan override examples for Supabase SQL Editor
-- Requires migration: 20250707120000_user_plan_overrides.sql
--
-- Find a user id:
--   select id, email from auth.users where email = 'you@example.com';

-- ---------------------------------------------------------------------------
-- Harmit — internal access (replace placeholders before running)
-- ---------------------------------------------------------------------------

-- insert into public.user_plan_overrides (user_id, email, override_plan, enabled, notes)
-- values (
--   '<HARMIT_USER_UUID>'::uuid,
--   'harmit@hmcoding.com',
--   'internal',
--   true,
--   'HM Coding — founder internal access'
-- );

-- ---------------------------------------------------------------------------
-- Other examples
-- ---------------------------------------------------------------------------

-- Intern / QA on Growth entitlements:
-- insert into public.user_plan_overrides (user_id, email, override_plan, enabled, notes)
-- values (
--   '<USER_UUID>'::uuid,
--   'intern@hmcoding.com',
--   'growth',
--   true,
--   'HM Coding intern account'
-- );

-- Disable an override (does not delete history):
-- update public.user_plan_overrides
-- set enabled = false, notes = coalesce(notes, '') || ' — disabled ' || now()::text
-- where user_id = '<USER_UUID>'::uuid and enabled = true;

-- Verify active override:
-- select * from public.user_plan_overrides where user_id = '<USER_UUID>'::uuid;
