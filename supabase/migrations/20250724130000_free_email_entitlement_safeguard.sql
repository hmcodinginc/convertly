-- Free-tier email safeguard (does not replace subscription limits).
-- Survives auth user delete so delete → re-signup cannot reset free lifetime after use.
-- Unused free accounts (0 consumed) may reclaim free limits on return.

create table public.free_email_entitlement (
  email_normalized text primary key,
  lifetime_audits_used integer not null default 0
    check (lifetime_audits_used >= 0),
  last_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.free_email_entitlement is
  'Durable free-tier lifetime usage by normalized email. Survives account delete; unused (0) emails may reclaim free limits.';

create index free_email_entitlement_last_user_id_idx
  on public.free_email_entitlement (last_user_id)
  where last_user_id is not null;

alter table public.free_email_entitlement enable row level security;

-- No direct client access; security definer RPCs/triggers own reads/writes.
revoke all on table public.free_email_entitlement from authenticated;
revoke all on table public.free_email_entitlement from anon;
grant all on table public.free_email_entitlement to service_role;

create or replace function public.normalize_auth_email(p_email text)
returns text
language sql
immutable
as $$
  select lower(trim(coalesce(p_email, '')));
$$;

comment on function public.normalize_auth_email(text) is
  'Normalize auth/profile emails for free-tier entitlement matching.';

create or replace function public.resolve_user_email_normalized(p_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  select public.normalize_auth_email(u.email)
  into v_email
  from auth.users u
  where u.id = p_user_id;

  if v_email is not null and v_email <> '' then
    return v_email;
  end if;

  select public.normalize_auth_email(p.email)
  into v_email
  from public.profiles p
  where p.id = p_user_id;

  return coalesce(v_email, '');
end;
$$;

create or replace function public.get_free_email_lifetime_used(p_email text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select e.lifetime_audits_used
      from public.free_email_entitlement e
      where e.email_normalized = public.normalize_auth_email(p_email)
    ),
    0
  );
$$;

create or replace function public.record_free_email_audit_consume(
  p_email text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := public.normalize_auth_email(p_email);
begin
  if v_email = '' then
    return;
  end if;

  insert into public.free_email_entitlement (
    email_normalized,
    lifetime_audits_used,
    last_user_id
  )
  values (v_email, 1, p_user_id)
  on conflict (email_normalized) do update
  set
    lifetime_audits_used = public.free_email_entitlement.lifetime_audits_used + 1,
    last_user_id = excluded.last_user_id,
    updated_at = now();
end;
$$;

-- Seed / raise free subscription counters from durable email usage (never lowers).
create or replace function public.sync_free_subscription_from_email(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_used integer;
begin
  if p_user_id is null then
    return;
  end if;

  v_email := public.resolve_user_email_normalized(p_user_id);
  if v_email = '' then
    return;
  end if;

  v_used := public.get_free_email_lifetime_used(v_email);

  -- Touch last_user_id without inventing usage for unused emails.
  insert into public.free_email_entitlement (
    email_normalized,
    lifetime_audits_used,
    last_user_id
  )
  values (v_email, v_used, p_user_id)
  on conflict (email_normalized) do update
  set
    last_user_id = excluded.last_user_id,
    updated_at = now();

  if v_used <= 0 then
    return;
  end if;

  update public.subscriptions s
  set
    lifetime_audits_used = greatest(s.lifetime_audits_used, v_used),
    updated_at = now()
  where s.user_id = p_user_id
    and s.plan = 'free';
end;
$$;

comment on function public.sync_free_subscription_from_email(uuid) is
  'Raises free subscription lifetime_audits_used to match durable email usage after signup/recreate.';

-- ---------------------------------------------------------------------------
-- Signup: seed free subscription from email ledger
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  v_email text := public.normalize_auth_email(new.email);
  v_free_used integer := 0;
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'firstName', ''),
    coalesce(new.raw_user_meta_data ->> 'lastName', '')
  );

  insert into public.workspaces (type, name, owner_id)
  values ('personal', 'Personal Workspace', new.id)
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (new_workspace_id, new.id, 'owner', 'active');

  if v_email <> '' then
    v_free_used := public.get_free_email_lifetime_used(v_email);

    insert into public.free_email_entitlement (
      email_normalized,
      lifetime_audits_used,
      last_user_id
    )
    values (v_email, v_free_used, new.id)
    on conflict (email_normalized) do update
    set
      last_user_id = excluded.last_user_id,
      updated_at = now();
  end if;

  insert into public.subscriptions (
    workspace_id,
    user_id,
    plan,
    status,
    lifetime_audits_used
  )
  values (
    new_workspace_id,
    new.id,
    'free',
    'active',
    v_free_used
  );

  insert into public.notification_preferences (user_id)
  values (new.id);

  insert into public.user_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Foundation bootstrap: sync after ensure (covers recreate / legacy paths)
-- ---------------------------------------------------------------------------

create or replace function public.ensure_business_foundation(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_workspace_id uuid;
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  if auth.role() is distinct from 'service_role'
     and auth.uid() is not null
     and auth.uid() is distinct from p_user_id then
    raise exception 'Not authorized';
  end if;

  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'User not found';
  end if;

  insert into public.profiles (id, email, first_name, last_name)
  select
    u.id,
    coalesce(u.email, ''),
    coalesce(u.raw_user_meta_data ->> 'firstName', ''),
    coalesce(u.raw_user_meta_data ->> 'lastName', '')
  from auth.users u
  where u.id = p_user_id
  on conflict (id) do nothing;

  select public.get_personal_workspace_id(p_user_id) into resolved_workspace_id;

  if resolved_workspace_id is null then
    insert into public.workspaces (type, name, owner_id)
    values ('personal', 'Personal Workspace', p_user_id)
    returning id into resolved_workspace_id;
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (resolved_workspace_id, p_user_id, 'owner', 'active')
  on conflict (workspace_id, user_id) do nothing;

  insert into public.subscriptions (workspace_id, user_id, plan, status)
  values (resolved_workspace_id, p_user_id, 'free', 'active')
  on conflict (workspace_id) do nothing;

  perform public.sync_free_subscription_from_email(p_user_id);

  insert into public.notification_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  update public.audits
  set workspace_id = resolved_workspace_id
  where user_id = p_user_id
    and workspace_id is null;

  return resolved_workspace_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Start gate: free plan uses max(subscription, email) usage
-- ---------------------------------------------------------------------------

create or replace function public.enforce_audit_start_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sub record;
  active_override public.override_plan;
  effective_plan text;
  plan_limit integer;
  used_count integer;
  in_flight integer;
  v_email text;
  email_used integer := 0;
begin
  if new.status not in ('pending', 'crawling', 'analyzing') then
    return new;
  end if;

  if TG_OP = 'UPDATE' then
    if old.status in ('pending', 'crawling', 'analyzing') then
      return new;
    end if;
  end if;

  if new.workspace_id is not null then
    select *
    into sub
    from public.subscriptions s
    where s.workspace_id = new.workspace_id
    for update;
  end if;

  if new.workspace_id is null or not found then
    select *
    into sub
    from public.subscriptions s
    where s.user_id = new.user_id
    order by s.created_at
    limit 1
    for update;
  end if;

  if not found then
    raise exception 'AUDIT_SUBSCRIPTION_MISSING';
  end if;

  active_override := public.get_active_plan_override(sub.user_id);

  if active_override is not null then
    effective_plan := active_override::text;
  else
    if sub.status not in ('active', 'trialing') then
      raise exception 'AUDIT_SUBSCRIPTION_INACTIVE';
    end if;

    effective_plan := sub.plan::text;
  end if;

  plan_limit := public.audit_limit_for_plan(effective_plan);

  if effective_plan = 'free' then
    v_email := public.resolve_user_email_normalized(new.user_id);
    email_used := public.get_free_email_lifetime_used(v_email);
    used_count := greatest(sub.lifetime_audits_used, email_used);

    -- Keep subscription counter aligned with durable email usage.
    if email_used > sub.lifetime_audits_used then
      update public.subscriptions
      set
        lifetime_audits_used = email_used,
        updated_at = now()
      where workspace_id = sub.workspace_id;
    end if;
  else
    used_count := sub.period_audits_used;
  end if;

  select count(*)::integer
  into in_flight
  from public.audits a
  where a.user_id = new.user_id
    and a.status in ('pending', 'crawling', 'analyzing')
    and a.entitlement_consumed_at is null
    and a.id is distinct from new.id;

  if used_count + in_flight >= plan_limit then
    raise exception 'AUDIT_LIMIT_REACHED';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Consume: bump subscription + durable email usage for free plan
-- ---------------------------------------------------------------------------

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
  v_email text;
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
    v_email := public.resolve_user_email_normalized(audit_row.user_id);

    if greatest(sub.lifetime_audits_used, public.get_free_email_lifetime_used(v_email)) >= plan_limit then
      return false;
    end if;

    update public.subscriptions
    set lifetime_audits_used = lifetime_audits_used + 1
    where workspace_id = audit_row.workspace_id;

    perform public.record_free_email_audit_consume(v_email, audit_row.user_id);
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

-- Backfill from current free subscriptions so existing usage is protected.
insert into public.free_email_entitlement (
  email_normalized,
  lifetime_audits_used,
  last_user_id
)
select
  public.normalize_auth_email(p.email) as email_normalized,
  max(s.lifetime_audits_used)::integer as lifetime_audits_used,
  (array_agg(s.user_id order by s.lifetime_audits_used desc, s.updated_at desc))[1] as last_user_id
from public.subscriptions s
join public.profiles p on p.id = s.user_id
where s.plan = 'free'
  and public.normalize_auth_email(p.email) <> ''
group by public.normalize_auth_email(p.email)
on conflict (email_normalized) do update
set
  lifetime_audits_used = greatest(
    public.free_email_entitlement.lifetime_audits_used,
    excluded.lifetime_audits_used
  ),
  last_user_id = coalesce(excluded.last_user_id, public.free_email_entitlement.last_user_id),
  updated_at = now();
