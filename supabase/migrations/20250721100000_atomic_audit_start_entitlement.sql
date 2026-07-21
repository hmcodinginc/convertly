-- Atomic audit-start entitlement enforcement + logout draft conversion.
--
-- Problem: entitlement was only checked client-side (read-only) at audit start,
-- while consumption happens at completion. Concurrent starts (multiple tabs /
-- parallel HTTP requests) could all pass the client check, letting more audits
-- start and complete than the plan allows ("3 completed, 2 counted").
--
-- Fix: a BEFORE trigger on public.audits gates every transition INTO a running
-- state. It locks the workspace subscription row (FOR UPDATE), so concurrent
-- starts for the same workspace serialize, and counts in-flight running audits
-- as implicit reservations: used + in_flight must stay below the plan limit.
--
-- Properties:
--   * Atomic and database-authoritative (covers direct REST inserts too).
--   * Failed/stale audits leave the running set, releasing their reservation —
--     an interrupted run never consumes entitlement.
--   * Completion-time consumption (consume_completed_audit_entitlement) is
--     unchanged; since starts are capped, it can no longer be over-subscribed.

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
begin
  -- Only gate rows entering a running state.
  if new.status not in ('pending', 'crawling', 'analyzing') then
    return new;
  end if;

  if TG_OP = 'UPDATE' then
    -- Phase transitions within an already-running audit are not re-gated.
    if old.status in ('pending', 'crawling', 'analyzing') then
      return new;
    end if;
  end if;

  -- Lock the subscription row: concurrent starts serialize here.
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
    used_count := sub.lifetime_audits_used;
  else
    used_count := sub.period_audits_used;
  end if;

  -- Running audits are implicit reservations against the allowance.
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

comment on function public.enforce_audit_start_entitlement() is
  'Atomic audit-start gate: locks the subscription row and blocks starts when used + in-flight audits reach the plan limit.';

drop trigger if exists audits_enforce_start_entitlement on public.audits;

create trigger audits_enforce_start_entitlement
  before insert or update on public.audits
  for each row
  execute function public.enforce_audit_start_entitlement();

-- ---------------------------------------------------------------------------
-- Draft rows may only leave draft by starting a run (draft -> pending).
-- Protects logout draft conversion from stray writes by a still-running
-- client engine (which would otherwise flip the row back to crawling/failed).
-- ---------------------------------------------------------------------------

create or replace function public.enforce_draft_status_transitions()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'draft' and new.status not in ('draft', 'pending') then
    raise exception 'INVALID_AUDIT_STATUS_TRANSITION';
  end if;
  return new;
end;
$$;

comment on function public.enforce_draft_status_transitions() is
  'Draft audits can only transition to pending (run start) or stay draft.';

drop trigger if exists audits_draft_transition_guard on public.audits;

create trigger audits_draft_transition_guard
  before update on public.audits
  for each row
  execute function public.enforce_draft_status_transitions();

-- ---------------------------------------------------------------------------
-- Logout mid-audit: convert the current user's running audits into drafts.
-- The configuration (website_url, audit_type, workspace) lives on the same
-- row; half-run child rows are purged so a later draft start is a clean run.
-- No entitlement was consumed (consumption happens only at completion).
-- ---------------------------------------------------------------------------

create or replace function public.convert_my_running_audits_to_drafts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_count integer := 0;
  r record;
begin
  if v_uid is null then
    return 0;
  end if;

  for r in
    select id
    from public.audits
    where user_id = v_uid
      and status in ('pending', 'crawling', 'analyzing')
    for update skip locked
  loop
    delete from public.audit_pages where audit_id = r.id;
    delete from public.audit_findings where audit_id = r.id;
    delete from public.audit_scores where audit_id = r.id;
    delete from public.audit_history where audit_id = r.id;

    update public.audits
    set status = 'draft',
        error_message = null
    where id = r.id;

    insert into public.audit_history (audit_id, status, message)
    values (r.id, 'draft', 'Run interrupted by logout — configuration saved as draft');

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

comment on function public.convert_my_running_audits_to_drafts() is
  'Converts the current user''s in-flight audits to drafts (used on logout). Purges partial run data; keeps the saved configuration.';

revoke all on function public.convert_my_running_audits_to_drafts() from public;
grant execute on function public.convert_my_running_audits_to_drafts() to authenticated;
