# Convertly

**AI-powered conversion intelligence for modern product and growth teams.**

Convertly analyzes public websites, detects intent, runs a rule-based audit engine, and delivers scored reports with consultant-grade recommendations. Built by [HM Coding](https://hmcoding.com).

---

## Features

### Audit engine

- **Conversion audits** — Discover pages, crawl static and rendered content, analyze UX/CRO signals
- **Intent detection** — Website and page intent drive rule applicability (V5)
- **V4 scoring** — Growth Score with blocker ceilings, category breakdowns, and confidence
- **Recommendations** — Rule-linked consultant recommendations with evidence
- **Recommendation playbooks** — Structured implementation guides per finding
- **Live audit execution** — Stage-by-stage progress, bot protection handling, and execution timeline
- **Exports** — PDF and structured report exports
- **Diagnostics** — Crawl, engine, and scoring traces (debug mode)

### Product app

- **Dashboard** — Metrics, priority insights, AI recommendations, recent audits
- **Audit history & detail** — Full report views, timeline, and report actions
- **Sample report** — Public marketing preview of audit output
- **Vertly** — In-app AI companion with page-aware context and playbook assistance
- **Workspace** — Personal workspace overview, domain management, and plan usage
- **Billing** — Free, Starter, Growth, and Scale plans with usage tracking and upgrade flows
- **Settings** — Profile, preferences, notifications, password management, and account deletion
- **Auth** — Supabase auth with logged-out and logged-in password recovery flows

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| UI | shadcn/ui, Framer Motion, Lucide |
| Auth & DB | Supabase (Auth, Postgres, Edge Functions) |
| Payments | Razorpay subscriptions (provider abstraction; Stripe-ready) |
| Render | Playwright render worker (Node.js) |
| Deploy | Vercel (client), Render/Fly (worker), Supabase (backend) |

---

## Architecture

```
Website → Crawl → Website Intent → Page Intent → Applicability Engine
       → Rule Execution → Reliability → V4 Scoring → Recommendations
       → Snapshot → Persistence
```

### Folder structure

```
Convertly/
├── client/                     # React SPA (Vite)
│   ├── src/
│   │   ├── app/                # App router
│   │   ├── pages/              # Route screens
│   │   ├── features/           # Domain UI (home, auth, dashboard, audits, vertly, profile, workspace)
│   │   ├── components/         # Shared UI (auth, billing, audit, layout, settings, workspace)
│   │   ├── hooks/              # Shared React hooks
│   │   ├── services/           # Business logic
│   │   │   ├── audit/          # Audit engine, crawl, intelligence, playbooks
│   │   │   ├── auth/           # Supabase auth provider
│   │   │   ├── payment/        # Payment edge function client
│   │   │   └── repositories/   # Supabase data access (audit, business)
│   │   ├── lib/                # Env, routes, billing, auth redirects, utilities
│   │   ├── styles/             # Global and layout CSS
│   │   └── types/              # Shared TypeScript types
│   └── scripts/                # Verification and dev scripts
├── render-worker/              # Playwright page renderer (POST /render)
├── supabase/
│   ├── migrations/             # Database schema
│   └── functions/
│       ├── audit-fetch/        # Server-side static HTML fetch
│       ├── audit-render/       # Playwright render proxy
│       ├── delete-account/     # Account deletion workflow
│       ├── payment-checkout/   # Subscription checkout
│       ├── payment-portal/     # Subscription management URL
│       ├── payment-cancel/     # Cancel subscription
│       ├── payment-webhook/    # Provider webhook ingestion
│       ├── _shared/payment/    # Payment provider abstraction (Razorpay, Stripe)
│       ├── _shared/pricing/    # Plan catalog and provider mapping
│       └── PAYMENTS.md         # Payment provider secrets reference
└── README.md
```

### App routes

| Route | Screen |
|-------|--------|
| `/` | Marketing home |
| `/sample-report` | Public sample audit report |
| `/login`, `/signup`, `/forgot-password` | Auth (guest) |
| `/reset-password` | Standalone password recovery |
| `/dashboard` | Dashboard |
| `/audit/new` | New audit |
| `/audits`, `/audits/:id` | Audit history and detail |
| `/workspace` | Workspace and domains |
| `/billing`, `/billing/return` | Plans, checkout, and payment return |
| `/settings/profile` | Profile and password |
| `/settings/preferences` | User preferences |
| `/settings/notifications` | Notification settings |

### Audit pipeline

1. **Discovery** — Homepage fetch + link extraction (`pageDiscovery.ts`)
2. **Acquisition** — Static fetch via `audit-fetch` edge function; Playwright render when SPA/quality gate requires it (`hybridPageAcquire.ts`)
3. **Intent** — Website intent (search, marketplace, SaaS, etc.) and per-page intent
4. **Applicability** — Rules filtered by intent before execution
5. **Execution** — Deterministic rule detectors produce findings
6. **Scoring** — V4 growth score with blocker ceilings
7. **Persistence** — Audits, pages, findings, scores, history in Supabase

### Business foundation

Each user gets a personal workspace with profile, subscription, preferences, and domain records. Plan entitlements gate audit usage. Internal plan overrides are supported for team access.

### Payment provider abstraction

Billing UI and services call generic `payment-*` edge functions. The active provider (`razorpay` or `stripe`) is selected via `PAYMENT_PROVIDER`. Convertly owns plan definitions; providers receive mapped external plan IDs only.

### Render worker

Local or hosted Node service exposing:

- `POST /render` — Playwright render with multi-strategy navigation
- `GET /health` — Health check

Start locally:

```bash
cd render-worker
npm install
npm run dev
```

Set `VITE_AUDIT_RENDER_URL=http://localhost:3100/render` in `client/.env` for local rendering without Supabase.

---

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase CLI (optional — migrations and linked DB)
- Playwright Chromium (render worker: `npx playwright install chromium`)

## Local Development

```bash
cd client
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
npm run typecheck    # TypeScript (0 errors required)
npm run lint         # ESLint
npm run build        # Production bundle
```

Optional render worker (for SPA sites without Supabase edge proxy):

```bash
cd render-worker
npm install
npx playwright install chromium
npm run dev          # http://localhost:3100
```

Set `VITE_AUDIT_RENDER_URL=http://localhost:3100/render` in `client/.env`.

---

## TypeScript Configuration

Convertly uses a **solution-style** TypeScript setup (multiple configs on purpose):

| File | Purpose |
|------|---------|
| `tsconfig.json` | Root orchestrator — project references only; mirrors `@/*` paths for IDE fallback |
| `tsconfig.app.json` | **Application source** (`src/`) — DOM types, React JSX, `@/*` → `src/*` |
| `tsconfig.node.json` | **Build tooling** (`vite.config.ts`) — Node types, no DOM |
| `tsconfig.typecheck.json` | Thin extends of `tsconfig.app.json` — used by `npm run typecheck` |

**Why multiple configs?** Application code and Vite config need different `lib` and `types` environments. A single config would either pollute app code with Node types or break `vite.config.ts` resolution. Project references let the editor and `tsc` pick the correct config per file.

**Path alias (`@/*`)** is defined in `tsconfig.app.json` as `"@/*": ["./src/*"]` (no `baseUrl` — deprecated in TypeScript 6). Vite resolves it via `resolve.tsconfigPaths: true`.

If the editor shows `TS2307 Cannot find module '@/...'`, reload the TypeScript server after pulling — the alias must exist in `tsconfig.app.json`, not only in `tsconfig.typecheck.json`.

---

## Audit Engine Overview

The intelligence engine (`client/src/services/audit/intelligence/`) runs deterministically:

1. **Website intent** — Classifies the domain (search, marketplace, SaaS, agency, etc.)
2. **Page intent** — Per-page classification from URL, title, schema, and content signals
3. **Applicability** — Filters rule packs by intent before execution
4. **Rule execution** — Detectors produce findings with `ruleId`, confidence, and verification status
5. **V4 scoring** — Growth Score with blocker ceilings
6. **Recommendations** — Consultant-grade output linked to executed rules
7. **Playbooks** — Actionable implementation guides built from rule metadata
8. **Diagnostics** — Crawl traces and engine diagnostics stored in audit snapshot (debug mode)

---

## Edge Functions

| Function | JWT | Role |
|----------|-----|------|
| `audit-fetch` | true | Server-side static HTML fetch (HTTPS, size limits, bot-safe UA) |
| `audit-render` | true | Proxies to Playwright render worker with auth + timeout |
| `delete-account` | true | Account deletion workflow |
| `payment-checkout` | true | Start subscription checkout |
| `payment-portal` | true | Subscription management URL |
| `payment-cancel` | true | Cancel subscription via provider |
| `payment-webhook` | false | Provider webhook ingestion |

Deploy via Supabase CLI or dashboard. `audit-render` requires `AUDIT_RENDER_WORKER_URL`. Payment secrets are documented in `supabase/functions/PAYMENTS.md`.

---

## Environment Variables

Copy `client/.env.example` to `client/.env`:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_APP_URL` | Public app URL for auth and billing redirects |
| `VITE_USE_LOCAL_AUTH` | `true` for localStorage MVP auth; `false` for Supabase auth + billing |
| `VITE_AUDIT_RENDER_URL` | Local render worker URL (optional) |
| `VITE_AUDIT_DEBUG` | `true` to enable audit debug logs in production builds |

### Supabase edge functions

| Secret / env | Function | Purpose |
|--------------|----------|---------|
| `AUDIT_RENDER_WORKER_URL` | `audit-render` | Playwright worker base URL |
| `PAYMENT_PROVIDER` | `payment-*` | Active provider (`razorpay` or `stripe`) |
| `APP_URL` | `payment-*`, auth | Public app URL for redirects |
| Razorpay / Stripe secrets | `payment-*` | See `supabase/functions/PAYMENTS.md` |

---

## Supabase Setup

1. Create a Supabase project
2. Apply migrations in order:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Migrations:

| File | Purpose |
|------|---------|
| `20250623000000_audit_engine.sql` | Core audit schema |
| `20250623100000_audit_score_categories.sql` | Score categories |
| `20250706100000_audit_findings_rule_id.sql` | `rule_id` on findings (V5) |
| `20250706120000_business_foundation.sql` | Profiles, workspaces, subscriptions, preferences |
| `20250706130000_payment_provider.sql` | Payment provider fields on subscriptions |
| `20250707120000_user_plan_overrides.sql` | Internal plan overrides |
| `20250707140000_business_table_grants.sql` | Business table grants |
| `20250707150000_ensure_business_foundation.sql` | `ensure_business_foundation` RPC |
| `20250707160000_service_role_business_grants.sql` | Service role business grants |

3. Deploy edge functions: `audit-fetch`, `audit-render`, `delete-account`, `payment-checkout`, `payment-portal`, `payment-cancel`, `payment-webhook`
4. Set function secrets (`AUDIT_RENDER_WORKER_URL`, payment provider credentials)
5. Allowlist auth redirect URLs: `/reset-password`, `/settings/profile`, `/billing/return`

---

## Migration Guide

### From pre-V5 to current

1. Apply all pending migrations in order (see table above)
2. Deploy client, edge functions, and render worker
3. Configure Razorpay (or Stripe) secrets per `supabase/functions/PAYMENTS.md`
4. Re-audit sites that previously had incorrect CRO findings on platform/marketplace intents

Historical audits without `rule_id` in findings still work; legacy recommendation title-matching is used as fallback.

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| **`main`** | **Production** — all release-ready work merges here directly |
| `develop` | **Experimental only** — spikes and prototypes; not a merge bridge |
| `fix/*`, `feat/*` | Feature and fix branches → merge directly into `main` when ready |

---

## Scripts

From `client/`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check (0 errors required) |
| `npm run lint` | ESLint |
| `npm run preview` | Preview production build |

Verification scripts:

```bash
node scripts/verify-v5-intent.mjs
node scripts/verify-v5-applicability.mjs
```

---

## Coding Standards

- **TypeScript** — Strict path aliases via `@/*`; run `npm run typecheck` before merge
- **Imports** — Use `@/` aliases; avoid deep relative chains
- **Logging** — Use `createLogger()` from `src/lib/logger.ts`; debug only when `VITE_AUDIT_DEBUG=true` or `DEV`
- **UI** — Premium dark SaaS aesthetic; reusable components; mobile-first
- **Engine** — Do not change V4 scoring logic or pipeline topology without explicit approval
- **Scope** — Minimal focused diffs; no premature abstraction

---

## Production Deployment

### Client (Vercel)

- Root directory: `client`
- Build command: `vite build`
- Output: `dist`
- Set environment variables in Vercel project settings

### Render worker

Deploy `render-worker/` to Render, Fly.io, or similar. Ensure Playwright Chromium is installed. Point Supabase `AUDIT_RENDER_WORKER_URL` to the worker.

### Supabase

- Run pending migrations on production
- Deploy edge functions after client/worker releases
- Configure payment provider secrets and webhooks

---

## Roadmap

### Shipped

- [x] V5 intent detection and applicability engine
- [x] Crawl diagnostics and render fallback
- [x] `rule_id` persistence and production migration
- [x] Business foundation (profiles, workspaces, subscriptions)
- [x] Razorpay billing with provider abstraction
- [x] Workspace and domain management
- [x] Vertly in-app companion and recommendation playbooks
- [x] Live audit execution experience
- [x] Settings, profile, and password recovery flows

### Next

- Team invitations and organization workspaces
- Stripe provider activation when onboarding is available
- Enhanced crawl for geo-restricted sites

---

## License

Proprietary. © 2026 Convertly · HM Coding. All rights reserved.

---

## Contributing

1. Branch from `main` (or a `fix/*` / `feat/*` branch)
2. Run `npm run typecheck`, `npm run lint`, `npm run build` from `client/`
3. Keep changes scoped; do not redesign engine or scoring without approval
4. Open a PR with test plan and migration notes if schema changes

For internal HM Coding contributors: follow the branch strategy above and ensure Supabase migrations are applied to staging before production.
