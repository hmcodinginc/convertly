-- V1 scoring categories: Conversion, Trust, Mobile, UX, Growth Score

alter type public.audit_score_category add value if not exists 'conversion';
alter type public.audit_score_category add value if not exists 'mobile';
alter type public.audit_score_category add value if not exists 'ux';
alter type public.audit_score_category add value if not exists 'growth';
