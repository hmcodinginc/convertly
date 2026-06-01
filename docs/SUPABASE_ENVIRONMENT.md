# Supabase environment architecture

Convertly uses Supabase **Auth only** (no public Postgres tables). Profile data lives in `auth.users.raw_user_meta_data` as `firstName` and `lastName`.

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | `client/.env` (gitignored) | Project API URL (root only, not `/rest/v1/`) |
| `VITE_SUPABASE_ANON_KEY` | `client/.env` (gitignored) | Public anon JWT for browser client |
| `VITE_USE_LOCAL_AUTH` | `client/.env` | `true` = localStorage MVP auth; `false` = Supabase when URL + anon key are set |

Template: `client/.env.example`

## Where keys are consumed

| File | Usage |
|------|--------|
| `client/src/lib/env.ts` | Reads `import.meta.env` at build time |
| `client/src/services/auth/supabaseClient.ts` | `createClient(url, anonKey)` |
| `client/src/services/auth/supabaseAuthProvider.ts` | Auth + `functions.invoke('delete-account')` |
| `client/vite-env.d.ts` | TypeScript env declarations |

**Never** add `VITE_SUPABASE_SERVICE_ROLE_KEY` or any service role key to the frontend.

## Server-side secrets (Edge Functions only)

| Secret | Set in | Purpose |
|--------|--------|---------|
| `SUPABASE_URL` | Auto-injected on Edge Functions | Project URL |
| `SUPABASE_ANON_KEY` | Auto-injected | Verify caller JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Edge Functions → Secrets | `auth.admin.deleteUser` in `delete-account` |

## Account deletion flow

1. Browser calls `supabase.functions.invoke('delete-account')` with the user session JWT.
2. Edge Function validates JWT, then deletes the user via Admin API (service role).
3. Client signs out, clears Convertly `localStorage` keys, redirects to `/`.

SDK note (`@supabase/supabase-js` ^2.106): **self-delete is not available** on the anon client; `auth.admin.deleteUser` requires service role → Edge Function is the correct production pattern.

## Git / secrets hygiene

- `client/.gitignore` ignores `.env` and `.env.*` except `.env.example`.
- A legacy anon key may exist in git history; rotation is optional and documented below.

## Key rotation checklist (when ready)

1. Supabase Dashboard → **Settings → API** → rotate **anon** key (and service role if exposed).
2. Update `VITE_SUPABASE_ANON_KEY` in local `.env`, stage, and production host env (Vercel/Netlify/etc.).
3. Update **Edge Function secret** `SUPABASE_SERVICE_ROLE_KEY` if service role was rotated.
4. Redeploy the `delete-account` function after secret changes.
5. Run smoke tests: sign up, login, profile edit, account delete on stage.
6. Invalidate old JWTs (rotation does this for new sign-ins; existing sessions expire naturally).

Do **not** commit real keys to the repository.

## Deploying `delete-account`

From repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked to the project):

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
supabase functions deploy delete-account
```

Dashboard alternative: **Edge Functions** → create/deploy `delete-account` → add secret `SUPABASE_SERVICE_ROLE_KEY`.

`supabase/config.toml` sets `verify_jwt = true` for this function.

## Password reset redirect URLs

Reset emails use `getPasswordResetRedirectUrl()` in `client/src/lib/authRedirects.ts`:

```
{origin}/reset-password
```

Recovery is handled by `ResetPasswordPage` (`detectSessionInUrl` + `PASSWORD_RECOVERY` event).

| Environment | Example redirect URL (must be allowlisted) |
|-------------|------------------------------------------|
| Local (Vite default) | `http://localhost:5173/reset-password` |
| Local (alt) | `http://127.0.0.1:5173/reset-password` |
| Stage | `https://<your-stage-host>/reset-password` |
| Production | `https://<your-production-host>/reset-password` |

The app builds the URL from `window.location.origin` at runtime, so each deployed host must be listed in Supabase.

### Required Supabase Dashboard changes

**Authentication → URL Configuration**

1. **Site URL** — set to your primary app URL (e.g. production `https://app.convertly.app` or stage host). Used as the default redirect base.
2. **Redirect URLs** — add every row from the table above that you use, including:
   - `http://localhost:5173/reset-password`
   - `http://127.0.0.1:5173/reset-password` (if you test via 127.0.0.1)
   - Stage: `https://<stage-host>/reset-password`
   - Production: `https://<production-host>/reset-password`

Wildcards (e.g. `http://localhost:5173/**`) are supported if you prefer one entry for all auth routes.

Remove legacy `/login` reset redirect entries if they were added previously.

### Profile “Forgot password” / reset email

- Profile **Change Password** drawer → **Send password reset email** calls the same `authService.requestPasswordReset()` as `/forgot-password`.
- `resetPasswordForEmail` uses the redirect URL above (previously hardcoded; now centralized in `authRedirects.ts`).
