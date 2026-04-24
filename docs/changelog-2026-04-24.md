# Changelog — 2026-04-24

Récap de tout ce qui a été livré dans la journée. Ordre chronologique des commits, dernier en bas.

---

## 1. Perf + audits sécurité/stabilité/scalabilité

Commits : `16b2af81`, `81fb50cf`, `464d59a8`

- `optimizePackageImports` activé (Next.js), tree-shake lucide-react + recharts + framer-motion.
- `RESEND_WEBHOOK_SECRET` maintenant **requis** en prod (throw au démarrage si absent).
- Migration **123** : index `sms_logs(merchant_id, sms_type, created_at DESC)` pour dédup rapide.
- 3 docs d'audit dans `docs/` : perf, stability, scalability, security.

## 2. Fix PWA — nav tappable pendant fetch merchant

Commit : `9ef8ca04`

- [layout.tsx:146](../src/app/[locale]/dashboard/layout.tsx#L146) : on bloque uniquement sur `!hasMounted`, plus sur `loading`. Cold start PWA rendait la sidebar intappable.

## 3. Admin — SMS credit + UX polish

Commits : `973823bc`, `bf8935c1`

- Détail merchant admin : vrai crédit SMS calculé (`getSmsUsageThisMonth` + `getEffectiveQuota`) au lieu de `sms_pack_balance` brut.
- Card SMS automations sur le détail merchant + polish history.

## 4. Design system officiel

Commit : `01bdf16b`

- Installation `impeccable` skills (`.agents/skills/impeccable/` + symlink `.claude/skills/impeccable/`).
- `PRODUCT.md` à la racine : register produit, users, purpose, brand personality, anti-références, design principles, a11y.
- `DESIGN.md` : palette, typography, composants à réutiliser, patterns, voice & tone.

## 5. Page `/dashboard/stats` — v1

Commit : `b220400a`

- Nouvelle page protégée par `all_in` plan tier (fidelity voit UpgradeLock).
- Entrée via `/plus` menu (MoreSheet), pas dans la bottom nav.
- Card d'entrée sur la home dashboard après `WeekTiles`.
- Migration **124** : colonne `slot.attendance_status` (`pending|attended|no_show|cancelled`) + index partiel + backfill.
- Route `PATCH /api/planning/attendance` pour marquer présence/absence.
- Boutons Venue/Absente dans `BookingDetailsModal` (slots passés uniquement), état optimistic.
- Fill rate calculé depuis `opening_hours` (option B) — marche en mode libre ET créneaux.
- Floor dur avril 2026 côté API + UI.
- Filtres : pills mois (scroll horizontal) + pills semaines (apparaît quand mois actif).

## 6. Greetings dashboard rotatifs

Commit : `6d8c8ca2`

- 60 phrases dans [src/lib/dashboard-greetings.ts](../src/lib/dashboard-greetings.ts).
- `pickGreeting(date)` avec `dayOfYear % 60` → même jour même phrase, ~2 mois sans répétition.
- Remplace les 7 `motivationDay` i18n.

## 7. Stats page — polish UX filtres + KPI + Quick Actions widget

Commit : `e5e77816`

- Pills semaines empilées proprement (semaine active en dessous des autres, pas de glide).
- Format plage : « mer 1 → dim 5 » (weekdays) au lieu de « 1–5 ».
- `WEEKDAYS_SHORT_JS = ['dim','lun','mar','mer','jeu','ven','sam']` pour le formatage.
- Y-axis aligné via `compactNumber(n)` + `Y_AXIS_WIDTH = 30` pour que le graphique ne déborde plus.
- Font KPI réduite pour que « 10 000 € » tienne sans wrap.
- Pills delta masquées quand pas de données précédentes (évite « +∞ % »).
- Widget **Quick Actions** créé : section « À toi de jouer ».

## 8. Card d'entrée Statistiques — redesign home

Commit : `84d36e8d`

- Card riche (pas juste un lien), fond gradient subtil, KPI aperçu, CTA clair.

## 9. Quick Actions — 10 triggers + auto-SMS aware + trial banners

Commit : `e7c50398`

- Widget migré de l'accueil vers `/dashboard/stats` (section « À toi de jouer »).
- **10 triggers** (priorité + slice 3) :
  1. Marquer présence (2+ RDV non marqués)
  2. Nouveau client du jour
  3. Agenda vide demain
  4. Anniversaire cette semaine (2 states : auto-SMS on/off)
  5. Proche récompense (2 states auto-SMS)
  6. Récompenser VIP (10+ visites ou 2+ récompenses)
  7. Clients inactifs (60j, 2 states)
  8. Suggérer acompte (no-show rate > 15 %)
  9. Activer rappel J-0
  10. Campagne SMS (50+ clients, pas de campagne 30j)
  11. Booster parrainage
  12. Activer SMS expiration voucher
  13. Activer SMS relance avis
- Logique « paid merchant » : `PAID_STATUSES = ['active','canceling','past_due']` + exception trial pour anniversaire.
- Cache-Control : `private, max-age=60`.
- Trial banners ajoutés dans Marketing Automations + Campaigns tabs : « SMS envoyés dès ton abonnement » (icon Gem).

## 10. Blog digest email cron

Commit : `1fd50a05`

- Template `src/emails/BlogDigestEmail.tsx` (React Email).
- Cron `/api/cron/blog-digest` tous les jours à **6h30 UTC** (= 8h30 France été / 7h30 hiver).
- Logique : envoie 1 article tous les 3+ jours min à tous les merchants abonnés.
- Articles dans `src/data/blog-articles.ts` (6 articles, dates 2026-04-16 → 2026-04-29).
- Table **`blog_email_dispatches`** (migration **125**) : `article_slug PK + sent_at + recipient_count`.
- Respecte `canEmail()` (opt-out, bounces).
- `SITE_ORIGIN = 'https://getqarte.com'` pour les URLs.

**Migration 125 à appliquer en prod dans Supabase SQL Editor** (déjà créée dans `supabase/migrations/`).

## 11. Blog listing — images correctes

Commit : `52cc7f77`

- Thumbnails passent de `h-48 object-cover` (croppait le haut des visages) à `aspect-[16/9]`.

## 12. Planning mode libre — guard horaires manquants

Commit : `e0e21dc4`

- Impossible d'activer le mode libre si `opening_hours` vide ou invalide.
- Modal i18n (FR/EN) avec CTA vers `/dashboard/public-page`.
- Helper `hasValidOpeningHours()` extrait dans `src/lib/opening-hours.ts` (réutilisable).

## 13. Purge « vibe coding icons »

Commit : `ce41cb51`

- 48 fichiers, ~140 occurrences de `Sparkles`/`Wand2`/`Zap` remplacées par `Flower2`/`Palette`/`Flame`.
- Overrides contextuels : `Gem` pour trial banners + `PlanCard`, `Lightbulb` pour suggestions, `Bot` pour AI Reengagement.
- Fn lib `sparkleGrand`/`sparkleMedium`/`sparkleSubtle` renommées → `triggerSparkle`.

## 14. Simplify batch — post review

Commit : `12cedf73`

- Clé i18n `planning.missingHours*` (FR/EN) pour le modal du mode libre (pas de hardcode).
- `QuickActionIcon` type : clé `'sparkles'` → `'flower'` pour aligner avec `Flower2` icon (évite mismatch sémantique).
- Consumer `ToSeeList` + `dashboard/page.tsx` mis à jour.

## 15. Attendance — feedback immédiat + preserve `booked_at`

Commit : `9008974e`

**Bug report** : un clic sur « Absente » sur un RDV passé affichait « Modifications enregistrées » (toast générique du modal) → interprété comme « nouvelle réservation créée », et `booked_at` du slot se reset silencieusement à NOW.

**Fix 1 — toast spécifique** [BookingDetailsModal.tsx](../src/app/[locale]/dashboard/planning/BookingDetailsModal.tsx) :
- `attended` → « Venue enregistrée » (success)
- `no_show` → « Absence enregistrée » (info)
- `null` (toggle off) : pas de toast, feedback visuel du bouton suffit

**Fix 2 — preserve `booked_at`** [api/planning/route.ts](../src/app/api/planning/route.ts) :
- PATCH fetch l'état précédent du slot pour détecter `wasBooked`.
- `booked_at = NOW` uniquement sur transition `empty → booked` (création manuelle).
- Edits ultérieurs préservent `booked_at`.

Clés i18n nouvelles : `planning.toastAttendanceAttended` + `...NoShow` (FR/EN).

## 16. Pull-to-Refresh (PTR) — dashboard / planning / stats

**Non encore committé à l'heure d'écriture — dans ce push.**

- Nouveau composant [PullToRefresh.tsx](../src/components/shared/PullToRefresh.tsx) : `PullToRefreshProvider` + hook `usePullToRefreshRegister(fn)`.
- Pattern Context + register callback : opt-in par page, pas de geste global.
- Touch only (desktop ignoré via `isTouchDevice()`).
- Indicateur custom (`RefreshCw` indigo, `w-10 h-10 rounded-full shadow-lg`) position `fixed` sous la top bar.
- Threshold 70px, amortissement × 0.5, haptic `navigator.vibrate(10)` au crossing.
- `passive: false` sur `touchmove` uniquement (pour `preventDefault`).
- `isRefreshing` en ref (pas en dep de l'effect) → listeners attachés **une seule fois** pour toute la vie du provider.
- Cleanup du timeout de reset animation dans return effect.
- Silent refetch pattern : les 3 pages exposent `{ silent?: boolean }` sur leur fetch interne pour éviter le flash spinner sous l'indicateur PTR.
- Provider wrappé dans [layout.tsx](../src/app/[locale]/dashboard/layout.tsx) (inside ToastProvider).
- Registrations :
  - `/dashboard` : invalide cache `qarte_dashboard_stats_v2_<id>` puis `fetchData({ silent: true })` (logique dans `fetchData` même, pas chez l'appelant).
  - `/dashboard/planning` : `invalidateUpcoming()` + `fetchSlots({ silent: true })`.
  - `/dashboard/stats` : `fetchStats({ silent: true })`.
- Pas de dépendance npm ajoutée.

**Justification vs natif** : le PTR natif du navigateur ne marche pas en PWA installée + fait un full reload (flash blanc, perte d'état React, scroll reset, 3s de re-bundle vs 500ms de refetch).

---

## Migrations à appliquer en prod

Toutes dans `supabase/migrations/`, à exécuter manuellement dans Supabase SQL Editor si ce n'est pas déjà fait :

- **123** : index sms_logs (appliquée)
- **124** : slot attendance_status (appliquée)
- **125** : blog_email_dispatches (à appliquer si cron blog-digest doit tourner)

---

## Fichiers touchés (récap)

### Créés aujourd'hui
- `PRODUCT.md`, `DESIGN.md`
- `src/app/[locale]/dashboard/stats/page.tsx` + `src/app/api/dashboard/stats/route.ts`
- `src/app/api/planning/attendance/route.ts`
- `src/app/api/dashboard/quick-actions/route.ts`
- `src/app/api/cron/blog-digest/route.ts`
- `src/components/dashboard/QuickActions.tsx` + `MarkAttendanceModal.tsx`
- `src/components/shared/PullToRefresh.tsx` ← **nouveau this push**
- `src/emails/BlogDigestEmail.tsx`
- `src/lib/dashboard-greetings.ts`, `src/lib/opening-hours.ts`
- `src/data/blog-articles.ts`
- `supabase/migrations/123_*.sql`, `124_*.sql`, `125_*.sql`
- `docs/audit-perf-*.md`, `audit-security-*.md`, `audit-stability-*.md`, `audit-scalability-*.md`

### Modifiés structurellement
- `src/app/[locale]/dashboard/layout.tsx` (entrée nav + PTR provider)
- `src/app/[locale]/dashboard/page.tsx` (card entrée stats, greetings rotatifs, silent fetchData, register PTR)
- `src/app/[locale]/dashboard/planning/page.tsx` (mode libre guard, register PTR)
- `src/app/[locale]/dashboard/planning/usePlanningState.ts` (silent fetchSlots)
- `src/app/[locale]/dashboard/planning/BookingDetailsModal.tsx` (toast attendance)
- `src/app/api/planning/route.ts` (preserve booked_at)
- `src/app/[locale]/dashboard/marketing/AutomationsTab.tsx` + `SmsTab.tsx` (trial banners)
- `src/types/index.ts` (`attendance_status` sur `PlanningSlot`)
- `messages/fr.json` + `messages/en.json` (clés stats, attendance, missing hours, subjects)
- `vercel.json` (cron blog-digest)
- 48 fichiers pour la purge d'icônes
