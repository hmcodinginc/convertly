# Supabase Edge Functions

## delete-account

Deletes the authenticated user via Admin API (service role stays server-side).

### Secrets (Dashboard → Edge Functions → Secrets)

| Name | Value |
|------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Project service role key |

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically.

### Deploy

```bash
supabase link --project-ref <project-ref>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
supabase functions deploy delete-account
```
