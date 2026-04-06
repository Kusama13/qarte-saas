# CLAUDE.md — Qarte SaaS

## Commands

```bash
npm run dev          # Dev server (port 3000)
npm run build        # Production build
npx tsc --noEmit     # Type check (run before push)
npm run lint         # ESLint
npm test             # Vitest
```

## Architecture

- Next.js 15 App Router + React 18 + TypeScript + Tailwind
- Supabase (PostgreSQL + Auth + Storage + RLS) + Stripe + Resend
- i18n: next-intl — FR default (no prefix), EN under /en/*
- All pages under src/app/[locale]/ except API routes

## Key Directories

```
src/app/[locale]/dashboard/  — Merchant dashboard (auth protected)
src/app/[locale]/admin/      — Admin dashboard (super_admins only, includes /tracking analytics)
src/app/[locale]/p/[slug]/   — Public merchant page (no auth)
src/app/api/                 — 30+ API routes
supabase/migrations/         — 74+ SQL migrations
messages/{fr,en}.json        — i18n translations
docs/                        — context.md, supabase-context.md, audits
```

## Code Style

- French language in UI (tutoiement dashboard, vouvoiement client-facing)
- No emojis unless explicitly requested
- Zod validation on all POST/PATCH/DELETE API routes
- Always use `getUser()` not `getSession()` for auth
- DB dates: visits→`visited_at`, redemptions→`redeemed_at` (NEVER `created_at`)
- Null safety: `Number(value || 0)` for cagnotte fields

## Gotchas

- NEVER push without explicit user approval
- NEVER place React hooks after conditional early returns (crash #310)
- Supabase admin client (service_role) = server-side only
- Phone storage: E.164 without + (e.g. `33612345678`)
- Migrations must be applied manually in Supabase SQL Editor
- `.next` cache can cause stale module errors → `rm -rf .next`

## Environment

Required env vars (server-side):
`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`RESEND_API_KEY`, `CRON_SECRET`, `VAPID_PRIVATE_KEY`, `IP_HASH_SALT`,
`OVH_APP_KEY`, `OVH_APP_SECRET`, `OVH_CONSUMER_KEY`, `OVH_SMS_SERVICE`, `OVH_SMS_SENDER`

Public (NEXT_PUBLIC_):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

## Docs

- `docs/context.md` — Full project context (architecture, features, APIs)
- `docs/supabase-context.md` — DB schema (tables, RLS, triggers, indexes)
