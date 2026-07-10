-- Guarantee every auth user has exactly one personal workspace with a subscription
-- before billing, checkout, or workspace flows rely on foundation data.

-- Remove duplicate personal workspaces (keep oldest per owner).
with primary_ws as (
  select distinct on (owner_id)
    id,
    owner_id
  from public.workspaces
  where type = 'personal'
  order by owner_id, created_at asc
),
duplicates as (
  select w.id, p.id as primary_id
  from public.workspaces w
  join primary_ws p on p.owner_id = w.owner_id
  where w.type = 'personal'
    and w.id <> p.id
)
update public.audits a
set workspace_id = d.primary_id
from duplicates d
where a.workspace_id = d.id;

with primary_ws as (
  select distinct on (owner_id)
    id,
    owner_id
  from public.workspaces
  where type = 'personal'
  order by owner_id, created_at asc
),
duplicates as (
  select w.id
  from public.workspaces w
  join primary_ws p on p.owner_id = w.owner_id
  where w.type = 'personal'
    and w.id <> p.id
)
delete from public.workspaces w
using duplicates d
where w.id = d.id;

create unique index if not exists workspaces_one_personal_per_owner_idx
  on public.workspaces (owner_id)
  where type = 'personal';

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

create or replace function public.bootstrap_business_foundation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  p_user_id uuid := auth.uid();
begin
  if p_user_id is null then
    raise exception 'Not authenticated';
  end if;

  return public.ensure_business_foundation(p_user_id);
end;
$$;

grant execute on function public.ensure_business_foundation(uuid) to service_role;

-- Backfill existing auth users missing a personal workspace or subscription.
do $$
declare
  u record;
begin
  for u in
    select au.id
    from auth.users au
    where not exists (
      select 1
      from public.workspaces w
      where w.owner_id = au.id
        and w.type = 'personal'
    )
       or not exists (
      select 1
      from public.workspaces w
      join public.subscriptions s on s.workspace_id = w.id
      where w.owner_id = au.id
        and w.type = 'personal'
    )
  loop
    perform public.ensure_business_foundation(u.id);
  end loop;
end;
$$;
