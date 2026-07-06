-- Convertly V6 Business Foundation
-- Profiles, personal workspaces, subscriptions, preferences
-- Organization-ready schema (workspace_members) without org UI at launch

create type public.workspace_type as enum ('personal', 'organization');

create type public.workspace_member_role as enum ('owner', 'admin', 'member');

create type public.workspace_member_status as enum ('active', 'invited');

create type public.subscription_plan as enum ('free', 'starter', 'growth', 'scale');

create type public.subscription_status as enum (
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
  'unpaid'
);

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_email_idx on public.profiles (email);

-- ---------------------------------------------------------------------------
-- workspaces (personal at launch; organization type reserved)
-- ---------------------------------------------------------------------------

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  type public.workspace_type not null default 'personal',
  name text not null,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspaces_owner_id_idx on public.workspaces (owner_id);
create index workspaces_type_idx on public.workspaces (type);

-- ---------------------------------------------------------------------------
-- workspace_members (owner row at signup; future team invites)
-- ---------------------------------------------------------------------------

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_member_role not null default 'member',
  status public.workspace_member_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index workspace_members_workspace_id_idx on public.workspace_members (workspace_id);

-- ---------------------------------------------------------------------------
-- workspace_domains
-- ---------------------------------------------------------------------------

create table public.workspace_domains (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  hostname text not null,
  is_primary boolean not null default false,
  last_audited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, hostname)
);

create index workspace_domains_workspace_id_idx on public.workspace_domains (workspace_id);

-- ---------------------------------------------------------------------------
-- subscriptions (one per workspace; billing source of truth)
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  plan public.subscription_plan not null default 'free',
  status public.subscription_status not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  lifetime_audits_used integer not null default 0,
  period_audits_used integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;
create index subscriptions_stripe_subscription_id_idx on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- ---------------------------------------------------------------------------
-- notification_preferences
-- ---------------------------------------------------------------------------

create table public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  weekly_digest boolean not null default true,
  audit_complete_email boolean not null default true,
  score_drop_alerts boolean not null default true,
  score_drop_threshold integer not null default 65,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_preferences
-- ---------------------------------------------------------------------------

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- extend audits (non-destructive)
-- ---------------------------------------------------------------------------

alter table public.audits
  add column if not exists workspace_id uuid references public.workspaces (id) on delete set null;

create index if not exists audits_workspace_id_idx on public.audits (workspace_id);

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = ws_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  );
$$;

create or replace function public.get_personal_workspace_id(p_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select w.id
  from public.workspaces w
  where w.owner_id = p_user_id
    and w.type = 'personal'
  order by w.created_at asc
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- bootstrap new auth users
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
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

  insert into public.subscriptions (workspace_id, user_id, plan, status)
  values (new_workspace_id, new.id, 'free', 'active');

  insert into public.notification_preferences (user_id)
  values (new.id);

  insert into public.user_preferences (user_id)
  values (new.id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Backfill existing users missing foundation rows
create or replace function public.bootstrap_business_foundation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  p_user_id uuid := auth.uid();
  new_workspace_id uuid;
  existing_workspace_id uuid;
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
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

  select public.get_personal_workspace_id(p_user_id) into existing_workspace_id;

  if existing_workspace_id is null then
    insert into public.workspaces (type, name, owner_id)
    values ('personal', 'Personal Workspace', p_user_id)
    returning id into new_workspace_id;

    insert into public.workspace_members (workspace_id, user_id, role, status)
    values (new_workspace_id, p_user_id, 'owner', 'active')
    on conflict (workspace_id, user_id) do nothing;

    insert into public.subscriptions (workspace_id, user_id, plan, status)
    values (new_workspace_id, p_user_id, 'free', 'active')
    on conflict (workspace_id) do nothing;

    existing_workspace_id := new_workspace_id;
  end if;

  insert into public.notification_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  insert into public.user_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  update public.audits
  set workspace_id = existing_workspace_id
  where user_id = p_user_id
    and workspace_id is null;

  return existing_workspace_id;
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

  if sub.status not in ('active', 'trialing') then
    return false;
  end if;

  plan_limit := case sub.plan
    when 'free' then 2
    when 'starter' then 10
    when 'growth' then 30
    when 'scale' then 100
    else 0
  end;

  if sub.plan = 'free' then
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

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create trigger workspace_domains_updated_at
  before update on public.workspace_domains
  for each row execute function public.set_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create trigger notification_preferences_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_domains enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.user_preferences enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can view member workspaces"
  on public.workspaces for select
  using (public.is_workspace_member(id));

create policy "Owners can update personal workspaces"
  on public.workspaces for update
  using (auth.uid() = owner_id and type = 'personal')
  with check (auth.uid() = owner_id and type = 'personal');

create policy "Users can view workspace memberships"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

create policy "Users can manage workspace domains"
  on public.workspace_domains for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can view own notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view own user preferences"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update own user preferences"
  on public.user_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant execute on function public.bootstrap_business_foundation() to authenticated;
grant execute on function public.try_consume_audit_entitlement(uuid) to authenticated;
grant execute on function public.get_personal_workspace_id(uuid) to authenticated;
