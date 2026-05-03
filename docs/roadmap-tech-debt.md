# Roadmap tech debt — Qarte SaaS

Consolidé depuis les 4 audits du 2026-04-24 (perf, scalability, security, stability).
Mis à jour le **2026-05-03** après gros sprint cleanup.

> **Comment lire ce doc** : seuls les findings encore TODO sont décrits en détail. Les findings fixés sont listés dans la section "Historique" en bas.

---

## P0 — Critique

> ✅ Tous les P0 originaux ont été traités. Voir Historique.

---

## P1 — Élevé (encore TODO)

### #5. SMS campaigns : partial failure non trackée si timeout `[stab]`
`src/app/api/cron/sms-campaigns-dispatch/route.ts:122-175`
Le check `Date.now() - startedAt > 280_000` casse la boucle, puis le code marque `status='done', recipient_count=sentCount`. Pas de champ `early_exit_at` ni distinction "fini" vs "coupé en cours". Merchant voit "X envoyés" comme succès alors que la moitié des destinataires n'a rien reçu.
**Fix** : ajouter colonne `early_exit_at` + `status='partial'` quand le break est déclenché par timeout, distinct de `done`.
**Note** : depuis mig 150 (`pending_phones`) et le re-schedule à +1h, le cron reprend automatiquement où il s'était arrêté → l'impact réel est désormais limité à un délai de 1h pour le merchant et un affichage trompeur temporaire. Reste valable pour la transparence UX.

### #6. Cron `morning-push` : prefetch ALL merchants sans pagination `[scal]`
`src/app/api/cron/morning-push/route.ts:49-52`
`.select('id, shop_name, ...')` sans `.limit()` — 25+ colonnes × N merchants en RAM à chaque run. À 20K merchants = OOM.
**Fix** : pagination par batch (2K à la fois) ou chunker via `id` range.
**Priorité réelle** : faible à 800 merchants, à revisiter à >5K.

### #7. Cron `deposit-expiration` : limit 200 fixe `[scal]`
`src/app/api/cron/deposit-expiration/route.ts:28`
`releaseExpiredDeposits(supabase, { limit: 200 })`. À 10K merchants planning actifs, 1-2K deposits/run potentiels = backlog.
**Fix** : limit dynamique selon temps restant ou pagination automatique.
**Priorité réelle** : faible à 800 merchants, à revisiter à >5K.

### #11. Cron SMS hourly : pas de métrique d'anomalie / alerting `[stab]`
`src/app/api/cron/sms-hourly/route.ts:664`
Toujours `return NextResponse.json({ ok: true, ...results })` même si `errors > 0` ou `sent === 0`. Aucune alerte possible.
**Fix** : HTTP 206 si `errors > seuil`, ou POST vers webhook Slack/monitoring si `sent < 10% expected`.

### #12. `/p/[slug]` revalidate = 3600s `[scal]`
`src/app/[locale]/p/[slug]/page.tsx:1`
ISR 1h — un merchant qui modifie son offre voit le vieux contenu jusqu'à 60 min côté clients.
**Fix** : réduire à 600s, ou on-demand revalidation via `revalidatePath` dans les routes de mutation merchant.

---

## P2 — Moyen (encore TODO)

### #13. Refactor `MerchantContext` en server-fetched `[perf]`
`src/contexts/MerchantContext.tsx:47-104` + `src/app/[locale]/dashboard/layout.tsx`
Toujours fetché côté client via `useEffect` → `getUser()` + `select('*')`. Coût TTI dashboard 300-800 ms. Le cache localStorage atténue mais n'élimine pas (premier login + cache miss).
**Fix** : helper server `getMerchantFromSession()`, layout dashboard async, prop `initialMerchant` dans le provider qui skip le fetch initial. Tester PWA standalone.

### #14. Vercel Speed Insights non installé `[perf]`
`src/app/layout.tsx:5,220`
Seul `@vercel/analytics` est installé. Aucune télémétrie LCP/INP/CLS réelle utilisateur.
**Fix** : `npm i @vercel/speed-insights` puis `<SpeedInsights />` dans le `<body>`.

### #15. Page blog en `'use client'` avec framer-motion `[perf]`
`src/app/[locale]/blog/page.tsx:1-6`
`'use client'` + `motion.div`/`motion.article` pour du contenu statique → SEO dégradé (meta non SSR), framer-motion chargé inutilement.
**Fix** : passer en RSC, remplacer `motion.*` par classes Tailwind `transition-*`.

### #16. Token unsubscribe utilise `SUPABASE_SERVICE_ROLE_KEY` en fallback `[sec]`
`src/app/api/email/unsubscribe/route.ts:12`
`const secret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!`. Si `CRON_SECRET` manque, la service_role key (clé superadmin) sert de matériel HMAC pour un token de désabonnement.
**Fix** : créer `UNSUBSCRIBE_TOKEN_SECRET` dédié, throw au boot si absent.

### #17. Rate limit in-memory map sans cleanup `[stab]`
`src/app/api/checkin/route.ts:22-42`, `src/app/api/cagnotte/checkin/route.ts:22-42`
`rateLimitMap.set(ip, ...)` sans `.delete()` après expiration. Grandit linéairement avec les IPs uniques.
**Fix** : cleanup LRU (cap 10k) ou cleanup périodique au-delà de la fenêtre.

### #19. OVH SMS send séquentiel `[scal]`
`src/app/api/cron/sms-hourly/route.ts:177,245,305,...`
`await sendBookingSms(...)` / `await sendMarketingSms(...)` séquentiel dans toutes les sections. 500 SMS = ~50s blocking.
**Fix** : `Promise.allSettled(chunk.map(...))` par batch de 10 avec rate-limit OVH respecté (10 req/s).

### #20. Resend : pas de queue concurrente ni idempotency-key `[scal]`
`src/app/api/cron/morning-jobs/route.ts:272`
`await rateLimitDelay()` séquentiel = 50s pour 100 emails. Si 2 crons parallèles = duplications possibles.
**Fix** : `p-limit(5)` + header `idempotency-key` (hash `merchantId:type:date`) côté Resend.

### #21. Pas d'archivage `sms_logs` / `visits` / `redemptions` / `processed_stripe_events` `[scal]`
Pas de cron de purge. `sms_logs` croît de 10-50K/jour. `processed_stripe_events` (mig 152) croît de 50-200/jour, à purger > 30j (Stripe retente max 24h).
**Fix** : cron mensuel d'archivage des logs > 12 mois vers table `_archive`, purge `processed_stripe_events` > 30j, `VACUUM ANALYZE` trimestriel.

### #22. Realtime subscriptions non monitorées `[scal]`
Aucun logger périodique du nombre de connexions Supabase Realtime concurrentes.
**Fix** : log périodique + circuit-breaker si > 80% du plafond du plan.

### #23. `/api/merchants/preview` : whitelist sans test de garde-fou `[sec]`
`src/app/api/merchants/preview/route.ts:21-25`
SELECT explicite OK aujourd'hui mais pas de test qui empêche un futur ajout accidentel de PII.
**Fix** : test automatique vérifiant la shape retournée + commentaire explicite "ne jamais ajouter PII ici".

### #24. Modals dashboard : pas de focus trap clavier `[a11y]`
`src/components/ui/Modal.tsx` + `src/app/[locale]/dashboard/planning/PlanningModal.tsx` + modals hand-rolled (`marketing/Modals.tsx`, `BuyPackModal.tsx`, `ClientSelectModal.tsx`).
`role="dialog"` + `aria-modal="true"` + `aria-label` ajoutés (sprint 2026-05-03), mais Tab sort encore du modal et navigue dans la page de fond. PRODUCT.md cible WCAG AA → vrai gap.
**Fix** : intégrer `focus-trap-react` (ou implémentation maison ~30 LoC) dans les 2 shells partagés. Auto-focus du premier élément focusable à l'ouverture, restitution du focus au déclencheur à la fermeture.

---

## À investiguer (statut incertain)

### Cron `sms-hourly` : timeout `maxDuration = 300s` vs sections `[stab]`
La logique des breaks `if (Date.now() - startedAt > 250_000) break` existe et limite par section, mais aucun champ `skipped_sections` ne remonte dans la réponse JSON. **Question** : les sections coupées sont-elles reprises au prochain run (toutes les heures) ou perdues définitivement pour la journée ? Si perdues, c'est P0 ; si reprises au tick suivant, c'est P1 cosmétique.

### Index `sms_logs(merchant_id, sms_type, created_at DESC)` — créé en migration mais appliqué ? `[scal]`
La migration `123_sms_logs_dedup_index.sql` crée bien l'index `CONCURRENTLY`. **Question** : a-t-elle été exécutée en prod ? Le CLAUDE.md précise que les migrations sont appliquées manuellement dans Supabase SQL Editor.

---

## Historique — items fixés

### Sprint 2026-05-03

| # | Item | Commit | Mig |
|---|---|---|---|
| **P0 #1** | Stripe webhook dedup `event.id` | `87da1a3a` | **152** ⚠️ à appliquer |
| **P1 #4** | OVH SMS timeout + retry | (déjà avant) | — |
| **P1 #6** | `target="_blank"` sans `rel` (1 lien restant, 29 OK) | `d093ecd2` | — |
| **P1 #7/9** | `/api/redeem-public` + `/api/cagnotte/redeem-public` ne fuient plus le schema Zod | `66d8801e`, `d5b1ff40` | — |
| **P1 #8/10** | Stripe webhook : 8 `.single()` → `.maybeSingle()` | `c5b48540` | — |
| **P1 A** | Mig 149 milestone `booked_online=true` | (déjà avant) | 149 |
| **P2 #18** | `console.error` → `logger.error` SMS stack | `f0d86435` | — |
| **Bonus** | Refactor `PG_UNIQUE_VIOLATION` constante (4 fichiers) | `ee174fbb` | — |
| **Item A** | Push milestone `firstScan`/`firstBooking` dédoublonnée via tracking email (faux positif post-mig149 : push "vient de réserver" envoyé jours après la résa) | `303c3fba` | — |
| **Bonus** | A11y modals (role=dialog + aria-modal) + warn destructif OfferModal + cancelBookingConfirm i18n | `9e41dae7` | — |

### Items déprio (théoriques au scale 5K, on est à ~800 merchants)

- **P0 #2** Cron `sms-hourly` N+1 queries — couvert par timeouts actuels
- **P0 #3** `/api/admin/merchants-data` listUsers — admin load 1-2s acceptable

## Migrations à appliquer manuellement (production)

⚠️ Les migrations sont appliquées **manuellement** dans Supabase SQL Editor (cf. CLAUDE.md). État au 2026-05-03 :

| Mig | Sujet | Status |
|---|---|---|
| 149 | `milestone_booking_count_online_only` | à confirmer appliquée |
| 150 | `sms_campaign_pending_phones` | à confirmer appliquée |
| 151 | `move_booking_custom_service` | ⚠️ à appliquer |
| 152 | `processed_stripe_events` | ⚠️ à appliquer |
