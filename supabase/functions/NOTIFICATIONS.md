# Email notifications

Transactional email is handled by the `email-notifications` edge function using
[Resend](https://resend.com). All sends are gated by each user's
`notification_preferences` row (Settings → Notifications), checked server-side
with the service-role client.

## Behavior

| Preference | Trigger | Email |
| --- | --- | --- |
| Audit complete | Client calls the function after an audit finishes | "Your audit for {domain} is complete" with Growth Score + report link |
| Score drop alerts | Checked in the same call | Sent only when the new score is below the user's threshold AND the previous completed audit for the same domain was at or above it (threshold crossing — no repeat alerts for every low run) |
| Weekly digest | Scheduled invocation with `?action=weekly_digest` | Past 7 days of completed audits with scores; users with no completed audits are skipped |

If `RESEND_API_KEY` is not configured, the function acknowledges requests
without sending anything — local development needs no email setup.

## Required secrets (Supabase → Edge Functions → Secrets)

| Secret | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key. Unset = email disabled (safe no-op). |
| `EMAIL_FROM` | Sender, e.g. `Convertly <notifications@yourdomain.com>`. The domain must be verified in Resend. Defaults to Resend's onboarding sender (only delivers to your own account's email — not production-ready). |
| `NOTIFICATIONS_CRON_SECRET` | Random string required by the weekly digest endpoint. Fail-closed: digest requests are rejected when unset. |
| `APP_URL` | Public app origin used for report links in the **weekly digest** (cron requests have no browser Origin). Must be the real hosted origin, no trailing slash. Audit-complete and score-drop links use the requesting browser's `Origin` header instead, so they are always correct for the host the user is actually on (production, staging, or localhost). |

## Deploy

```bash
supabase functions deploy email-notifications
```

`verify_jwt` is disabled in `config.toml` for this function because the weekly
digest is called by cron without a user JWT; the `audit_completed` action still
validates the caller's JWT in-function (same pattern as the payment functions).

## Scheduling the weekly digest

Create a cron job (Supabase Dashboard → Integrations → Cron, or `pg_cron` +
`pg_net`) that POSTs every Monday morning:

```sql
select cron.schedule(
  'convertly-weekly-digest',
  '0 8 * * 1',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/email-notifications?action=weekly_digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<NOTIFICATIONS_CRON_SECRET value>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Store the secret in Vault rather than inline if preferred. Until this job is
scheduled, weekly digests simply do not send; the other two emails work
without it.
