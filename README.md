# Convertly

**Conversion intelligence for modern product and growth teams.**

Convertly audits public websites for conversion readiness — trust, UX, CTAs, forms, and growth blockers — then returns a **Growth Score** with prioritized, consultant-grade recommendations.

Built by [HM Coding](https://hmcoding.com).

### Positioning

Convertly is a **conversion / CRO / business-readiness** product.

| We are | We are not |
|--------|------------|
| Conversion, trust, growth, UX | An SEO platform |
| Weighted business-impact scoring | Keyword / rank tracking |
| Prioritized conversion fixes | Lighthouse / full Core Web Vitals lab suite |
| Supporting technical signals (light) | Search Console replacement |

Lightweight technical checks (H1, ALT, robots/sitemap, OG/Twitter cards, schema presence, mixed content) appear **inside the existing conversion report** as supporting signals — not a separate SEO product.

---

## Features

### Audit engine

- **Conversion audits** — Page discovery, static + rendered acquisition, intent-aware rule packs
- **Growth Score (Intelligence v4)** — Weighted conversion impact (not issue count); category breakdowns and confidence
- **SPA-aware reliability** — Softens form/DOM findings when render confidence is low or OAuth/JS shells are detected
- **Recommendations + playbooks** — Rule-linked fixes with implementation guidance
- **Live execution UI** — Stage timeline, progress, bot-protection handling
- **Exports** — PDF and structured report exports

### Product app

- **Marketing** — Home, sample report; Vertly on public pages
- **Dashboard** — Metrics, opportunity queue, recommendations, drafts
- **Audits** — History, detail reports, live execution, report actions
- **Vertly** — Rule-based Convertly product specialist (message-first routing + page context; not a general LLM chatbot)
- **Workspace** — Usage, audit ledger, domains
- **Billing** — Free / Starter / Growth / Scale via Razorpay (Stripe-ready abstraction)
- **Settings** — Profile, preferences, notifications, security, danger zone
- **Ops** — Email notifications (Resend), Sentry (optional), product analytics events

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| UI | shadcn/ui, Framer Motion, Lucide |
| Auth & DB | Supabase (Auth, Postgres, Edge Functions, RLS) |
| Payments | Razorpay subscriptions via edge functions |
| Email | Resend via `email-notifications` edge function |
| Render | Playwright render worker (Node.js) |
| Monitoring | Optional Sentry (`VITE_SENTRY_DSN`, production builds only) |
| Deploy | Vercel (client), Render/Fly (worker), Supabase (backend) |

Production client build uses `vite build` (see [Vite CLI](https://vite.dev/guide/cli)).

---

## Architecture (summary)

Full detail: [`Architecture.md`](./Architecture.md).

### Audit pipeline

```
Website → Discovery → Acquisition (static / render)
       → Website intent → Page intent → Applicability
       → Rule execution → Render reliability → Scoring → Recommendations
       → Snapshot → Persistence → Entitlement consume → Optional email
```

Audits run **in the browser tab**. Keep the tab open until completion.

### Vertly

```
Message → Conversational intents → Scope → Domain → Subtopic
       → Local handler (product memory / audit / billing / …) → Response
```

Page-context suggestions enrich prompts; product answers come from the Vertly dataset/handlers — not an open-ended SEO chatbot.

### Repository layout

```
Convertly/
├── client/                 # React SPA (Vite)
├── render-worker/          # Playwright POST /render
├── supabase/
│   ├── migrations/
│   ├── functions/          # Edge functions + _shared
│   └── scripts/            # OPERATIONS.md runbook
├── Architecture.md
├── LAUNCH-CHECKLIST.md
└── README.md
```

---

## Routes

| Route | Access | Screen |
|-------|--------|--------|
| `/` | Public | Marketing home |
| `/sample-report` | Public | Sample conversion audit report |
| `/login`, `/signup`, `/forgot-password` | Guest | Auth |
| `/reset-password` | Public | Password recovery |
| `/dashboard` | Authenticated | Dashboard |
| `/audit/new` | Authenticated | New audit |
| `/audits`, `/audits/:id` | Authenticated | History and report |
| `/workspace` | Authenticated | Workspace |
| `/billing`, `/billing/return` | Authenticated | Plans and checkout return |
| `/settings/*` | Authenticated | Profile, preferences, notifications, security, danger zone |

---

## Local development

```bash
cd client
npm install
cp .env.example .env
npm run dev          # http://localhost:5173
npm run typecheck
npm run lint
npm run build        # vite build
```

Prerequisites: Node.js 20+, npm 10+. For the render worker: `npx playwright install chromium`.

Local auth without Supabase: `VITE_USE_LOCAL_AUTH=true`. Production must use `VITE_USE_LOCAL_AUTH=false`.

Optional local render worker:

```bash
cd render-worker
npm install && npx playwright install chromium
npm run dev          # http://localhost:3100
```

Set `VITE_AUDIT_RENDER_URL` in `client/.env` (see `client/.env.example`).

---

## Environment variables (client)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Anon (public) key |
| `VITE_APP_URL` | Public app origin for auth/billing redirects (no trailing slash) |
| `VITE_USE_LOCAL_AUTH` | `true` localStorage auth; `false` for production |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile (optional) |
| `VITE_AUDIT_RENDER_URL` | Optional local render worker |
| `VITE_SENTRY_DSN` | Optional Sentry DSN (production only) |

Edge secrets (Resend, Razorpay, render worker token, service role, `APP_URL`) live in Supabase — never in the client bundle. See `supabase/functions/PAYMENTS.md` and `NOTIFICATIONS.md`.

---

## Supabase

### Migrations

Apply in timestamp order (`supabase db push`). Notable recent migrations:

| Migration | Purpose |
|-----------|---------|
| `…_audit_engine.sql` … business/payment foundation | Core schema |
| `…_audit_entitlement_consumption.sql` | Entitlement ledger |
| `…_vertly_conversations.sql` | Vertly history |
| `…_fail_stale_audits_watchdog.sql` | Stuck-audit cleanup |
| `…_atomic_audit_start_entitlement.sql` | Start-race entitlement fix |
| `…_product_events.sql` | Product analytics |
| `…_service_role_notification_grants.sql` | Email function table grants |

### Edge functions

| Function | Role |
|----------|------|
| `audit-fetch` | Server-side HTML / robots / sitemap fetch |
| `audit-render` | Playwright render proxy |
| `email-notifications` | Audit complete, score-drop, weekly digest (Resend) |
| `delete-account` | Account deletion |
| `payment-checkout` | Start subscription checkout |
| `payment-portal` | Subscription management |
| `payment-cancel` | Cancel subscription |
| `payment-change-plan` | Plan change flow |
| `payment-webhook` | Provider webhook ingestion (no user JWT) |

Ops runbook: [`supabase/scripts/OPERATIONS.md`](./supabase/scripts/OPERATIONS.md).

---

## Production launch

Follow [`LAUNCH-CHECKLIST.md`](./LAUNCH-CHECKLIST.md) for Razorpay live cutover, render worker token, Resend, Sentry, migrations, and Vercel env.

---

## Security

- Never commit secrets or `.env` files
- Only `VITE_*` public values ship to the browser; RLS protects data
- Service role stays in edge functions
- Payments and webhooks run server-side
- Render worker requires `RENDER_WORKER_TOKEN` in production

---

## Coding standards

- Prefer `@/*` imports; run `npm run typecheck` before merge
- Log with `createLogger()` — no sensitive data in client logs
- Premium dark SaaS UI; mobile-first; minimal focused diffs
- **Do not** redesign the audit engine, rewrite scoring, or reposition as SEO without explicit approval

---

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production |
| `fix/*`, `feat/*` | Work → `main` when ready |

---

## Roadmap

### Shipped

- Conversion audit engine + Growth Score + confidence / SPA softening
- Business foundation, billing, workspace ledger
- Vertly Convertly-only routing + expanded context suggestions
- Live execution, sample report, notifications plumbing
- Lightweight supporting technical signals in-report

### Next

- Team invitations / org workspaces
- Optional hosted LLM provider for Vertly (routing unchanged)
- Stronger crawl for geo-restricted / heavily blocked sites
- Razorpay live-mode cutover after QA (see launch checklist)

---

## License

Proprietary. © 2026 Convertly · HM Coding. All rights reserved.

## Contributing

1. Branch from `main`
2. From `client/`: `npm run typecheck`, `npm run lint`, `npm run build`
3. Keep changes scoped; note migrations if schema changes
4. Never commit secrets
