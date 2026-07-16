alter table public.audits
  add column if not exists entitlement_consumed_at timestamptz null;

comment on column public.audits.entitlement_consumed_at is
  'Timestamp when this audit successfully consumed entitlement. Null means not counted.';

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
  set entitlement_consumed_at = now()
  where id = p_audit_id
    and entitlement_consumed_at is null;

  return true;
end;
$$;

grant execute on function public.consume_completed_audit_entitlement(uuid) to authenticated;
