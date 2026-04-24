# Stats feature + Design system — progress 2026-04-24

État d'avancement du chantier « page statistiques + no-show + quick actions + design harmonisé ». Rédigé avant compaction pour reprendre proprement.

---

## ✅ Livré (commité)

### Design system officiel (impeccable skills)
- Installé `npx impeccable skills install` → `.agents/skills/impeccable/` (symlink vers `.claude/skills/impeccable/`)
- **`PRODUCT.md`** à la racine : register produit, users (pro beauté FR/BE/CH), purpose, brand personality, anti-références (Planity/Booksy/Treatwell/Doctolib/Zoho), design principles, a11y
- **`DESIGN.md`** à la racine : atmosphere, palette couleurs (primary `#4b0082`, accents par feature, neutrals), typography (Figtree + Bodoni Moda + hiérarchie complète), radius/padding/shadow dominants, composants à réutiliser (`StatsCard`, `HeroToday`, `CollapsibleCard`, `FeatureBadge`, `WeekTiles`, `StatusBanner`), patterns récurrents, icons, motion, states, voice & tone, do-not list

### Page `/dashboard/stats`
- **Entrée dans `/plus` menu** (MoreSheet, pas dans bottom nav) via `nav-config.ts` → `SECONDARY_ITEMS`, clé i18n `dashNav.stats` (FR/EN)
- **Gating** `all_in` plan tier + `requirePlanFeature('planning')` côté API. Fidelity tier voit UpgradeLock avec CTA subscription.
- **Card d'entrée** sur la home dashboard après WeekTiles (visible si `showPlanningUi(merchant)`)
- **Pas de flèches** : ni `ArrowRight` sur la card home, ni `ArrowLeft` sur le header page stats
- **Senior FE designer pass** appliqué (KpiCard harmonisé avec StatsCard, SectionLabel pattern `text-[10px] tracking-[0.18em]`, TOOLTIP_STYLE centralisé, charts wrappers `rounded-2xl`, couleurs trend pill alignées, copy « tes tops prestations / le podium de ta semaine »)

### Filtre temporel
- **Hard floor avril 2026** (`STATS_FLOOR_YEAR = 2026, STATS_FLOOR_MONTH = 4`) côté API + UI. Jamais de mois avant avril.
- **Niveau 1** pills mois : « Avril », « Mai »... scrollable horizontal, année affichée (`Avril 26`) uniquement si historique multi-années
- **Niveau 2** pills semaines : apparaît quand un mois est actif. « Tout le mois · Sem 1 1–5 · Sem 2 6–12 · Sem 3 13–19 · Sem 4 20–26 · Sem 5 27–30 »
- Reset auto du weekIdx quand le mois change
- API passé de `?month=YYYY-MM` à `?from=YYYY-MM-DD&to=YYYY-MM-DD` (généralisable)

### Fill rate — Option B (calcul opening_hours)
- API charge `merchants.opening_hours` + `booking_mode`
- `computeOpenMinutes(openingHours, from, to)` itère chaque jour, parse `{open, close, break_start, break_end}` et somme les minutes ouvertes
- Slots bloqués (`client_name = '__blocked__'`) soustraits des minutes disponibles
- Slots bookés (hors cancelled) : somme `total_duration_minutes` (fallback sur services si null)
- **Formule** : `bookedMinutes / max(0, openMinutes - blockedMinutes)`
- Fonctionne pareil en mode libre ET créneaux
- UI : affiche « 68 % » · sub « 12h / 18h ouvertes ». Si pas d'horaires → « — » · « Renseigne tes horaires »
- Chart « remplissage par jour » suit la même logique (bookedMin/availableMin par jour de semaine)

### No-show tracking
- Migration **124_slot_attendance_status.sql** exécutée (confirmée par user) : colonne `attendance_status VARCHAR(12) CHECK IN ('pending','attended','no_show','cancelled')` + index partiel + backfill des slots passés avec client comme `attended`
- Route `PATCH /api/planning/attendance` : `{slot_id, merchant_id, attendance_status}` → update atomique
- **BookingDetailsModal** : 2 boutons « Venue ✓ » / « Absente ✗ » sur les **slots passés uniquement** (`slot_date < today && client_name`), état optimistic avec rollback sur erreur
- Stats no-show rate = `no_show / (attended + no_show)` — exclut `pending` et `cancelled`
- Les slots pré-avril 2026 backfillés `attended` ne polluent pas les stats (filtrés par le floor)

### Greetings dashboard
- 60 phrases dans [src/lib/dashboard-greetings.ts](../src/lib/dashboard-greetings.ts)
- Pool organisé par catégorie tonale (énergie, exigence, flow, fin de semaine, repos, fierté, client, métier, croissance, émotion, pragmatique)
- `pickGreeting(date)` avec rotation stable `dayOfYear % 60` → même jour = même phrase, change le lendemain, tient ~2 mois sans répétition
- `page.tsx` dashboard home utilise `pickGreeting()` au lieu des 7 `motivationDay` i18n (les vieilles clés existent toujours dans fr.json, non supprimées)

### Bug fix PWA (déjà commité plus tôt)
- [layout.tsx:142](../src/app/[locale]/dashboard/layout.tsx#L142) `if (!hasMounted)` au lieu de `if (!hasMounted || loading)` → nav tappable pendant le fetch merchant sur cold start PWA

### SMS credit admin (déjà commité)
- `getSmsUsageThisMonth` + `getEffectiveQuota` intégrés dans `/api/admin/merchants/[id]` pour afficher le vrai crédit (quota cycle + pack - envoyés) au lieu de `sms_pack_balance` seul

### Sécurité + audits (déjà commité)
- `RESEND_WEBHOOK_SECRET` requis en production (throw si absent)
- Migration 123 : index `sms_logs(merchant_id, sms_type, created_at DESC)` — **exécutée par user**
- 3 docs d'audit (security/stability/scalability) dans `docs/`

---

## ✅ Quick Actions — Phase 1 + Phase 2 **shippé 2026-04-24**

Voir [changelog-2026-04-24.md §9](./changelog-2026-04-24.md) pour le détail complet.

- Widget placé sur `/dashboard/stats` (pas sur la home — décision prise en cours de route pour ne pas surcharger l'accueil).
- API `GET /api/dashboard/quick-actions?merchantId=X` créée, retourne top 3 par priorité sur 10+ triggers.
- 4 actions ont une **logique 2-états** selon auto-SMS on/off (anniversaire, proche récompense, inactifs, parrainage).
- Cache-Control `private, max-age=60`.

Les 10+ triggers shippés :
1. Marquer présence (2+ RDV non marqués)
2. Nouveau client du jour
3. Agenda vide demain
4. Anniversaire cette semaine (2 states)
5. Proche récompense (2 states)
6. Récompenser VIP
7. Clients inactifs (2 states)
8. Suggérer acompte (no-show > 15 %)
9. Activer rappel J-0
10. Campagne SMS (50+ clients, 30j sans campagne)
11. Booster parrainage (2 states)
12. Activer SMS expiration voucher
13. Activer SMS relance avis

## ✅ Pull-to-Refresh (PTR) — shippé 2026-04-24

Voir [changelog-2026-04-24.md §16](./changelog-2026-04-24.md).

PTR opt-in par page sur `/dashboard`, `/dashboard/planning`, `/dashboard/stats`. Touch only. Pas de lib externe.

### 3. Design review continue

À chaque étape on vérifie contre `DESIGN.md`. Règle de base :
- Tokens strictement listés dans DESIGN.md
- Réutiliser `StatsCard`, `FeatureBadge`, `CollapsibleCard`, etc.
- `rounded-xl` default, `rounded-2xl` pour grandes surfaces
- Pas de flèches de navigation (hormis dans les modales internes)
- Tutoiement, pas d'emojis sauf exception

### 4. Points d'amélioration à penser plus tard

- **Graphique remplissage mode libre** : afficher peut-être en heures (ex « 12h bookées / 18h dispos ») plutôt qu'en % si plus parlant
- **Comparaison semaine précédente** quand on est sur une semaine : l'API calcule déjà `previousPeriod` avec un span de même durée, mais visuellement on ne le valorise pas encore (pas de chart side-by-side)
- **Filtre custom range** : l'API supporte déjà `?from=&to=` donc on pourrait ajouter un datepicker plus tard si besoin
- **Taux d'annulation** (reporté v2) : nécessiterait d'archiver les slots annulés (soft-cancel) — pas prioritaire

### 5. Roadmap perf (rappel du doc audit-perf-2026-04-24.md)

- Speed Insights à activer (visibilité data réelle)
- Blog → RSC (SEO + LCP)
- Refactor MerchantContext server-fetched (le gros morceau, -500ms à -1s TTI dashboard)

---

## 📌 Conventions à respecter pour toute nouvelle migration

- **Toujours `IF NOT EXISTS`** sur `CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE ADD COLUMN`
- **UPDATE backfill idempotent** (filter par `WHERE col IS NULL` ou autre condition sûre)
- Migrations appliquées **manuellement** dans Supabase SQL Editor (pas de CI auto)

---

## Fichiers clés touchés

### Créés
- `PRODUCT.md` / `DESIGN.md` (design system)
- `src/app/[locale]/dashboard/stats/page.tsx`
- `src/app/api/dashboard/stats/route.ts`
- `src/app/api/planning/attendance/route.ts`
- `src/lib/dashboard-greetings.ts`
- `supabase/migrations/124_slot_attendance_status.sql`
- `.agents/skills/impeccable/` + `.claude/skills/impeccable/` (symlink)
- `skills-lock.json`

### Modifiés
- `src/app/[locale]/dashboard/layout.tsx` (entrée nav Statistiques)
- `src/app/[locale]/dashboard/_nav/nav-config.ts` (entrée MoreSheet)
- `src/app/[locale]/dashboard/page.tsx` (card entrée + greetings rotatifs)
- `src/app/[locale]/dashboard/planning/BookingDetailsModal.tsx` (boutons no-show)
- `src/types/index.ts` (`attendance_status` sur `PlanningSlot`)
- `messages/fr.json` + `messages/en.json` (clé `dashNav.stats`)
