# Operations runbook

Minimum operational tooling for launch. All statements run in the Supabase
SQL Editor (service role — bypasses RLS). Replace `<...>` placeholders before
running. Related scripts in this folder: `user_plan_overrides.example.sql`
(plan overrides), `audit-orphan-subscriptions.ts` (report-only orphan check).

## Look up a user

```sql
select id, email, created_at from auth.users where email = '<email>';
```

Workspace + subscription for a user:

```sql
select w.id as workspace_id, s.id as subscription_id, s.plan, s.status,
       s.period_audits_used, s.lifetime_audits_used,
       s.current_period_start, s.current_period_end
from public.workspaces w
join public.subscriptions s on s.workspace_id = w.id
where w.owner_id = '<USER_UUID>'::uuid;
```

## Plan overrides

Use `user_plan_overrides.example.sql`. Overrides take precedence over the
Razorpay-synced plan and are the supported way to grant internal/QA access.

## Subscription corrections

Fix a subscription whose state drifted from the provider (always verify in
the Razorpay dashboard first):

```sql
-- Set plan/status manually (e.g. webhook missed):
update public.subscriptions
set plan = '<free|starter|growth|scale>', status = 'active'
where id = '<SUBSCRIPTION_UUID>'::uuid;

-- Reset period usage (e.g. after support decision):
update public.subscriptions
set period_audits_used = 0
where id = '<SUBSCRIPTION_UUID>'::uuid;
```

Note: `period_audits_used` is also derived from the entitlement ledger by the
start-entitlement trigger — correct the ledger too when refunding an audit:

```sql
-- Refund one consumed audit (removes the newest ledger row for the audit):
delete from public.audit_entitlement_ledger
where audit_id = '<AUDIT_UUID>'::uuid;
```

## Audit cleanup

```sql
-- Find stuck audits (should be rare; the stale watchdog fails them automatically):
select id, user_id, website_url, status, updated_at
from public.audits
where status in ('pending', 'crawling', 'analyzing')
  and updated_at < now() - interval '30 minutes';

-- Force-fail a stuck audit:
update public.audits
set status = 'failed', error_message = 'Marked failed by operator'
where id = '<AUDIT_UUID>'::uuid;

-- Delete an audit and all child data (pages/findings/scores/history cascade):
delete from public.audits where id = '<AUDIT_UUID>'::uuid;
```

## Product analytics queries

Events live in `public.product_events` (no user-facing select access).

```sql
-- Daily event counts, last 14 days:
select date_trunc('day', created_at) as day, event, count(*)
from public.product_events
where created_at > now() - interval '14 days'
group by 1, 2
order by 1 desc, 3 desc;

-- Checkout funnel, last 30 days:
select event, count(distinct user_id) as users
from public.product_events
where event in ('checkout_started', 'plan_activated')
  and created_at > now() - interval '30 days'
group by event;

-- Audit failure rate, last 7 days:
select
  count(*) filter (where event = 'audit_failed')::numeric
    / nullif(count(*) filter (where event in ('audit_completed', 'audit_failed')), 0)
    as failure_rate
from public.product_events
where created_at > now() - interval '7 days';
```

## Where to look when something breaks

| Symptom | Where |
| --- | --- |
| Client errors | Sentry (if `VITE_SENTRY_DSN` configured) |
| Edge function failures (payments, audit-fetch/render, emails) | Supabase Dashboard → Edge Functions → Logs; payment-webhook logs structured JSON with `eventType` |
| Render worker issues | Hosting platform logs (Render/Fly); `GET /health` for liveness |
| Email delivery | Resend dashboard → Logs |
| Webhook signature failures | Supabase logs + Razorpay dashboard → Webhooks |
