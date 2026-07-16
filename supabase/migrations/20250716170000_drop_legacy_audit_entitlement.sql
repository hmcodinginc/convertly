-- Remove workspace-scoped legacy entitlement consumption.
-- Audit usage may only increment via consume_completed_audit_entitlement(audit_id).

revoke execute on function public.try_consume_audit_entitlement(uuid) from authenticated;
revoke execute on function public.try_consume_audit_entitlement(uuid) from service_role;

drop function if exists public.try_consume_audit_entitlement(uuid);
