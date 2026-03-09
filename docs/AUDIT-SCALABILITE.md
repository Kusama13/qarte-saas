# AUDIT SCALABILITÉ — Qarte SaaS

**Score : 94/100** — Capacité actuelle ~5000-10000 merchants (Supabase Pro : backups quotidiens, 60 connexions)

---

## Ce qui va bien

- Checkin parallélisé (Promise.all sur 3 étapes)
- Stats dashboard optimisé (5 queries parallèles, groupBy en JS)
- Singleton pattern Supabase admin
- Cron sections isolées try/catch + timeout + batch emails
- Landing page CDN + RSC (illimité)
- Bundle size optimisé (~70KB gzipped, lazy load Framer Motion)
- 4 index DB ajoutés (visits, loyalty_cards, redemptions, vouchers)
- Push notifications batchées par 50 avec pause 100ms
- Scan page : fetch merchant + referral en parallèle
- Page carte fidélité découpée en 5 composants (FCP amélioré)

### Corrections déployées (mars 2026)

- **Admin métriques** : 2 queries illimitées (visits, loyalty_cards) remplacées par RPCs server-side (`get_first_visit_per_merchant`, `get_tenth_card_date_per_merchant`)
- **Admin merchants-data** : loyalty_cards count via RPC `get_loyalty_card_counts_per_merchant` + `.limit(10000)` sur tracking tables
- **Activity feed** : `.limit()` sur les 4 tables (redemptions 500, loyalty_cards 1000, contact_messages 100, vouchers 200)
- **Merchants top** : loyalty_cards count via RPC au lieu de scan complet
- **Push subscribers** : `.limit(50000)` sur visits
- **Cron morning events push** : traitement per-merchant au lieu de bulk load + `.limit(5000)` + timeout guard
- **Migration 052** : 3 fonctions RPC SQL (agrégations server-side, ~1000 rows retournées au lieu de millions)

---

## Corrections faisables en local

*Toutes les corrections locales ont été implémentées.*

---

## Nécessite intervention externe

### Upstash Redis (~€15/mois)

- [ ] **Rate limiter Map → Redis** (2h)
  - `src/lib/rate-limit.ts` : remplacer `Map` par `@upstash/ratelimit`
  - Chaque cold start Vercel reset les compteurs → faux positifs à 300+ merchants

### Supabase Pro (+€25/mois)

- [x] **Free → Pro** — Fait (mars 2026)
  - 60 connections simultanées, backups quotidiens 7j, 8GB RAM

### Mois 2+ (si 1000+ merchants)

- [ ] **Cron refactor vers queue** (3-4 jours)
  - Bull + Redis ou SQS pour offload les emails — +€50/mois

- [ ] **Push service dédié** (2 jours)
  - Remplacer web-push par service managé (FCM) — +€30/mois

---

*Audit initial : 19 février 2026 — Mis à jour : 8 mars 2026*
