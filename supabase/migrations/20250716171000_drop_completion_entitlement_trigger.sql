-- Remove orphaned completion trigger that still called the dropped legacy RPC.
-- This trigger was applied out-of-band (not present in the current migration tree)
-- and is the remaining dependency on try_consume_audit_entitlement.

drop trigger if exists audits_consume_entitlement_on_complete on public.audits;
drop function if exists public.consume_audit_entitlement_on_completion();

-- Legacy boolean columns from the same out-of-band migration.
-- Consumption is owned solely by entitlement_consumed_at + consume_completed_audit_entitlement.
alter table public.audits
  drop column if exists entitlement_consumed;

alter table public.audits
  drop column if exists consumes_entitlement;
