-- Draft audits and audit type for saved configurations.

alter type public.audit_session_status add value if not exists 'draft';

alter table public.audits
  add column if not exists audit_type text not null default 'full-funnel';

comment on column public.audits.audit_type is
  'User-selected audit template (full-funnel, page-specific, competitive).';
