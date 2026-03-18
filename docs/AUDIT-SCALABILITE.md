# AUDIT SCALABILITE — Qarte SaaS

**Score : 86/100** — Capacite actuelle ~5000-8000 merchants (Supabase Pro)

---

## Ce qui va bien

- Checkin parallelise (Promise.all sur 3 etapes)
- Stats dashboard optimise (5 queries paralleles, groupBy en JS)
- Singleton pattern Supabase admin
- Cron sections isolees try/catch + timeout + batch emails
- Landing page CDN + RSC (illimite)
- Bundle size optimise (~70KB gzipped, lazy load Framer Motion)
- 25+ index DB (visits, loyalty_cards, redemptions, vouchers, planning slots, etc.)
- Push notifications batchees par 50 avec pause 100ms
- Planning : factory pattern photos (`_photo-helpers.ts`), max 200 slots/merchant, memoisation correcte (slotsByDate, serviceColorMap, slotCards)
- Activity feed : merchant lookup optimise (batch par IDs references, plus de fetch unbounded)
- Admin merchant detail : 20 queries paralleles `head: true` (count-only)
- Customer search avec debounce 300ms
- Client-side image compression avant upload (1MB/1200px)

### Corrections deployees (mars 2026)

- **Admin metriques** : RPCs server-side (`get_first_visit_per_merchant`, etc.)
- **Admin merchants-data** : loyalty_cards count via RPC + `.limit(10000)`
- **Activity feed** : `.limit()` sur toutes les tables + fetch merchants scope aux IDs references
- **Planning photos** : ownership + slot verification en parallele (`Promise.all`)
- **Planning shift-slot** : supporte `newDate` pour deplacements inter-jours
- **Photo helpers** : factory pattern elimine ~350 lignes dupliquees

---

## Corrections faisables en local

### MEDIUM

- [ ] **Customer search N+1** (1h)
  - `src/app/api/customers/search/route.ts:40-55` : charge TOUS les clients puis filtre en JS
  - Fix : utiliser `ILIKE` SQL avec `LIMIT 10` + JOIN

- [ ] **Admin merchants-data visits sans LIMIT** (30min)
  - `src/app/api/admin/merchants-data/route.ts:39` : visits 30 jours sans `.limit()`
  - A 5000 merchants actifs = ~1.5M rows
  - Fix : `.limit(500000)` ou RPC aggregation

- [ ] **Photos orphelines en Storage** (2h)
  - Quand un slot est supprime, CASCADE supprime la DB mais pas les fichiers Storage
  - Meme probleme si un merchant est supprime
  - Fix : cron cleanup ou trigger post-delete

- [ ] **Pas de `next/image` pour photos dynamiques** (2h)
  - Photos planning (inspiration + resultat) utilisent `<img>` brut
  - Pas d'optimisation WebP, pas de lazy loading natif
  - Fix : remplacer par `next/image` avec `unoptimized` ou Supabase image transform

### LOW

- [ ] **Pas de pagination sur certains list endpoints** (1h)
  - `/api/push/history` : tout l'historique sans pagination
  - `/api/planning?booked=true` : 60 jours sans pagination
  - Fix : ajouter `offset`/`limit` query params

- [ ] **Pas de caching sur routes publiques stables** (1h)
  - Seul `/api/merchants/top` a un `Cache-Control`
  - `/api/planning?public=true` et page pro pourraient beneficier de `stale-while-revalidate`

- [ ] **Shift-slot queries sequentielles** (30min)
  - `src/app/api/planning/shift-slot/route.ts` : ownership + fetch slot sequentiels
  - Fix : parallelliser avec `Promise.all`

- [ ] **SELECT * sur tables larges** (2h)
  - 30+ occurrences de `.select('*')` (merchants = 50+ colonnes)
  - Fix : selectionner uniquement les colonnes necessaires

- [ ] **Planning re-fetch complet apres chaque action** (2h)
  - Chaque add/update/delete recharge tous les slots de la semaine
  - Fix : updates optimistes cote client

---

## Necessite intervention externe

### Upstash Redis (~15EUR/mois)
- [ ] **Rate limiter Map → Redis** (2h) — cold start reset les compteurs

### Mois 2+ (si 1000+ merchants)
- [ ] **Cron refactor vers queue** (3-4 jours) — Bull + Redis ou SQS
- [ ] **Push service dedie** (2 jours) — FCM au lieu de web-push

---

## Estimations de capacite

| Seuil | Etat |
|-------|------|
| 1000 merchants | OK — systeme fluide |
| 5000 merchants | Admin lent (3-5s), customer search >1s pour gros merchants |
| 10000 merchants | Admin merchants-data risque timeout, besoin RPC aggregation |

**Bottlenecks principaux** : customer search N+1, admin visits sans LIMIT, photos orphelines Storage

---

*Audit initial : 19 fevrier 2026 — Mis a jour : 19 mars 2026*
