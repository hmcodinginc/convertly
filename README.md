# Convertly

**AI-powered conversion intelligence for modern product and growth teams.**

Convertly analyzes public websites, detects intent, runs a rule-based audit engine, and delivers scored reports with consultant-grade recommendations. Built by [HM Coding](https://hmcoding.com).

---

## Features

- **Conversion audits** — Discover pages, crawl static and rendered content, analyze UX/CRO signals
- **Intent detection** — Website and page intent drive rule applicability (V5)
- **V4 scoring** — Growth Score with blocker ceilings, category breakdowns, and confidence
- **Recommendations** — Rule-linked consultant recommendations with evidence
- **Audit dashboard** — Metrics, opportunity queue, recent audits
- **Exports** — PDF and structured report exports
- **Diagnostics** — Crawl, engine, and scoring traces (debug mode)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| UI | shadcn/ui, Framer Motion, Lucide |
| Auth & DB | Supabase (Auth, Postgres, Edge Functions) |
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
├── client/                 # React SPA (Vite)
│   ├── src/
│   │   ├── pages/          # Route screens
│   │   ├── features/       # Domain UI sections
│   │   ├── components/     # Shared UI primitives
│   │   ├── services/       # Business logic
│   │   │   └── audit/      # Audit engine, crawl, intelligence
│   │   ├── lib/            # Env, routes, logger, utilities
│   │   └── types/          # Shared TypeScript types
│   └── scripts/            # Verification and dev scripts
├── render-worker/          # Playwright page renderer (POST /render)
├── supabase/
│   ├── migrations/         # Database schema
│   └── functions/          # audit-fetch, audit-render, delete-account
└── README.md
```

### Audit pipeline

1. **Discovery** — Homepage fetch + link extraction (`pageDiscovery.ts`)
2. **Acquisition** — Static fetch via `audit-fetch` edge function; Playwright render when SPA/quality gate requires it (`hybridPageAcquire.ts`)
3. **Intent** — Website intent (search, marketplace, SaaS, etc.) and per-page intent
4. **Applicability** — Rules filtered by intent before execution
5. **Execution** — Deterministic rule detectors produce findings
6. **Scoring** — V4 growth score with blocker ceilings (unchanged in V5)
7. **Persistence** — Audits, pages, findings, scores, history in Supabase

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
5. **V4 scoring** — Growth Score with blocker ceilings (unchanged in V5)
6. **Recommendations** — Consultant-grade output linked to executed rules
7. **Diagnostics** — Crawl traces and engine diagnostics stored in audit snapshot (debug mode)

---

## Edge Functions

| Function | Role |
|----------|------|
| `audit-fetch` | Server-side static HTML fetch (HTTPS, size limits, bot-safe UA) |
| `audit-render` | Proxies to Playwright render worker with auth + timeout |
| `delete-account` | Account deletion workflow |

Deploy via Supabase CLI or dashboard. `audit-render` requires `AUDIT_RENDER_WORKER_URL` secret pointing to the hosted render worker.

---

## Environment Variables

Copy `client/.env.example` to `client/.env`:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_APP_URL` | Public app URL for auth redirects |
| `VITE_USE_LOCAL_AUTH` | `true` for localStorage MVP auth |
| `VITE_AUDIT_RENDER_URL` | Local render worker URL (optional) |
| `VITE_AUDIT_DEBUG` | `true` to enable audit debug logs in production builds |

### Supabase edge functions

| Secret / env | Function | Purpose |
|--------------|----------|---------|
| `AUDIT_RENDER_WORKER_URL` | `audit-render` | Playwright worker base URL |

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
| `20250623100000_audit_score_categories.sql` | V1 score categories |
| `20250706100000_audit_findings_rule_id.sql` | `rule_id` on findings (required for V5) |

3. Deploy edge functions: `audit-fetch`, `audit-render`, `delete-account`
4. Set `AUDIT_RENDER_WORKER_URL` in Supabase function secrets

---

## Migration Guide

### From pre-V5 to V5

1. Apply `20250706100000_audit_findings_rule_id.sql` to production
2. Deploy client + edge functions + render worker
3. Re-audit sites that previously had incorrect CRO findings on platform/marketplace intents

Historical audits without `rule_id` in findings still work; legacy recommendation title-matching is used as fallback.

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| **`main`** | **Production** — all release-ready work merges here directly |
| `develop` | **Experimental only** — spikes and prototypes; not a merge bridge |
| `fix/*`, `feat/*` | Feature and fix branches → merge directly into `main` when ready |

**V5 release:** `fix/enterprise-audit-scoring` → `main` after production migration and E2E validation.

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

---

## Roadmap

### V5 (current)

- [x] Website intent detection and applicability engine
- [x] Crawl diagnostics and render fallback
- [x] Centralized logger and production console cleanup
- [x] `rule_id` persistence
- [x] Production migration `rule_id`
- [x] Full enterprise site validation (ASUS, Sony LIV, Jio)

### Post-V5

- Team invitations and roles
- Stripe billing integration
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
