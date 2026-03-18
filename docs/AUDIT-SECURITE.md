# AUDIT SECURITE — Qarte SaaS

**Score : 91/100** — 0 critical, 0 high, 5 medium, 3 low

---

## Ce qui va bien

- RLS policies restrictives (migration 038)
- JWT validation correcte (`getUser()` pas `getSession()`)
- Zod partout pour validation inputs (planning, offers, checkin, push, referrals, etc.)
- File upload avec magic bytes + UUID filename + rate limit 10/min + compression serveur
- Webhook Stripe signature verifiee
- Headers HSTS, X-Frame-Options, X-Content-Type-Options OK
- Permissions-Policy complet (camera, microphone, geolocation, magnetometer, gyroscope, accelerometer, payment, usb)
- Cookie customer HttpOnly + SameSite=Strict
- Admin auth centralisee (`authorizeAdmin()`) — messages d'erreur uniformes
- Cron protege par `CRON_SECRET` (comparaison timing-safe)
- Planning : auth + ownership verifies sur toutes les routes, slots max 200, photos max 3/slot
- Photo helpers factorise (`_photo-helpers.ts`) — validation coherente photos inspiration + resultat
- IP hashing SHA-256 + salt pour GDPR
- Referral lookup retourne uniquement `first_name` (pas de PII)
- Activity feed : `authorizeAdmin()` + rate limit

### Corrections deployees (mars 2026)

- **Push subscribe DELETE** : auth cookie phone + verification ownership client
- **Push send** : rate limit 10 envois/heure par IP
- **RPCs admin-only** : migration 052 restreint les 3 fonctions RPC a `service_role` ou `super_admin`
- **Audit log visits/edit** : modifications tracees dans `point_adjustments`
- **Stamps limits** : migration 054 — palier 1 max 15, palier 2 max 30
- **Merchants preview** : rate limit 30/min ajoute
- **Referral POST** : rate limit 5/min ajoute
- **Customer create 409** : retourne `customer_id` existant (planning reutilise au lieu de bloquer)

---

## MEDIUM (5)

### M1 — `/api/customers/create` sans Zod validation
- `src/app/api/customers/create/route.ts:37` : body destructure sans schema
- `initial_stamps`, `initial_amount` non bornes — un merchant pourrait injecter des valeurs arbitraires
- Fix : ajouter Zod schema avec bornes (stamps 0-15, amount 0-10000)

### M2 — Rate limit manquant sur routes publiques GET
- `/api/referrals` GET (referral code lookup)
- `/api/welcome` GET (welcome code validation)
- `/api/services` GET (public services list)
- `/api/planning?public=true` (dispos publiques)
- Risque : enumeration, scraping
- Fix : ajouter rate limit 30/min par IP

### M3 — Push notification payload non HTML-escape
- `src/app/api/push/send/route.ts:264` : titre/body envoyes directement
- Content moderation existe mais ne bloque pas l'injection HTML
- Fix : escape avant envoi

### M4 — IP_HASH_SALT fallback hardcode
- `src/app/api/checkin/route.ts:45`, `src/app/api/cagnotte/checkin/route.ts:44`
- Fallback `'qarte-default-ip-salt'` si env var absent → hash predictible
- Fix : throw si absent + ajouter dans Vercel env vars

### M5 — Pas de Content-Security-Policy header
- `next.config.mjs` : CSP manquant
- Necessite test en prod (Facebook Pixel, Clarity, GSC)

---

## LOW (3)

### L1 — `/api/test-emails` GET non authentifie
- Leake le HTML des templates email (donnees de test hardcodees)

### L2 — Error details dans push/subscribe et push/send
- `err.message` retourne au client dans le champ `details`
- Pourrait reveler des details internes (Supabase, Node.js)

### L3 — Planning public GET sans rate limit
- `/api/planning?public=true` : donnees minimales (dates/heures) mais pas de rate limit

---

## Necessite intervention externe

### Config Vercel (env vars)
- [ ] **Enforce IP_HASH_SALT** (30min) — throw si absent

### Test en prod (scripts tiers)
- [ ] **Header CSP** (1h) — tester Facebook Pixel, Clarity, GSC

### Upstash Redis (~15EUR/mois)
- [ ] **Rate limiter in-memory → Redis** (2h) — cold start reset les compteurs

### Migration DB
- [ ] **Webhook idempotency** (3h) — table `webhook_events` (stripe_event_id unique)

---

*Audit initial : 19 fevrier 2026 — Mis a jour : 19 mars 2026*
