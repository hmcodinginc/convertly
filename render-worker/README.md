# Convertly render worker

Self-hosted Playwright service that renders JavaScript-heavy pages for the
audit engine. In production it is called only by the `audit-render` Supabase
edge function; in local development the client can call it directly via
`VITE_AUDIT_RENDER_URL`.

## Run locally

```bash
cd render-worker
npm install
npm run dev        # listens on http://localhost:3100
```

No token is required locally — when `RENDER_WORKER_TOKEN` is unset, `/render`
accepts unauthenticated requests (a startup warning is logged).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | no (default 3100) | HTTP port. |
| `RENDER_WORKER_TOKEN` | **yes in production** | Shared secret required in the `x-render-token` header on `POST /render`. Requests without it get 401. `GET /health` stays open for platform health checks. |

## Production deployment

1. Deploy this directory (Docker image provided) to Render, Fly.io, Railway,
   or similar. Keep the instance private if the platform allows it.
2. Generate a long random token and set it as `RENDER_WORKER_TOKEN` on the
   worker.
3. Set the matching Supabase edge function secrets:
   - `AUDIT_RENDER_WORKER_URL` — the deployed worker's base URL (https).
   - `AUDIT_RENDER_WORKER_TOKEN` — the same token value.
4. Redeploy the `audit-render` function if secrets changed:
   `supabase functions deploy audit-render`.

Without the token pair, anyone who discovers the worker URL can drive your
Playwright instance (resource abuse / SSRF attempts). The worker also has its
own URL safety checks (HTTPS only, private ranges blocked), but the token is
the access control.
