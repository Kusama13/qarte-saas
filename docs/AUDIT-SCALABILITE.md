# AUDIT SCALABILITÉ — Qarte SaaS

**Score : 68/100** — Capacité actuelle ~300-500 merchants, point de rupture ~500

---

## Ce qui va bien

- Checkin parallélisé (Promise.all sur 3 étapes)
- Stats dashboard optimisé (5 queries parallèles, groupBy en JS)
- Singleton pattern Supabase admin
- Cron sections isolées try/catch
- Landing page CDN + RSC (illimité)
- Bundle size acceptable (~100KB gzipped)

---

## Corrections faisables en local

*Toutes les corrections locales ont été implémentées.*

---

## Nécessite intervention externe

### Migration DB (appliquer sur Supabase)

- [ ] **6 index DB manquants** (1h)
  - Créer migration avec :
    - `idx_visits_customer_created` (customer_id, created_at)
    - `idx_loyalty_cards_referral_code` (referral_code)
    - `idx_redemptions_card_tier_date` (loyalty_card_id, tier, redeemed_at)
    - `idx_pending_email_merchant_day` (merchant_id, reminder_day)
    - `idx_vouchers_customer_merchant` (customer_id, merchant_id)
    - `idx_banned_numbers_check` (merchant_id, phone_number)
  - Gain : +30-50% perf queries

### Upstash Redis (~€15/mois)

- [ ] **Rate limiter Map → Redis** (2h)
  - `src/lib/rate-limit.ts` : remplacer `Map` par `@upstash/ratelimit`
  - Chaque cold start Vercel reset les compteurs → faux positifs à 300+ merchants

### Supabase Pro (+€25/mois)

- [ ] **Free → Pro** (0h, clic)
  - Free = 10 connections simultanées
  - À 300+ merchants avec Vercel concurrent functions : connection overflow

### Mois 2+ (si 1000+ merchants)

- [ ] **Cron refactor vers queue** (3-4 jours)
  - Bull + Redis ou SQS pour offload les emails — +€50/mois

- [ ] **Push service dédié** (2 jours)
  - Remplacer web-push par service managé (FCM) — +€30/mois

---

*Audit effectué le 19 février 2026*
