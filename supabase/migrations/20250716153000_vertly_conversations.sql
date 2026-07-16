create table if not exists public.vertly_conversations (
  user_id uuid primary key references auth.users (id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.vertly_conversations is
  'Per-user Vertly conversation history. Messages are stored as a bounded JSON array for launch.';

create trigger vertly_conversations_updated_at
  before update on public.vertly_conversations
  for each row execute function public.set_updated_at();

alter table public.vertly_conversations enable row level security;

grant select, insert, update, delete on public.vertly_conversations to authenticated;

create policy "Users can view own Vertly conversation"
  on public.vertly_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own Vertly conversation"
  on public.vertly_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own Vertly conversation"
  on public.vertly_conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own Vertly conversation"
  on public.vertly_conversations for delete
  using (auth.uid() = user_id);
