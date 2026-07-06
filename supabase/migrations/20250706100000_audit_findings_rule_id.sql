-- V5: persist rule identity on audit findings for traceability
alter table public.audit_findings
  add column if not exists rule_id text;

create index if not exists audit_findings_rule_id_idx
  on public.audit_findings (rule_id)
  where rule_id is not null;
