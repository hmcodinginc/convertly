-- Edge Functions use the service_role key for direct PostgREST table access.
-- Migration 20250707140000 granted business foundation tables to authenticated only.
-- SECURITY DEFINER RPCs (ensure_business_foundation) succeed without table GRANTs,
-- but loadWorkspaceContext() SELECTs workspaces/subscriptions via the admin client
-- and requires explicit service_role privileges (Postgres 42501 otherwise).

grant select on table public.workspaces to service_role;

grant select, update on table public.subscriptions to service_role;
