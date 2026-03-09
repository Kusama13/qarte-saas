# AUDIT SÉCURITÉ — Qarte SaaS

**Score : 93/100** — 0 critical, 0 high, 4 medium, 1 low

---

## Ce qui va bien

- RLS policies restrictives (migration 038)
- JWT validation correcte (`getUser()` pas `getSession()`)
- Zod partout pour validation inputs
- File upload avec magic bytes + UUID filename + rate limit 10/min
- Webhook Stripe signature vérifiée
- Headers HSTS, X-Frame-Options, X-Content-Type-Options OK
- Permissions-Policy complet (camera, microphone, geolocation, magnetometer, gyroscope, accelerometer, payment, usb)
- Cookie customer HttpOnly + SameSite=Strict
- Admin auth centralisée (`verifyAdminAuth()`) — messages d'erreur uniformes
- Cron protégé par `CRON_SECRET` (comparaison timing-safe)

### Corrections déployées (mars 2026)

- **Push subscribe DELETE** : auth cookie phone + vérification ownership client (était ouvert sans auth)
- **Push send** : rate limit 10 envois/heure par IP (n'avait pas de rate limit)
- **RPCs admin-only** : migration 052 restreint les 3 fonctions RPC à `service_role` ou `super_admin` (plpgsql auth guard)
- **Audit log visits/edit** : modifications de visites tracées dans `point_adjustments` (raison, auteur, diff)
- **Stamps limits** : migration 054 — palier 1 max 15 (etait 50), palier 2 max 30 (etait illimite) + validation frontend/JS

---

## Corrections faisables en local

### MEDIUM

- [ ] **Rate limit routes publiques** (1h)
  - Ajouter rate limit sur : `/api/merchants/preview`, `/api/merchant/stats`, `/api/referrals` GET, `/api/offers`

- [ ] **Masquer prénom parrain** (1h)
  - `src/app/api/referrals/route.ts` : retourner initiale + `***` au lieu du prénom complet

- [ ] **HTML escape push notifications** (1h)
  - `src/app/api/push/send/route.ts` : escape titre/body même après modération

- [ ] **Validate merchant_id dans webhook metadata** (1h)
  - `src/app/api/stripe/webhook/route.ts` : vérifier que le merchant existe avant update

### LOW

- [ ] **Rename `getSupabase()` → `getBrowserClient()`** (1h)
  - `src/lib/supabase.ts` : clarifier l'intention (22 fichiers à renommer)

---

## Nécessite intervention externe

### Migration DB (appliquer sur Supabase)

- [x] **Migration 052 — RPCs admin-only** : code déployé, **à exécuter dans Supabase SQL Editor**

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

*Audit initial : 19 février 2026 — Mis à jour : 8 mars 2026*
