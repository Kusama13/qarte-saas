# AUDIT SCALABILITÉ — Qarte SaaS

**Score : 78/100** — Capacité actuelle ~500-800 merchants (plafond dur : Supabase Free 10 connexions)

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
