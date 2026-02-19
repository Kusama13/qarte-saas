# AUDIT SÉCURITÉ — Qarte SaaS

**Score : 78/100** — 0 critical, 4 high, 8 medium, 12 low

---

## Ce qui va bien

- RLS policies restrictives (migration 038)
- JWT validation correcte (`getUser()` pas `getSession()`)
- Zod partout pour validation inputs
- File upload avec magic bytes + UUID filename
- Webhook Stripe signature vérifiée
- Headers HSTS, X-Frame-Options, X-Content-Type-Options OK
- Cookie customer HttpOnly + SameSite=Strict
- Admin auth centralisée (`verifyAdminAuth()`)
- Cron protégé par `CRON_SECRET`

---

## Corrections faisables en local

### Semaine 1 — MEDIUM

- [ ] **Rate limit routes publiques** (1h)
  - Ajouter rate limit sur : `/api/merchants/preview`, `/api/merchant/stats`, `/api/referrals` GET, `/api/offers`

- [ ] **Masquer prénom parrain** (1h)
  - `src/app/api/referrals/route.ts` : retourner initiale + `***` au lieu du prénom complet

- [ ] **HTML escape push notifications** (1h)
  - `src/app/api/push/send/route.ts` : escape titre/body même après modération

- [ ] **Validate merchant_id dans webhook metadata** (1h)
  - `src/app/api/stripe/webhook/route.ts` : vérifier que le merchant existe avant update

### Semaine 3 — LOW

- [ ] **Bearer token timing-safe** (30min)
  - `src/app/api/cron/morning/route.ts` : utiliser `crypto.timingSafeEqual` pour comparer CRON_SECRET

- [ ] **Admin error messages uniformes** (15min)
  - `src/lib/admin-auth.ts` : retourner le même message 403 pour non-auth et non-admin

- [ ] **Permissions-Policy complet** (15min)
  - `next.config.mjs` : ajouter magnetometer, gyroscope, accelerometer, payment, usb

- [ ] **Rate limit upload** (1h)
  - `src/app/api/upload/route.ts` : ajouter 10 req/min par IP

- [ ] **Rename `getSupabase()` → `getBrowserClient()`** (1h)
  - `src/lib/supabase.ts` : clarifier l'intention, throw si appelé côté serveur

---

## Nécessite intervention externe

### Migration DB (appliquer sur Supabase)

- [ ] **Webhook idempotency** (3h)
  - Créer table `webhook_events` (stripe_event_id unique)
  - Checker avant chaque update dans `src/app/api/stripe/webhook/route.ts`
  - Évite duplicate emails si Stripe renvoie le même event

### Config Vercel (env vars)

- [ ] **Enforce IP_HASH_SALT** (30min)
  - `src/app/api/checkin/route.ts` : throw si `IP_HASH_SALT` absent au lieu de fallback hardcodé
  - Nécessite : ajouter `IP_HASH_SALT` dans Vercel env vars

### Test en prod (scripts tiers)

- [ ] **Header CSP** (1h)
  - `next.config.mjs` : ajouter Content-Security-Policy
  - Nécessite : tester en prod que Facebook Pixel, Clarity, GSC ne cassent pas

### Audit Supabase dashboard

- [ ] **Vérifier RLS referrals + vouchers** (2h)
  - Vérifier dans Supabase que les policies sur referrals et vouchers sont correctes

### Upstash Redis (~€15/mois)

- [ ] **Rate limiter in-memory → Redis** (2h)
  - `src/lib/rate-limit.ts` : remplacer `Map` par `@upstash/ratelimit`
  - Chaque cold start Vercel reset les compteurs → faux positifs à 300+ merchants

---

*Audit effectué le 19 février 2026*
