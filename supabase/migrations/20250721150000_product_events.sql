-- Lightweight first-party product analytics.
--
-- Events are written by the client (insert-only for authenticated users on
-- their own rows) and read only via service role / SQL — there is no select
-- grant, so users can never read event data.

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.product_events is
  'First-party product analytics events (audit_started, checkout_started, ...). Insert-only from the client; queried via service role.';

create index if not exists product_events_event_created_at_idx
  on public.product_events (event, created_at desc);

create index if not exists product_events_user_id_idx
  on public.product_events (user_id);

alter table public.product_events enable row level security;

grant insert on public.product_events to authenticated;

create policy "Users can insert own product events"
  on public.product_events for insert
  with check (auth.uid() = user_id);
