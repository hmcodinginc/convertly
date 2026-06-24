-- Audit Engine Foundation schema
-- Maps to client/src/types/auditEngine.ts

create type public.audit_session_status as enum (
  'pending',
  'crawling',
  'analyzing',
  'completed',
  'failed'
);

create type public.audit_page_type as enum (
  'homepage',
  'pricing',
  'about',
  'contact',
  'services',
  'features',
  'login',
  'signup',
  'custom'
);

create type public.page_discovery_status as enum (
  'candidate',
  'reachable',
  'unreachable',
  'unknown'
);

create type public.finding_category as enum (
  'ux',
  'conversion',
  'trust',
  'performance',
  'copy',
  'accessibility',
  'technical'
);

create type public.finding_severity as enum (
  'critical',
  'high',
  'medium',
  'low'
);

create type public.audit_score_category as enum (
  'clarity',
  'trust',
  'friction',
  'performance',
  'cta_strength',
  'overall'
);

create table public.audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  website_url text not null,
  status public.audit_session_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_pages (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  page_type public.audit_page_type not null,
  url text not null,
  path text not null,
  title text not null,
  discovery_status public.page_discovery_status not null default 'candidate',
  desktop_screenshot_key text,
  mobile_screenshot_key text,
  discovered_at timestamptz not null default now()
);

create table public.audit_findings (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  page_id uuid references public.audit_pages (id) on delete set null,
  category public.finding_category not null,
  severity public.finding_severity not null,
  title text not null,
  description text not null,
  recommendation text not null,
  created_at timestamptz not null default now()
);

create table public.audit_scores (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  category public.audit_score_category not null,
  score numeric(5, 2),
  max_score numeric(5, 2) not null default 100,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (audit_id, category)
);

create table public.audit_history (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits (id) on delete cascade,
  status public.audit_session_status not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index audits_user_id_idx on public.audits (user_id);
create index audits_status_idx on public.audits (status);
create index audit_pages_audit_id_idx on public.audit_pages (audit_id);
create index audit_findings_audit_id_idx on public.audit_findings (audit_id);
create index audit_scores_audit_id_idx on public.audit_scores (audit_id);
create index audit_history_audit_id_idx on public.audit_history (audit_id);

alter table public.audits enable row level security;
alter table public.audit_pages enable row level security;
alter table public.audit_findings enable row level security;
alter table public.audit_scores enable row level security;
alter table public.audit_history enable row level security;

create policy "Users can manage their audits"
  on public.audits
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage their audit pages"
  on public.audit_pages
  for all
  using (
    exists (
      select 1 from public.audits
      where audits.id = audit_pages.audit_id
        and audits.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.audits
      where audits.id = audit_pages.audit_id
        and audits.user_id = auth.uid()
    )
  );

create policy "Users can manage their audit findings"
  on public.audit_findings
  for all
  using (
    exists (
      select 1 from public.audits
      where audits.id = audit_findings.audit_id
        and audits.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.audits
      where audits.id = audit_findings.audit_id
        and audits.user_id = auth.uid()
    )
  );

create policy "Users can manage their audit scores"
  on public.audit_scores
  for all
  using (
    exists (
      select 1 from public.audits
      where audits.id = audit_scores.audit_id
        and audits.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.audits
      where audits.id = audit_scores.audit_id
        and audits.user_id = auth.uid()
    )
  );

create policy "Users can manage their audit history"
  on public.audit_history
  for all
  using (
    exists (
      select 1 from public.audits
      where audits.id = audit_history.audit_id
        and audits.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.audits
      where audits.id = audit_history.audit_id
        and audits.user_id = auth.uid()
    )
  );

create or replace function public.set_audit_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger audits_updated_at
  before update on public.audits
  for each row
  execute function public.set_audit_updated_at();

create trigger audit_scores_updated_at
  before update on public.audit_scores
  for each row
  execute function public.set_audit_updated_at();
