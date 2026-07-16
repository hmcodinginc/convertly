-- Durable audit entitlement ledger.
-- Preserves URL, audit type, and completion metadata when an audit row is deleted.
-- Consumption reset for testing lives in scripts/reset-test-data.sql (not in migrations).

create table public.audit_entitlement_ledger (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references public.audits (id) on delete set null,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  website_url text not null,
  audit_type text not null,
  completed_at timestamptz not null,
  consumed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index audit_entitlement_ledger_audit_id_uidx
  on public.audit_entitlement_ledger (audit_id)
  where audit_id is not null;

create index audit_entitlement_ledger_workspace_id_idx
  on public.audit_entitlement_ledger (workspace_id);

create index audit_entitlement_ledger_user_id_idx
  on public.audit_entitlement_ledger (user_id);

comment on table public.audit_entitlement_ledger is
  'Immutable snapshot of counted audit consumption. Survives audit deletion for usage ledger display.';

alter table public.audit_entitlement_ledger enable row level security;

create policy "Users can view own audit entitlement ledger"
  on public.audit_entitlement_ledger
  for select
  using (auth.uid() = user_id);

grant select on public.audit_entitlement_ledger to authenticated;

create or replace function public.consume_completed_audit_entitlement(p_audit_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_row record;
  sub record;
  active_override public.override_plan;
  effective_plan text;
  plan_limit integer;
  consumed_timestamp timestamptz := now();
begin
  select *
  into audit_row
  from public.audits a
  where a.id = p_audit_id
  for update;

  if not found then
    return false;
  end if;

  if audit_row.user_id <> auth.uid() then
    return false;
  end if;

  if audit_row.status <> 'completed' then
    return false;
  end if;

  if audit_row.entitlement_consumed_at is not null then
    return true;
  end if;

  if audit_row.workspace_id is null then
    return false;
  end if;

  select *
  into sub
  from public.subscriptions s
  where s.workspace_id = audit_row.workspace_id
  for update;

  if not found then
    return false;
  end if;

  active_override := public.get_active_plan_override(sub.user_id);

  if active_override is not null then
    effective_plan := active_override::text;
  else
    if sub.status not in ('active', 'trialing') then
      return false;
    end if;

    effective_plan := sub.plan::text;
  end if;

  plan_limit := public.audit_limit_for_plan(effective_plan);

  if effective_plan = 'free' then
    if sub.lifetime_audits_used >= plan_limit then
      return false;
    end if;

    update public.subscriptions
    set lifetime_audits_used = lifetime_audits_used + 1
    where workspace_id = audit_row.workspace_id;
  else
    if sub.period_audits_used >= plan_limit then
      return false;
    end if;

    update public.subscriptions
    set period_audits_used = period_audits_used + 1
    where workspace_id = audit_row.workspace_id;
  end if;

  update public.audits
  set entitlement_consumed_at = consumed_timestamp
  where id = p_audit_id
    and entitlement_consumed_at is null;

  insert into public.audit_entitlement_ledger (
    audit_id,
    workspace_id,
    user_id,
    website_url,
    audit_type,
    completed_at,
    consumed_at
  )
  values (
    audit_row.id,
    audit_row.workspace_id,
    audit_row.user_id,
    audit_row.website_url,
    audit_row.audit_type,
    audit_row.updated_at,
    consumed_timestamp
  )
  on conflict (audit_id) where audit_id is not null do nothing;

  return true;
end;
$$;

grant execute on function public.consume_completed_audit_entitlement(uuid) to authenticated;
