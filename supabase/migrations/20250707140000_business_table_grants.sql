-- Business foundation tables were created with RLS policies but without table-level
-- GRANTs for the authenticated role. Postgres returns "permission denied for table …"
-- before RLS is evaluated when role privileges are missing.

grant select, update on table public.profiles to authenticated;

grant select, update on table public.workspaces to authenticated;

grant select on table public.workspace_members to authenticated;

grant select, insert, update, delete on table public.workspace_domains to authenticated;

grant select on table public.subscriptions to authenticated;

grant select, update on table public.notification_preferences to authenticated;

grant select, update on table public.user_preferences to authenticated;

grant select on table public.user_plan_overrides to authenticated;

-- Personal workspace owners created before membership backfill may lack a member row,
-- causing is_workspace_member() to fail RLS checks on workspace_domains.
insert into public.workspace_members (workspace_id, user_id, role, status)
select w.id, w.owner_id, 'owner', 'active'
from public.workspaces w
where w.type = 'personal'
  and not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = w.id
      and wm.user_id = w.owner_id
  )
on conflict (workspace_id, user_id) do nothing;

-- Ensure bootstrap always creates membership for existing personal workspaces.
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

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (existing_workspace_id, p_user_id, 'owner', 'active')
  on conflict (workspace_id, user_id) do nothing;

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
