# AUDIT SCALABILITE — Qarte SaaS

**Score : 84/100** — Mis a jour 7 avril 2026
**Capacite estimee : ~5000-8000 merchants** (Supabase Pro, Vercel Pro)

---

## Resume

3 critiques, 5 hautes, 9 moyennes restantes. Les principaux risques sont le rate limiting en memoire (C1 — necessite Redis), le refactor admin merchants-data (C3), et le hard timeout cron (C9).

---

## Ce qui va bien

- Checkin parallelise (Promise.all sur 3 etapes)
- Singleton pattern Supabase admin + browser client
- Cron sections isolees try/catch + soft timeout 240s + cap SMS 200/run + push batch 100
- Landing page CDN + RSC, pages publiques ISR 1h
- 28+ index DB (visits, loyalty_cards, redemptions, vouchers, planning slots, composites)
- Upload securise (10MB max, magic bytes, rate limit, MIME whitelist)
- Customer auth cookie signe pour les APIs client
- SMS dedup par slot_id + insert-before-send
- Email retry (2 retries, backoff exponentiel)
- Push dedup UNIQUE index + 429 quota handling
- RLS sur toutes les tables sensibles (admin_tasks, admin_notes)
- CHECK constraints TEXT length + deposit exclusivite
- html-to-image lazy-loaded, jspdf type-only import
- Images webp + deviceSizes optimises
- Planning API limite a 1000 + default 90j
- Error isolation par slot dans evening cron (parallel ops)

---

## CRITICAL (4 restantes)

### C1. Rate limiting en memoire — perdu au cold start
**Fichier** : `src/lib/rate-limit.ts` lignes 8-19
- `Map<string, RateLimitEntry>` en memoire, reset a chaque cold start Vercel
- Chaque instance serverless a son propre store
- **Touche** : checkin, booking, upload, customer-edit
- **Fix** : Redis (Upstash) ou Vercel KV

### C3. Admin merchants-data — 13 queries paralleles sans pagination
**Fichier** : `src/app/api/admin/merchants-data/route.ts` lignes 41-54
- Fetch `merchants.*` sans LIMIT + 12 tables avec `limit(10000)`
- Tout agrege en JS cote serveur → memoire spike
- **Fix** : RPC SQL pour aggregation, pagination merchants

### ~~C4. Page admin metriques — 10k+ records en state client~~ FAIT (mig 099)
RPC `get_merchants_with_services` et `get_merchants_with_photos` (DISTINCT cote DB). React 18 auto-batch les setState.

### C9. Timeout cron soft, pas hard
**Fichier** : `src/app/api/cron/morning/route.ts` lignes 83-86
- `isTimedOut()` skip les sections futures mais ne coupe pas la section en cours
- **Fix** : return early avec status 202 si timeout

---

## HIGH (5 restantes)

### H1. Middleware — 2-3 queries DB par requete
`src/middleware.ts` lignes 91-151 — `getUser()` + `merchants.select()` sur chaque route protegee.
**Fix** : cache merchant_id dans session JWT ou Vercel KV (TTL 5min)

### H6. Email sans rate limit interne
`src/lib/email.ts` — Resend limite a 2 req/s. Les crons utilisent `rateLimitDelay()` mais les APIs directes (signup, booking) non.
**Fix** : throttle dans sendEmail factory

### H7. Pas de virtualisation listes longues
Planning 500+ slots, admin 1000+ rows rendus sans virtualisation.
**Fix** : react-window pour les listes > 100 items

### H9. Recharts importe sans lazy load
`src/app/[locale]/admin/metriques/page.tsx` — ~40KB gzipped charge au top-level.
**Fix** : `dynamic(() => import('./Charts'), { ssr: false })`

### H13. customers.merchant_id nullable
Permet des customers orphelins sans merchant.
**Fix** : documenter le cas d'usage ou rendre NOT NULL

---

## MEDIUM (9 restantes)

| # | Issue | Fichier |
|---|-------|---------|
| M1 | SMS dedup N+1 (1 query par SMS en cron) | `src/lib/sms.ts:154-176` |
| M2 | Customer search ILIKE sur 3 colonnes (pas de full-text) | `src/app/api/customers/search/route.ts:46-51` |
| M3 | Checkin post-visit queries pourraient etre denormalisees | `src/app/api/checkin/route.ts:356-387` |
| M6 | Pas de retention policy (sms_logs, push_history grandissent indefiniment) | Toutes les tables audit |
| M8 | Pas de batch email (Resend supporte le batch) | `src/lib/email.ts` |
| M10 | Browser client singleton sans auto-reconnect | `src/lib/supabase.ts:8-26` |
| M12 | Photos planning non compressees avant upload | `src/app/api/upload/route.ts` |
| M14 | point_adjustments schema drift (created_at vs adjusted_at) | Schema mig 002 |
| M15 | Pas de compression reponse configuree | `next.config.mjs` |

---

## Plan de remediation

### Phase 1 — Immediate
1. Rate limiting distribue (Upstash Redis) — C1
2. Timeout hard-stop crons — C9

### Phase 2 — Sprint suivant
3. Pagination admin merchants-data — C3
4. COUNT queries metriques — C4
5. Cache middleware auth (Vercel KV) — H1
6. Email rate limit interne — H6

### Phase 3 — 2 sprints
7. Virtualisation listes longues — H7
8. Recharts lazy load — H9
9. Data retention policy — M6
10. Compression images upload — M12

---

## Migration 098 (a appliquer dans SQL Editor)

Fichier : `supabase/migrations/098_scalability_constraints.sql`

Contenu : 11 CHECK constraints, RLS admin, deposit exclusivite, 3 composite indexes, UNIQUE push dedup, index reactivation tracking.

---

*Audit realise le 7 avril 2026. Methode : analyse statique du code + schema DB + patterns de requetes.*
