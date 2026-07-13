-- Scheduled downgrade metadata (Razorpay cycle_end plan changes).
-- Live entitlements remain on subscriptions.plan until the schedule applies.

alter table public.subscriptions
  add column if not exists scheduled_plan public.subscription_plan null,
  add column if not exists scheduled_change_at timestamptz null;

comment on column public.subscriptions.scheduled_plan is
  'Target Convertly plan after a scheduled Razorpay downgrade (cycle_end).';

comment on column public.subscriptions.scheduled_change_at is
  'When Razorpay will apply scheduled_plan (from change_scheduled_at).';
