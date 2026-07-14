-- User-selected next plan after cancelling a domestic-card Razorpay subscription.
-- Applied via checkout once the current subscription ends (client-driven UX).

alter table public.subscriptions
  add column if not exists pending_plan public.subscription_plan null;

comment on column public.subscriptions.pending_plan is
  'Convertly plan the user chose to subscribe to after their current subscription ends.';

create or replace function public.set_subscription_pending_plan(
  p_pending_plan public.subscription_plan
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if p_pending_plan is not null and p_pending_plan = 'free' then
    raise exception 'Invalid pending plan';
  end if;

  update public.subscriptions
  set
    pending_plan = p_pending_plan,
    updated_at = now()
  where user_id = auth.uid();

  if not found then
    raise exception 'Subscription not found';
  end if;
end;
$$;

grant execute on function public.set_subscription_pending_plan(public.subscription_plan) to authenticated;
