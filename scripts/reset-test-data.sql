-- Manual testing utility — NOT a migration.
-- Resets audit entitlement consumption only.
-- Keeps audits, reports, findings, screenshots, users, and workspaces intact.
--
-- Usage (linked remote or local):
--   supabase db query --linked -f scripts/reset-test-data.sql
--   supabase db query --local  -f scripts/reset-test-data.sql
--
-- Or paste into the Supabase SQL editor.

update public.subscriptions
set
  lifetime_audits_used = 0,
  period_audits_used = 0;

update public.audits
set entitlement_consumed_at = null
where entitlement_consumed_at is not null;

delete from public.audit_entitlement_ledger;
