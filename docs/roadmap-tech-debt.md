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

### Sprint 2026-05-04

| # | Item | Commit | Mig |
|---|---|---|---|
| **UX vitrine** | Liens permanents fidélité + réservation/acompte sur `/p/[slug]` (drop bandeau cookie-gated cassé par HttpOnly + Instagram in-app strip) | `2fcc614a` | — |
| **Polish vitrine** | Wording interrogatif (`Un acompte à régler ?` vs affirmatif) + icône `Wallet` (vs `Hourglass` urgent) + ambre soft sans border | `68db52bf` | — |
| **UX `/customer`** | Page login adaptive selon intent (loyalty/booking/deposit) + pill "Vous arrivez de {shop}" + sessionStorage passe `{intent, fromShop, returnTo}` depuis vitrine + redirect post-login vers carte d'origine. Bandeau landing aligné `Accéder à mon espace` | `d74cfa24` | — |
| **Sec/refacto** | Extract `src/lib/customer-login-intent.ts` (single source of truth pour storage key + types + helpers) + fix open-redirect mini-bug (`//evil.com` était toléré par `startsWith('/')` naïf) + lookup tables vs ternaires nestées | `d74cfa24` | — |
| **Copy signup** | Refonte 2 étapes signup : titre étape 2 ("Crée ta carte fidélité" → "Présente ton salon en 30 secondes") + tutoiement systématique (vouvoiement leftovers fixed) + labels concrets ("Le nom de ton salon", "Ton métier") + visuel tampons → 3 pills triple promesse (Vitrine/Résas/Fidélité). Cross-step CTA harmonisé "Lancer mon essai gratuit". Passe au filtre ux-writing + signup-flow-cro + copywriting skills. | `80c4d268` | — |
| **Copy planning** | RDV → Résa sur 24 labels merchant-facing planning (action/stats/empty/settings/warnings/service à domicile body). Client-facing intact (SMS templates, emails, vitrine cliente, allowCustomerCancelDesc/RescheduleDesc) — terme "RDV" garde sa place côté cliente. + "Ajouter un RDV" → "Ajouter une réservation" (modal nouveau RDV manuel). | `80c4d268` | — |
| **Booking horizon** | Cap public passé de 60j → **90j** côtés slot mode + libre + fetch SSR vitrine. Constante `BOOKING_HORIZON_DAYS` extraite dans `src/lib/booking-window.ts` (single source of truth, importée par `api/planning/route.ts`, `p/[slug]/page.tsx`, `p/[slug]/BookingModal.tsx`, dashboard `planning/page.tsx`). Hint i18n `autoBookingHint` interpolé via `{days}` placeholder pour rester en sync. | `80c4d268` | — |
| **Admin SMS credits** | Monitoring crédits providers : `getOvhCredit()` + `getSmsPartnerCredit()` (helpers défensifs avec fallback noms de champs SMS Partner) + route `/api/admin/sms/credits` (cache module-level 5min) + cron daily `/api/cron/sms-credits-check` 8h UTC + email alerte `sendSmsCreditLowEmail` à `contact@getqarte.com` si crédit `<50`, dedup via `app_config(sms_credit_alert_*_last_sent_at)`, reset auto si crédit ≥75. Card `ProviderCreditCard` dans `/admin/sms` Aperçu (lookup table couleurs). Constantes `SMS_CREDIT_LOW/WARN/RESET_THRESHOLD` extraites dans `src/lib/sms-constants.ts`. Cron entry ajoutée à `vercel.json`. | `8d46c0d1` | — |
| **Admin home cleanup** | Suppression bloc "Actions du jour" (4 sections : RDV demain, vouchers expirent, milestones, inactifs) + composant `ActionSegment` + barre Funnel conversion + types/maps/states orphelins (-265 LoC). | `8d46c0d1` | — |
| **Admin SMS overview** | Dépassement affiché en SMS (pas en €), nouvelle colonne "Restant total" avec breakdown `(free + pack)` pour visu globale de la conso restante d'un merchant qui a acheté un pack. Provider `'ovh'` désormais tracé pour SMS marketing trial (était `null`). Bug fix : onglet "Échecs SMS" tournait en boucle quand 0 résultat (flag `failuresFetched`). | `8d46c0d1` | — |

### Sprint 2026-05-05

| # | Item | Commit | Mig |
|---|---|---|---|
| **Subscription page** | Bug fix recap PaidStatusCard utilisait toggle UI (default `'annual'`) → merchant All-In **mensuel** voyait "120 SMS/mois" au lieu de 100. Helper `buildAllInExtras(interval)` branche sur `paidInterval` Stripe réel. + épuration listes Fidélité 7→5 / Tout-en-un extras 5→4 (drop redondants Clients illimités/Offre duo/QR+NFC, drop concours, ajout Offre nouveaux clients). + i18n drop "+20 en annuel" / "bonus annuel" sur featureSms* (confusion 120 dans vue mensuelle). + PlanCard drop duplication prix mensuel. | `b01b332b` | — |
| **Bring-back SMS** | Bug fix : "Relancer l'acompte" envoyait `confirmation_no_deposit` (sans lien) au lieu d'un vrai SMS de demande. Nouveau type `deposit_request` avec template FR/EN incluant `merchant.deposit_link`. Dedup scopé à 1h pour ce type (vs forever) afin d'autoriser une 2e relance légitime sur même slot mode créneaux. + Bug fix UX : icônes Link2/CheckCircle2 muted en gray-400 quand option non sélectionnée + libellé SMS dynamique selon le choix. + Conflit créneau (404) : nouveau bouton "Choisir un autre créneau" qui ouvre `BookingDetailsModal` manual booking pré-rempli (date/heure/services/custom/client/notes), suppression auto de l'archive à la création réussie. | `ab48b91e` | **154** ⚠️ à appliquer |
| **Admin Growth tab** | Refonte complète (sénior data eng audit) : 5 KPI cards rolling 4 sem (net new paying + delta vs 4 sem avant, WAU/MAU, share online, cohort 4w retention, gift cards CA) + 3 charts hebdo (BarChart stacked vitrine vs manuel, LineChart acquisition+scans, ComposedChart funnel SaaS) + mini-chart marketing SMS trial. RPCs Postgres `admin_growth_weekly(weeks_back)` + `admin_growth_rolling()` (Europe/Paris, exclusion super_admins via LEFT JOIN anti-join). Nouvelle route `/api/admin/analytics/growth` séparée + cache module-level keyé sur weeksBack. Helper partagé `createTtlCache<TKey,TValue>` extrait dans `api-helpers.ts` (refacto sms/credits aussi). Bug fix : ancienne route comptait "newCustomersTrend" via `loyalty_cards.created_at` → 2× les clientes multi-merchant ; remplacé par split clean customers (humans) vs cards (merchants). Allègement route principale : 4 queries inutiles supprimées (cards/customers/referrals/vouchers). | `8d41054d` | **155** ⚠️ à appliquer (CROSS JOIN fix) |
| **Parrainage validation manuelle** | Nouveau bouton "Marquer comme utilisée" sur chaque badge pending/created dans `/dashboard/referrals` — ouvre une modale (composant `<Modal>` shared) avec textarea raison obligatoire (>=3 chars, max 140) + confirmation. POST `/api/referrals/[id]/validate` `{side, reason}` marque le voucher filleul ou parrain utilisé manuellement. Côté filleul → déclenche aussi création voucher parrain + push + SMS (helper extrait `src/lib/referral-completion.ts` `completeReferralAfterReferredUse` partagé avec `/api/vouchers/use` qui perd ~140 LoC dupliquées + dédup phone fetch). Route utilise `authorizeMerchant` helper (vs auth hand-rolled). Audit trail dans `vouchers.manual_validation_reason` + `manually_validated_by`. **Polish UX** (impeccable critique + fix) : tap target ≥36px (était 24px = mistap garanti mains mouillées PRODUCT.md), affordance bouton vs statut distinguée par bordure (et plus seulement par couleur), wording unifié mobile/desktop "Marquer comme utilisée" (vs "Valider en boutique"/"Valider le filleul" divergents), layout mobile éclaté en 2 lignes filleul/parrain (vs pills côte-à-côte source de confusion), modale recolorée emerald (action positive vs indigo générique), copy adoucie "Une note pour ton historique" (vs "Pourquoi tu valides à la main ?" culpabilisant), hiérarchie boutons modale (cancel text-only, confirm primary). | `48024419` | **156** ⚠️ à appliquer |

### Sprint 2026-05-05 (suite)

| # | Item | Commit | Mig |
|---|---|---|---|
| **Bons cadeaux : fix save + warning lien paiement** | Bug fix : la sauvegarde des bons cadeaux échouait silencieusement (`Une erreur est survenue. Réessaie.`) dès qu'un lien de paiement existant ne commençait pas par `https://` (Zod `z.string().url()` strict). Cause : `PaymentLinkField` (gift-cards) ne préfixait pas `https://` côté client comme le faisait `planning/page.tsx` → tout save (même juste pour modifier les montants) renvoyait le payload entier avec un lien invalide → 400. **Fix** : 2 helpers exportés dans `src/lib/payment-providers.ts` (`normalizePaymentLink` + `isValidPaymentLink`), single source of truth ; `normalizePaymentLink` remplace l'ancienne private `normalizeLink` (consolidée), réutilisée par `buildDepositLinks` et par les 2 pages dashboard. Save gift-cards utilise maintenant `normalizePaymentLink()`. Save planning idem (avant : 4× `/^https?:\/\//i.test(...)` inline dupliqués → remplacés par `normalizePaymentLink()`). **Warning UX** : `PaymentLinkField` (gift-cards) + `DepositLinkInput` (planning) affichent maintenant une bordure amber + message "Ça ne ressemble pas à un lien. Colle l'URL complète depuis ton compte (ex : revolut.me/tonpseudo)." dès que la coiffeuse a tapé du texte ("Payplug") au lieu d'un URL. Bug corollaire fixé : `detectPaymentProvider` recevait du texte sans scheme dans planning save → label fournisseur n'était jamais détecté quand on tapait `revolut.me/foo` sans `https://` → maintenant normalisé d'abord. | `c8e8a5d5` | — |

### Sprint 2026-05-06

| # | Item | Commit | Mig |
|---|---|---|---|
| **Welcome offer : pas de bait-and-switch** | Avant : la réduction welcome (-15%) était appliquée optimistement dès l'ouverture du `BookingModal` vitrine en supposant nouvelle cliente → quand une cliente connue tapait son numéro, le prix sautait brutalement de 28€ à 35€ (effet bait-and-switch). Maintenant 3 états visuels distincts : (a) avant/pendant lookup numéro → teaser pill rose-50/60 "Nouvelle ici ? -X% sur cette résa" + prix plein conservé ; (b) lookup confirme nouvelle cliente → bandeau rose plein + réduction réellement appliquée + prix barré ; (c) cliente connue → ni teaser ni bandeau, prix plein. La promo offer reste appliquée immédiatement (universelle, pas conditionnelle → pas de bait-and-switch). 2 nouvelles clés i18n `welcomeTeaserTitle` / `welcomeTeaserSubtitle` (FR + EN). | `801011fa` | — |
| **Promo offer : ciblage par prestation** | Une merchant a demandé à pouvoir cibler la promo sur 1-N prestations précises (ex : "-20% Coloration" mais pas sur les coupes). Mig 157 ajoute `merchant_offers.target_service_ids UUID[] NULL` + `merchant_planning_slots.applied_offer_amount NUMERIC` (snapshot € économisé). Helper `computeBookingPrice` étendu : signature passe de `totalPrice` à `serviceLines[]` + `promoTargetServiceIds[]?`, calcul per-line pour la promo seulement (member + welcome restent appliqués au total). Helper `validateAppliedDiscounts` recalcule serveur-side `applied_offer_amount` depuis `target_service_ids × prix réels` (anti-spoof). API merchant-offers POST/PATCH/GET acceptent `targetServiceIds`. API book/manual-booking/PATCH stockent `applied_offer_amount`. UI dashboard `PromoSection` : multi-select dropdown des services (default = toutes), masqué si % vide. UI vitrine `BookingModal` : badge `-X%` + prix barré sur les tuiles ciblées dans la liste de services + bandeau "Promo -X% sur Coloration" + breakdown "Promo -7€" au lieu de "Promo -10%" quand ciblée. UI manual `BookingDetailsModal` : hint italique sous le toggle promo listant les prestations concernées. 4 nouvelles clés i18n. | `801011fa` | **157** ⚠️ à appliquer |
| **SMS trial : refonte 7 SMS courts + nouveau SMS T+15min** | Refonte des 7 SMS trial existants (check-in 48h ×5 variantes + pre-loss J-1 ×3 variantes + churn survey) : copy plus court ≤115 chars, ton institut beauté 28 ans (vs coiffeuse 45 ans), virer "fidelisee" → "dans la carte" / "qui reviennent", virer "vitrine sur Google" (fausse promesse SEO) → "page vitrine à partager", tutoiement direct merchant, loss aversion explicite ("perds-les pas" → "à garder"), CTA verbe en début. **Nouveau type `example_vitrine`** envoyé au prochain cron horaire ≥15 min après signup (fenêtre [15min, 24h]) — montre un exemple de page vitrine via short link `cll.re/1VvxCB` + invite WhatsApp pour questions. Mig 158 ajoute `merchants.example_vitrine_sms_sent_at TIMESTAMPTZ` + **backfill `NOW()` pour tous les merchants existants** (defense en profondeur, évite incident 2026-04-20 type) + partial index `WHERE IS NULL`. **Liens courts SMS Partner / Cuttly** : `SIGNIN_URL` (ptnr.fr/1Vvx2D) remplace "ouvre l'app" sur 6 SMS, `QR_URL` (ptnr.fr/1Vvxut) sur celebration_vitrine, `EXAMPLE_VITRINE_URL` (cll.re/1VvxCB) sur example_vitrine. Cron horaire `sms-trial-marketing` gagne SECTION 0 en plus des 3 sections existantes. Reste OVH (pas de re-routing SMS Partner). | (à pusher) | **158** ⚠️ à appliquer |
| **Affiliation merchant→merchant : lien partage + tracking + admin** | Système complet de parrainage merchant→merchant (distinct du parrainage cliente→cliente existant) : Mig 159 ajoute `merchants.referred_by_merchant_id UUID NULL REFERENCES merchants(id) ON DELETE SET NULL` + index partiel. **Settings dashboard** ([:251-307](src/app/[locale]/dashboard/settings/page.tsx)) : refonte du bloc parrainage existant (qui était basé sur `referral_code` cosmetic non-tracké) → 2 boutons (Copier le lien / Partager Web Share API) sur le lien `${getAppUrl()}/?ref=${merchant.slug}`, **pas d'affichage du lien**, pas de visu compteur côté merchant. Copy : "Recommande Qarte, gagnez 10€ chacun" (promesse posée, mécanisme Stripe -10€ + email parrain HORS SCOPE V1). **Capture `?ref=`** : déjà en place dans `ClientShell.tsx` (root landing) + signup page → localStorage `qarte_signup_source = affiliate_<slug>`. **API `/api/merchants/create`** parse `signup_source`, lookup `merchants.slug`, store `referred_by_merchant_id` si match (anti self-ref check). **API `/api/affiliate/resolve`** étendue : fallback sur `merchants.slug` (en plus de `affiliate_links` partenaires externes) → pill "X recommande Qarte" affiché au signup pour parrains merchants. **Admin** : nouvel onglet "Parrainages merchants" dans `/admin/affiliation` (3e tab à côté de "Liens actifs" + "Demandes") avec table filleul/parrain/statut/date + nouvelle route `/api/admin/affiliation/merchant-referrals`. 8 fichiers + 2 migrations. | `07d827fe` | **159** ⚠️ à appliquer |

### Sprint 2026-05-07

| # | Item | Commit | Mig |
|---|---|---|---|
| **Emails affiliation : filleul (code -10€) + parrain (notif conversion)** | 2 emails React Email + Stripe webhook trigger. **AffiliationWelcomeEmail** (filleul) : envoyé AU LIEU du welcome standard si `referred_by_merchant_id != NULL`, mention parrain + code Stripe `QARTEAFFI2026005` en évidence, fallback si parrain supprimé. Lookup `parentShopName` mergé dans la query slug existante (zéro requête supplémentaire). Bug fix anti self-ref : check `refMerchant.user_id !== user_id` (vs `id` qui comparait merchant.id vs auth user_id, toujours différents). **AffiliateConversionEmail** (parrain) : envoyé via Stripe webhook `invoice.payment_succeeded` au 1er paiement filleul. Gate `billing_reason='subscription_create'` pour skip tous les renewals. Atomic claim sur `affiliate_parent_notified_at` pour éviter double envoi en cas de retry Stripe. Mention "10€ crédités par notre équipe sous 48h" (pas de code Stripe pour le parrain, application manuelle Qarte). Mig 160 : `merchants.affiliate_parent_notified_at TIMESTAMPTZ` + backfill `NOW()` (defense en profondeur) + partial index. i18n FR + EN : sections `affiliationWelcome` + `affiliateConversion` + 3 sujets. Code promo template via `{code}` placeholder dans preview pour single source of truth. 9 fichiers + 1 migration. | `fbc1a0be` | **160** ⚠️ à appliquer |
| **Toast succès annulation/modif résa carte fidélité** | Avant : cancel disparaissait silencieusement, reschedule avait juste un check inline dans la modale qui se ferme. Maintenant : toast vert auto-dismiss 5s confirme l'action à la cliente. `ToastProvider` monté sur layout `customer/card` (était limité au dashboard merchant). `useToast` dans `UpcomingAppointmentsSection` : `addToast` au succès cancel + reschedule (après timeout 1500ms quand la modale se ferme). Réutilise clés i18n existantes `bookingCancelled` / `bookingRescheduled` (FR + EN déjà traduites). 2 fichiers, ~10 lignes utiles. | `89206db3` | — |
| **Badge "sur Qarte" en haut de la vitrine merchant** | Acquisition lever discret : badge cliquable "sur Qarte" (text-[11px] gray-400, hover indigo-600) au-dessus du logo merchant 100x100, on-axis avec le layout centré. Validé via skill `impeccable shape` (register product) + frontend designer agent : variant B (centered tagline) choisi vs A (top-right pill, glassmorphism banni par DESIGN.md) et C (bottom-floating, intrusif zone CTA). Lien vers `getqarte.com?utm_source=vitrine&utm_medium=referral&utm_content=top_badge` (UTM standard, **pas `?ref=`** qui collidait avec mon nouveau système d'affiliation merchant→merchant). **Footer "Vous aussi créez votre vitrine sur Qarte" mis à jour** : pointe maintenant vers landing (au lieu de `/auth/merchant/signup?ref=vitrine-en-ligne` qui polluait `qarte_signup_source`) + `utm_content=footer_cta` pour discriminer dans GA. 1 fichier, ~10 lignes. | `f06b0488` | — |
| **Vitrine horaires : collapse + badge tri-state + format FR** | Refonte du bloc horaires de la vitrine `/p/[slug]` ([:HORAIRES section](src/app/[locale]/p/[slug]/ProgrammeView.tsx)). **Collapse par défaut** : seul le jour aujourd'hui est visible (highlight primary_color), bouton "Voir tous les jours" déplie les 6 autres (1 ligne par jour, pas de regroupement type "Lun-Ven"). Animation `height: 0 → auto` via `AnimatePresence`. Helper `slotSignature`/`formatGroupLabel`/`groupedHours` supprimés (plus utilisés, -25 LoC nettes). **Format heures FR** via helper `formatTime` existant : `9h00–12h00 · 14h00–18h00` au lieu de `09:00–12:00, 14:00–18:00` (anglo-saxon). Séparateur `·` au lieu de `, ` entre les 2 plages = signal visuel léger qu'il y a une pause. **Badge tri-state** `open/break/closed` : nouveau état "En pause" (amber) quand `nowHHMM` est dans `[break_start, break_end]`. Helper `isOnBreak` à côté de `isOpenNow`. Lookup table `HOURS_BADGE_STYLES` module-level avec `labelKey` pour i18n (pas de recreation per render). 3 nouvelles clés i18n (`onBreak`, `seeAllDays`, `hideOtherDays`) FR + EN. | (à pusher) | — |
| **Toast cancel/reschedule + validation save vitrine dashboard** | **Toast** : succès cancel/reschedule résa carte fidélité (déjà commité `89206db3`). **Validation save** vitrine dashboard ([InfoSection.tsx](src/app/[locale]/dashboard/public-page/InfoSection.tsx)) : refuse l'enregistrement si **adresse non géolocalisée** (saisie ET `addressCoords` null = pas de suggestion choisie dans `AddressAutocomplete` → l'adresse n'existe pas dans la geomap OpenRouteService) OU **lien réservation invalide** (`isValidUrl()` false). Border amber + texte amber sous chaque champ + bouton save désactivé `opacity-50 cursor-not-allowed` + texte de blocage sous le bouton. Defense in depth : early return dans `handleSave` si `!canSave`. Nouveau helper générique `isValidUrl(raw)` dans [src/lib/utils.ts](src/lib/utils.ts) (à côté de `normalizeUrl` existant) — réutilise pattern `normalize → URL constructor → host has dot + length ≥4`. **Refacto inline** : `handleSave` utilise maintenant `normalizeUrl()` au lieu de `(/^https?:\/\//i.test...)` inline (réutilise helper utils.ts existant). Réseaux sociaux exclus du scope validation URL (pseudo seul OK via `normalizeSocialUrl`). 4 nouvelles clés i18n FR + EN (`infoBookingInvalid`, `infoAddressNotGeocoded`, `infoSaveBlocked`). | (à pusher) | — |
| **Wording CTA résa : "Prendre rendez-vous" → "Réserver"** | Standard industrie (Booksy/Planity/Treatwell utilisent tous "Réserver"), plus court (8 vs 17 chars), cohérent avec refonte sprint 2026-05-04 ("RDV → Résa" sur planning merchant-facing). FR : 4 clés mises à jour (`bookAppt`, `bookAppointment` ×2 occurrences, `infoBookingHint`). EN : `Book appointment` / `Book an appointment` → `Book` (4 clés). | (à pusher) | — |
| **Plan Fidélité : gating bons cadeaux + déblocage campagnes SMS via pack + refonte copy upgrade** | **Gift cards bloqués Fidélité** : nouveau flag `giftCards` dans `PlanFeatures` (false/true), helper `hasGiftCards`, gating à 4 niveaux : (a) navbar `/dashboard/gift-cards` `locked`, (b) page dashboard affiche `PlanUpgradeCTA`, (c) API `/gift-cards/settings` PATCH refuse 403 si Fidélité tente d'activer, (d) API `/gift-cards/request` POST (vitrine publique) refuse 403, (e) bouton "Offrir un bon" caché sur vitrine `/p/[slug]` si Fidélité (même si `gift_card_enabled=true` legacy). Ajout `featureGiftCards` dans la grille comparative subscription page (était totalement invisible avant !). **Campagnes SMS débloquées Fidélité via pack** : `marketingSms: true` pour les 2 tiers (était `false` Fidélité). Quota mensuel reste 0 → submit naturellement bloqué via `quotaLeft + packBalance >= recipients` avec message "Achète un pack pour la lancer". Code mort supprimé dans `submit/route.ts` (check `!marketingSms` + trigger `triggerUpgradeAllInEmail` qui ne se déclenchait plus jamais). `SmsBalancePanel` : nouveau mode `packOnly` quand quota=0 (barre cachée, copie "X SMS dans mon pack" + blocage rouge "Prends un pack" si vide). **Refonte copy upgrade** (lecture skills `paywall-upgrade-cro` + `copywriting`) : titres outcome-led ("Tes résas tombent pendant que tu travailles" vs "Gère ton planning"), descriptions avec exemples concrets vocabulaire beauté (mardi creux, brushing, fête des mères, taggage Insta, téléphone entre deux clientes), suppression de "nécessite/réservé/pour activer/pour débloquer" (jargon punitif), "Tout-en-un" mentionné une fois par écran (CTA bouton uniquement, pas martelé titre+desc+button). Bug i18n bonus : `PlanUpgradeCTA` avait son CTA par défaut "Passer en Tout-en-un" hardcodé en FR → users EN voyaient du français. Désormais via `useTranslations` (clé `planUpgradeCta.discoverAllIn`). Bandeau Fidélité auto SMS prix supprimé ("Tu es en Fidélité 19€" → "Tu es en plan Fidélité") — était faux pour les annuels à 190€. **Important** : le bouton de réservation externe (`booking_url` Planity/Booksy/etc.) reste 100% accessible aux Fidélité (par design — Fidélité = "garde ton outil de résa, ajoute Qarte pour fidélité+vitrine+parrainage"). 13 fichiers, 0 migration. | (à pusher) | — |

### Notes ouvertes

- **Booking horizon configurable par merchant (1/2/3 mois)** — discuté, **pas fait**. Default 90j couvre 80%+ des cas, anti-pattern "Zoho settings sprawl" (PRODUCT.md). À faire si 2+ merchants demandent explicitement.
- **Bloquer une plage open-ended** — discuté, **pas fait**. Sémantique différente du "horizon", + complexe à coder. À faire si demande client (congé long, fermeture prolongée).

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
| 153 | `offer_discount` (mig 153 doc dans supabase-context.md) | à confirmer |
| 154 | `sms_deposit_request` + cleanup `gift_card_expiry_reminder` (CHECK étendu, NOT VALID + VALIDATE) | ⚠️ à appliquer |
| 155 | `admin_growth_weekly` (RPC + index) — note : CROSS JOIN fix après 1ère tentative (erreur 42P01 si appliqué avant le fix) | ⚠️ à ré-appliquer |
| 156 | `voucher_manual_validation` (manual_validation_reason + manually_validated_by sur vouchers) | ⚠️ à appliquer |
| 157 | `offer_target_services` (target_service_ids sur merchant_offers + applied_offer_amount sur slots) | ⚠️ à appliquer |
| 158 | `example_vitrine_sms` (example_vitrine_sms_sent_at + backfill NOW + partial index) | ⚠️ à appliquer |
| 159 | `merchant_affiliation` (referred_by_merchant_id sur merchants + index partiel) | ⚠️ à appliquer |
| 160 | `affiliate_parent_notified` (affiliate_parent_notified_at sur merchants + backfill + partial index) | ⚠️ à appliquer |
