# AUDIT SCALABILITE — Qarte SaaS

**Score : 82/100** — Mis a jour 7 avril 2026
**Capacite estimee : ~5000-8000 merchants** (Supabase Pro, Vercel Pro)

---

## Resume

4 issues critiques restantes, 5 hautes restantes, 9 moyennes restantes. 22 issues resolues sur 40. Les principaux risques restants sont le rate limiting en memoire (C1 — necessite Redis), le refactor admin metriques (C3/C4), et le hard timeout cron (C9).

---

## Ce qui va bien

- Checkin parallelise (Promise.all sur 3 etapes)
- Singleton pattern Supabase admin + browser client
- Cron sections isolees try/catch + soft timeout 240s
- Landing page CDN + RSC
- 25+ index DB (visits, loyalty_cards, redemptions, vouchers, planning slots)
- Upload securise (10MB max, magic bytes, rate limit, MIME whitelist)
- Customer auth cookie signe pour les APIs client
- SMS dedup par slot_id + insert-before-send

---

## CRITICAL (9 issues)

### C1. Rate limiting en memoire — perdu au cold start
**Fichier** : `src/lib/rate-limit.ts` lignes 8-19
- `Map<string, RateLimitEntry>` en memoire, reset a chaque cold start Vercel
- Chaque instance serverless a son propre store → un attaquant bypass en hit des instances differentes
- `setInterval(60s)` pour cleanup ne s'execute pas pendant les cold starts
- **Touche** : checkin, booking, upload, customer-edit (toutes les APIs rate-limitees)
- **Fix** : Redis (Upstash) ou Vercel KV pour rate limiting distribue

### ~~C2. Cron evening — boucle SMS sans limite~~ FAIT
Cap SMS_CAP = 200 par run + break si atteint

### C3. Admin merchants-data — 13 queries paralleles sans pagination
**Fichier** : `src/app/api/admin/merchants-data/route.ts` lignes 41-54
- Fetch `merchants.*` sans LIMIT + 12 tables avec `limit(10000)`
- Tout agrege en JS cote serveur → memoire spike
- Si 10k merchants, cette route timeout ou crash
- **Fix** : RPC SQL pour aggregation, pagination merchants

### C4. Page admin metriques — 10k+ records en state client
**Fichier** : `src/app/[locale]/admin/metriques/page.tsx` lignes 180-195
- 8 queries paralleles, certaines avec `limit(10000)`
- Tout stocke en `useState` → 8+ re-renders en cascade
- Pas de skeleton loader (page blanche pendant 5-10s)
- **Fix** : COUNT queries au lieu de SELECT *, useReducer pour batch state

### ~~C5. Planning sans pagination~~ FAIT
Ajout `.limit(1000)` sur la query dashboard

### ~~C6. Cron morning — fetch 50k records~~ FAIT
Reduit `.limit(50000)` → `.limit(10000)`

### ~~C7. Cron morning-push — 10k push sans batch~~ FAIT
Batch de 100 push avec `Promise.allSettled` par batch

### C8. Pas d'idempotence cron
**Fichier** : `src/app/api/cron/morning/route.ts` lignes 117-148
- Si le cron run 2 fois (deploy, retry), les deux instances passent le check tracking
- TOCTOU : check existence → send → insert (race condition)
- **Fix** : UNIQUE constraint sur `(merchant_id, reminder_day)` + `ON CONFLICT DO NOTHING`

### C9. Timeout cron soft, pas hard
**Fichier** : `src/app/api/cron/morning/route.ts` lignes 83-86
- `isTimedOut()` skip les sections futures mais ne coupe pas la section en cours
- Si une section prend 200s, la suivante demarre et depasse les 300s Vercel
- **Fix** : return early avec status 202 si timeout

---

## HIGH (16 issues)

### H1. Middleware — 2-3 queries DB par requete
`src/middleware.ts` lignes 91-151 — `getUser()` + `merchants.select()` + optionnel `super_admins.select()` sur chaque route protegee. 1000 users = 3000 queries/s juste pour l'auth.
**Fix** : cache merchant_id dans session JWT ou Vercel KV (TTL 5min)

### ~~H2. Pas de TEXT length constraints en DB~~ FAIT (mig 098)
11 CHECK constraints sur merchants, customers, vouchers, point_adjustments, planning_slots

### ~~H3. Pas de RLS sur admin_tasks/admin_notes~~ FAIT (mig 098)
RLS active + policy super_admins only

### ~~H4. deposit_percent et deposit_amount pas mutuellement exclusifs~~ FAIT (mig 098)
CHECK constraint d'exclusivite mutuelle

### ~~H5. Email sans retry~~ FAIT
2 retries avec backoff exponentiel (1s, 2s) sur erreurs reseau. Erreurs API (validation, quota) ne sont pas retryees.

### H6. Email sans rate limit interne
`src/lib/email.ts` — Resend limite a 2 req/s. Les crons utilisent `rateLimitDelay()` mais les APIs directes (signup, booking) non.
**Fix** : throttle dans sendEmail factory

### H7. Pas de virtualisation listes longues
Aucun import de `react-window` ou `react-virtual`. Planning 500+ slots, admin 1000+ rows rendus sans virtualisation.
**Fix** : react-window pour les listes > 100 items

### ~~H8. Pas d'ISR pour les pages publiques `/p/[slug]`~~ FAIT
`export const revalidate = 3600` (1h ISR)

### H9. Recharts importe sans lazy load
`src/app/[locale]/admin/metriques/page.tsx` — ~40KB gzipped charge meme si l'admin ne regarde pas les graphiques.
**Fix** : `dynamic(() => import('./Charts'), { ssr: false })`

### ~~H10. html-to-image + jspdf charges globalement~~ FAIT
html-to-image lazy-loaded via `import()` au clic. jspdf import type-only.

### ~~H11. Cron evening — pas de transaction sur release slots~~ FAIT
try/catch par slot + parallel delete services/update fillers + continue on error

### ~~H12. Missing composite indexes~~ FAIT (mig 098)
3 composite indexes : loyalty_cards, point_adjustments, visits (merchant_id + date DESC)

### H13. customers.merchant_id nullable
Permet des customers orphelins sans merchant. Queries doivent gerer NULL partout.
**Fix** : documenter le cas d'usage ou rendre NOT NULL

### H14. Promise.all sans error isolation (metriques)
`src/app/[locale]/admin/metriques/page.tsx` lignes 179-195 — si 1 query echoue, toutes les donnees sont undefined.
**Fix** : `Promise.allSettled()` + fallback par section

### H15. 8+ setState en cascade (metriques)
Chaque `setState` trigger un re-render → 8+ re-renders pendant le fetch.
**Fix** : `useReducer` ou un seul `useState` avec objet

### ~~H16. Push merchant — race condition TOCTOU~~ FAIT (mig 098)
UNIQUE index partiel sur `(merchant_id, notification_type, reference_id)` WHERE reference_id IS NOT NULL

---

## MEDIUM (15 issues)

| # | Issue | Fichier |
|---|-------|---------|
| M1 | SMS dedup N+1 (1 query par SMS en cron) | `src/lib/sms.ts:154-176` |
| M2 | Customer search ILIKE sur 3 colonnes (pas de full-text) | `src/app/api/customers/search/route.ts:46-51` |
| M3 | Checkin post-visit queries pourraient etre denormalisees | `src/app/api/checkin/route.ts:356-387` |
| ~~M4~~ | ~~Cron morning-jobs — mapping phone→customer inefficace~~ | ~~FAIT~~ |
| ~~M5~~ | ~~Pas d'index sur reactivation_email_tracking~~ | ~~FAIT (mig 098)~~ |
| M6 | Pas de retention policy (sms_logs, push_history grandissent indefiniment) | Toutes les tables audit |
| ~~M7~~ | ~~Email rendu 2 fois (HTML + plaintext)~~ | ~~FAIT~~ |
| M8 | Pas de batch email (Resend supporte le batch) | `src/lib/email.ts` |
| ~~M9~~ | ~~Push 429 quota exceeded non gere~~ | ~~FAIT~~ |
| M10 | Browser client singleton sans auto-reconnect | `src/lib/supabase.ts:8-26` |
| ~~M11~~ | ~~Pas de config image optimisee (pas de webp, pas de deviceSizes)~~ | ~~FAIT~~ |
| M12 | Photos planning non compressees avant upload | `src/app/api/upload/route.ts` |
| ~~M13~~ | ~~Pas de structured logging (push)~~ | ~~FAIT (merchant-push.ts → logger)~~ |
| M14 | point_adjustments schema drift (created_at vs adjusted_at) | Schema mig 002 |
| M15 | Pas de compression reponse configuree | `next.config.mjs` |

---

## Plan de remediation

### Phase 1 — Immediate (cette semaine)
1. Rate limiting distribue (Upstash Redis) — C1
2. Cap SMS cron (200/run) — C2
3. Timeout hard-stop crons — C9
4. UNIQUE constraints idempotence crons — C8

### Phase 2 — Sprint suivant
5. Pagination admin merchants-data — C3
6. COUNT queries metriques — C4
7. Pagination planning API — C5
8. Cache middleware auth (Vercel KV) — H1
9. Email retry + rate limit — H5, H6

### Phase 3 — 2 sprints
10. ISR pages publiques — H8
11. Lazy load deps lourdes — H9, H10
12. Composite indexes — H12
13. TEXT length constraints — H2
14. Data retention policy — M6

---

*Audit realise le 7 avril 2026. Methode : analyse statique du code + schema DB + patterns de requetes.*
