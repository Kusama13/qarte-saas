# AUDIT SCALABILITE — Qarte SaaS

**Score : 72/100** — Mis a jour 7 avril 2026
**Capacite estimee : ~3000-5000 merchants** (Supabase Pro, Vercel Pro)

---

## Resume

9 issues critiques, 16 hautes, 15 moyennes. Les principaux risques sont le rate limiting en memoire (perdu au cold start serverless), les crons sans limite de batch (SMS/push/email), et les pages admin qui chargent 10k+ records cote client sans pagination.

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

### C2. Cron evening — boucle SMS sans limite
**Fichier** : `src/app/api/cron/evening/route.ts` lignes 269-321
- Itere tous les merchants actifs, envoie 1 SMS par slot du lendemain
- Aucune limite globale sur le nombre de SMS par run
- `rateLimitDelay()` = 600ms/SMS → 500 SMS = 5min, timeout Vercel a 300s
- OVH rate limit ~1000 SMS/min non gere
- **Fix** : cap global (ex: 200 SMS/run), batch par merchant avec limite

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

### C5. Planning sans pagination
**Fichier** : `src/app/api/planning/route.ts` lignes 78-91
- Mode dashboard : SELECT * avec nested joins (services, photos) sans LIMIT
- Merchant actif 6 mois = 500+ slots × photos
- **Fix** : ajouter `.limit(500)` + filtre date obligatoire

### C6. Cron morning — fetch 50k records
**Fichier** : `src/app/api/cron/morning/route.ts` ligne 543
- `.limit(50000)` sur les offres — tout en memoire
- Si timeout, envois partiels sans rollback
- **Fix** : pagination par batch de 5000

### C7. Cron morning-push — 10k push sans batch
**Fichier** : `src/app/api/cron/morning-push/route.ts` lignes 83-96
- 5000 loyalty_cards + 10000 push_subscriptions en une requete
- `Promise.allSettled` sur 10k items = spike memoire
- Pas de batch rate limiting vers le push provider
- **Fix** : batch de 100 avec 1s de pause

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

### H2. Pas de TEXT length constraints en DB
`merchants.shop_name`, `customers.first_name`, `vouchers.reward_description`, etc. — tous TEXT sans limite. Un user peut coller 1MB de texte.
**Fix** : CHECK constraints (ex: `LENGTH(shop_name) <= 255`)

### H3. Pas de RLS sur admin_tasks/admin_notes
Tables sans RLS documentee — potentiellement lisibles par le client anon.
**Fix** : `ENABLE ROW LEVEL SECURITY` + policy super_admins only

### H4. deposit_percent et deposit_amount pas mutuellement exclusifs
Pas de CHECK constraint — les deux peuvent etre remplis simultanement.
**Fix** : `CHECK ((deposit_percent IS NULL) OR (deposit_amount IS NULL))`

### H5. Email sans retry
`src/lib/email.ts` lignes 81-94 — si Resend echoue, l'email est perdu. Pas de retry exponential backoff.
**Fix** : 3 retries avec backoff (1s, 2s, 4s)

### H6. Email sans rate limit interne
`src/lib/email.ts` — Resend limite a 2 req/s. Les crons utilisent `rateLimitDelay()` mais les APIs directes (signup, booking) non.
**Fix** : throttle dans sendEmail factory

### H7. Pas de virtualisation listes longues
Aucun import de `react-window` ou `react-virtual`. Planning 500+ slots, admin 1000+ rows rendus sans virtualisation.
**Fix** : react-window pour les listes > 100 items

### H8. Pas d'ISR pour les pages publiques `/p/[slug]`
Chaque visite de la vitrine merchant query Supabase. Si une page devient virale, DB hammered.
**Fix** : `export const revalidate = 3600` (1h ISR)

### H9. Recharts importe sans lazy load
`src/app/[locale]/admin/metriques/page.tsx` — ~40KB gzipped charge meme si l'admin ne regarde pas les graphiques.
**Fix** : `dynamic(() => import('./Charts'), { ssr: false })`

### H10. html-to-image + jspdf charges globalement
~80KB total de deps lourdes importees au top-level dans le planning.
**Fix** : `await import('html-to-image')` au moment du clic

### H11. Cron evening — pas de transaction sur release slots
`src/app/api/cron/evening/route.ts` lignes 174-227 — DELETE services + UPDATE fillers + UPDATE slot principal en 3 requetes separees. Si une echoue, donnees corrompues.
**Fix** : error isolation par slot + continue on error

### H12. Missing composite indexes
Pas de `idx_loyalty_cards_merchant_created`, `idx_point_adjustments_merchant_adjusted`. Queries admin/metriques font des scans.
**Fix** : `CREATE INDEX idx_loyalty_cards_merchant_created ON loyalty_cards(merchant_id, created_at DESC)`

### H13. customers.merchant_id nullable
Permet des customers orphelins sans merchant. Queries doivent gerer NULL partout.
**Fix** : documenter le cas d'usage ou rendre NOT NULL

### H14. Promise.all sans error isolation (metriques)
`src/app/[locale]/admin/metriques/page.tsx` lignes 179-195 — si 1 query echoue, toutes les donnees sont undefined.
**Fix** : `Promise.allSettled()` + fallback par section

### H15. 8+ setState en cascade (metriques)
Chaque `setState` trigger un re-render → 8+ re-renders pendant le fetch.
**Fix** : `useReducer` ou un seul `useState` avec objet

### H16. Push merchant — race condition TOCTOU
`src/lib/merchant-push.ts` lignes 33-45 — check existence → send → insert. Deux calls simultanes passent le check.
**Fix** : `UNIQUE(merchant_id, reference_id)` + `ON CONFLICT DO NOTHING`

---

## MEDIUM (15 issues)

| # | Issue | Fichier |
|---|-------|---------|
| M1 | SMS dedup N+1 (1 query par SMS en cron) | `src/lib/sms.ts:154-176` |
| M2 | Customer search ILIKE sur 3 colonnes (pas de full-text) | `src/app/api/customers/search/route.ts:46-51` |
| M3 | Checkin post-visit queries pourraient etre denormalisees | `src/app/api/checkin/route.ts:356-387` |
| M4 | Cron morning-jobs — mapping phone→customer inefficace | `src/app/api/cron/morning-jobs/route.ts:108-133` |
| M5 | Pas d'index sur pending_email_tracking(merchant_id, reminder_day) | Schema |
| M6 | Pas de retention policy (sms_logs, push_history grandissent indefiniment) | Toutes les tables audit |
| M7 | Email rendu 2 fois (HTML + plaintext) | `src/lib/email.ts:78-79` |
| M8 | Pas de batch email (Resend supporte le batch) | `src/lib/email.ts` |
| M9 | Push 429 quota exceeded non gere | `src/lib/merchant-push.ts:67-88` |
| M10 | Browser client singleton sans auto-reconnect | `src/lib/supabase.ts:8-26` |
| M11 | Pas de config image optimisee (pas de webp, pas de deviceSizes) | `next.config.mjs` |
| M12 | Photos planning non compressees avant upload | `src/app/api/upload/route.ts` |
| M13 | Pas de structured logging (emails, push) | `src/lib/email.ts`, `src/lib/merchant-push.ts` |
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
