-- Track which payment provider owns external subscription IDs.
alter table public.subscriptions
  add column if not exists payment_provider text not null default 'razorpay';

comment on column public.subscriptions.payment_provider is
  'Active payment provider for external IDs stored in stripe_* columns (razorpay | stripe).';

comment on column public.subscriptions.stripe_customer_id is
  'External payment provider customer ID (Razorpay cust_* or Stripe cus_*).';

comment on column public.subscriptions.stripe_subscription_id is
  'External payment provider subscription ID (Razorpay sub_* or Stripe sub_*).';

comment on column public.subscriptions.stripe_price_id is
  'External payment provider plan/price ID (Razorpay plan_* or Stripe price_*).';
