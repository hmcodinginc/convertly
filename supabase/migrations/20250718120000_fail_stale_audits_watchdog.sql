-- Fail audits stuck in a non-terminal status with no progress for ~15 minutes.
-- Uses existing audits.updated_at (maintained by trigger).
-- Does not touch draft, completed, or already-failed rows.
--
-- Idempotent: safe to re-apply. If pg_cron is unavailable, functions are still
-- created and the migration succeeds. Client RPC + optional Dashboard schedule
-- still cover cleanup.

create or replace function public.fail_stale_audits()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_count integer := 0;
  r record;
  v_message constant text := 'Audit was interrupted. Please run it again.';
begin
  for r in
    select id
    from public.audits
    where status in ('pending', 'crawling', 'analyzing')
      and updated_at < now() - interval '15 minutes'
    for update skip locked
  loop
    update public.audits
    set
      status = 'failed',
      error_message = v_message
    where id = r.id;

    insert into public.audit_history (audit_id, status, message)
    values (r.id, 'failed', v_message);

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$fn$;

comment on function public.fail_stale_audits() is
  'Marks non-terminal audits with no progress for 15+ minutes as failed.';

revoke all on function public.fail_stale_audits() from public;
grant execute on function public.fail_stale_audits() to service_role;

-- Per-user helper invoked by the app on audit list / session restore.
create or replace function public.fail_my_stale_audits()
returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_count integer := 0;
  r record;
  v_uid uuid := auth.uid();
  v_message constant text := 'Audit was interrupted. Please run it again.';
begin
  if v_uid is null then
    return 0;
  end if;

  for r in
    select id
    from public.audits
    where user_id = v_uid
      and status in ('pending', 'crawling', 'analyzing')
      and updated_at < now() - interval '15 minutes'
    for update skip locked
  loop
    update public.audits
    set
      status = 'failed',
      error_message = v_message
    where id = r.id;

    insert into public.audit_history (audit_id, status, message)
    values (r.id, 'failed', v_message);

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$fn$;

comment on function public.fail_my_stale_audits() is
  'Marks the current user stale non-terminal audits as failed.';

revoke all on function public.fail_my_stale_audits() from public;
grant execute on function public.fail_my_stale_audits() to authenticated;

-- Schedule via pg_cron when available. Named jobs upsert; never fail migration.
do $outer$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'fail-stale-audits',
      '*/5 * * * *',
      'select public.fail_stale_audits()'
    );
  else
    raise notice
      'pg_cron is not enabled; fail_stale_audits() was created but not scheduled. Enable pg_cron under Database → Extensions, then: select cron.schedule(''fail-stale-audits'', ''*/5 * * * *'', ''select public.fail_stale_audits()'');';
  end if;
exception
  when others then
    raise notice
      'Skipping cron schedule for fail-stale-audits (%). Function is still available.',
      SQLERRM;
end;
$outer$;
