-- HM Coding internal plan overrides (database-backed; no hardcoded allowlists)

create type public.override_plan as enum ('starter', 'growth', 'scale', 'internal');

create table public.user_plan_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  override_plan public.override_plan not null,
  enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_plan_overrides_user_id_idx on public.user_plan_overrides (user_id);

create unique index user_plan_overrides_one_active_per_user_idx
  on public.user_plan_overrides (user_id)
  where enabled = true;

comment on table public.user_plan_overrides is
  'HM Coding internal access grants. One enabled override per user. Managed via admin/SQL until admin UI exists.';

-- Returns the active override plan for a user, or null when none applies.
create or replace function public.get_active_plan_override(p_user_id uuid)
returns public.override_plan
language sql
stable
security definer
set search_path = public
as $$
  select o.override_plan
  from public.user_plan_overrides o
  where o.user_id = p_user_id
    and o.enabled = true
  limit 1;
$$;

create or replace function public.audit_limit_for_plan(p_plan text)
returns integer
language sql
immutable
as $$
  select case p_plan
    when 'free' then 2
    when 'starter' then 10
    when 'growth' then 30
    when 'scale' then 100
    when 'internal' then 500
    else 0
  end;
$$;

-- Atomically reserve an audit slot (returns false when limit reached)
create or replace function public.try_consume_audit_entitlement(p_workspace_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  sub record;
  active_override public.override_plan;
  effective_plan text;
  plan_limit integer;
begin
  if not public.is_workspace_member(p_workspace_id) then
    return false;
  end if;

  select *
  into sub
  from public.subscriptions s
  where s.workspace_id = p_workspace_id
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
    where workspace_id = p_workspace_id;

    return true;
  end if;

  if sub.period_audits_used >= plan_limit then
    return false;
  end if;

  update public.subscriptions
  set period_audits_used = period_audits_used + 1
  where workspace_id = p_workspace_id;

  return true;
end;
$$;

create trigger user_plan_overrides_updated_at
  before update on public.user_plan_overrides
  for each row execute function public.set_updated_at();

alter table public.user_plan_overrides enable row level security;

create policy "Users can view own plan override"
  on public.user_plan_overrides for select
  using (auth.uid() = user_id);

grant execute on function public.get_active_plan_override(uuid) to authenticated;
grant execute on function public.audit_limit_for_plan(text) to authenticated;
