# Convertly

AI-powered conversion intelligence for modern product and growth teams. Convertly analyzes website experiences, surfaces high-impact opportunities, and helps teams ship higher-converting funnels with clarity and speed.

**Owner:** [HM Coding](https://hmcoding.com)

---

## Features

- **Conversion audits** — Full-funnel and page-specific analysis with conversion scores
- **Priority queue** — Rank opportunities by likely impact
- **AI recommendations** — Actionable guidance with ownership and rollout direction
- **Audit dashboard** — Metrics, recent runs, and onboarding for new workspaces
- **Workspace & billing** — Team settings and subscription management (MVP mock data)
- **Sample report** — Public preview of a completed audit at `/sample-report`

---

## Architecture

Convertly follows a layered frontend architecture:

```
Pages
  ↓
Services        (authService, auditService, billingService, …)
  ↓
Repositories    (authRepository, profileRepository, audit repositories)
  ↓
Storage / Data  (localStorage MVP; Supabase-ready)
```

### Key directories

| Path | Purpose |
|------|---------|
| `src/pages/` | Route-level screens |
| `src/components/` | Reusable UI, layout, auth shells |
| `src/features/` | Domain sections and mock data |
| `src/services/` | Business logic and API facades |
| `src/services/repositories/` | Persistence adapters |
| `src/lib/` | Routes, env, validation utilities |
| `src/types/` | Shared TypeScript types |

### Auth (MVP)

- Local auth via `localStorage` when `VITE_USE_LOCAL_AUTH=true` (default)
- Supabase env placeholders in `.env.example` and `src/services/auth/supabaseClient.ts`
- Protected app routes redirect unauthenticated users to `/login`
- Auth pages use a split layout with rotating product panel and legal content overlay

---

## Tech stack

- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS v4**
- **shadcn/ui** (Button, Input, Label, Checkbox)
- **Framer Motion**
- **React Router v7**
- **Lucide React**

---

## Local setup

### Prerequisites

- Node.js 20+
- npm 10+

### Install and run

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:5173`.

### Environment variables

Copy `.env.example` to `.env`:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (production auth) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_USE_LOCAL_AUTH` | `true` for localStorage MVP auth (default) |

### Build

```bash
npm run build
```

---

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Marketing landing page |
| `/login` | Guest | Sign in |
| `/signup` | Guest | Create account |
| `/forgot-password` | Guest | Password reset request |
| `/sample-report` | Public | Demo audit report |
| `/dashboard` | Protected | Audit dashboard |
| `/audit/new` | Protected | Start new audit |
| `/audits` | Protected | Audit history |
| `/audits/:id` | Protected | Audit detail report |
| `/workspace` | Protected | Workspace settings |
| `/billing` | Protected | Billing |
| `/settings` | Protected | Account settings |

---

## Roadmap

### Launch sprint (MVP — ~5 days)

- [x] Landing page polish and navigation
- [x] Auth pages and split auth layout
- [x] Protected routes and local auth foundation
- [x] Sample report public preview
- [ ] Supabase auth integration
- [ ] Email/password reset via Supabase
- [ ] Production deployment pipeline
- [ ] Real audit backend integration

### Post-launch

- Team invitations and roles
- Stripe billing integration
- Live website crawl pipeline
- Mobile nav drawer for authenticated app

---

## HM Coding ownership

Convertly is developed and maintained by **HM Coding**. All product design, codebase, and launch execution for this MVP are owned by HM Coding unless otherwise agreed in writing.

© 2026 Convertly · HM Coding
