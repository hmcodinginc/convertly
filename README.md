# Convertly

**AI-powered conversion intelligence for modern product and growth teams.**

Convertly analyzes public websites, detects intent, runs a deterministic audit engine, and delivers scored reports with consultant-grade recommendations. Built by [HM Coding](https://hmcoding.com).

---

## Features

### Audit engine

- **Conversion audits** — Page discovery, static and rendered content acquisition, UX/CRO rule execution
- **Intent detection** — Website and page intent drive rule applicability
- **Scoring** — Growth Score with category breakdowns, blocker ceilings, and confidence signals
- **Recommendations** — Rule-linked consultant recommendations with evidence
- **Recommendation playbooks** — Structured implementation guides per finding
- **Live execution UI** — Stage timeline, progress ring, bot-protection handling, completion summary
- **Exports** — PDF and structured report exports
- **Diagnostics** — Crawl and engine diagnostics (development tooling)

### Product app

- **Marketing site** — Home, pricing, sample report; Vertly available on public pages
- **Dashboard** — Metrics, priority insights, recommendations, recent audits
- **Audits** — History, detail reports, live execution view, report actions
- **Vertly** — Convertly-only AI product specialist with message-first routing and page-aware context
- **Workspace** — Usage, audit ledger, domain management
- **Billing** — Free, Starter, Growth, and Scale plans with Razorpay subscriptions (provider abstraction)
- **Settings** — Profile, preferences, notifications, security, danger zone
- **Auth** — Supabase auth (production) or local auth (development); password recovery flows

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| UI | shadcn/ui, Framer Motion, Lucide |
| Auth & DB | Supabase (Auth, Postgres, Edge Functions) |
| Payments | Razorpay subscriptions via edge functions (Stripe-ready abstraction) |
| Render | Playwright render worker (Node.js) |
| Deploy | Vercel (client), Render/Fly (worker), Supabase (backend) |

---

## Architecture

### Audit pipeline

```
Website → Discovery → Acquisition (static / render)
       → Website intent → Page intent → Applicability
       → Rule execution → Reliability → Scoring → Recommendations
       → Snapshot → Persistence
```

### Vertly (in-app AI)

Vertly answers **Convertly product questions only** — not general-purpose chat.

```
Message → Scope detection → Domain classification → Subtopic (message-first)
       → Local handler provider → Response
```

Page context enriches answers; it does not override user intent. Handlers cover product memory, audit/report expertise, billing, workspace, dashboard, account state, greetings, and out-of-scope refusal.

Future provider swaps (e.g. hosted LLM) replace the response provider only; routing stays the same.

### Repository layout

```
Convertly/
├── client/                     # React SPA (Vite)
│   ├── src/
│   │   ├── app/                # Router
│   │   ├── pages/              # Route screens
│   │   ├── features/           # Domain UI (home, audits, vertly, dashboard, …)
│   │   ├── components/         # Shared UI (auth, billing, audit, layout, …)
│   │   ├── hooks/              # Shared React hooks
│   │   ├── services/           # Business logic
│   │   │   ├── audit/          # Engine, crawl, intelligence, playbooks
│   │   │   ├── auth/           # Supabase auth provider
│   │   │   ├── payment/        # Payment edge function client
│   │   │   └── repositories/   # Data access (audit, business)
│   │   ├── lib/                # Env, routes, billing, utilities
│   │   └── styles/             # Global and layout CSS
│   └── scripts/                # Verification and dev scripts
├── render-worker/              # Playwright page renderer (POST /render)
├── supabase/
│   ├── migrations/             # Database schema
│   └── functions/              # Edge functions (audit, payments, account)
└── README.md
```

---

## Routes

| Route | Access | Screen |
|-------|--------|--------|
| `/` | Public | Marketing home |
| `/sample-report` | Public | Sample audit report |
| `/login`, `/signup`, `/forgot-password` | Guest | Auth |
| `/reset-password` | Public | Password recovery |
| `/dashboard` | Authenticated | Dashboard |
| `/audit/new` | Authenticated | New audit |
| `/audits`, `/audits/:id` | Authenticated | History and report |
| `/workspace` | Authenticated | Workspace |
| `/billing`, `/billing/return` | Authenticated | Plans and checkout return |
| `/settings/*` | Authenticated | Profile, preferences, notifications, security, danger zone |

Authenticated routes are wrapped in `ProtectedRoute`. Guest auth routes redirect signed-in users to the dashboard.

---

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase CLI (optional — migrations and linked DB)
- Playwright Chromium for the render worker: `npx playwright install chromium`

---

## Local development

```bash
cd client
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run build        # Production bundle (vite build)
```

For local development without Supabase, set `VITE_USE_LOCAL_AUTH=true` in `client/.env`. Production deployments must use Supabase auth (`VITE_USE_LOCAL_AUTH=false`).

Optional render worker (SPA sites without Supabase edge proxy):

```bash
cd render-worker
npm install
npx playwright install chromium
npm run dev          # http://localhost:3100
```

Then set `VITE_AUDIT_RENDER_URL` in `client/.env` to your local worker `/render` endpoint (see `client/.env.example`).

---

## Environment variables

Copy `client/.env.example` to `client/.env`. **Do not commit `.env` files.**

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (project root, not `/rest/v1/`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key — safe for client bundles |
| `VITE_APP_URL` | Public app URL for auth and billing redirects (no trailing slash) |
| `VITE_USE_LOCAL_AUTH` | `true` = localStorage dev auth; `false` = Supabase auth (production) |
| `VITE_AUDIT_RENDER_URL` | Optional local render worker URL |

Supabase **edge function secrets** (payment credentials, render worker URL, webhook signing keys) belong in the Supabase dashboard or CLI — never in the client repo. See `supabase/functions/PAYMENTS.md` for payment provider setup (no secrets in git).

Production builds log a console warning if local auth is enabled or Supabase variables are missing (`warnIfProductionMisconfigured` in `client/src/lib/env.ts`).

---

## Security

- **Secrets** — Never commit API keys, webhook secrets, service role keys, or `.env` files. Use `.env.example` as a template only.
- **Client bundle** — Only `VITE_*` public variables ship to the browser. The Supabase anon key is designed for client use with Row Level Security.
- **Service role** — Restricted to edge functions and server-side tooling; never expose in the SPA.
- **Auth** — Protected routes require a valid session. Unauthenticated users are redirected to login with a safe return path.
- **Errors** — User-facing load errors use generic copy; technical details are logged via `createLogger()` only.
- **Payments** — Checkout and webhooks run through authenticated edge functions; provider secrets stay in Supabase function configuration.

---

## TypeScript configuration

| File | Purpose |
|------|---------|
| `tsconfig.json` | Root project references |
| `tsconfig.app.json` | Application source (`src/`) |
| `tsconfig.node.json` | Vite config (Node types) |
| `tsconfig.typecheck.json` | Used by `npm run typecheck` |

Path alias: `@/*` → `src/*` (defined in `tsconfig.app.json`, resolved by Vite).

---

## Scripts

From `client/`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |

Verification scripts:

```bash
node scripts/verify-vertly-intent.mjs
node scripts/verify-v5-intent.mjs
node scripts/verify-v5-applicability.mjs
```

---

## Supabase setup

1. Create a Supabase project.
2. Apply migrations in timestamp order:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

| Migration | Purpose |
|-----------|---------|
| `20250623000000_audit_engine.sql` | Core audit schema |
| `20250623100000_audit_score_categories.sql` | Score categories |
| `20250706100000_audit_findings_rule_id.sql` | `rule_id` on findings |
| `20250706120000_business_foundation.sql` | Profiles, workspaces, subscriptions |
| `20250706130000_payment_provider.sql` | Payment provider fields |
| `20250707120000_user_plan_overrides.sql` | Internal plan overrides |
| `20250707140000_business_table_grants.sql` | Business table grants |
| `20250707150000_ensure_business_foundation.sql` | Bootstrap RPC |
| `20250707160000_service_role_business_grants.sql` | Service role grants |
| `20250713160000_subscription_scheduled_plan.sql` | Scheduled plan changes |
| `20250713180000_subscription_pending_plan.sql` | Pending plan state |
| `20250713213000_audit_draft_lifecycle.sql` | Audit draft lifecycle |

3. Deploy edge functions: `audit-fetch`, `audit-render`, `delete-account`, `payment-checkout`, `payment-portal`, `payment-cancel`, `payment-webhook`.
4. Configure function secrets in Supabase (render worker URL, payment provider — see `PAYMENTS.md`).
5. Allowlist auth redirect URLs: `/reset-password`, `/settings/profile`, `/billing/return`.

### Edge functions

| Function | JWT | Role |
|----------|-----|------|
| `audit-fetch` | yes | Server-side static HTML fetch |
| `audit-render` | yes | Playwright render proxy |
| `delete-account` | yes | Account deletion |
| `payment-checkout` | yes | Start subscription checkout |
| `payment-portal` | yes | Subscription management URL |
| `payment-cancel` | yes | Cancel subscription |
| `payment-webhook` | no | Provider webhook ingestion |

---

## Render worker

Local or hosted Node service:

- `POST /render` — Playwright render with multi-strategy navigation
- `GET /health` — Health check

Point Supabase `audit-render` at the deployed worker URL via function secrets.

---

## Production deployment

### Client (Vercel)

- Root directory: `client`
- Build command: `vite build`
- Output: `dist`
- Set `VITE_*` variables in the hosting dashboard (not in the repo)

### Render worker

Deploy `render-worker/` to Render, Fly.io, or similar. Install Playwright Chromium in the runtime image.

### Supabase

- Run pending migrations on production before or with each release
- Deploy edge functions after schema changes
- Configure payment webhooks and secrets in the Supabase dashboard

---

## Coding standards

- **TypeScript** — Use `@/*` imports; run `npm run typecheck` before merge
- **Logging** — Use `createLogger()` from `src/lib/logger.ts`
- **UI** — Premium dark SaaS aesthetic; reusable components; mobile-first
- **Scope** — Minimal focused diffs; avoid unrelated refactors
- **Engine** — Do not change scoring logic or pipeline topology without explicit approval

---

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — release-ready work merges here |
| `develop` | Experimental spikes (not a merge bridge) |
| `fix/*`, `feat/*` | Feature and fix branches → `main` when ready |

---

## Roadmap

### Shipped

- Intent detection and applicability engine
- Business foundation (profiles, workspaces, subscriptions, billing)
- Vertly Convertly-only routing with page context
- Live audit execution experience
- Marketing site with sample report and Vertly
- Settings, security, and account deletion flows

### Next

- Team invitations and organization workspaces
- Optional hosted LLM provider for Vertly (routing unchanged)
- Enhanced crawl for geo-restricted sites

---

## License

Proprietary. © 2026 Convertly · HM Coding. All rights reserved.

---

## Contributing

1. Branch from `main` (or `fix/*` / `feat/*`)
2. From `client/`, run `npm run typecheck`, `npm run lint`, and `npm run build`
3. Keep changes scoped; include migration notes if schema changes
4. Never commit secrets, `.env` files, or credentials

For internal HM Coding contributors: apply Supabase migrations to staging before production.
