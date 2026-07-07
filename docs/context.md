# Qarte SaaS — Contexte Projet

> Document principal du projet. Pour le schema DB complet, voir `docs/supabase-context.md`.

---

## 1. Overview

**Qarte** — Plateforme SaaS tout-en-un : reservation en ligne + fidelite (tampons/cagnotte) + vitrine SEO. Le client qui reserve recoit automatiquement sa carte de fidelite.

- **URL:** getqarte.com | **Deploiement:** Vercel
- **Langues:** Francais uniquement (EN desactive via redirect 301, infra conservee) via `next-intl` | **Version:** 0.1.0
- **Pays:** FR, BE, CH uniquement (signup + PhoneInput)
- **Ton FR:** tutoiement dashboard merchant, vouvoiement client-facing
- **Essai:** 3 jours | **Prix:** Tout-en-un 24€/mois ou 120€/6 mois (1 mois offert) — **seule offre proposée aux nouveaux depuis juillet 2026**. **Fidélité retirée** (plus souscriptible) : abonnés Fidélité existants grandfathered (14€/70€, ou 19€/95€ avant juin 2026), reconnus via `STRIPE_PRICE_FIDELITY*` dans le webhook + peuvent upgrader vers Tout-en-un. Annuel 240€/190€ legacy, plus proposé depuis mai 2026. Fidélité (existants) = SMS pack-only : anniversaire offert, parrainage via pack
- **Cible:** Salons de beaute (coiffeurs, barbiers, instituts, ongleries, spas, estheticiennes)
- **Entite:** SAS Tenga Labs — 58 rue de Monceau, CS 48756, 75380 Paris Cedex 08

---

## 2. Tech Stack

- **Next.js** 15.5.12 (App Router) + **React** 18.3.1 + **TypeScript** 5.6.2
- **Tailwind CSS** 3.4.13 + **Framer Motion** (animations)
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- **Stripe** (paiements) + **Resend** (emails) + **OVH SMS** + **SMS Partner** (SMS transactionnels FR/BE via SMS Partner, marketing + CH via OVH)
- **Recharts** (graphiques), **Lucide React** (icones), **jsPDF** + **QRCode** (PDF/QR), **Web Push**
- **next-intl** (i18n) — `messages/fr.json` + `messages/en.json` (~2243 lignes chacun)

---

## 3. Structure du Projet

```
src/
├── app/
│   ├── api/               # Routes API (voir section 6) — hors [locale]
│   ├── [locale]/           # Segment i18n (fr sans prefixe, en sous /en/*)
│   │   ├── auth/          # Signup 2 phases + login
│   │   ├── dashboard/     # Dashboard merchant (protected) + onboarding (personalize)
│   │   ├── admin/         # Dashboard admin (super_admins)
│   │   ├── customer/      # Carte fidelite + wallet
│   │   ├── scan/[code]/   # Scan QR (page publique)
│   │   ├── boutique/      # Carte NFC (20€)
│   │   ├── p/[slug]/      # Page publique programme (bio reseaux)
│   │   ├── pros/          # Social proof merchants
│   │   ├── exemples/      # Showcase pages demo par metier (vitrine + carte cliente)
│   │   └── page.tsx       # Landing page
│   ├── layout.tsx         # Root shell (fonts, analytics)
│   └── [locale]/layout.tsx # Locale layout (NextIntlClientProvider, metadata)
│
├── components/
│   ├── landing/           # Hero, SocialProofMerged (4 temoignages reels + case study fusionnes), FeaturesGridSection, FideliteSection (light), PageProSection (light), PricingTransition, PricingCondensed, FAQ, Footer, MobileStickyCta
│   ├── ui/                # Button, Input, Modal, Select, Badge, Toast, Skeleton
│   ├── shared/            # Header, Footer, CookieBanner, QRScanner
│   ├── dashboard/         # CustomerManagementModal, AdjustTab, RewardsCombinedTab, HistoryTab, JournalTab, DangerZone, PendingPointsWidget, OnboardingChecklist, ZeroScansCoach, MilestoneModal
│   ├── loyalty/           # StampsSection, CagnotteSection, RewardCard, RedeemModal, StickyRedeemBar, HistorySection, VoucherRewards, VoucherModals, ReviewModal, ReviewCard, ReferralModal, BirthdaySection, SocialLinks, CardHeader, InstallPrompts, UpcomingAppointmentsSection
│   └── analytics/         # GTM, FacebookPixel, TikTokPixel, MicrosoftClarity
│
├── emails/               # 35 templates React Email + BaseLayout
├── lib/                  # supabase.ts, stripe.ts, utils.ts, scripts.ts, push.ts, logger.ts, analytics.ts, facebook-capi.ts, email.ts
├── types/index.ts        # Merchant, LoyaltyCard, Visit, Customer, etc.
├── contexts/             # MerchantContext
└── middleware.ts          # Auth middleware

docs/
├── context.md            # Ce fichier
├── supabase-context.md   # Schema DB complet (source unique)
├── sms-system.md         # Architecture SMS (marketing + transactionnel + packs)
├── email-matrix.md       # Matrice des emails merchant (3 crons emails)
├── AUDIT-MARKETING.md    # Score 67/100
├── AUDIT-SECURITE.md     # Score 92/100
└── AUDIT-SCALABILITE.md  # Score 88/100

supabase/migrations/      # Migrations actives (≥145), anciennes dans old/
```

---

## 4. Modes de Fidelite

Deux modes exclusifs, configures dans `/dashboard/program` :

### 4.1 Mode Passage (`loyalty_mode = 'visit'`, defaut)

Le client accumule des **tampons** (1 par visite, 2 les jours doubles). Au bout de N visites → recompense fixe.

**Flux scan** : QR → telephone → `POST /api/checkin` → fetch/create customer+card → idempotence 3 min → Shield → increment stamps

```
points_earned = (double_days_enabled && jour double) ? 2 : 1
current_stamps += points_earned
```

**Visit record** : `points_earned` = 1 ou 2, `amount_spent` = NULL, `status` = confirmed/pending

### 4.2 Mode Cagnotte (`loyalty_mode = 'cagnotte'`)

Le client cumule un **montant depense** (EUR). Au bout de N visites → X% cashback sur le cumul.

**Flux scan** : QR → telephone → **saisie montant** (confirmation par tap explicite, pas d'auto-validation) → `POST /api/cagnotte/checkin` → meme logique + montant

```
current_stamps += 1    // toujours 1, pas de x2
current_amount += amount
```

**Visit record** : `points_earned` = 1, `amount_spent` = montant EUR, `status` = confirmed/pending

**Calcul cashback** : `Math.round(currentAmount * percent) / 100` (percent = entier, ex: 5 pour 5%)

### 4.3 Detection recompense (commun)

```typescript
isRewardReady = currentStamps >= stamps_required
isTier2Ready  = tier2_enabled && currentStamps >= tier2_stamps_required
```

Detection basee sur le **nombre de visites**, pas sur le montant.

**Cycle palier** : palier 1 ne peut etre reclame qu'une fois entre deux paliers 2.

**Cap tier2_stamps_required** : `src/lib/tier2-max.ts` — merchants crees ≥ 2026-04-20 limites a 20 passages, anciens conserves a 30 (legacy). Validation client-side uniquement.

### 4.4 Reset au redeem

| Scenario | `current_stamps` | `current_amount` |
|---|---|---|
| **Palier unique — redeem** | Reset 0 | Reset 0 (cagnotte) / N/A (passage) |
| **Double palier — redeem palier 1** | Garde (continue vers palier 2) | **Reset 0** (cagnotte) / N/A (passage) |
| **Double palier — redeem palier 2** | Reset 0 | Reset 0 (cagnotte) / N/A (passage) |

**Point cle cagnotte** : `current_amount` reset TOUJOURS a 0 (meme au palier 1 avec tier2). Le cashback palier 2 est calcule sur le montant accumule APRES le palier 1.

```typescript
const shouldResetStamps = tier === 2 || !merchant.tier2_enabled;
// Cagnotte: TOUJOURS reset current_amount a 0
```

**Protection atomique** : `.gte('current_stamps', stampsRequired)` comme condition d'update. 0 rows → 409.

### 4.5 Annulation (`/api/rewards/cancel`)

| Scenario | Stamps restaures | Amount restaure |
|---|---|---|
| Palier 1 (tier2 off) | Oui | Oui (cagnotte) |
| Palier 1 (tier2 on) | Non (pas ete reset) | Oui (cagnotte, avait ete reset) |
| Palier 2 | Oui | Oui (cagnotte) |

### 4.6 Comparatif

| Aspect | Passage | Cagnotte |
|---|---|---|
| Tracking | `current_stamps` | `current_stamps` + `current_amount` |
| Increment | +1 (ou +2 jours doubles) | +1 tampon + montant EUR |
| Recompense | Fixe (ex: "1 brushing") | % du cumul |
| Jours doubles | Oui | Non |
| Saisie client | Rien | Montant depense (confirme par tap) |
| `amount_spent` (visit) | NULL | Montant EUR |
| `reward_value` (redemption) | NULL | Cashback EUR |

### 4.7 Switch de mode

- Les `loyalty_cards` existantes NE SONT PAS modifiees — `current_stamps` et `current_amount` persistent
- `current_amount` doit TOUJOURS etre initialise a 0 a la creation de carte
- Les API rejettent les requetes du mauvais mode
- Switch vers cagnotte : `double_days_enabled` desactive, `cagnotte_percent` requis
- Switch vers passage : `cagnotte_percent` / `cagnotte_tier2_percent` → NULL
- Tout calcul cagnotte : `Number(value || 0)` obligatoire

---

## 5. Fonctionnalites

### Qarte Shield (anti-fraude)
- Quarantaine visites inhabituelles (2+ scans/jour meme client)
- Detection IP duplicates, moderation manuelle (valider/refuser), bannissement numeros
- `shield_enabled` (BOOL, defaut true), wording : "verification automatique"
- Toggle on/off : `PendingPointsWidget` (accueil dashboard, visible uniquement si clients > 0) + `/dashboard/settings` (carte dediee en haut, toujours accessible)

### Offre Duo (mig 082)
- `duo_offer_enabled` (BOOL, defaut false) + `duo_offer_description` (TEXT) sur table `merchants`
- Config dans `/dashboard/program` (ExtrasSection) : toggle + description + suggestions
- Affiche sur page publique `/p/[slug]` (ProgrammeView) et carte fidelite client (`/customer/card/[merchantId]`)
- Le merchant applique la reduction manuellement — pas de logique au scan
- Fonctionne en mode passage ET cagnotte

### Student Offer
- `student_offer_enabled` (BOOL, defaut false) + `student_offer_description` (TEXT) sur table `merchants` (mig 087)
- Config dans `/dashboard/public-page` (PromoSection) : toggle + description + suggestions (-10%, -20%, -15% hors WE)
- Affiche sur page publique `/p/[slug]` dans la section "Avantages exclusifs" avec icone GraduationCap
- Mention "Carte etudiante obligatoire" affichee automatiquement
- Reduction permanente (pas de date d'expiration)

### Jours x2 (Double Stamp Days) — mode passage uniquement
- `double_days_enabled` + `double_days_of_week` (JSON array getDay(), timezone merchant via `getTimezoneForCountry(country)`)
- Helpers : `parseDoubleDays()`, `formatDoubleDays()`, `DAY_LABELS`, `WEEK_ORDER`
- Affiche dans ScanSuccessStep (badge amber) et sous la grille StampsSection

### Parrainage Client
- Code parrainage par carte (`referral_code`, 6 chars sur la carte client)
- Lien `/scan/{code}?ref={referral_code}` → banner parrain + inscription filleul
- Voucher filleul auto-cree a l'inscription, voucher parrain auto-cree quand filleul consomme
- Statuts : `pending` → `completed` (filleul consomme)
- Dashboard `/dashboard/referrals` : toggle, config recompenses, stats, tableau
- Config aussi dans `/dashboard/program` (ExtrasSection) : toggle + recompenses parrain/filleul — synchro avec la page Parrainage (memes champs DB)

### Offre Nouveaux Clients (mig 056)
- Code welcome par merchant (`welcome_referral_code`, genere a l'activation)
- Lien `/scan/{code}?welcome={welcome_code}` → banner "Offre nouveaux clients" + inscription
- API separee `/api/welcome` (GET validation + POST inscription) — zero impact sur `/api/referrals`
- Referral cree avec `referrer=null` (parrain virtuel = Qarte), `status='completed'`
- Voucher `source='welcome'`, expire 30 jours
- CTA visible sur page publique `/p/[slug]` si active
- Config dans Ma Page (`/dashboard/public-page`) uniquement
- Dashboard parrainage : affiche uniquement les vrais parrainages (welcome filtre)

### Birthday Gift
- `birth_month` / `birth_day` sur customers, voucher source='birthday'
- Cron `morning-jobs` (7h UTC) genere vouchers + push client + email merchant + push merchant. SMS envoye par `sms-hourly` a 10h local (plage legale FR). Dedup via `sms_logs` same-day
- Dashboard accueil : section "Anniversaires a venir" (3 jours, aujourd'hui inclus) si `birthday_gift_enabled`

### Avis Google
- `review_link` sur `merchants` — lien Google review du commerce
- Modal `ReviewModal` declenchee automatiquement : au 1er passage, au 3e passage (`current_stamps === 1 || 3`), apres chaque redeem, apres chaque voucher consomme
- Modal `ReferralModal` declenchee au 2e, 5e, 10e passage (si `referral_program_enabled`). Affiche recompenses parrain+filleul, Web Share API / clipboard. Cooldown 90j (`qarte_referral_shown_{merchantId}`). Guard `!showReviewModal` pour eviter double modal
- Dismiss 90 jours (localStorage `qarte_review_card_dismissed_${merchantId}`)
- Encart permanent `ReviewCard` sur la carte client si `review_link` configure
- `ReviewPrompt` sur la carte (dismissable definitivement via localStorage)
- Config dans `/dashboard/program` (ExtrasSection)

### Symbiose Réservation ↔ Fidélité (mig 180, `booking_earns_loyalty` — ON par défaut nouveaux merchants)
- Une **réservation EN LIGNE honorée** crédite automatiquement un point sur la carte : **+1 tampon** (mode passage) ou le **prix de la presta** (`total_price`, mode cagnotte). Libellé **« Réservation du X »** sur la carte cliente (`HistorySection`, `visits.source='booking'`).
- **« Le point suit la présence »** : le crédit se déclenche quand `attendance_status='attended'` — soit au **« Venue »** manuel (`/api/planning/attendance` PATCH), soit à l'**auto-mark J+1** de `morning-jobs` (7h). **No-show → aucun point** ; un point crédité est **retiré** si le RDV passe en `no_show`/annulé/supprimé/replanifié (helper `revokeBookingLoyalty`).
- **Activé par défaut pour les nouveaux merchants** (`merchants/create` pose `booking_earns_loyalty: true` au signup ; la colonne reste DEFAULT FALSE donc les existants restent opt-in). Le save dashboard est **découplé** de `auto_booking_enabled` (sinon le défaut sauterait au 1er enregistrement). Sans effet tant que la résa en ligne n'est pas active (rien à créditer).
- Helper unique `src/lib/booking-loyalty.ts` (`creditBookingLoyalty` / `revokeBookingLoyalty`). Garde-fous : toggle ON, créneau **`booked_online`** primary réservé avec `customer_id` (résa manuelle dashboard + walk-in texte libre ignorés), non déjà crédité, **dédup jour** (si un passage confirmé existe déjà ce jour-là, le scan gagne → 1 point/jour).
- **Bloc « points à venir » sur la confirmation de résa vitrine** (`BookingModal`, `step='confirm'`) : `book/route.ts` renvoie un objet `booking.loyalty` calculé par le helper pur `projectBookingLoyalty` (booking-loyalty.ts, type partagé `BookingLoyaltyPreview`) : mode, tampons courants/projetés/cible, restant, récompense, `state` first_point/in_progress/reward_ready, ou montant crédité en cagnotte. Nouvelle cliente → pas de relecture carte (0 connu). Copie au **futur** (« en venant, vous gagnez 1 point ») → motive la venue, réduit le no-show. Affiché seulement si l'option est ON. Bloc emerald (harmonie avec le badge « carte prête » du même écran).
- **Idempotence fail-safe** : index unique partiel `visits(planning_slot_id)` → au pire un point manquant, jamais de double ni de corruption (même en cas de réutilisation de créneau). Wrappers `safeRevoke` / `syncBookingLoyalty` (ne jettent jamais) branchés sur **tous** les points de sortie d'état (attendance `PATCH`, annulation `planning` PATCH + DELETE en lot pré-requêté, `customer-edit` cancel+reschedule, `shift-slot`) + reset `attendance_status` à l'annulation **et au déplacement** (le RPC `move_booking` ne le réinitialise pas). Le checkin exclut `source='booking'` de ses comptes Shield/idempotence.
- Réglage : **Planning > Paramètres** (`LoyaltyBookingCard`, visible si résa en ligne active) — toggle + modal explicatif « Comment ça marche » (bouton `headerRight`, même format que `FollowupCard` : intro + 4 étapes illustrées + encarts « 1 point/jour » et « résa en ligne uniquement »). Une résa honorée compte aussi comme **passage** dans les stats (choix assumé).
- UI partagée : le `Modal` (`src/components/ui/Modal.tsx`) est capé à la hauteur du viewport (`max-h-[calc(100dvh-2rem)]`, header figé, corps `overflow-y-auto`) — un modal riche ne déborde plus hors écran en paysage / gros zoom (fix transverse aux 9 modals).

### Push Notifications
- Programmees (10h/19h), manuelles, automations (welcome, close_to_reward, reward_ready, inactive, reward_reminder, events)
- Batched 50, pause 100ms entre batches

### Support Multi-Pays
- 10 pays dans `PHONE_CONFIG` : FR, BE, CH, LU, US, GB, CA, AU, ES, IT
- `COUNTRIES_BY_LOCALE` : FR/EN → FR/BE/CH (LU et autres retires, EN desactive)
- `PHONE_COUNTRIES` : `['FR', 'BE', 'CH']` — pays supportes pour les clients (selecteur PhoneInput + schemas Zod)
- E.164 sans + (ex: 33612345678, 32475123456, 41791234567)
- `formatPhoneNumber(phone, country)`, `validatePhone(phone, country)`, `displayPhoneNumber(phone, country)` — tous avec param country
- `detectPhoneCountry(phone)` : detecte FR/BE/CH depuis le prefix E.164 (pre-tri module-level)
- `displayPhoneWithFlag(phone)` : retourne `{ flag: '🇫🇷', display: '06 12 34 56 78', country: 'FR' }`
- `formatPhoneLabel(phone)` : raccourci JSX → `"🇫🇷 06 12 34 56 78"` (utilise partout pour l'affichage)
- `toLocalPhone(phone)` : convertit E.164 en format local → `{ local: '0612345678', country: 'FR' }` (pour pre-remplir PhoneInput)
- `getAllPhoneFormats(phone)` : genere toutes les variantes E.164 FR/BE/CH pour lookup anti-doublon (ex: `33612345678` → `['33612345678', '32612345678', '41612345678']`)
- **PhoneInput** (`src/components/ui/PhoneInput.tsx`) : selecteur pays drapeau+indicatif+nom pays, dropdown avec pays prefere en premier, placeholder dynamique, `useMemo` pour tri. Prop optionnelle `hidePrefix` : masque l'indicatif `+33` après le drapeau et agrandit le drapeau (`text-xl`) — utilisée dans `BookingModal` vitrine (étape coordonnées) pour un input plus épuré
- **Client choisit son pays** : le PhoneInput est pre-rempli avec le pays du merchant mais le client peut changer (ex: client belge chez merchant francais)
- **`phone_country`** : parametre optionnel dans tous les schemas Zod des APIs client-facing (9 routes). Fallback `merchant.country` si absent (backward compat)
- **Lookup multi-format** : `.in('phone_number', getAllPhoneFormats(...))` au lieu de `.eq()` — evite les doublons cross-border
- **Affichage** : tous les numeros affiches avec drapeau + format local via `formatPhoneLabel()` (8 endroits dashboard)
- Utilise dans : `/scan/[code]` (QR), `/customer` (login), `/p/[slug]` (booking), `/dashboard/planning` (client select), `/dashboard/customers` (ajout), `/dashboard/members` (ajout), `/auth/merchant/signup/complete` (inscription)

### Fuseaux Horaires (country-aware)
- `COUNTRY_TIMEZONE` map dans `src/lib/utils.ts` : 10 pays → IANA timezone (FR→Europe/Paris, US→America/New_York, etc.)
- `getTimezoneForCountry(country?)` : resout le timezone IANA, defaut Europe/Paris
- `getTodayForCountry(country?)` : YYYY-MM-DD dans le fuseau du merchant
- `getTodayStartForCountry(country?)` : ISO UTC timestamp de minuit dans le fuseau du merchant (pour filtres `gte` DB)
- **Toutes les APIs** utilisent ces fonctions (checkin, cagnotte, stats, planning, offers, push, visits, vouchers)
- `getTodayInParis()` et `getCurrentDateTimeInParis()` marques `@deprecated` — wrappers retrocompatibles
- **Crons** (morning/morning-jobs/morning-push/email-onboarding/email-engagement/evening) : utilisent `getTodayInParis()` intentionnellement (batch FR, pas per-merchant)
- `last_visit_date` : toujours set dans le fuseau du merchant via `getTodayForCountry(merchant.country)`
- `verifyMerchantOwnership()` dans push/schedule et offers retourne `country` pour eviter requete DB supplementaire

### Formatage Heures/Dates (locale-aware)
- `formatTime(time, locale)` : FR → **`HHhMM` toujours zero-padded** (ex: `09h00`, `14h30`) | EN → `2:00 PM` / `2:30 PM`
- `formatDate(date, locale)` : FR → `dd/MM/yyyy` | EN → `MM/dd/yyyy`
- `formatDateTime(date, locale)` : FR → `dd/MM/yyyy à HH:mm` | EN → `MM/dd/yyyy h:mm AM/PM`
- `formatEUR(amount, locale)` : **@deprecated** — wrapper backward-compat, ne plus utiliser
- `formatCurrency(amount, country?, locale?)` : retourne montant + symbole devise (ex: `19,00 €`, `$19.00`, `£19.00`)
- `getCurrencyForCountry(country?)` : ISO currency code (EUR, CHF, GBP, USD, CAD, AUD)
- `getCurrencySymbol(country?)` : symbole seul (€, CHF, £, $)
- `COUNTRY_CURRENCY` map dans `src/lib/utils.ts` : 10 pays → ISO currency code
- Default `'fr'` / EUR partout pour backward-compat

### Navigation i18n (regles imperatives)
- **Liens internes** : TOUJOURS `import { Link } from '@/i18n/navigation'` — JAMAIS `next/link` ni `<a href="/...">` (sinon perte de locale EN → FR)
- **Router** : TOUJOURS `import { useRouter } from '@/i18n/navigation'` — JAMAIS `next/navigation` pour useRouter
- **usePathname** : TOUJOURS `import { usePathname } from '@/i18n/navigation'` (retourne path sans prefixe locale)
- **Exceptions** qui restent sur `next/navigation` : `useSearchParams`, `useParams`, `notFound`
- **Liens externes** (https://) : `<a>` classique, pas de `<Link>`
- `src/i18n/navigation.ts` exporte : `{ Link, redirect, usePathname, useRouter, getPathname }`
- `src/i18n/routing.ts` : config routing (locales, defaultLocale, pathnames)
- **TikTokPixel** : seule exception, utilise `usePathname` de `next/navigation` (besoin du path complet avec prefixe pour analytics)

### SEO i18n
- **Sitemap principal** (`src/app/sitemap.ts`) : pages statiques (dont `/exemples`, showcase des démos par métier) + blog + compare + alternatives + tools. **Pas les démos `/p/demo-*`** (polluaient les SERPs "qarte" brandée ; restent noindex), **pas les pages merchant** (cf sitemap secondaire ci-dessous). Note : `/exemples` est indexable (page marketing), elle linke vers les `/p/demo-*` qui restent noindex.
- **Sitemap secondaire merchants** (`src/app/sitemap-merchants.xml/route.ts`) : route handler XML qui liste les `/p/[slug]` éligibles (exclut canceled + trial expiré). **Volontairement non déclaré dans `robots.ts`** — soumis manuellement à Google Search Console pour que les marchands soient indexés sans pollution brand "qarte". Cache 1h.
- **robots.ts (dynamic)** : disallow `/api/`, `/dashboard/`, `/admin/`, `/auth/`, `/customer/`, `/scan/`. + 11 règles AI bots opt-in (GPTBot, PerplexityBot, ClaudeBot, Google-Extended, Applebot-Extended, Bingbot, etc.) + opt-out CCBot. **Bug critique fix mai 2026** : `public/robots.txt` statique shadow le dynamic en Next.js → suppression du fichier statique pour que les règles AI bots soient enfin servies
- **noindex** : `/scan/[code]` et `/customer/card/[merchantId]` (layouts avec `robots: { index: false, follow: false }`). **Page marchand `/p/[slug]` aussi noindex** quand : démo (`isDemoSlug(slug)`), abonnement annulé / trial expiré, ou trop pauvre (0 service ET 0 photo ET pas de logo). Garde `follow: true` pour le link juice
- **Hreflang** : géré **par-page** via `metadata.alternates.languages` (Next 15). Plus de hreflang global dans `<head>` (créait des conflits sur `/p/[slug]` pointant vers `/`)
- **og:locale:alternate** : dans `[locale]/layout.tsx` (FR ↔ EN)
- **Blog** : `[locale]/blog/layout.tsx` — metadata locale-aware + canonical + alternates
- **/p/[slug]** : `generateMetadata` — `title: { absolute: ... }` pour casser le template `%s | Qarte` du root layout (objectif : pas de mention Qarte dans les SERPs marchand). Description enrichie avec ville + 1ère phrase de bio (max 160 chars). `og.siteName: shop_name` pour la même raison
- **Avis Google sur la vitrine (juin 2026)** : 2 surfaces dans `ProgrammeView`.
  - **Badge note dans le hero** (sous le téléphone) : traitement typographique (ligne **Bodoni Moda italic** « {salon} est noté <note>/5 sur Google », **note en doré `#B8860B`** via `t.rich`) dans une pilule **teintée couleur du salon** (`${p}16→${s}0E` + bordure `${p}24`). Tappable → `scrollIntoView` fluide vers la section. Nombre d'avis affiché **seulement si > 10**.
  - **Section `GoogleReviewsSection`** ([`src/components/vitrine/GoogleReviewsSection.tsx`](../src/components/vitrine/GoogleReviewsSection.tsx)) entre Photos et Réseaux (ancre `id="avis-google"`) : note héros en doré + 5 étoiles + « d'après N avis Google » + microcopy « Avis publiés sur Google » ; **3 avis** témoignage (cartes blanches bordées + guillemet `Quote` couleur salon) ; CTA bouton « Voir tous les avis sur Google » (fond `${p}12` + logo Google + icône lien externe). Toujours le nombre total d'avis affiché en bas (vs > 10 pour le badge haut).
  - Logo Google partagé : [`src/components/icons/GoogleGlyph.tsx`](../src/components/icons/GoogleGlyph.tsx) (badge + section, fini la duplication SVG).
  - Données via **Places API (New)** Place Details ([`src/lib/google-places.ts`](../src/lib/google-places.ts) `fetchPlaceDetails` / `getMerchantGoogleReviews` / `searchPlaces`), clé serveur `GOOGLE_MAPS_API_KEY`. **Cache 72h** en base (`merchant_google_reviews_cache`, mig 173) pour rester sous le palier gratuit + ToS (texte des avis non stocké durablement ; `place_id` stockable indéfiniment dans `merchants.google_place_id`). **Purge** des lignes > 72h dans le cron `morning-jobs` (rétention ToS pour les salons sans trafic). **Garde-fou coût** : fetch pour les **abonnés** (`active`/`past_due`) **et les essais en cours** (`trial` non expiré) ayant relié leur fiche ; **plus aucun fetch** dès que l'essai est expiré ou le compte annulé. Connexion dashboard via `program/ExtrasSection` : **autocomplétion live** (Places Autocomplete New, debounce 320ms → proxy `/api/places/search` → `autocompletePlaces`) → au pick, stocke `google_place_id` ET **auto-déduit le lien d'avis** (`writeReviewUrl` = `search.google.com/local/writereview?placeid=...`) dans `review_link` (gardé en **backup éditable**, plus de doublon de saisie ; alimente le flux SMS/modal de demande d'avis). **À l'enregistrement**, `/api/places/refresh` (POST) **fetch immédiatement** (param `force` de `getMerchantGoogleReviews` → ignore le TTL car le place_id a changé) + `revalidatePath` la vitrine → **affichage direct des avis**, sans attendre le 1er rendu / l'ISR. **Pas de JSON-LD `aggregateRating`/`Review`** (self-serving = pas d'étoiles Google + risque de pénalité) : valeur = confiance/conversion, pas le SEO.
  - **Pages démo** (`/p/demo-*`) : avis **fictifs statiques par métier** ([`src/lib/demo-reviews.ts`](../src/lib/demo-reviews.ts), `getDemoGoogleReviews(shop_type)`), zéro appel API, `mapsUri` null donc pas de CTA « voir tout ». Permet de montrer le rendu de la section sur la landing.
- **Welcome email** : `sendWelcomeEmail` recoit le locale du merchant a la creation
- **Admin pages** : hardcoded `'fr-FR'` acceptable (usage interne uniquement)

### Planning (mig 063-074, 083-086, 088-089)

- **Limites** : 20 creneaux par batch de creation (Zod max), **500 creneaux futurs actifs max par merchant** (mig 089 ajoute 2 partial indexes pour tenir a cette echelle : deposit deadline + booked). Suppression bulk : 200 par requete (client boucle si plus).

- Planning gere par le merchant — mode manuel (le client contacte) OU **reservation en ligne** (`auto_booking_enabled`, mig 083)
- **Reservation en ligne** : le client clique un creneau sur `/p/[slug]`, coche ses prestations, entre son tel/prenom, et confirme. Blocage automatique des creneaux consecutifs selon la duree totale des services. Email notification au merchant (`BookingNotificationEmail`). API `POST /api/planning/book`
- **Email confirmation client (optionnel, mig 148)** : champ email facultatif dans la dernière étape de `BookingModal` (subtitle adapté selon présence d'un acompte : *"Pour recevoir votre confirmation et le lien pour régler l'acompte par mail."*). Si fourni → `sendBookingConfirmationEmail()` avec un `mode` parmi 3 :
  - **`pending_deposit`** (résa avec acompte) : header *"Une dernière étape ✨"*, bloc paiement orange + CTA "Régler l'acompte" + deadline. **Pas de bouton carte fidélité** (objectif unique = payer)
  - **`deposit_received`** (acompte validé par merchant) : header *"Acompte reçu ✨"*, bloc vert récap **acompte reçu + reste à régler le jour du RDV** (totalPrice - depositAmount), bouton carte fidélité présent. Déclenché par `/api/planning` PATCH quand `deposit_confirmed` transitionne `false → true`. Helper `sendDepositReceivedEmail()` dans `src/lib/booking-emails.ts` refetch slot+merchant+services+customer en parallèle, utilise `computeDepositAmount()` partagé. **Base prix = `slot.total_price` réduit (snapshot mig 176, fallback somme brute si NULL)** — sinon acompte + reste à payer étaient calculés sur le prix catalogue et faux pour les résas avec réduction. Indépendant du toggle SMS — si email présent, le client a toujours une trace écrite
  - **`confirmed`** (résa sans acompte) : standard, bouton carte fidélité, message rappel J-1
  Signature merchant ("À bientôt — {shopName}"), pas Qarte. Email aussi remonté sur `customers.email` (modifiable depuis `EmailSection` sur `/customer/card/[merchantId]`, API `PUT /api/customers/email`). Snapshot conservé sur `merchant_planning_slots.customer_email` pour traçabilité (au cas où le client modifierait après).
- **Message de la cliente (mig 167)** : champ texte libre facultatif à la dernière étape du `BookingModal` vitrine (`messageLabel`/`messagePlaceholder`/`messageHint`, namespace i18n `booking`). Stocké sur `merchant_planning_slots.customer_message` (distinct de `notes`, la note du merchant). Visible : encart violet lecture seule dans `BookingDetailsModal`, bulle violette `MessageCircle` sur les cartes de la liste `ReservationsSection` (indicateur seul, pas le texte), section « 💬 Message de la cliente » dans `BookingNotificationEmail` (boîte lavande), ligne dans le push merchant (tronqué 80 car. via `truncate`). Propagé par `move_booking` (mig 167) + `customer-edit` reschedule, reset au clear/annulation du slot.
- **Anti double-booking — mode libre (mig 175)** : toutes les écritures de résa en mode libre passent par une RPC sous `pg_advisory_xact_lock(merchant + jour)` qui rend le check de chevauchement et l'INSERT atomiques. Avant, `book`/`manual-booking`/`bring-back`/`customer-edit` reschedule/`shift-slot` faisaient `SELECT chevauchements → INSERT` sans verrou → 2 résas concurrentes qui se chevauchent (start_time différents) passaient toutes deux (l'index UNIQUE ne couvre que le start_time exact). `reserve_free_slot` pose une ligne qui occupe la plage, puis la route l'enrichit par UPDATE ; `move_booking_free` verrouille + re-check + `move_booking` pour `shift-slot`. La **superposition volontaire en résa manuelle** reste possible via `force=true` (saute le check, garde le verrou). Mode créneaux déjà atomique (UPDATE `.is(client_name,null)` + `move_booking` au start_time exact). Voir `docs/supabase-context.md` (RPC mig 175).
- **Multi-slot booking** : quand la duree > 30min, les creneaux consecutifs sont bloques. Le slot principal a les `planning_slot_services`, les fillers ont `primary_slot_id` pointant vers le principal (mig 084). Filtre centralise dans `usePlanningState.slotsByDate`. Cascade PATCH (clear) et DELETE (supprime fillers). **PATCH services** : quand les services changent sur un slot booke en mode creneaux, les fillers sont recalcules (clear anciens + block nouveaux selon nouvelle duree)
- **BookingModal vitrine — mode créneaux, créneau trop court (mai 2026)** : la cliente clique une heure sur la vitrine puis choisit ses prestations. Si la durée totale ne tient pas dans le créneau cliqué (un RDV booké tombe dans l'intervalle), `durationAvailable=false`. Avant : message rouge + bouton désactivé → cul-de-sac (le modal mode créneaux n'a pas de sélecteur d'heure, la cliente devait fermer et re-deviner). Désormais le modal calcule `validDaySlots` (les autres heures libres du **même jour** qui tiennent la durée — filtre les RDV bookés + les heures déjà passées) et les affiche en pills cliquables dans l'encart rouge. État local `pickedTime` (init = prop `slotTime`, devient modifiable) ; `effectiveTime`/`durationAvailable`/payload suivent automatiquement. Si aucune heure ne tient ce jour-là, message invitant à fermer et choisir une autre date. Clés i18n `booking.durationPickAnother` / `durationNoneThatDay`.
- **Garde anti-rétroactif vitrine** (mai 2026) : aucune cliente ne peut créer/déplacer une résa sur un créneau dont l'heure est déjà passée (heure merchant). Source unique [`isSlotInPast()`](../src/lib/booking-window.ts) (`fromZonedTime` + `getTimezoneForCountry`, sémantique stricte `<` à la seconde) + helper `getMinutesSinceMidnightForCountry()` pour les filtres à granularité minute. Gardes serveur : `POST /api/planning/book` ([:107](../src/app/api/planning/book/route.ts)), `PATCH /api/planning/customer-edit` (reschedule). Filtres APIs publiques : `GET /api/planning?public=true` + `GET /api/planning/free-slots` ne servent plus aucun slot du jour passé (mode créneaux ET mode libre, y compris les `tightCandidates` du home_service). Filtres UI : `ProgrammeView` + `BookingModal.validDaySlots` calculent l'heure courante dans le fuseau merchant (avant : `new Date()` navigateur → horloge décalée = slots périmés affichés). Race finale : si la cliente clique pile à la seconde de péremption, l'API renvoie 400 `slot_in_past`, le modal affiche `t('booking.slotInPast')` (FR « Ce créneau vient de passer. Choisissez le suivant. »), bump l'état `freeSlotsBump` pour forcer un re-fetch de `/free-slots` (le cache contenait encore le slot expiré), reset `selectedTime` pour re-pick immédiat. Le dashboard merchant (`POST /api/planning/manual-booking`, `PATCH /api/planning`) reste libre de backdater — saisie a posteriori légitime.
- **Acompte** (optionnel) : `deposit_link` + `deposit_link_label` (ex: "Revolut") et optionnellement `deposit_link_2` + `deposit_link_2_label` (ex: "PayPal"), mig 090. Si le label est vide, `detectPaymentProvider()` dans `BookingModal.tsx` devine le nom du provider depuis le domaine (Revolut, PayPal, Lydia, Stripe, SumUp, Wise, Pumpkin, Twint, Payconiq, Venmo, Cash App, Zelle, Monzo, Buy Me a Coffee) — fallback "Payer l'acompte". `deposit_percent` OU `deposit_amount` (fixe). Tristate `deposit_confirmed`: NULL=pas d'acompte, false=en attente, true=confirme. Boutons confirmer ET annuler confirmation dans le dashboard. Modal publique affiche une **liste de choix** si 2 liens configures. Header modal confirm devient "En attente de confirmation" + icone `Hourglass` (au lieu de `CalendarDays`) + message incitatif "Merci de payer rapidement..." (pas d'affichage de deadline cote client, urgence douce). Bouton final unifie "Mes RDV & fidelite" (meme en cas d'acompte en attente) pointant vers `/customer/card/[merchantId]`. Conditions de resa via `booking_message`. Lien affilie Revolut sous les champs.
- **Acompte uniquement nouvelles clientes** (mig 165, mai 2026) : toggle `deposit_only_for_new_customers` BOOLEAN sur `merchants` (default FALSE). Si ON → l'acompte est skip quand le profil `customers` existe deja pour ce `merchant_id` (= cliente deja connue, soit elle a deja reserve soit elle a ete ajoutee comme walk-in via ClientSelectModal — meme semantique `isNewCustomer` que la welcome offer). Sources de verite : server `/api/planning/book/route.ts:368` + client `BookingModal.tsx` (gate `skipDepositReturning` sur `recognition.kind === 'known'`, lookup via `/api/member-cards/lookup` keye sur le meme `merchant_id`). Coexiste avec `member_programs.skip_deposit` (programme membre prioritaire, OR logique). Affichage dans /dashboard/planning : nouveau toggle dans la section Acompte (couleur amber-500 pour cohérence card) + ligne discrète gray-500 en bas linkant `/dashboard/members` ("Pour exempter une cliente précise ou lui donner une remise permanente, crée un programme membre"). Manual booking inchange (n'a jamais demande d'acompte).
- **Refonte UI Paramètres planning** (mai 2026) : extraction des 3 cards lourdes du tab settings (`page.tsx`: 2700 → 2346 lignes, -13%) dans `src/app/[locale]/dashboard/planning/settings/` : [`DepositCard.tsx`](../src/app/[locale]/dashboard/planning/settings/DepositCard.tsx) (atomisée ①②③④ : Lien → Combien → Pour qui → Délai, "Pour qui" en segmented control 2 boutons au lieu de toggle, encart "Comment ça se passe pour la cliente ?" en collapse), [`CustomerEditCard.tsx`](../src/app/[locale]/dashboard/planning/settings/CustomerEditCard.tsx), [`HomeServiceCard.tsx`](../src/app/[locale]/dashboard/planning/settings/HomeServiceCard.tsx), [`DepositLinkInput.tsx`](../src/app/[locale]/dashboard/planning/settings/DepositLinkInput.tsx). Création de composants UI réutilisables dans [`src/components/ui/`](../src/components/ui/) : `Switch` (tones indigo/emerald/amber/violet/rose, sizes sm/md), `Callout` (7 variants), `ChipGroup` (options + custom input numérique ; prop `fill` = layout grille pleine largeur, colonnes auto selon le nombre de cellules), `ToggleRow` (toggle + sub-content révélé), `SettingCard` (carte de réglage unifiée — en-tête bandeau teinté, prop `tone` indigo/emerald/violet, corps optionnel ; pattern unique de toute la page Paramètres planning depuis la refonte mai 2026). Bouton "Enregistrer" sticky pill toujours visible avec texte sur mobile + desktop (avant : FAB rond mobile sans texte, dépendait de `hasScrolled` state supprimé). Layout actions agenda : `grid-cols-3` avec "Ajouter une résa" `col-span-2` (2/3) + "Bloquer" `col-span-1` (1/3) + kebab à part. Pattern HTML : ne pas wrap `<Switch>` dans un `<button>` parent (HTML invalide → erreur hydration React) — la zone cliquable se limite au Switch lui-même (44×24px), accepté comme trade-off pour HTML propre + a11y unique-role. A11y : tous les hints `text-gray-400` du tab settings → `text-gray-500` (WCAG AA contraste).
- **Sous-navigation Paramètres** (juin 2026) : le tab settings affichait ~13 cards d'un coup (scroll lourd mobile). Désormais un **segmented control** (state `settingsSection` persisté `localStorage.qarte_planning_settings_section`) n'affiche **qu'une section à la fois** — **Agenda** (mode, tampon, horizon, service à domicile), **Réservation** (toggle résa, conditions, acompte, annulation/modif, RDV de suivi), **Notifs** (push, message public, SMS). Chaque section a sa couleur (pilule active : Agenda indigo, Réservation emerald, Notifs violet). Horizon + Service à domicile ont été déplacés de Réservation vers Agenda (mécanique d'agenda) — conditions d'affichage préservées (Horizon : autoBooking ON ; domicile : autoBooking + mode libre). Le bouton Enregistrer flottant reste hors sections et sauve tout depuis n'importe quelle vue (état partagé `usePlanningState` + `saveSettings` global).
- **Delai d'acompte** : `deposit_deadline_hours` (merchant config 1h/2h/3h/4h + custom, default 1h, NULL=libre). `deposit_deadline_at` (TIMESTAMPTZ sur le slot) calcule par `computeDepositDeadline()` (helper partage dans `src/lib/deposit.ts`) avec **grace nuit silencieuse** : si la deadline brute tombe entre 22h et 9h heure merchant, elle est repoussee a 9h du matin (large marge reveil). Cap absolu : RDV - 4h. Si RDV dans moins de 4h, pas de deadline. **Auto-liberation par cron dedie `/api/cron/deposit-expiration`** (mig 111, `*/15 * * * *` — lag max 15 min). Le client ne voit jamais l'heure exacte (incite a payer tout de suite). Message statique dans la config dashboard informe le merchant de la grace nuit. **Encart info merchant** sous le delai : rappelle qu'il recoit un email + notif push a chaque resa et doit valider vite, avec warning spam ("ajoute contact@getqarte.com a tes contacts").
- **Archive acomptes echoues** (mig 111) : quand un slot est libere pour acompte non recu, les details de la resa (nom client, tel, services, date/heure, montant acompte attendu) sont **snapshotes dans `booking_deposit_failures` AVANT** le wipe. Le merchant voit l'archive sous les resas dans l'onglet Reservations (section amber repliable, badge compact en haut du summary). 2 actions par ligne : **[Poubelle]** confirm inline → delete definitif / **[Ramener]** ouvre `BringBackBookingModal` (variante legere de `BookingDetailsModal`) : resume readonly + radio "Relancer l'acompte" (SMS avec nouveau lien) OU "Marquer l'acompte comme recu" + checkbox "Envoyer SMS de confirmation". Le ramener reutilise le creneau d'origine (409 si occupe). Helper partage `releaseExpiredDeposits()` dans `src/lib/deposit-release.ts` — unique source de verite (appele uniquement par le cron deposit-expiration). `SlotReleasedEmail` reecrit pour mentionner la possibilite de recuperer la resa depuis le dashboard. Evening + morning-jobs gardent seulement le **warning "acompte expirant dans 4h"** (plus aucune release).
- **RDV de suivi récurrents (+3/+6 sem.) — acompte différé** (mig 177, toggle `recurring_followup_enabled` dans Paramètres agenda, gaté `auto_booking_enabled`) : à la fin d'une réservation en ligne réussie, `FollowupScheduler` (écran de confirmation `BookingModal`) propose jusqu'à **2 RDV de suivi**, calendrier ouvert direct sur **+3 sem.** (puis +6 sem.), la cliente ajuste. Chaque suivi → `POST /api/planning/book` avec `followup:true` : **acompte différé** (`deposit_deferred=true`, `deposit_confirmed=false`, `deposit_deadline_at=NULL` tant qu'on n'est pas à J-7), **bypass de l'horizon** (cap 120j), et **aucun envoi cliente par RDV** (le merchant reçoit juste une push). Quand la cliente a terminé (2e RDV réservé ou bouton « Terminer »), `FollowupScheduler` appelle **`POST /api/planning/followup-recap`** qui envoie **UN seul email récap** (`FollowupRecapEmail`, `sendFollowupRecapEmail`) listant les RDV de suivi + annonçant le rappel (J-7 « régler l'acompte et confirmer » si acompte, sinon simple rappel) + « vous pourrez reporter/annuler depuis votre carte ». Destinataire = `customer_email` snapshoté sur les slots (jamais choisi par l'appelant), borné aux slots `booked_at` < 2h (anti-abus + rate-limit). Tant qu'on n'est pas à J-7, le suivi s'affiche **« RDV de suivi »** (badge violet) dans l'agenda (`ReservationsSection`), la modale détail (`BookingDetailsModal`) et la carte cliente (`UpcomingAppointmentsSection`), et il est **exclu de l'encart « Acomptes en attente »** (`PendingDepositsWidget`, filtre `deposit_deferred ≠ true`) — l'acompte n'est pas encore dû, on ne sollicite pas la cliente ni le merchant. **Rappel J-7** (cron `morning-jobs` → `sendFollowupDepositReminders`, `src/lib/followup-reminders.ts`) : **repasse `deposit_deferred=false`** (la résa bascule en « en attente d'acompte » normale, reprise automatiquement par les badges ambre + l'encart + le cron `deposit-expiration`), email (`BookingConfirmationEmail` mode `pending_deposit`, `deadlineHours:null`) + **1 seul SMS** `deposit_reminder` (les rappels veille/jour-J restent coupés tant que `deposit_confirmed=false`), puis pose `deposit_deadline_at` = **rappel + 48h** (`computeFollowupDepositDeadline` / `FOLLOWUP_DEPOSIT_WINDOW_HOURS`, délai fixe indépendant du délai d'annulation, cap RDV−4h, plancher now) → le cron `deposit-expiration` libère ensuite le créneau si l'acompte n'est pas reçu. Sans acompte configuré : suivis proposés quand même, `deposit_confirmed=NULL`, rappels veille/jour-J normaux (pas de J-7). **Reschedule** d'un slot différé (cliente `customer-edit` PATCH + merchant `shift-slot`) ré-arme `deposit_deferred` sur le nouveau créneau et remet `deposit_reminder_sent_at`/`deposit_deadline_at` à NULL (sinon la cliente échapperait à l'acompte en déplaçant). À partir de J-7 (passée en « en attente d'acompte »), la cliente peut payer/reporter/annuler depuis sa carte ; avant J-7, le bloc paiement de la carte est masqué (rien à régler tout de suite). Côté merchant, la modale détail (`BookingDetailsModal`) masque le bouton « Confirmer l'acompte » tant que le RDV est différé (avant J-7) et affiche à la place les actions normales (enregistrer/déplacer/annuler). Les RDV différés sont aussi exclus des compteurs « acomptes en attente » (`/api/customers/pending-deposits`, compteur admin `/api/admin/merchants/[id]`). **Aide intégrée** : la carte `FollowupCard` (Paramètres → Agenda) a un bouton « Comment ça marche » qui ouvre une modale expliquant le fonctionnement en langage pro (rien à payer sur le moment, rappel J-7, 48h pour régler, badge agenda, cas sans acompte, mode créneaux). **Limite connue (préexistante, tous acomptes confondus)** : reporter une résa *déjà en attente d'acompte* (deadline posée) vers une date plus lointaine conserve l'ancienne deadline (`move_booking` RPC ne la recalcule pas).
- **Source reservation** : `booked_online` BOOLEAN (mig 088) — true si reserve via `/api/planning/book` (vitrine), false si cree manuellement par le merchant. Utilise dans admin activite pour distinguer "Reservation en ligne" vs "Reservation manuelle"
- **Priorite resa Qarte vs externe** : quand `auto_booking_enabled`, le CTA externe (`booking_url`) est masque sur la vitrine et la carte de fidelite affiche un seul lien "Reserver" vers `/p/{slug}`. Warning dans les settings si les deux sont configures
- **Guard offres vitrine** : les sections offre nouveaux clients et promo utilisent `canBookOnline = auto_booking_enabled && planningSlots.length > 0`. Si resa en ligne activee mais aucun creneau disponible, fallback vers le mode scan (bouton "En profiter" + lien `/scan/{code}`)
- **Annulation/modification par le client** (mig 096-097) : `allow_customer_cancel` + `allow_customer_reschedule` (2 toggles independants) + `cancel_deadline_days` / `reschedule_deadline_days` (delais separes en jours avant le RDV, min 1 = la veille). API `DELETE/PATCH /api/planning/customer-edit` (auth cookie phone). Boutons "Annuler" (rouge) et "Modifier" (couleur merchant) dans `UpcomingAppointmentsSection` sur la carte client. Modal bottom-sheet pour confirmation annulation + modal reschedule (selecteur date horizontal + grille horaires, charge slots via `GET /api/planning?public=true`). Push + email au merchant. Tous les RDV sont editables (pas de restriction `booked_online`)
- Multi-services, photos inspiration, photos resultat ("avant/apres"), liens sociaux clients
- 1 creneau = 1 ligne en DB (date + heure debut). `client_name IS NULL` = disponible, rempli = pris
- Dashboard `/dashboard/planning` : 3 onglets (Agenda, Reservations, Parametres) — l'activation resa en ligne a ete fusionnee dans Parametres
- **Hero planning desactive** (avril 2026) : quand `!planning_enabled`, card centrée "Ton agenda, ta façon" + sous-titre "Active pour démarrer. Voilà ce qu'il y a dedans :" suivi d'une liste de 5 features icône+titre+desc (Lucide icons indigo) : `CalendarCheck` Réservation en ligne (0% commission) · `LayoutGrid` 2 modes au choix (Créneaux/Libre rendu via `t.rich` avec `<b>`) · `MapPin` Service à domicile · `MessageSquare` Rappel SMS la veille · `CreditCard` Acomptes (Revolut/PayPal/Stripe). Footer italique gris "carte de fidélité auto à chaque cliente". Remplace l'ancienne checklist 1-2-3 trop verbeuse. Keys i18n `disabledFeat{1-5}{Title,Desc}` + `disabledFooter`
  - **Agenda** : **3 vues** — `day` (1 jour, defaut mobile), `2day` (2 jours cote-a-cote, mobile uniquement), `week` (7 jours, defaut >=1024px). Toggle mobile `[1j|2j]`, toggle desktop `[Jour|Semaine]`. Pref persistee dans `localStorage.qarte_planning_view`. Header nav : `Calendar (date picker) | ← | Semaine XX + date range | → | toggle`. Timeline 8h-21h avec graduations 15/30/45. **CA du jour** affiche en pill emerald (headers DayView + WeekView) : somme du prix des slots confirmes (`client_name` present, pas `__blocked__`) — **`slot.total_price` réduit (snapshot mig 176) avec fallback somme `service.price` brute si NULL**, formate via `formatCurrency(merchant.country)` — vu en `utils.ts:computeDayRevenue` (idem `dashboard/stats` pour le CA global). Les RDV `no_show` valent l'acompte conserve (helper `noShowRevenue`), pas le prix presta. En mode `2day`, le 2e jour (J+1) est highlight `bg-indigo-100` (vs `bg-indigo-600` pour le jour primaire). Menu kebab pour actions semaine (story Instagram, copie semaine, vider jour/semaine). Mode libre : overlays hachures FERME/PAUSE depuis `merchant.opening_hours`. Slot cards Booksy-style : heure debut-fin (bold, en haut) → prestations (text-sm bold, line-clamp-2, visible d'un coup d'oeil) → nom client (discret, en bas)
  - **Reservations** : tous les RDV reserves (a venir + passes), groupes par jour avec **bande stats** en tete (2 chips : RDV + Total estime dans devise merchant, icones CalendarDays/Wallet sur fond degrade indigo-violet). Empty state enrichi : "Partage ton lien partout sur tous tes reseaux pour commencer a avoir tes premieres reservations". Heure affichee sur 2 lignes : **heure debut** (indigo bold) + **heure fin** (gray-500, text-sm) calculee via `endTimeFromStart(start, duration)` — lecture "de 9h00 a 10h30" en un coup d'oeil
  - **Parametres** : 3 sections dans l'ordre d'usage, **un accent couleur par section** (mai 2026, refonte UI) — **Mon agenda** (indigo : mode creneaux/libre, tampon inter-RDV), **Reservation en ligne** (emerald : toggle activation en tete de section + horizon de resa + conditions + acompte + annulation client + service a domicile), **Communication** (violet : push, message libre public, SMS). Toutes les cartes utilisent le primitif unique `SettingCard` (en-tete a bandeau teinte, prop `tone` indigo/emerald/violet portee par la section : en-tete + icone + Switch alignes sur la couleur de section). Etat selectionne des pills/segments en `slate-800` (noir adouci). amber reserve aux Callout d'avertissement uniquement
- **Modal unifie `BookingDetailsModal`** : **un seul modal** pour les 2 onglets (Agenda ET Reservations). Clic sur une resa dans la liste Reservations → ouvre directement BookingDetailsModal (plus de modal light inline). **Header refondu (avril 2026)** : pas de flèche retour (bug UX en édition + doublon avec lien "Changer client" en création). Stack vertical : nom client `text-base font-semibold` > date `text-sm gray-700 capitalize` > heure `text-sm font-medium gray-900` avec icône Clock cyan-600 + `tabular-nums`. Lien "Changer le client" cyan-700 visible **uniquement en création** (`!slot.client_name && draft.clientName.trim()`). Icone `CalendarPlus` (export .ics RFC 5545 via `src/lib/ics.ts`) a cote du X. Footer 3 boutons flex-1 equilibres : `[Check Enregistrer]` indigo solid / `[CalendarClock Deplacer]` gray outline / `[Trash2 Annuler]` red outline. Pour slot vide (rare) : `[Enregistrer]` flex-1 + `[Trash2]` icon. Overlay Deplacer + overlay Annuler (avec toggles SMS). **Onglets Photos / Notes / Historique** unifies en une seule barre `<TabButton>` (mutuellement exclusive) avec pastilles compteur : nombre pour Photos, point indigo si note saisie, rien pour Historique. Un seul panneau rendu a la fois — gain vertical massif vs 3 accordeons empiles
- **Wrapper `PlanningModal`** (`planning/PlanningModal.tsx`) : shell partage overlay + Framer Motion + container + sub-components `<ModalHeader>` (icone tintee, titre, sous-titre, badge, actions, X) et `<ModalFooter>` (flex gap-2). Utilise par AddSlotsModal, ConfirmDeleteSlotsModal, et les 3 modaux inline de `page.tsx` (bloquer creneau, supprimer bloc, changer mode). Tokens unifies : `bg-red-600` pour danger, `text-xs font-bold rounded-xl py-2.5` pour boutons footer, `focus:ring-indigo-500/20`. Sizes `sm`/`md`/`lg`. BookingDetailsModal et ClientSelectModal gardent leur shell custom (overlays internes complexes)
- **Scroll des modals planning** : tous les modals (PlanningModal + BookingDetailsModal + ClientSelectModal + modal manuel) appellent `useBodyScrollLock` (verrou body counter-based, `src/hooks/useBodyScrollLock.ts`) et portent `overscroll-contain` sur leur conteneur scrollable — corrige le scroll-bleed (l'arrière-plan défilait sous le modal). Les overlays internes Déplacer/Annuler de `BookingDetailsModal` sont en `flex-1 min-h-0 overflow-y-auto overscroll-contain` (le `min-h-0` est requis pour qu'un enfant flex borne réellement son scroll)
- **Vue Semaine / 2-jours (`WeekView`)** : composant generique pilote par `weekDays: Date[]` — grille `48px + N colonnes` (N = `weekDays.length`). Desktop = 7 cols, mode `2day` = 2 cols (`[selectedDay, selectedDay+1]`). Compact header inline (weekday+date sur une ligne) quand `weekDays.length <= 2`. Prop optionnel `secondarySelectedStr` pour highlight intermediaire (J+1 en 2-day). Chaque colonne = mini day header cliquable + pill CA du jour + timeline overlays/slot cards condenses (text-[9px]/-[10px]). Constantes + helpers partages dans `timelineShared.ts`. Donnees per-day memoizees (`columnData` useMemo) incluent `revenue` pour eviter recalcul.
- **Deplacer un RDV — mode libre** : l'overlay Deplacer fetch `GET /api/planning/free-slots?merchantId=&date=&totalDuration=` quand la date change. L'API retourne UNIQUEMENT les heures ou le RDV rentre (tient compte de `opening_hours`, bookings existants, blocs, `buffer_minutes`, pause dejeuner). Pendant le fetch : spinner. Si aucun slot : warning amber "Pas de creneau dispo ce jour". Input custom en fallback
- **Deplacer un RDV — mode creneaux** : les chips pre-existantes (slots vides) sont filtrees par duree consecutive. Si le RDV dure 2h, ne propose pas 14h quand 14h30 est deja pris (calcul `needed = ceil(duree / 30)` + verification que les N slots suivants sont tous vides). **Fetch hors-cache** (avril 2026) : `slotsByDate` est limité à la semaine affichée (`weekStart..weekEnd`) ; si la date cible est hors fenêtre, `BookingDetailsModal` déclenche un fetch ponctuel `GET /api/planning?from=moveDate&to=moveDate` (state `moveTargetDaySlots`). Sans ce fetch, déplacer vers une autre semaine affichait toujours « aucun créneau dispo » même quand le jour était plein. Spinner pendant le fetch (réutilise le même UI que mode libre). Boolean dérivé `moveDateOutOfCache` stable comme dépendance de l'effet (pas `slotsByDate` directement, sinon re-fetch parasite à chaque mutation de `slots`).
- **Couleurs services** : palette 10 couleurs vives (niveau 500-600) attribuees automatiquement aux services. Slots bookes affiches en bande saturee style Booksy (fond vif 90% opacity, bord gauche 4px, texte blanc). Slots bloques (incl. FERME/PAUSE mode libre) en hachures diagonales + pill blanc (Lock + notes/raison tronquees en WeekView, + heure en DayView) avec `z-10` explicite pour garantir la visibilite au-dessus des hachures
- **Kebab menu actions — semaine** : bouton 3 points a droite de "Bloquer une plage" masque en mode libre si aucune action dispo (`selectedDayFreeCount === 0 && freeSlots === 0`). En mode creneaux toujours visible (contient Telecharger story + Copier semaine)
- **Historique client** : dans le modal booking, affiche les RDV passes du client (via `GET /api/planning?customerId=`)
- **Photos resultat** : photos "apres" prestation (max 3/creneau), separees des photos inspiration. Groupees sous un depliant "Photos" (Avant/Apres) dans le modal edition
- Flow edition : clic slot reserve → direct modal edition (skip selection client). Clic slot libre → Modal 1 (choix/creation client) → Modal 2 (edition)
- **Modal selection client** : recherche par nom OU telephone (API normalise le numero en E.164 via `getAllPhoneFormats`). Bouton "Passer" masque si un numero est saisi (force creation client). Bouton "Etape suivante" masque si aucun client selectionne
- **Modal nouveau RDV manuel (mode libre)** : wizard 2 etapes via state `manualStep` (1|2). Etape 1 = Prestations + Creneau (date/heure) + warning conflit 409 + bouton Forcer ; etape 2 = Client (recherche/creation + voucher grants) + Notes + toggle SMS + erreurs de save. Header : badge `1/2`·`2/2` + barre de progression indigo→violet. Footer dynamique (`Annuler`/`Suivant` puis `Retour`/`Confirmer`). Conflit au submit → bounce auto etape 1. Auto-clear du conflit sur changement date/heure. API `POST /api/planning/manual-booking` accepte `send_sms` → `sendBookingSms('confirmation_no_deposit')`
- **Prestation sur mesure (one-shot, mig 130-132)** : composant partage `<CustomServicePicker>` dans `src/app/[locale]/dashboard/planning/CustomServicePicker.tsx` utilise dans 3 flows : creation/edition mode creneau (BookingDetailsModal), creation mode libre (manual booking modal), bring-back (BringBackBookingModal). Le merchant clique "+ Prestation sur mesure" → mini-form inline (nom **requis**, duree, prix optionnel) avec bordure dashed coloree (couleur random depuis `SERVICE_COLORS`). Confirme → card sur fond indigo avec badge "SUR MESURE" + icones edit/remove. Stocke directement sur `merchant_planning_slots` (4 colonnes nullable, 1 prestation custom max par booking — pollution catalogue evitee). Compte dans `total_duration_minutes`, `totalPrice`, deposit calcul, overlap detection, CA stats (`slotRevenue` includes `custom_service_price`), CA hebdo cron, `computeDayRevenue`, `getSlotColor` (fallback). **Top services exclus volontairement** (no service_id → no recurrence). Au moment de l'archive deposit-failure : 4 colonnes snapshotees sur `booking_deposit_failures` (mig 131) puis re-injectees lors du bring-back (avec override possible). Helper `customServiceDisplayName(slot)` + constante `CUSTOM_SERVICE_DEFAULT_NAME = 'Prestation sur mesure'` dans `src/lib/utils.ts`. Prix stocke en DECIMAL en euros (mig 132 a corrige une INTEGER en cents creee par erreur — sinon `formatCurrency` affichait 4000 € au lieu de 40 €)
- **Guard activation mode libre (avril 2026)** : impossible d'activer le mode libre si `opening_hours` vide ou invalide. Modal i18n (`planning.missingHours*` FR/EN) avec CTA vers `/dashboard/public-page`. Helper `hasValidOpeningHours()` dans `src/lib/opening-hours.ts` (reutilisable partout). Helper `isValidOpeningSlot(slot)` mutualisé pour la validation par-jour : `open < close` et si pause `open < break_start < break_end < close` — utilisé par `InfoSection` (vitrine, bloque le save si horaires incohérents type "08-16 puis 14-20") et le picker activation
- **Mode libre par défaut (mai 2026)** : à la première activation du planning (`!planningEnabled && !slots.length`), le picker pré-sélectionne `'free'` au lieu de laisser le merchant choisir. Le merchant peut basculer sur `'slots'` s'il préfère. Si `'free'` selectionné sans horaires : warning amber inline + bouton Confirmer désactivé + lien direct vers la page horaires (`pendingFreeBlocked` dérivé). Onboarding checklist : step "Crée tes créneaux" supprimée (n'a aucun sens en mode libre, créait de la confusion)
- **Guard activation planning sans programme fidélité (mai 2026)** : impossible d'activer le toggle planning si `!merchant.reward_description`. Modal `missingLoyaltyBlock` avec CTA `/dashboard/program` (pattern identique à `missingHoursBlock`). Sinon les clientes qui réservent reçoivent une carte vide. 5 clés i18n FR + EN (`missingLoyaltyTitle/Body/Warning/Later/Cta`).
- **SMS opt-in dans les modals planning** (4 toggles opt-in desactives par defaut, grises + badge "Pro" en trial, visibles uniquement si slot a un numero) : `confirmation_no_deposit` (mode creneaux via BookingDetailsModal sur slot libre + mode libre via manual-booking modal), `confirmation_deposit` (validation acompte), `booking_moved` (overlay deplacement), `booking_cancelled` (overlay annulation). Rappel J-1 automatique par cron evening pour tous RDV futurs
- **Creation client depuis planning** : reutilise `/api/customers/create`. Si client existe deja (409), l'API retourne `customer_id` et le planning le reutilise automatiquement
- **Annulation RDV — comportement par mode** : en mode creneaux, annuler vide le slot (garde le creneau reutilisable). En mode libre, annuler supprime le slot (sinon contrainte unique `slot_date+start_time` bloquerait la recreation sur le meme horaire). Flag serveur `delete_if_empty` dans PATCH `/api/planning`, declenche par `BookingDetailsModal.handleClearSlot` quand `bookingMode === 'free'`
- **Switch mode slots → libre** : `POST /api/planning/switch-mode` purge atomiquement TOUS les creneaux primaires vides du merchant (toutes semaines confondues, filtre `client_name IS NULL AND primary_slot_id IS NULL`) puis bascule `booking_mode` dans la meme requete. Bug historique fixe (mai 2026) : l'ancien flow chunked DELETE cote client ne purgeait que les creneaux de la semaine **affichee** (slots fetched via `weekStart..weekEnd`), laissant des creneaux fantomes hors fenetre qui violaient la contrainte unique `(merchant_id, slot_date, start_time)` lors d'une resa libre. Preserves : resas (`client_name` non-null), fillers actifs (`primary_slot_id` non-null), blocages (`client_name='__blocked__'`). Modal confirmation : warning generique "Tous tes creneaux vides seront supprimes" (plus de count par semaine bias)
- **Toasts UX** : `ToastProvider` monte au niveau `dashboard/layout.tsx`. Les 10 actions planning emettent un toast via `useToast()` dans `usePlanningState` + `page.tsx` : creation (creneaux + libre), edition save, annulation, deplacement, suppression simple/bulk, confirmation acompte, creation client, restauration booking. Types : `success` (creation, edit, move, deposit), `info` (suppression, annulation). Keys i18n `toast*` dans `messages/{fr,en}.json > planning.*`
- **Recherche reservations** : barre de recherche en haut de l'onglet Reservations (`ReservationsSection.tsx`) — filtre par nom (includes insensible a la casse) OU telephone (digits-only, match partiel >=2 chiffres, supporte les formats E.164). `type="search"` + `enterKeyHint="search"` + `autoComplete="off"` pour UX mobile. X clear custom, native webkit cancel hide. Pendant la recherche : RDV passes auto-deplies, empty state dedie `noReservationsForQuery`. Style identique au search client de `ClientSelectModal` (rounded-xl + ring indigo)
- **Auto-creation client + voucher nouveaux clients** : a la reservation en ligne, si nouveau client, creation automatique du customer + carte fidelite. **Plus de voucher welcome cree** depuis mai 2026 (sprint 2026-05-08) pour les merchants `auto_booking_enabled=TRUE` — la reduction welcome est appliquee directement au booking via `welcome_offer_discount_percent` (mig 153). Pour merchants `auto_booking_enabled=FALSE` (cas C, autre systeme de resa), le voucher pattern est conserve (cree via `/api/welcome` ou `/api/vouchers/grant` manuel). Idem pour les promos `merchant_offers` : appliquees au booking si auto_booking ON, voucher cree via `/api/merchant-offers/claim` si auto_booking OFF
- **Regle no-cumul (mai 2026)** : `computeBookingPrice` (`src/lib/booking-pricing.ts`) applique **member fidele toujours cumule** (statut permanent VIP) + **welcome vs promo : la plus rentable en EUR uniquement** (comparaison en EUR car promo ciblee 30% sur 1 presta peut battre welcome global 15%). `appliedDiscounts` retourne `member`+`memberAmount`, `welcome`+`welcomeAmount`, `promo`+`promoAmount` (tous en precision centime). Final = `total - memberAmount - max(welcomeAmount, promoAmount)`. Validator `validateAppliedDiscounts` rejette `applied_offer_percent + applied_welcome_percent` set ensemble (defense server-side). Toggles BookingDetailsModal mutuellement exclusifs (welcome decoche promo et inverse).
- Tables : `merchant_planning_slots` (mig 063+065+083+084), `planning_slot_services` (mig 071), `planning_slot_photos` (mig 072), `planning_slot_result_photos` (mig 074), `booking_deposit_failures` (mig 111)
- Colonnes `instagram_handle`, `tiktok_handle`, `facebook_url` sur `customers` (mig 073)
- API `/api/planning` (GET avec join services+photos+result_photos+customer social, filtre `customerId`/POST/PATCH avec cascade fillers/DELETE avec cascade fillers) + `/api/planning/book` (POST public, rate-limited) + `/api/planning/copy-week` + `/api/planning/photos` + `/api/planning/result-photos` + `/api/planning/shift-slot` + `/api/planning/deposit-failures` (GET list + DELETE) + `/api/planning/deposit-failures/bring-back` (POST) + `/api/planning/switch-mode` (POST atomique, basculer slots↔free) + `/api/planning/free-availability` (GET binaire jour-par-jour, mode libre uniquement, range max 62j, rate-limited 30/min) + `/api/customers/social`
- Helpers partages : `_photo-helpers.ts`, `computeDepositAmount()` + `computeDepositInfo()` + `computeDepositDeadline()` + `noShowRevenue()` (dans `src/lib/deposit.ts`, `computeDepositAmount` re-exporte depuis `planning/utils.ts` pour backcompat), `releaseExpiredDeposits()` (dans `src/lib/deposit-release.ts`, single source of truth pour libere+archive), `endTimeFromStart(start, duration)`, `formatDateLong(d, locale)`, `computeDayRevenue(slots, serviceMap)`, `getISOWeekNumber(d)` dans `planning/utils.ts`. **`computeDepositInfo`** (mai 2026) consolide rawDeposit + isFullPayment + cappedDeposit + remaining + fixedExceedsTotal pour les UI (BookingModal sticky bar + totals box) — evite la duplication 3-sites observee historiquement (3 commits "fix Math.round centime" en chaine).
- Page publique `/p/[slug]` : section "Disponibilites" (60j glissants, groupes par mois, preview 4 jours + bouton Voir plus), banniere message libre
- **BookingModal vitrine — UX mode libre** (mai 2026) : 2 useEffect distincts sur `/api/planning/free-availability`. (1) fetch du **mois affiche** dans le calendrier (deps `[calMonth, totalDuration, ...]`) → dot vert/rouge sous chaque jour. (2) fetch independant **today→today+30** (deps `[totalDuration, ...]`, indep de `calMonth`) → calcule `firstAvailableDate` (1ere date avec dispo) affiche en lien cliquable au-dessus du calendrier ("Premiere dispo : mardi 14 mai" + pastille verte). Click bascule `calMonth` au bon mois + selectionne la date. Skip home_service (impossible sans coords cliente) et mode slots. Container `min-h-[18px]` pour eviter saut de mise en page quand le lien apparait/disparait. Typo bandeaux promo + welcome teaser : titre `text-[14-15px] font-bold tracking-tight line-clamp-2` (vitrine + modal), description `line-clamp-2/3` + `text-gray-700` (au lieu de `truncate` qui coupait au milieu d'un mot)
- `display_phone` (mig 108) : numero fixe/portable affiche sur vitrine publique (E.164 sans +), configurable dans dashboard > Ma Vitrine > Mon salon avec PhoneInput + selecteur pays, affiche formate avec drapeau sur `/p/[slug]` + lien `tel:` cliquable, prioritaire dans JSON-LD `telephone`
- **Bandeau "Page suspendue"** : bandeau rouge sticky en haut de `/p/[slug]` pour merchants expires. Condition : `subscription_status` hors active/canceling/past_due, ET si trial → verifie `trial_ends_at + 3j grace`. Message : "Page suspendue — compte inactif. Un abonnement est necessaire pour reactiver cette page." Pression sociale pour inciter le merchant a s'abonner. Note : `subscription_status` reste `trial` en DB meme apres expiration (jamais mute automatiquement), d'ou la verification sur `trial_ends_at`.
- **Bandeau demo** : bandeau fixe bottom sur pages demo (`isDemo`) : "Mode demo — les actions sont desactivees" + CTA "Creer mon compte".
- **Acompte** : toggle on/off dans parametres planning (`depositEnabled` state local, sync au load). `computeDepositAmount()` cappe au prix total (`Math.min`). Si acompte >= prix → affiche "Paiement integral" au lieu de "Acompte" (vitrine + dashboard).
- **Reply OK warm-up** : texte sous bouton signup "Reponds OK a l'email pour activer tes 3 jours d'essai gratuit" + encart jaune dans Welcome email demandant de repondre OK (warm-up deliverabilite)

### Service à domicile — calcul auto durée de trajet (mig 134-136)

- **But** : pour les pros qui interviennent à domicile (ongleries mobiles, esthéticiennes itinérantes), le planning intègre automatiquement le temps de trajet entre RDV. La cliente saisit son adresse à la résa, le système calcule le trajet et bloque le créneau juste à temps.
- **S'applique uniquement au mode libre** (`booking_mode = 'free'`) — les créneaux pré-générés du mode `slots` sont fixes par construction.
- **Toggle merchant** : carte dans Planning → Paramètres → Mon agenda. Active sous condition que `shop_address` soit renseignée (validation à l'activation, toast si manquante). À l'activation, géocodage auto via BAN si `shop_lat/lng` non déjà capturés (InfoSection les pré-stocke depuis avril 2026).
- **Privacy par défaut** : sub-toggle "Masquer mon adresse sur la vitrine" auto-activé à la 1ère activation home_service. Cache `streetAddress` côté `/p/[slug]` ET dans le JSON-LD ; `addressLocality` (ville) reste pour le SEO local. Extraction ville via `extractCityFromAddress()` (lib/utils.ts) — gère **les deux formats** : avec virgule (`"12 rue Lepic, 75018 Paris"`) ET sans virgule (BAN-style `"12 Rue Lepic 75018 Paris"`, format renvoyé par api-adresse.data.gouv.fr). Regex `\b\d{4,5}\b\s+(.+)$` capture tout après le code postal. Cache busté côté vitrine via `POST /api/dashboard/revalidate-merchant-page` après save (sinon ISR 1h sert l'ancien HTML).
- **Stack** :
  - Géocodage : `api-adresse.data.gouv.fr` (BAN, gratuit, sans clé) — déjà utilisé par `AddressAutocomplete`, étendu pour exposer `lat/lng`
  - Routing : OpenRouteService Directions API (`https://api.openrouteservice.org/v2/directions/driving-car`), 2000 req/jour gratuit, env `OPENROUTESERVICE_API_KEY`
  - Cache Postgres `travel_time_cache` (origin_key, dest_key, duration_minutes, fetched_at) — clé = "lat,lng" arrondi 4 décimales (~11m)
  - Fallback Haversine × 1.4 / 30 km/h si ORS down
- **Calcul slots dispo** (`/api/planning/free-slots`) :
  - Si `home_service_enabled`, exige `?customerLat=&customerLng=` (sinon 400 + flag `requiresAddress`)
  - Pour chaque créneau candidat : trouve le booking précédent / suivant du jour, calcule travelIn (prev → cliente) et travelOut (cliente → next)
  - Dédoublonnage des paires d'origine/destination + appels `getTravelTime` parallèles via `Promise.all` (gain ~10× sur les jours chargés)
  - Slot valide si : `t >= prev.end + travelIn` ET (si next) `t + duration + buffer + travelOut <= next.start` — buffer (aléa) appliqué symétriquement
  - **Mode loose pour le 1er RDV** : `earliestStart = prev ? prev.end + travelIn : openMins`. L'horaire d'ouverture représente "heure du 1er RDV possible" (modèle mental pro à domicile), pas "heure de départ de chez soi". Pro doit avancer son ouverture si trajet matinal nécessaire — la modale BookingDetails affiche l'heure de départ conseillée.
  - **Tight insertion** : pour chaque RDV, on injecte un candidat extra `tight = ceil((b.end + travelIn) / 5) * 5` (5 min sup. après la fin du trajet). Évite que la cliente perde jusqu'à 14 min d'attente quand le trajet retombe entre deux multiples de 15 (ex. 10h47 → 10h50 dispo en plus de 11h00). Skip si déjà sur la grille 15 min, hors journée, dans une pause, ou en chevauchement. 0 appel API supplémentaire (les paires booking↔cliente sont toutes pré-fetchées). Côté book route, accepté nativement par construction (`requestedStart - travelIn ≥ prev.end` est vrai par définition du `ceil`).
  - Cap de sécurité : `MAX_TRAVEL_MINUTES = 60` — au-delà le slot est rejeté (cliente trop loin)
- **Rayon d'intervention configurable** (mig 170, mai 2026) : `merchants.home_service_radius_km` (1-200, NULL = pas de limite → fallback sur le cap 60 min). Backfill à 15 km pour tous les merchants déjà `home_service_enabled=true`, pré-rempli à 20 km à toute nouvelle activation côté UI. Réglable dans Planning > Paramètres > Service à domicile (chips 10/15/20/30/50 km + input custom + « Pas de limite »). Validation **Haversine** (vol d'oiseau, [`src/lib/geo.ts`](../src/lib/geo.ts) — module pur partagé client+serveur) à 3 niveaux : (1) `BookingModal` vitrine côté client à la sélection BAN → encart rouge `addressOutOfZoneTitle/Body` + bouton « Suivant » désactivé (1 cliente comprend tout de suite qu'elle est trop loin et pourquoi), (2) `GET /api/planning/free-slots` → `{ slots: [], outOfZone: true, radiusKm }` (court-circuite tout appel ORS pour rien), (3) `POST /api/planning/book` → 400 `{ error: 'out_of_zone', radius_km }` (défense serveur anti-spoof). Si rayon NULL, on conserve le comportement précédent (cap 60 min). Couplé au badge vitrine — cf. section suivante.
- **Badge « À domicile »** (`/p/[slug]`) : visible si `home_service_enabled`. Pill couleur `primary_color` du merchant, icône `Home` Lucide, texte « À domicile · jusqu'à X km » (si rayon configuré) ou simplement « À domicile » (si NULL). Cohabite avec le pill « Y aller » (cas adresse visible) ou le remplace fonctionnellement (cas adresse masquée — la cliente n'a aucun lieu où aller, le badge signale qu'on vient à elle). Clés i18n `programmeView.homeServiceBadge` / `homeServiceBadgeWithRadius`.
- **Booking** (`/api/planning/book`) :
  - Schéma Zod accepte `customer_address`, `customer_lat`, `customer_lng` (optionnels, requis si `home_service_enabled`)
  - Recheck travel-time anti-race avant l'INSERT
  - Persiste `customer_address`, `customer_lat/lng`, `travel_time_minutes` (calculé) sur le slot
  - Après INSERT, appelle `recomputeDayTravel(merchantId, date)` — un nouveau RDV inséré entre deux existants change le prédécesseur du suivant
  - Réponse JSON : `is_new_customer: boolean` (utilisé par BookingModal pour gating le badge "carte de fidélité prête")
- **Recompute** (`src/lib/travel-recompute.ts`) :
  - Une seule fonction `recomputeDayTravel(merchantId, date)` — recalcule tous les slots de la journée en parallèle (Promise.all sur fetch + sur update)
  - Respecte `travel_time_overridden = true` (override manuel jamais réécrasé)
  - Hooks : POST book, PATCH cancel (client_name → null), DELETE slots (par date affectée), POST shift-slot (sur source date + target date)
- **Move (déplacement) — mig 136** : la fonction RPC `move_booking` transfère désormais les 5 champs home-service (`customer_address`, `customer_lat/lng`, `travel_time_minutes`, `travel_time_overridden`) vers la cible et les reset sur la source. Sans ça (mig 091 originale) l'adresse restait orpheline sur le slot vidé et la cible perdait toute info.
- **Move (déplacement) — mig 151** : `move_booking` étendue pour transférer/reset aussi les 4 champs presta sur mesure (`custom_service_name/duration/price/color`, mig 130). Avant, déplacer un RDV avec presta custom laissait la presta orpheline sur l'ancien créneau et la cible la perdait. Idem côté `customer-edit/route.ts` (free mode INSERT, slot mode fallback clear+fill, DELETE slot mode clear) — tous les chemins de move/cancel propagent maintenant les 4 colonnes.
- **Cancel (annulation)** : PATCH avec `client_name: null` reset les 5 champs home-service en plus des champs de réservation classiques (defense in depth — vraie utilité limitée car fillers existent uniquement en mode `slots`).
- **Affichage planning** (DayView + WeekView) : bande visuelle juste au-dessus de chaque RDV, hauteur proportionnelle au `travel_time_minutes`, **couleur dérivée de la couleur de prestation** (tint léger ~15% opacité + bordure dashed à ~33% opacité — continuité visuelle, pas de rupture). Texte adaptatif : icône `Car` dès 14px de haut, label "Trajet X min" à partir de 24px, sinon juste la bande colorée. Title HTML toujours présent pour tooltip.
- **Modale BookingDetails** : nouvelle carte sky bleue quand `customer_address` présent — affiche adresse complète + bouton "Itinéraire" (Google Maps avec `&origin=` cliente précédente ou marchand pour le 1er RDV, `&destination=` cliente actuelle), durée trajet entrant, **heure de départ conseillée** (= start - travelIn), trajet vers la cliente suivante (depuis le `travel_time_minutes` du slot suivant).
- **BookingModal vitrine** : étape `address` insérée entre `services` et `datetime` quand `home_service_enabled`. Indicateur de progression : 4 dots au lieu de 3. Validation : coords requises (sélection dans l'autocomplete BAN, pas juste tape libre). Récap final affiche l'adresse. Intro personnalisée avec `{shopName}` ("Lux'beauty by Laila intervient à domicile...").
- **Push notification merchant** enrichie en mode home_service : ajoute `📍 {address}` + `🚗 {travelIn} min trajet · départ conseillé HH:MM`.
- **Email confirmation merchant** (`BookingNotificationEmail`) : section ambrée "🏠 Service à domicile" avec adresse + trajet + heure de départ conseillée, juste avant l'éventuel bloc acompte.
- **Manuel booking dashboard** (avril 2026) : champ adresse cliente disponible dans les 2 flows quand `home_service_enabled`. **Mode libre** — `AddressAutocomplete` en step 1 du wizard manuel (entre Créneau et Conflict), optionnel. **Mode créneaux + édition** — la carte sky du `BookingDetailsModal` est désormais éditable (display par défaut + bouton `[✎ Modifier l'adresse]` stacké au-dessus de `[📍 Itinéraire]`). Bouton "Itinéraire" pointe vers l'adresse en cours d'édition (fallback adresse sauvée). API `/api/planning/manual-booking` + PATCH `/api/planning` acceptent `customer_address`/`customer_lat`/`customer_lng` avec **gate `home_service_enabled` côté serveur** (defense in depth, lookup dédié dans le PATCH). Texte sans coords accepté (persiste l'adresse texte sans calcul de trajet). `recomputeDayTravel` déclenché uniquement si coords présentes. **Carte sky collapsible** : header cliquable (chevron animé), défaut expanded quand `!customer_address || !travel_time_minutes` (action requise), défaut collapsed sinon (résumé adresse + heure de départ visible en glance). Override durée trajet **abandonné v1** (override sticky sans UX claire pour revenir à l'auto = risque oubli, recompute respecte `travel_time_overridden=true` indéfiniment).

### Bons cadeaux (mig 138-146)

- **But** : permettre à un visiteur d'offrir un bon cadeau à un proche depuis la vitrine `/p/[slug]` du salon. Pas d'intégration paiement Qarte (cohérent 0% commission) — l'offreur paie le merchant via lien externe (Revolut/PayPal/Stripe…) déjà configuré dans Planning > Réservation en ligne. Le merchant valide manuellement la réception du paiement, ce qui déclenche : création carte fidélité destinataire + voucher (source=`gift`, expire 12 mois) + SMS au destinataire + emails (offreur + destinataire si email fourni). Au moment où le destinataire utilise le voucher (flow standard `vouchers/use` existant), SMS systématique à l'offreur.
- **Toggle merchant** : `merchants.gift_card_enabled` configuré dans `/dashboard/program > Avantages` (ExtrasSection, juste après duo offer). Permet aussi de fixer `gift_card_amounts` (JSONB array, défaut `[30, 50, 80, 100]`) et `gift_card_message` (mot d'introduction sur la modal vitrine, max 300 chars).
- **Vitrine** : section gradient merchant entre les promos et la carte fidélité simulée. Modal 4 étapes (montant > destinataire > offreur > récap) avec dot-progress, design soigné couleurs merchant. À l'étape 4 : preview Apple Wallet style avec montant en grand. À submit : appel `POST /api/gift-cards/request`, écran succès avec instructions paiement (référence GIFT-XXXXXX à mettre en commentaire de virement).
- **Dashboard** :
  - Page dédiée `/dashboard/gift-cards` accessible depuis sidebar desktop + Plus mobile (icône Gift fuchsia). 4 onglets : À valider (pending_payment, badge rouge urgent), Actifs, Consommés, Annulés. Chaque ligne = carte avec montant + référence + offreur/destinataire (tel + email cliquables) + dates clés + status pill colorée + actions Marquer payé/Annuler pour les pending.
  - Widget `PendingGiftCardsWidget` sur dashboard accueil (juste après `AttendanceCheckPrompt`) : visible uniquement si `gift_card_enabled` ET au moins 1 bon en attente. Card gradient rose-fuchsia-violet avec count, déclenche urgence merchant.
  - Modal de confirmation paiement : reprend le code `GIFT-XXXXXX` et le montant pour vérification visuelle avant émission du voucher.
- **Stack** :
  - DB : table `gift_cards` (mig 138) + 3 colonnes `merchants` (`gift_card_enabled`, `gift_card_amounts JSONB`, `gift_card_message`) + extension `vouchers.source` CHECK avec `'gift'`. Index composé `(merchant_id, status, created_at DESC)` + index dédié `voucher_id` (lookup pour SMS offreur quand consommé) + index partiel `created_at WHERE status='pending_payment'` (cron auto-cancel)
  - Lib : `src/lib/gift-cards.ts` — helpers `generateGiftCardCode()` (suffix 6 chars sans 0/O/I/1/L pour éviter confusions, retry 5× sur collision DB), `computeGiftCardExpiry()` (12 mois), `parseGiftCardAmounts()`, `merchantHasPaymentLink()`, constantes `GIFT_CARD_MIN_AMOUNT = 5`, `GIFT_CARD_MAX_AMOUNT = 1000`, `GIFT_CARD_AUTO_CANCEL_DAYS = 3`, `GIFT_CARD_EXPIRY_MONTHS = 12`
  - API : 4 routes séparées (un endpoint = un fichier) — `POST /api/gift-cards/request` (public vitrine, rate-limited 3/h par IP, banned check sender + recipient, génère code, insert en `pending_payment`, fire-and-forget email offreur + email merchant + push merchant), `GET /api/gift-cards?merchantId=&status=` (merchant auth, retourne liste + counts par status), `POST /api/gift-cards/[id]/confirm-payment` (merchant valide paiement reçu : crée customer destinataire + loyalty_card + voucher source=`gift` + update gift_card en `active`, fire-and-forget SMS destinataire + emails), `POST /api/gift-cards/[id]/cancel` (merchant annule pending_payment uniquement)
  - SMS (mig 139, types ajoutés au CHECK `sms_logs.sms_type`) : `gift_card_received` envoyé au destinataire à la confirmation paiement, `gift_card_used` envoyé à l'offreur quand le destinataire consomme (hook fire-and-forget dans `/api/vouchers/use` qui détecte `source='gift'`, lookup gift_card via voucher_id, update son status à `used`, puis envoie SMS via `sendBookingSms` avec nouveaux paramètres `giftSenderName`/`giftRecipientName`/`giftAmount`)
  - Emails (4 templates React Email, design Apple Wallet style avec gradient merchant pour le destinataire) :
    - `GiftCardOrderConfirmationEmail` — offreur juste après commande, avec liens paiement merchant (Revolut/PayPal détectés via `detectPaymentProvider`) + référence GIFT-XXXXXX en gros + 3 étapes "What happens next"
    - `GiftCardActivatedEmail` — offreur quand merchant valide le paiement, "ton cadeau est parti"
    - `GiftCardReceivedEmail` — destinataire (optionnel si email fourni), carte gradient `${primaryColor}→${secondaryColor}` avec montant + nom merchant + nom offreur, mot perso encadré violet, CTA vers `/customer/card/[merchantId]`
    - `GiftCardMerchantNotificationEmail` — merchant à la commande, détails offreur/destinataire + référence à attendre + 3 étapes action
  - Cron horaire `/api/cron/gift-cards-expire` (vercel.json : `0 * * * *`) — auto-cancel les `pending_payment` > 3j (`cancellation_reason='auto_expired_3d'`). Lag max 1h.
- **Flow complet** :
  1. Visiteur vitrine → ouvre modal → 4 étapes → submit `POST /api/gift-cards/request`
  2. Insert `pending_payment` + emails (offreur + merchant) + push merchant
  3. Offreur reçoit email avec lien paiement + référence à mettre en commentaire
  4. Offreur paie via Revolut/PayPal/Stripe… (hors-Qarte)
  5. Merchant voit le widget urgent sur le dashboard accueil → ouvre `/dashboard/gift-cards` → onglet À valider → "Marquer payé"
  6. Cascade : crée customer destinataire + loyalty_card + voucher source=`gift` (expires 12 mois) + status `active` + SMS destinataire + email destinataire (si email) + email confirmation offreur
  7. Destinataire reçoit SMS → arrive en salon → merchant scan QR ou ouvre fiche client → onglet Récompenses → consomme le voucher (flow standard existant)
  8. `/api/vouchers/use` détecte `source='gift'` → lookup gift_card via voucher_id → update gift_card status `used` + SMS offreur "X vient d'utiliser ton cadeau"
- **Pas de remboursement automatique** : Qarte ne gère pas les paiements donc pas de remboursement. Si annulation merchant après paiement reçu, à lui de rembourser hors-Qarte (texte explicite dans le dialog d'annulation).
- **Anti-spam** : rate limit strict 3/h par IP (declenche email + push merchant), banned numbers check (offreur ET destinataire), gate `gift_card_enabled` côté serveur, gate `merchantHasPaymentLink` (pas de bon possible sans lien paiement configuré), gate `getTrialStatus().isTrialExpired` (suspension trial expiré).

#### V2 (mig 140-144) — bons services + PDF + scheduling + image
- **Mode services** (mig 140) : `gift_cards.kind = 'amount' | 'services'`. L'offreur peut offrir des prestations spécifiques (au lieu d'un montant). `service_ids[]` + `service_snapshot JSONB` (fallback si presta supprimée). `formatGiftCardServicesLabel()` génère le label ("1 brushing + 1 soin").
- **PDF imprimable** (mig 141) : `gift_cards.pdf_url` — rendu Satori (template A6 paysage hammam) uploadé bucket `gift-cards-pdf`. `sender_last_name`/`recipient_last_name` optionnels.
- **Envoi différé** (mig 142) : `scheduled_send_at` — l'offreur peut programmer l'envoi destinataire (anniv, Noël). Cron `gift-cards-deliver` (`/api/cron/gift-cards-deliver`) envoie SMS+email à échéance, marque `notified_at` (anti-double).
- **Image embarquée emails** (mig 143) : `gift_cards.image_url` — PNG du bon (rendu Satori partagé avec le PDF), affiché dans email destinataire ET email offreur. Bucket `gift-cards-pdf` accepte `image/png`. `renderAndUploadGiftCardAssets()` génère PDF+PNG en 1 appel.

#### V3 polish (mig 145-146) — validité personnalisable + détection booking + rappel expiration
- **Validité personnalisable** (mig 145) : `merchants.gift_card_expiry_months SMALLINT 1-24, défaut 3`. UI dashboard segment 3/6/12 mois. `computeGiftCardExpiry(paidAt, months)` propagé partout. Vitrine GiftCardModal lit la valeur via prop pour i18n dynamique.
- **Détection bon cadeau au booking** : `/api/member-cards/lookup` étendu, retourne `giftCards: { count, total_amount, has_services, has_amount }`. BookingModal skip-deposit auto si bon actif + bannière verte (3 messages contextuels selon kind/count) + mention "valable en 1 fois · non remboursable".
- **+1 tampon à la conso** : `/api/vouchers/use` retire le skip same-day pour `source='gift'` — la cliente garde son bonus tampon même si elle a scanné le QR le jour même (geste "extra" du bon cadeau).
- **Mention non remboursable partout** : PDF (footer), email destinataire (ligne Usage), modal Voir carte fidélité (bandeau ambre), modal vitrine pré-achat (sous validityNote — légalement important).
- **Rappel SMS J-7** (mig 146) : `gift_cards.expiry_reminder_sent_at TIMESTAMPTZ` + index partiel `(expires_at) WHERE status='active' AND expiry_reminder_sent_at IS NULL`. Cron `gift-cards-expire` étendu : passe 0 = SELECT bons actifs expirant dans ≤7j sans rappel envoyé, `Promise.allSettled` pour batch SMS, batch single UPDATE après. Nouveau SmsType `gift_card_expiry_reminder` (FR/EN, GSM-7 safe).
- **Vitrine refactor** : Welcome (emerald) + Promo (amber) initialement unifiés via `<OfferCard>` component. Mai 2026 : composant supprimé après refonte custom des banners promo + concours (layout flex avec valeur hero à droite en `primary_color` merchant — `-X%` pour promo, `J-X` pour concours). Bon cadeau "offrir" déplacé après Avantages exclusifs (intent différent — pour quelqu'un d'autre).
- **Modals consommation** : Detail "Voir" et Celebration adaptés pour `source='gift'` (titre "Votre bon cadeau ✨" / "Bon cadeau activé 🎁", icône Sparkles décoratif animé, copy chaleureux "C'est officiel, votre bon a été utilisé chez {salon}").
- **Carte fidélité** : `voucher.source='gift'` affiche maintenant "Bon cadeau" au lieu de "Récompense" (clé i18n `voucherRewards.giftCard`).

### Clients fideles (ex Programmes Membres, mig 018 + 109)
- Programmes de fidelite avances : nom, duree (jours/semaines/mois), avantages configurables
- **Avantage texte libre** : `benefit_label` — affiche sur la carte client ("Brushing offert", "Acces prioritaire")
- **Reduction** : `discount_percent` (pills 5/10/15/20%) — appliquee automatiquement a la reservation en ligne
- **Exemption acompte** : `skip_deposit` — le client fidele ne paie pas d'acompte, booking confirme immediatement (deposit=null dans la reponse API)
- **Detection automatique** : au booking, lookup par telephone via `GET /api/member-cards/lookup` (debounce 500ms, AbortController) → banner indigo "Bienvenue, client fidele" avec avantages listes
- **Application serveur** : `POST /api/planning/book` applique la reduction au prix total et skip le depot si applicable (source de verite)
- **Modal creation compact** : nom + pills rapides, duree inline (pills+input), section "Avantages" separee (reduction pills, acompte toggle avec hint, avantage texte libre avec hint), responsive mobile
- Design dashboard : violet/indigo (coherent avec le reste, plus d'amber)
- Tables `member_programs` + `member_cards`
- Dashboard `/dashboard/members` accessible via bouton "Clients fideles" dans `/dashboard/customers`
- **Page `/dashboard/customers`** : header purple-tint avec titre + compteur total, liens secondaires `Clients fideles` + `Jeu concours` (amber outline). **2 StatsCards fidelite** sous le header : `Passages` (UserCheck emerald, total `visits` merchant) + `Recompenses debloquees` (Gift rose, total `redemptions` merchant) — count queries `head: true` paralleles dans `fetchData`. Search bar (bg-blanc, X clear) + bouton `Filtrer` + CTA `Nouveau` (gradient indigo→violet) sur la meme ligne. Modal filtres groupes (`PlanningModal`-style mais inline) : **Statut** (Nouveaux 7j / Actifs 30j / Inactifs 60j+ / Proche recompense / Recompense prete / Anniv. ce mois — exclusif) + **Communication** (Notifiables) + **Avantages actifs** (Bienvenue / Promo). Filtre `Anniv. ce mois` utilise `customer.birth_month === new Date().getMonth() + 1`

---

## 6. Routes API

### Fidelite (mode visit)
- `POST /api/checkin` — Scan + visit + stamps (parallelise, cree customer+card). Rejette cagnotte.
- `POST /api/redeem` — Redeem (merchant auth). Rejette cagnotte.
- `POST /api/redeem-public` — Redeem (client auth cookie). Rejette cagnotte.

### Fidelite (mode cagnotte)
- `POST /api/cagnotte/checkin` — Scan + visit + stamps + montant. Rejette visit.
- `POST /api/cagnotte/redeem` — Redeem cashback (merchant auth). Rejette visit.
- `POST /api/cagnotte/redeem-public` — Redeem cashback (client auth cookie). Rejette visit.

### Commun aux deux modes
- `POST /api/adjust-points` — Ajustement stamps + amount_adjustment (cagnotte). Audit log dans `point_adjustments`.
- `PUT /api/visits/edit` — Modifier points/montant d'une visite. Audit log dans `point_adjustments`.
- `POST /api/rewards/cancel` — Annulation dernier redeem (gere les deux modes)
- `POST /api/visits/moderate` — Valider/rejeter quarantaine

### Clients
- `POST /api/customers/create` — Creer client + carte (merchant auth, dedup telephone)
- `POST /api/customers/register` — Inscription client
- `POST /api/customers/card` — Carte fidelite (auth cookie phone). Retourne visites, ajustements, redemptions, vouchers, member card + `upcomingAppointments` + `pastAppointments` (si planning_enabled, 7 queries paralleles)
- `POST /api/customers/cards` — Toutes les cartes (auth cookie, rate limit 10/min)
- `PUT /api/customers/update-name` — Modifier nom/prenom (merchant auth)

### Commercants
- `POST /api/merchants/create` — Creer merchant (idempotent, pre-remplit stamps_required)
- `GET /api/merchants/preview` — Donnees publiques
- `GET /api/merchant/stats` — Statistiques

### Parrainage
- `GET /api/referrals?code=` — Info code parrainage
- `POST /api/referrals` — Inscription filleul (cree customer + carte + voucher)
- `POST /api/vouchers/use` — Consommer voucher (helper partagé `completeReferralAfterReferredUse` extrait dans `src/lib/referral-completion.ts` qui crée le voucher parrain + push + SMS si filleul). Bonus +1 stamp sauf birthday et sauf si visite confirmee aujourd'hui (evite double stamp scan+voucher)
- `POST /api/referrals/[id]/validate` (mig 156) — Marque manuellement un voucher de parrainage utilisé depuis le dashboard (cliente sans téléphone, scan oublié). Body `{side: 'referred'\|'referrer', reason}` (raison min 3 chars stockée dans `vouchers.manual_validation_reason` + `manually_validated_by` pour audit). `side='referred'` réutilise le helper `completeReferralAfterReferredUse` → même pipeline que le scan client. Auth via `authorizeMerchant` après lookup referral.
- `POST /api/merchants/referral-config` — Config parrainage + offre nouveaux clients (merchant auth)

### Offre nouveaux clients
- `GET /api/welcome?code=` — Valider code welcome (public)
- `POST /api/welcome` — Inscription via offre nouveaux clients. Accepte les clients existants si `current_stamps === 0` et pas de voucher welcome/referral existant (ex: client cree via planning). Bloque si stamps > 0 ou voucher deja attribue.
- `POST /api/vouchers/grant` — Attribution manuelle voucher welcome/promo (merchant auth). Verification stamps + doublons. `PATCH` = consommer, `DELETE` = retirer, `GET` = lister vouchers client
- Offre nouveaux clients : eligible si nouveau client OU client existant avec 0 tampons et sans voucher welcome/referral

### Push & Marketing (Client)
- `POST /api/push/subscribe` — Abonnement push client (auth cookie phone)
- `DELETE /api/push/subscribe` — Desabonnement push client (auth cookie phone + ownership)
- `POST /api/push/send` — Envoi notification aux clients (rate limit 10/h par IP)
- `GET /api/offers` — Offres promo

### Push Merchant (PWA Pro)
- `POST /api/merchant-push/subscribe` — Abonnement push merchant (auth Supabase JWT)
- `DELETE /api/merchant-push/subscribe` — Desabonnement push merchant
- Helper `sendMerchantPush()` dans `src/lib/merchant-push.ts` — fire-and-forget, dedup via `merchant_push_logs`
- **Triggers temps reel** : nouvelle resa en ligne (dans `POST /api/planning/book`), anniversaires clients (cron morning)
- **Triggers cron** : rappels essai (J+5, J+7, J+8 grace) — morning-push cron
- **Push onboarding** (PWA only, `pwa_installed_at` non null) : config J+1/J+2, vitrine J+3, planning J+4, QR pret, no scans, premier scan, inactif J+7 — greffes dans les sections email existantes
- **Emails onboarding supplementaires** : vitrine J+3 (tracking -304), planning J+4 (tracking -308) — via `runStandardEmailSection`
- **Architecture** : table separee `merchant_push_subscriptions` (auth JWT, pas cookie phone), meme service worker `sw.js`, meme VAPID keys
- **Prompt activation** : banner dans le layout dashboard, uniquement en mode standalone PWA (pas desktop). **Carte "Notifications" permanente** en haut de l'onglet Paramètres planning (full-width) avec badge "Actives" + bouton Activer + messages contextuels (iOS non-PWA, permission refusée, conseil désinstall/réinstall si endpoint révoqué)
- **Verification abonnement reel** : `useMerchantPushNotifications` verifie au montage `pushManager.getSubscription()` (pas localStorage seul) — corrige le cas ou iOS revoque l'endpoint apres inactivite, le hook se resynchronise avec la realite serveur. **Parcourt TOUTES les registrations** (`getRegistrations()`) et non un lookup scope `getRegistration('/dashboard')` : ce dernier renvoyait `undefined` en PWA standalone iOS meme abonnement present (scope reel unifie sur `/`) -> le bandeau "Activer les notifs" revenait a chaque ouverture
- **SW controller workaround** : `sw.js` n'appelle plus `clients.claim()` (causait crash React removeChild sur personalize mobile). Pour eviter le "Registration failed - push service error" sur Chrome Android / iOS PWA quand le SW vient d'etre installe, on detecte `navigator.serviceWorker.controller === null` apres `serviceWorker.ready` et **reload la page une fois** (flag sessionStorage anti-loop, cleared apres subscribe reussi). Applique aux DEUX flux : `subscribeToPush()` (client, flag `qarte_push_sw_reload`) **et** `useMerchantPushNotifications.subscribe()` (merchant, flag `qarte_merchant_push_sw_reload`) — ce dernier l'avait perdu, d'ou l'abonnement merchant qui echouait en silence au 1er essai et le bandeau qui revenait sans cesse
- **Pas de toggles** : toutes les notifs actives par defaut pour tout merchant abonne au push

### SMS (OVH Cloud + SMS Partner)
> **Pour l'architecture complete (marketing + packs + automatisations + dispatch providers + rollback) voir `docs/sms-system.md`.**

- **Deux providers cohabitent** depuis avril 2026 :
  - **OVH** — marketing tous pays + transactionnel CH ([`src/lib/ovh-sms.ts`](../src/lib/ovh-sms.ts), signature HMAC-SHA1)
  - **SMS Partner** — transactionnel FR/BE uniquement ([`src/lib/sms-partner.ts`](../src/lib/sms-partner.ts), API key body)
  - **Routage** automatique via `selectTransactionalProvider(phone)` dans [`sms.ts`](../src/lib/sms.ts), basé sur `detectPhoneCountry()` (préfixe E.164)
  - **Feature flag** `SMS_PARTNER_ENABLED=true` — à `false` ou absent, tout repart sur OVH (rollback instantané via redeploy Vercel)
  - **Tracé** : colonne `sms_logs.provider` (`'ovh' | 'sms_partner'`, default `'ovh'`, mig 129)
  - **Quota agrégé** : `getSmsUsageThisMonth()` ne filtre jamais par provider — 1 SMS = 1 unité de quota peu importe le fournisseur
- **Service** : `src/lib/sms.ts` — dedup via `sms_logs`, quota 100 SMS/cycle + pack (pas d'overage, blocage a 0), templates FR/EN < 160 chars
- **Reserve aux abonnes actifs** (pas trial) — message CTA dans dashboard + planning settings
- **Bonus SMS engagement** (avril 2026 + maj mai 2026 pour 6 mois) : Tout-en-un mensuel = 100 SMS/mois, **6 mois = 110**, **annuel = 120**. Source : `getSmsQuotaFor(tier, interval, isLegacy)` + `getEngagementSmsBonus(merchant)` dans `src/lib/plan-tiers.ts` (lookup `ENGAGEMENT_BONUS = { monthly: 0, semestrial: 10, annual: 20 }`). Quota effectif appliqué automatiquement par `getPlanFeatures()` (calcul transparent — checkin/marketing/usage tous alignés). Constants `ALL_IN_MONTHLY_QUOTA = 100` / `ALL_IN_SEMESTRIAL_QUOTA = 110` / `ALL_IN_ANNUAL_QUOTA = 120`. Annual legacy (créés avant `PRICING_SPLIT_DATE = 2026-04-05`, tarif 19€/180€) restent à 100 — leur tarif historique prime. Trial reste à 100 (les SMS sont de toute façon gatés par `PAID_STATUSES`). Webhook `customer.subscription.updated` sync `billing_interval` côté DB en lisant `interval` + `interval_count` (interval=month + interval_count=6 → `'semestrial'`). Prorata `change-tier` calcule le quota override selon l'engagement courant.
- **Sanitize GSM-7 catch-all** ([`src/lib/sms-sanitize.ts`](../src/lib/sms-sanitize.ts), nov 2026) : helper `sanitizeSmsForGsm7()` remplace €/£/$ par EUR/GBP/USD avant envoi. **Appliqué dans les 2 providers bas niveau** (`ovh-sms.ts` + `sms-partner.ts`) plutôt qu'au wrapper, pour catch-all TOUS les call sites (sendBookingSms, sendMarketingSms, sms-trial-marketing, /api/admin/test-sms, futurs callers). Couvre les vulnérabilités où du texte libre merchant (`birthday_gift_description`, `referral_reward_referrer`, marketing body free-form) pouvait laisser passer le symbole euro et finir transmis comme "?" sur certains carriers. `sms_logs.message_body` conserve l'original (debug : voit ce que le système a tenté vs ce qui est parti).
- **Robustesse SMS transactionnels** (mig 162, mai 2026) : refonte `sendBookingSms` avec fallback intelligent ([sms.ts:sendWithIntelligentFallback](../src/lib/sms.ts)). Sur timeout SMS Partner, **pas de fallback OVH immédiat** (cause de doublons en at-least-once retry) → status `pending_verify` + attente du DLR webhook (`/api/sms-partner/dlr` auth secret query, mig 162) pendant 10min. Si DLR `delivered` → marqué `sent`. Si `not delivered` → fallback OVH inline. Si pas de DLR → cron `sms-verify` (toutes 10min) backstop. Cron `sms-batch-audit` à 19h30 UTC vérifie chaque slot demain a un `reminder_j1` valide, re-envoie défensivement les manquants — **garde-fou** `sms_evening_last_run_at` < 6h pour éviter trigger prématuré (incident 2026-05-08 où trigger manuel à 8h UTC a re-envoyé 9 rappels 11h trop tôt). Numéros confirmés invalides 2 fois sur 2 providers ajoutés à `sms_phone_blacklist` (skip à la source, cache LRU 1000 entries). 8 classes d'erreur ([sms-error-classifier.ts](../src/lib/sms-error-classifier.ts)) : invalid_phone/no_credit/rate_limit/timeout/server_error/config_error décident du fallback. Fix critique extraction `errors[0].code` per-numéro chez SMS Partner (top-level `code` vague vs per-numéro précis, ex code 9 mobile invalide). Alertes admin email `sales@getqarte.com` via `notifySmsAdmin()` ([sms-admin-alerts.ts](../src/lib/sms-admin-alerts.ts)) sur config_error (30min dedup) / no_credit (6h) / batch_audit_high_miss (24h). Marketing campagnes + trial marketing **inchangés** : OVH only, pas de fallback. Env var nouvelle : `SMS_PARTNER_DLR_SECRET` (généré + ajouté Vercel ; passé à chaque `urlDlr` de POST `/v1/send`).
- **16 types de SMS** (migrations 092, 112, 113, 139, 146) :
  - `reminder_j1` — rappel la veille a 19h (cron evening, toggle `reminder_j1_enabled` default true, gate `planning_enabled`)
  - `reminder_j0` — rappel le matin meme H-3, plancher 7h local (cron sms-hourly, toggle `reminder_j0_enabled`, gate `planning_enabled`)
  - **Rappels (j1/j0) — exclusion des résas non confirmées** : les 3 requêtes de rappel (evening, sms-hourly, sms-batch-audit) filtrent `.not('deposit_confirmed','is',false)` → une cliente dont l'acompte n'est pas payé (résa en attente) ne reçoit PAS de rappel ; dès confirmation (ou sans acompte) le rappel repart. Même exclusion ajoutée au tirage `monthly-contest` (une résa impayée ne participe pas et ne peut pas gagner)
  - **Crons & merchants soft-deletés** : les prefetch merchant des crons d'envoi (morning-jobs, sms-hourly, evening, weekly-recap, morning-push, monthly-contest) filtrent `.is('deleted_at', null)` — un compte supprimé (soft-delete) ne déclenche plus de notif client/merchant même si son `subscription_status` n'a pas changé (cohérent avec `sendPastDueSms` + les routes publiques)
  - **Refus d'une résa en attente (widget Acomptes en attente)** : `DELETE /api/planning` accepte `notifySms` ; le refus envoie un SMS `booking_cancelled` à la cliente **uniquement si le toggle SMS est activé** (composant `SmsToggle`, gaté `isPaid`, même UX que l'acceptation). Sans toggle, suppression silencieuse
  - `confirmation_no_deposit` / `confirmation_deposit` / `booking_moved` / `booking_cancelled` — opt-in dans modaux planning
  - `deposit_reminder` — rappel acompte J-7 d'un RDV de suivi (mig 177, cron `morning-jobs`, même wording que `deposit_request` ; dédup naturelle par slot)
  - `birthday` — voeux + cadeau anniversaire (cron morning-jobs)
  - `referral_reward` — notification parrain quand le filleul utilise sa recompense (toggle `referral_reward_sms_enabled` default ON, gate `referral_program_enabled`, opt-out respecte)
  - `campaign` — campagne SMS marketing manuelle (cron sms-campaigns-dispatch */15min, moderation admin)
  - `welcome` — SMS bienvenue H+1 apres 1er scan (toggle `welcome_sms_enabled`)
  - `review_request` — merci + avis Google H+2 (toggle `post_visit_review_enabled`, gate `review_link` defini)
  - `voucher_expiry` — cadeau expire J-7 (toggle `voucher_expiry_sms_enabled`)
  - `referral_invite` — invitation parrainage apres 5 visites (toggle `referral_invite_sms_enabled`, gate `referral_program_enabled`)
  - `inactive_reminder` — relance client inactif 30-45j, dedup 60j (toggle `inactive_sms_enabled`)
  - `near_reward` — plus qu'un tampon avant la recompense (palier 1 ou 2), dedup 90j, derniere visite ≥15j (toggle `near_reward_sms_enabled`, gate `reward_description`)
- **Toggles SMS merchant** : 4 toggles opt-in dans les modaux planning (confirmation nouveau RDV, validation acompte, deplacement, annulation). Design harmonise : bandeau cliquable + toggle switch. Desactive par defaut. En trial : grise + badge "Pro". Visible uniquement si le slot a un numero de telephone. Aucun auto-envoi — toujours opt-in.
- **Compteur SMS** : visible dans dashboard principal + planning parametres (barre de progression), cycle aligne sur la date d'abonnement Stripe (`billing_period_start`). **Warning visuel adouci si pack > 0** : la jauge `SmsBalancePanel` ne passe en ambre que si le quota plan est >=80% **ET** packBalance==0 (sinon le pack prend le relais en silence). Idem côté push/email : alertes 80%/90% **skip** si pack > 0 ; alerte 100% envoyée avec message « On bascule sur ton pack SMS de N » au lieu du message bloqué.
- **Composant `SmsQuotaGauge`** (`src/components/dashboard/SmsQuotaGauge.tsx`) — jauge partagée entre planning settings et dashboard accueil (panneau `SmsRecent` étendu). 3 états visuels : **OK** (vert + hint pack), **quota épuisé + pack > 0** (ambre + ligne « il te reste N SMS sur ton pack »), **quota épuisé + pack 0** (rouge + message bloquant). Source unique pour éviter divergence entre les 2 surfaces.
- **Packs SMS** : 5 tailles (50/100/150/200/250) avec prix TTC envoyés direct à Stripe (pas de `automatic_tax`, suite `not_collecting` Stripe Tax sans tax registration France) : 6,90€ / 10,20€ / 14,70€ / 19,20€ / 23,70€. **Bonus +10% gratuit à partir de 150** (+15/+20/+25 SMS), géré côté code via `getCreditedSmsCount(packSize)` dans le webhook `credit_sms_pack`. Single source of truth : `src/lib/sms-pack-pricing.ts` (PACK_TTC_CENTS, BONUS_SMS_BY_SIZE, PROCESSING_FEE_TTC_CENTS, VAT_RATE) — importé par checkout, webhook et BuyPackModal. UI BuyPackModal : badge vert « 🎁 +X offerts » en exergue à côté du nom du pack + encart confirmation « Tu repars avec N SMS au total ». Email confirmation pack : variantes `headingWithBonus`/`introWithBonus` quand bonus > 0.
- **Booking modal client** : pas de SMS a la reservation sans acompte (rappel J-1 suffit). Hint "un SMS de rappel vous sera envoye la veille".
- **Landing** : SMS mis en avant dans Hero (badge), FeaturesGrid, PageProSection (bloc dedie avec visual 2 SMS), Pricing, FAQ (Q4+Q12). **Bonus 6 mois +10 visible** : sur le toggle Mensuel/6 mois de `PricingSection` (ligne SMS dynamique `100 ... · +10 sur 6 mois` ou `110 ... · un mois offert` via `t.rich` + balise `<accent>`), `PricingSectionCondensed` (`100 SMS marketing/mois inclus — 110 sur 6 mois`), FAQ pricing a12, comparatif Planity (`planityOpt2Feat2`), table compare (`smsQarte`). Email `SubscriptionConfirmedEmail` interpole `{smsQuota}` dans `introAllIn` (FR + EN) selon ce que le webhook calcule. PlanCard + PaidStatusCard typent `features` en `ReactNode[]` pour permettre le rich text. Annuel +20 conservé pour les abonnés legacy (affichage `featureSmsAnnual`).
- **Admin** : `/admin/sms` unifie avec 2 onglets (Apercu : metriques + breakdown par merchant cycle ; Moderation : liste campagnes pending + approve/reject avec badge count). Fusion des anciennes pages `/admin/sms` + `/admin/sms-review`. **`/admin/merchants/[id]` section SMS étoffée** : ligne « Alertes envoyées ce cycle » (80%/90%/100% colorés ambre/orange/rouge si ✓) + tableau « Historique des packs (N) » (date · pack_size · TTC · status `paid`/`pending`/`failed`/`refunded` coloré via `PACK_STATUS_COLORS` map, 20 derniers, scrollable). Endpoint API enrichi avec `smsPackHistory` (batché dans `Promise.all` initial) + `smsAlerts: { alert80, alert90, alert100 }` (true si `sms_alert_X_sent_cycle === cycle courant`).
- **Admin activite** : badges "Acompte en attente" / "Acompte OK" sur les reservations
- **Env vars OVH** : `OVH_APP_KEY`, `OVH_APP_SECRET`, `OVH_CONSUMER_KEY`, `OVH_SMS_SERVICE`, `OVH_SMS_SENDER`
- **Env vars SMS Partner** : `SMS_PARTNER_API_KEY`, `SMS_PARTNER_SENDER` (default "Qarte"), `SMS_PARTNER_ENABLED` ("true" pour activer le routage transactionnel FR/BE), `SMS_PARTNER_SANDBOX` ("true" en dev = pas d'envoi réel)
- **Sender** : "Qarte" sur les deux providers (en attente validation OVH, fallback numero court via `senderForResponse` ; SMS Partner accepte 3-11 chars sans spéciaux)
- **Migrations** : 092 (sms_logs + app_config), 093 (birthday + referral types), 094 (booking_moved + booking_cancelled), **112 (chantier SMS marketing complet — packs, campagnes, opt-outs, 14 types, RPC `credit_sms_pack`)**, **113 (near_reward)**, **129 (colonne `provider` pour distinguer OVH vs SMS Partner, default 'ovh', additive non-destructive)**

### Stripe
- `POST /api/stripe/checkout` — Session paiement (verifie customer Stripe)
- `POST /api/stripe/webhook` — 5 events (checkout.completed, sub.updated, sub.deleted, invoice.failed, invoice.succeeded)
- `POST /api/stripe/portal` — Portail client Stripe
- `GET /api/stripe/payment-method` — Methode de paiement active + **subscription price** (`unit_amount`, `currency`, `interval`) pour afficher le vrai tarif du merchant (gere grandfathered + tarifs negocies). Fetch parallele customer + subscriptions (limit:3 pour gerer churn-resub-churn), filtre statuses `active`/`trialing`/`past_due`

### Photos merchant
- `POST /api/photos` — Upload photo realisation (auth, magic bytes, max 6, compress client via `compressOfferImage`)
- `DELETE /api/photos` — Supprimer photo + fichier storage (auth, ownership)

### Prestations
- `GET /api/services?merchantId=` — Liste services **actifs** + categories (public). Champs: name, price, position, category_id, duration, description, price_from, image_url. `&archived=1` (owner only) → liste des prestations **archivées**
- **Photo prestation (facultative, mig 182)** : `merchant_services.image_url`. Vignette en tête de ligne + petit glyphe loupe → **agrandissement plein écran**. Composants partagés `src/components/shared/` : `ServiceThumbnail` (vignette 44px réutilisée vitrine + sélection résa) et `ImageLightbox` (lightbox une image, nav prev/next optionnelle → sert **aussi** la galerie réalisations de `ProgrammeView`, plus de lightbox dupliquée). Vitrine (`ProgrammeView`) + sélection de résa (`BookingModal`, tap agrandit sans cocher). Dashboard `ServicesSection` : tuile upload/remplacer/retirer par prestation (réutilise `compressServiceImage` + `POST /api/upload?folder=services` → PUT). Pas de photo → ligne texte normale. Nettoyage Storage au remplacement + suppression définitive
- `POST /api/services` — CRUD services et categories (merchant auth, type discrimine: 'service' | 'category'). Quota `MAX_SERVICES_PER_MERCHANT` compté sur les **actives**
- Services: duration (int, min, nullable), description (text, nullable), price_from (bool, "a partir de")
- **Archivage (mig 179)** : `DELETE /api/services` (presta) **archive** au lieu de supprimer si la presta est utilisée par un RDV (le lien `planning_slot_services` est `ON DELETE CASCADE` → un hard delete ferait perdre le nom de la presta sur le RDV ; durée/prix survivent car snapshotés sur le créneau). Hard delete uniquement si jamais réservée. Réponse `{archived: true|false}`. Les archivées sont masquées de la vitrine + de la sélection (booking manuel, bon cadeau client) mais **gardent leur nom dans l'historique des RDV** (jointures inchangées). PUT `type:'service_reactivate'` les remet sur la vitrine (refusé si quota actif atteint). UI `ServicesSection` : section repliable « Archivées » + bouton Réactiver, toasts distincts archive/suppression

### Planning
- `GET /api/planning?merchantId=&from=&to=` — Slots merchant (auth, join services avec noms+photos+result_photos+customer social) ou `&public=true` (dispo only, 30j). `&booked=true` filtre les creneaux reserves uniquement. `&customerId=` filtre par client
- `POST /api/planning` — Creation batch creneaux (max 20/requete, 200 actifs total)
- `PATCH /api/planning` — Marquer creneau pris/libre (client_name, phone, service_ids[], notes)
- `DELETE /api/planning` — Supprimer creneaux (batch slotIds, max 200/requete, client batch si plus)
- `POST /api/planning/copy-week` — Copier horaires d'une semaine vers une autre
- `POST/DELETE /api/planning/photos` — Upload/suppression photos inspiration (max 3/creneau, magic bytes, rate limit)
- `POST/DELETE /api/planning/result-photos` — Upload/suppression photos resultat (max 3/creneau, magic bytes, rate limit, helpers partages avec photos)
- `POST /api/planning/shift-slot` — Decaler un creneau (newTime + newDate optionnel pour deplacements inter-jours, verifie UNIQUE). Param `force?: boolean` : si `true` ET le slot source est booke → utilise la fonction Postgres atomique `move_booking()` (mig 091) qui transfere les champs booking + FKs (`planning_slot_services`, `planning_slot_photos`, `planning_slot_result_photos`, `customer_notes`) vers le slot cible. Source devient un slot libre dispo pour rebook, cible est reutilisee si existante vide ou creee si absente. Rejette les resas multi-creneaux (pas encore supporte). Bouton "Deplacer" dans `BookingDetailsModal` ouvre un overlay inline avec date picker + pills creneaux libres + input heure custom.
- `POST /api/planning/switch-mode` — Bascule `merchants.booking_mode` ('slots'|'free'). Si slots→free : purge atomiquement tous les creneaux primaires vides du merchant (toutes semaines confondues, `client_name IS NULL AND primary_slot_id IS NULL`) puis UPDATE `booking_mode` (+ `auto_booking_enabled=true` si free). Body `{ merchantId, targetMode }`. Renvoie `{ success, deletedCount, modeChanged }`. Auth + ownership obligatoire.
- `GET /api/planning/free-availability` — Map `{ 'YYYY-MM-DD': boolean, ... }` indiquant pour chaque jour de la fenetre s'il existe au moins 1 creneau libre. Mode libre uniquement, skip `home_service` (impossible sans coords cliente). Params `merchantId`, `from`, `to` (max 62j), `duration`. Rate limit 30/min. Utilise par : (1) calendrier vitrine BookingModal (dots vert/rouge sur chaque jour), (2) lien "Premiere dispo : mardi 14 mai" au-dessus du calendrier vitrine (fenetre today→today+30 independante du mois affiche), (3) overlay Deplacer dans dashboard BookingDetailsModal (suggestion prochain jour libre quand le jour cible est plein).

### Journal de suivi client
- `GET/POST/PATCH/DELETE /api/customer-notes` — CRUD notes client (auth merchant, Zod)
- Table `customer_notes` (mig 080) : content, note_type (string libre), pinned, slot_id optionnel
- Types predefinis (constantes exportees depuis `src/lib/note-styles.ts`) : `general`, `allergy`, `contraindication`, `preference`, `formula`, `observation` + tags custom. Helper `isCriticalNoteType()` pour `allergy`/`contraindication`
- Onglet "Journal" dans CustomerManagementModal (BookOpen icon teal)
- Allergies + contre-indications **auto-pinned** a la creation (visibilite critique) + bandeau rouge persistant en haut du modal sur tous les onglets
- Badge `AlertTriangle` rouge sur la liste clients pour les clients ayant une allergie/contre-indication
- Notes epinglees visibles comme "Memo client" dans BookingDetailsModal avant chaque RDV
- Photos resultat agglomerees depuis tous les RDV passes du client (`<img loading="lazy">`)
- Styles types partages via `src/lib/note-styles.ts` (`getTypeStyle`) qui consomme les tokens `ROLES` de `src/lib/customer-modal-styles.ts`

### Modal de gestion client (`CustomerManagementModal`)
- Modal flottant centre, hauteur fixe 640px desktop / `max-h-[calc(100vh-2rem)]`
- 4 onglets : Adjust (points/cagnotte) / Rewards (vouchers + redeem + offrir) / History / Journal
- Actions destructives (supprimer client, bannir numero) deplacees dans menu kebab `•••` du header (plus d'onglet "Danger") → modal overlay confirmation
- Single source of truth pour les notes : le shell fetch `/api/customer-notes`, derive le bandeau allergies, et passe `notes + refetchNotes` en prop a `CustomerJournalTab` (evite double fetch)
- Composant partage `<SectionHeader role label count />` dans `src/components/dashboard/customer-modal/SectionHeader.tsx` — utilise dans les 4 tabs pour une hierarchie visuelle uniforme
- Tokens couleurs centralises dans `src/lib/customer-modal-styles.ts` — 7 ROLES (primary/success/premium/warning/danger/neutral/birthday) avec champs `bg`/`bgSolid`/`bar`/`text`/`icon`/`solid`/`hoverBg`/`hoverBgSolid`/`hoverIcon` (full literal classes pour Tailwind JIT)
- AdjustTab : jauge dynamique avec preview live de l'ajustement (segment delta emerald/red superpose), labels `Palier 1` / `Palier 2` explicites, divider entre les 2 paliers. **Garde-fou clic-clic** : confirmation explicite (bandeau ambre + bouton "Confirmer") quand l'ajustement est significatif (negatif, ≥5 tampons ou ≥50€). Tampons clampes a [0, max] cote UI **et** API (jamais negatif).
- HistoryTab : groupement par bucket (`Aujourd'hui` / `Cette semaine` / `Ce mois` / `Plus ancien`), limite 5 items + bouton "Voir plus" (×2 a chaque clic). Toast `visitUpdated` apres edition d'un passage.
- RewardsTab : 3 sections (Bons actifs / Recompenses / Offrir) en grid 2 cols desktop, refetch via `loadVouchers()` apres grant (evite UUID synthetique fantome). **Confirm inline** sur "Consommer" et "Retirer" un bon — etat unifie via `confirmAction: { type: 'use' | 'remove'; id }` (un seul confirm a la fois, etat impossible elimine).
- Toasts coherents (via `showSuccess` interne, rendu en haut du tab) sur **toutes** les actions : edit nom (`nameUpdated`), edit anniv (`birthdayUpdated`), pin/unpin note (`notePinned`/`noteUnpinned`), edit visite (`visitUpdated`) — plus de save silencieux.

### Jeu concours mensuel
- `GET /api/contest?merchantId=` — Historique tirages (auth, 12 derniers)
- `PATCH /api/contest` — Sauvegarde config (contestEnabled, contestPrize fallback)
- `GET /api/contest/participants?merchantId=` — Nombre participants uniques du mois courant
- `GET /api/contest/analytics?merchantId=` — ROI : RDV mois courant vs moyenne 3 mois précédents (`{ currentMonthBookings, avgBaseline, boost, hasBaseline }`)
- `GET /api/contest/prizes?merchantId=` — Lots planifiés mois par mois
- `PUT /api/contest/prizes` — Upsert lot pour un mois donné (`{ merchantId, month, prize }`)
- `DELETE /api/contest/prizes` — Efface lot d'un mois (revient au fallback `merchants.contest_prize`)
- `GET /api/cron/monthly-contest` — Cron 1er du mois (`0 8 1 * *`, déclaré dans `vercel.json`) : tirage automatique. Lookup planned prize en bulk via `merchant_contest_prizes` → fallback `merchants.contest_prize`. **Participants** : tous les slots du mois précédent (par `slot_date`, donc date du RDV) avec `client_name NOT NULL` + `client_name != '__blocked__'` + `primary_slot_id IS NULL`, **online ET manuels** (plus de filtre `customer_id NOT NULL`). Dédup par téléphone (9 derniers chiffres) → `customer_id` → nom. Annulations auto-exclues (un slot annulé repasse `client_name = NULL`). Insert `merchant_contests` (`winner_customer_id` nullable pour un gagnant manuel), push + email merchant via template `ContestWinnerEmail`
- **Cron `morning-jobs` passe contestPrizeReminder** : si `contest_enabled=true` ET pas de lot pour mois courant (ni planifié, ni fallback) ET dans les 5 derniers jours du mois → push + email "Définis le lot avant le tirage". Idempotent via `merchants.contest_missing_prize_alerted_at` (max 1/mois)
- Page `/dashboard/contest` (refonte nov 2026) : palette violet→rose (DESIGN.md feature "fidélité extras"), hero gradient avec stats grid (countdown J-X, participants live, boost ROI), last winner showcase 30 jours post-tirage, carte "Lot du mois courant" + carte "Planifier les mois suivants" avec édition inline mois par mois, modal sober "Comment fonctionne le tirage" via icône `ℹ️` discrète (pas de bullets pédagogiques visibles à l'écran)

### Clients (social)
- `PATCH /api/customers/social` — MAJ liens sociaux (instagram_handle, tiktok_handle, facebook_url)

### Dashboard utilities
- `POST /api/dashboard/revalidate-merchant-page` — Force-revalide la vitrine `/[locale]/p/[slug]` après un save dashboard. Sans ça, l'ISR cache (`revalidate = 3600` dans `src/app/[locale]/p/[slug]/page.tsx`) sert du HTML obsolète jusqu'à 1h (ex. `hide_address_on_public_page` toggled mais adresse encore visible côté vitrine). Auth via `getUser()` + lookup merchant.slug. Appelé fire-and-forget après les saves dans `dashboard/planning/page.tsx` (handleSettingsSave) et `dashboard/public-page/InfoSection.tsx`. Idempotent : déclencher 2× n'a aucun effet de bord.

### Admin
- `/api/admin/merchants/[id]` — GET stats (25 queries paralleles : clients, visites, redemptions, referrals, services, photos, planning slots+bookings, **resas en ligne + manuelles (total, `booked_online` true/false)**, **resas en attente d'acompte**, push, vouchers, **gift_cards** snapshot, **merchant_contest_prizes** planifiés, **merchant_contests** historique tirages)/PATCH notes. Page detail (`/admin/merchants/[id]`) avec sections **collapsibles** (CollapsibleCard) : Programme de fidélité, Vitrine en ligne, **Jeu concours**, **Bons cadeaux**, Automatisations SMS, Emails envoyés. Stats compactes (CompactStat). Header : badge Plan tier ("All-in" violet/Crown vs "Fidélité" bleu/Star) à côté du statut abonnement. Programme fidélité tracke toutes les features : mode visite/cagnotte, paliers, anniversaire, parrainage, shield, jours x2, **offre duo**, **offre étudiant**. Vitrine tracke : planning, resa en ligne, **RDV de suivi +3/+6 (`recurring_followup_enabled`, badge Repeat)**, mode libre/buffer, **service à domicile (badge "Domicile (géocodé)" / "Domicile (non géocodé)" selon shop_lat/lng)**, annulation/modif J-x, deposit_deadline_hours, **acompte nouvelles clientes (`deposit_only_for_new_customers`, mig 165)**, **adresse masquée (`hide_address_on_public_page`, mig 135)**, **bienvenue** (avec badge `-X%` si `welcome_offer_discount_percent` configuré, sinon mention mode legacy voucher), **lien sur carte**. Badge statut abonnement : cas explicites `past_due` (« Impayé depuis le {date} » + « compte bloqué (>72h) » si `past_due_since` dépasse 72h, mig 164), `canceling` (« Annulation programmée ») et `trial` (« En essai » + jours restants + **date et heure de fin d'essai en heure de Paris** sous le badge, via `formatParisDateTime` = `Intl.DateTimeFormat` timeZone `Europe/Paris`, le timestamp `trial_ends_at` étant en UTC). Section **Jeu concours** dédiée : statut on/off + alerte missing-prize (`contest_missing_prize_alerted_at`), lot par défaut, lots planifiés mois par mois (current + 5 prochains via `merchant_contest_prizes`), historique 12 derniers tirages avec gagnant + nb participants. Section **Bons cadeaux** dédiée : statut on/off + revenu cumulé dans badge (formatCurrency), validité (mois), 5 stats compactes par statut (`Record<GiftCardStatus, number>` : active/used/pending_payment/expired/cancelled), bloc revenu cumulé pink (hors annulés + pending_payment). Liens & Réseaux inclut **WhatsApp** + 2eme deposit link. Bio = bouton compact qui révèle le texte. Email tracking labels complets (-100→-308).
- `/api/admin/merchants-data` — liste globale agregation : ajoute `pendingDepositsCounts` par merchant (derive de `slotsList` deja charge, zero query supplementaire). Badge orange sablier sur la ligne merchant dans `/admin/merchants` (desktop + mobile) pour reperer d'un coup d'oeil les merchants qui ont des resas bloquees.
- `/api/admin/activity-feed` — Timeline activite (scans, inscriptions, recompenses, nouveaux clients, vouchers, reservations planning, offres bienvenue, messages). Optimise : fetch merchants par IDs references uniquement
- `/api/admin/announcements` — CRUD annonces
- `/api/admin/analytics` — GET aggregation globale (~14 queries paralleles) pour page `/admin/analytics` : revenue (MRR, ARPU, tier mix, mrrHistory), funnel (signup sources, trial-to-paid, avgTimeToConvert), activation (activationRate, avgTimeToFirstScan, avgTimeTo10Customers, featureAdoption 17 flags), engagement (actifs 7j/30j, scans trend, top 10), automations (push/email, booking/offres). Le bloc `growth` a été déplacé dans une route séparée (cf. `/api/admin/analytics/growth` ci-dessous). Remplace l'ancien couple `/api/admin/tracking` + page `metriques`.
- `/api/admin/analytics/growth` (mig 155) — GET dédié à la Growth tab. Cache module-level 5min keyé sur `weeksBack` (helper partagé `createTtlCache` dans `api-helpers.ts`). Wraps 2 RPCs Postgres `admin_growth_weekly(weeks_back)` (8 séries hebdo Europe/Paris : RDV vitrine vs manuel, nouveaux clients vs nouvelles cartes, scans, signups, paid conversions, marketing SMS, gift cards CA) + `admin_growth_rolling()` (KPIs 4w glissants : net new paying + delta, WAU/MAU, share online, cohort 4w retention, gift cards CA 4w) + 3 queries cumulatives (referrals, vouchers by source, total customers). Toutes les RPCs excluent les super_admins via LEFT JOIN anti-join (NULL-safe + perf vs NOT IN).
- `/api/admin/incomplete-signups`, `/api/admin/prospects`, `/api/admin/tasks`, `/api/admin/merchant-emails`

---

## 7. Inscription & Onboarding

1. **Phase 1:** Email + password (`/auth/merchant/signup`) — filet typo email
2. **Phase 2:** Infos commerce (`/auth/merchant/signup/complete`)
3. **Personnalisation** (`/dashboard/personalize`) — logo + ambiance couleurs (12 palettes : Elegant, Glamour, Moderne, Zen, Sable, Dore, Ocean, Passion, Menthe, Indigo, Terracotta, Noir). Sauvegarde `logo_url`, `primary_color`, `secondary_color` puis redirige vers `/dashboard/program`. Page onboarding-only (pas dans la sidebar). **Défaut UI : Glamour** — si le merchant a encore les couleurs par défaut DB (`#654EDA`/`#9D8FE8`, aucune palette ne les propose), la page pré-coche Glamour pour éviter de laisser aucune palette sélectionnée. **Guards critiques** : (1) init couleurs/logo se déclenche une seule fois (`initialized` flag) pour éviter écrasement par background refetch ; (2) bouton Continuer désactivé pendant upload (`disabled={saving || uploading}`) ; (3) pas de `refetch()` avant `router.push` — évite race condition session qui redirigeait vers `/auth/merchant` ; (4) erreur upload affichée (`uploadError` state, clé i18n `personalize.uploadError`) ; (5) extension fichier fallback `png|jpg` si absente.
4. **Welcome** (`/dashboard/welcome`) — redirige vers `/dashboard/program` (page legacy conservee pour eviter 404 sur URLs bookmarkees).
5. `/dashboard/program` → config (couleurs, stamps, reward, extras : parrainage, avis Google, duo, jours x2, anniversaire)
6. Premiere sauvegarde → modal "Tout est connecte !" (interconnexion 3 piliers : vitrine → reservation → carte fidelite auto) → "Voir le parcours client" (`/scan/{code}`) ou "Plus tard" → `/dashboard/qr-download`
7. QR download → modal (1x) "Aide-nous a te rendre visible" → "Completer ma page" (`/dashboard/public-page`)
8. `isFirstSetup` = true quand `reward_description` is null
9. Email QR code envoye a la premiere config

**OnboardingChecklist** : 16 etapes en **3 groupes accordion par pilier produit** (refonte avril 2026 cohérente avec le split tier Fidélité/Tout-en-un). Groupe **Fidélité** (6, icone `Heart` rose) : programme, logo, QR, parrainage, anniversaire, 1er client. Groupe **Vitrine** (5, icone `Store` violet) : bio, prestations, adresse, photos, réseaux. Groupe **Planning et Résa** (5, icone `CalendarDays` emerald, **masquable**) : planning, résa en ligne, créneaux, 1ère résa, SMS campagnes. **Toggle masquage Planning** : lien texte "Je n'utilise pas le planning" en bas du body déplié → confirmation inline ambre → set `planning_intent='no'` (mig 121) → groupe disparaît. Réactivable depuis `/dashboard/settings`. **Cohérence Fidélité-only** : si `planning_intent='no'`, encart SMS quota dashboard masqué + email Planning Reminder J+4 skip. Helpers `isPlanningHidden()` + `showPlanningUi()` dans `src/lib/plan-tiers.ts` (combine tier + intent). **Design** : container `bg-white border-gray-100 rounded-2xl md:rounded-3xl shadow-sm`, palette plum uniforme (`#4b0082`) pour icones/progress, emerald pour done, amber pour CTA s'abonner. Celebrations sparkles (sparkleSubtle par etape, sparkleMedium par groupe, sparkleGrand quand tout complete). Auto-dismiss 3 jours apres completion. Visible en trial uniquement. CTA "S'abonner" standalone amber toujours visible.

**ZeroScansCoach** : 3 etapes interconnectees avec fleches (ArrowDown) montrant le parcours client : (1) "Ta vitrine attire" → vitrine, (2) "Elles reservent en ligne" → planning, (3) "Carte fidelite automatique" (resultat auto, pas de lien). Visible quand 0 scans en trial.

**MilestoneModal** : celebrations in-app trial only. 6 milestones one-shot : vitrine_live (bio+adresse), services_added (1+ prestation), planning_active (planning active), first_scan (1+ client), first_booking (1+ resa en ligne), first_reward (1+ recompense). Modal glassmorphism centree + sparkleGrand() + Framer Motion. Dedup localStorage permanent (`qarte_milestone_{type}_{merchantId}`). Priorite d'affichage : vitrine > services > planning > scan > booking > reward. 1 seul modal par chargement. Queries milestone conditionnelles `subscription_status === 'trial'`.

**Dashboard accueil — ordre des sections** : Greeting → OnboardingChecklist (trial) → Raccourcis mobile → Prochains RDV (avec badges acompte) → Anniversaires (urgent) → Stats cards → Cagnotte → Referrals/Welcome highlights → SMS quota → Weekly comparison (avec phrase tendance) → Activity feed (timeline 8 events : scans, recompenses, parrainages, offres bienvenue — sans bookings, geres par la notification bell) → Shield + PendingPoints (en bas). Les bookings sont retires de l'activite recente car la notification bell les couvre.

**Score programme** : cercle sticky 0-100% (recompense 25pts, logo 20pts, reseaux 15pts, avis 15pts, reservation 10pts, palier2 10pts, jours x2 5pts)

**Boutons save unifies** : tous `bg-indigo-600 hover:bg-indigo-700` (default), `bg-emerald-600` (saved), `rounded-xl`, icone Check/Loader2. Coherent sur Ma Page, Programme, Parrainage, Parametres, Planning.

**Planning module harmony** : tabs/hero/toggles/pills deposit/save button tous unifies en indigo (plus d'emerald/violet accent mixte). Emerald reserve au feedback "saved" et aux status success semantiques.

**BookingModal vitrine — section acompte** : fond + bordure + icone + CTA "Payer acompte" utilisent les couleurs du merchant (`primary_color` / `secondary_color` via styles inline avec opacites hex `0D`/`1A`/`26`). Plus d'ambre. `RewardCard` et `TierProgressDisplay` : tier 2 = gradient inverse des couleurs merchant (plus de violet Qarte hardcode `#8B5CF6`).

**Headers unifies** : tous `bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]` avec titre gradient `from-indigo-600 to-violet-600`.

**Jeu concours mensuel** (mig 105) : merchants activent `contest_enabled` + configurent `contest_prize` (lot par défaut) et/ou des lots planifiés mois par mois (`merchant_contest_prizes`). Clients ayant un RDV pendant le mois (par `slot_date`) participent automatiquement, **résa online ET manuelles** (slots `client_name NOT NULL`, hors `__blocked__`, `primary_slot_id IS NULL`), dédup par téléphone → customer_id → nom. Les annulations sont exclues d'office (le créneau repasse `client_name = NULL`). Cron `monthly-contest` le 1er du mois tire un gagnant au hasard, insert `merchant_contests`, push + email merchant (template `ContestWinnerEmail`). **Lot affiché = lot planifié du mois courant → fallback `contest_prize`**, même règle partout : tirage, dashboard, vitrine `/p/[slug]` (résolu dans `getMerchantData`), carte client (résolu dans `/api/customers/card`). Page dediee `/dashboard/contest` (admin-only via `super_admins` check dans le sidebar). Generation story Instagram (4:5, `ContestWinnerStory.tsx`, meme pattern glassmorphism que `SocialMediaTemplate.tsx`). Badge concours sur vitrine `/p/[slug]` si actif. Emoji `🎉` dans NotificationBell pour type `contest_winner`.

---

## 8. Stripe & Abonnement

### Pricing dual-devise
- **FR (EUR) Tout-en-un :** `PLAN` (24€/mois) + `PLAN_SEMESTRIAL` (120€/6 mois — interval=month, interval_count=6) + `PLAN_ANNUAL` (240€/an, **legacy**) — `STRIPE_PRICE_ID` + `STRIPE_PRICE_ID_SEMESTRIAL` + `STRIPE_PRICE_ID_ANNUAL`
- **FR (EUR) Fidélité — RETIRÉE aux nouveaux (juillet 2026), conservée pour les abonnés existants :** `PLAN_FIDELITY` (14€/mois) + `PLAN_FIDELITY_SEMESTRIAL` (70€/6 mois) + `PLAN_FIDELITY_ANNUAL` (190€/an, legacy) + `PLAN_FIDELITY_LEGACY_PRICE_IDS` (19€/95€ avant juin 2026) — env `STRIPE_PRICE_FIDELITY*`. Le webhook (`tierFromPriceId`) mappe toujours ces price IDs → `fidelity` pour les abonnés en place. `checkout/route.ts` ne crée plus de souscription Fidélité (force `all_in`) ; `change-tier/route.ts` autorise l'upgrade Fidélité→Tout-en-un mais **rejette** tout passage vers Fidélité (400)
- **EN (USD):** `PLAN_EN` ($24/mo) + `PLAN_ANNUAL_EN` ($240/yr) — pas de plan 6 mois EN ; le checkout fallback sur l'annuel EN si plan='semestrial' est demandé
- Helper unique `getPriceId(tier, interval, locale)` dans `src/lib/stripe.ts` — utilisé par checkout + change-tier (zéro duplication)
- **DB `merchants.billing_interval`** : `'monthly' | 'semestrial' | 'annual'` (mig 166 — CHECK constraint). Webhook détecte `'semestrial'` via `interval=month && interval_count=6`. Helper `normalizeBillingInterval()` dans `lib/plan-tiers.ts` pour coercer la valeur DB sans ternaires éparpillés.
- **Bonus SMS engagement** (`getEngagementSmsBonus(merchant)`) : Mensuel `+0` / 6 mois `+10` / Annuel `+20` (lookup table `ENGAGEMENT_BONUS`). Annual legacy (créés avant `PRICING_SPLIT_DATE`) restent à 100 — leur tarif historique 180€ prime.
- **NFC offerte** : uniquement annuel legacy (les anciens abonnés). Mensuel et 6 mois → NFC en option payante 20€ via Stripe payment link (CTA dans email confirmation et page boutique).
- Selection price_id basee sur `merchant.locale` dans `/api/stripe/checkout`
- Locale Stripe UI : `fr` ou `en` selon merchant.locale

### Statuts
| Statut | Description |
|--------|-------------|
| `trial` | Periode d'essai (3 jours) |
| `active` | Abonnement actif |
| `canceling` | Annulation programmee (cancel_at_period_end=true) |
| `canceled` | Annule (orthographe US) |
| `past_due` | Paiement en retard (traite comme actif) |

### Machine d'etats Webhook
| Evenement Stripe | Statut DB | Email |
|-----------------|-----------|-------|
| checkout.session.completed | `active` | SubscriptionConfirmedEmail (annuel legacy: NFC offerte ; mensuel + 6 mois: NFC en option 20€) |
| subscription.updated (cancel_at_period_end) | `canceling` | SubscriptionCanceledEmail |
| subscription.updated (canceling→active) | `active` | SubscriptionReactivatedEmail |
| subscription.deleted | `canceled` | — (gap : aucun email envoye quand Stripe force-cancel apres echecs paiement, voir section ci-dessous) |
| invoice.payment_failed | `past_due` | PaymentFailedEmail + **SMS past_due_initial** (mig 163) + **atomic claim `past_due_since`** (mig 164) |
| invoice.payment_succeeded (recovery) | `active` | SubscriptionConfirmedEmail + **resetPastDueSmsFlags** (mig 163) + **reset `past_due_since`** (mig 164) |

**Evenements requis sur l'endpoint Stripe** (`/api/stripe/webhook`) : `checkout.session.completed`, `checkout.session.expired`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`. **Gotcha (incident mai 2026)** : l'endpoint n'etait abonne qu'aux 3 premiers — `invoice.payment_failed`/`succeeded` jamais recus → `past_due_since` jamais pose (blocage 72h mort, dunning email/SMS step 1 morts), recovery past_due→active mort, notif parrain affiliation morte. Les merchants passaient quand meme en `past_due` via `subscription.updated` (qui mappe le statut) mais sans aucune machinerie dunning. Si on recree l'endpoint Stripe, verifier les 6 evenements.

**Grace period** : 3 jours apres expiration (lecture seule), suppression apres 3 jours.

### Dunning past_due (mig 163, mai 2026)
Sequence complete quand un merchant tombe en `past_due` :
- **J0** : `PaymentFailedEmail step 1` (webhook) + **SMS `past_due_initial`** (Qarte→merchant via SMS Partner FR/BE / OVH CH, fire-and-forget post-webhook)
- **J+2** : **SMS `past_due_reminder`** (cron `morning`, gate `daysSince(updated_at) >= 2 AND past_due_sms2_sent_at IS NULL`)
- **J+3** : `PaymentFailedEmail step 2`
- **J+7** : `PaymentFailedEmail step 3`
- **J+10** : `PaymentFailedEmail step 4`

Helper unique [`src/lib/sms-past-due.ts`](../src/lib/sms-past-due.ts) `sendPastDueSms({supabase, merchant, step})` avec atomic claim sur `merchants.past_due_sms{1,2}_sent_at` (race-safe webhook/cron) + rollback flag si echec envoi + reset des 2 flags sur `invoice.payment_succeeded`. **Caractere transactionnel critique** (info compte) : ne respecte PAS `marketing_sms_opted_out`, seul `merchants.no_contact = true` (full opt-out admin) bloque. Logue dans `merchant_marketing_sms_logs` (canal Qarte→merchant), n'impacte PAS le quota merchant (cout absorbe par Qarte). Voir [docs/sms-system.md](sms-system.md) section "Dunning past_due".

### Bandeau permanent past_due dans header dashboard (mai 2026)
Quand `merchant.subscription_status === 'past_due'`, **bandeau rouge fixed top-0 z-[60] sur toute la largeur** (mobile + desktop) en haut du dashboard avec icone `AlertTriangle` + texte unifie *"Régularise pour ne pas perdre toutes tes données"* (i18n key `pastDueDataWarning`, meme texte tous tiers Fidelite/Tout-en-un/legacy), cliquable → `/dashboard/subscription`. Padding-top des autres surfaces (topbar mobile, aside desktop, main) ajuste conditionnellement via `pt-[calc(env(safe-area-inset-top)+40px)]` quand `isPastDue`. Safe-area iOS PWA respectee. Avant : l'avertissement n'etait visible que dans le sidebar (ferme par defaut sur mobile, 80% du trafic) → impaye silencieux pendant des jours. Suppression au passage du `<StatusBanner>` past_due duplique dans la sidebar.

### Blocage past_due > 72h (mig 164, mai 2026)
Apres 72h en `past_due`, le merchant est **bloque** : redirect dashboard vers `/dashboard/subscription` (seule page accessible) + 403 sur 8 routes API client-facing (checkin, cagnotte/checkin, welcome, referrals, planning/book, vouchers/use, merchant-offers/claim, gift-cards/request) + `<SuspendedBanner />` etendu sur `/p/[slug]` + `/scan/[code]` (texte neutre "Page suspendue", on ne mentionne PAS l'impaye cote cliente, choix UX assume).

**Source de verite temporelle** : nouvelle colonne `merchants.past_due_since TIMESTAMPTZ` (mig 164) set par Stripe webhook `invoice.payment_failed` via atomic claim `WHERE past_due_since IS NULL` (Stripe peut re-fire payment_failed sur le meme cycle → on ne reset pas le compteur a chaque retry), reset NULL sur `invoice.payment_succeeded`. **Independant de `updated_at`** qui se reset a toute modif merchant (toggle settings, edit profil, etc.) — sans cette separation, un past_due qui modifie sa fiche bypasserait le blocage trivialement.

**Helper unifie** [`src/lib/merchant-access.ts`](../src/lib/merchant-access.ts) : `isMerchantBlocked({trial_ends_at, subscription_status, past_due_since})` combine les 2 cas de blocage (`isPastDueBlocked` 72h + `getTrialStatus().isTrialExpired` post-grace). `getMerchantAccessStatus()` retourne aussi `reason: 'trial_expired' | 'past_due_unpaid' | null` pour wording UI specifique.

**Bandeau dashboard `/dashboard/subscription` specifique past_due_unpaid** : `alertPastDueBlocked` "Paiement a regulariser — compte suspendu" + `alertPastDueBlockedDesc` "Tes clientes ne peuvent plus reserver ni scanner. Mets a jour ta carte pour tout reactiver immediatement." (rouge, separe du `alertPastDue` initial qui reste pour J0-J+2 non encore bloques).

**Bonus correctif** : les emails dunning J+3/J+7/J+10 du cron `morning` migrent de `updated_at` vers `past_due_since` (meme bypass via toggle settings). Idem cron dunning SMS J+3 (`past_due_reminder`, decale de J+2 a J+3 pour synchro avec le blocage).

**Coupure SMS sortants quand bloque** : `sendBookingSms` et `sendMarketingSms` integrent `isPastDueBlocked()` — un merchant suspendu ne peut plus envoyer rappels RDV, marketing, welcome, review, etc. (incoherent que la cliente recoive "rappel demain" alors que le merchant ne pourra pas la check-in). 7 crons passent `pastDueSince` (sms-hourly, evening, sms-batch-audit, morning-jobs, gift-cards-deliver/expire, sms-campaigns-dispatch). Les 2 SMS dunning eux-memes (`past_due_initial`/`past_due_reminder`) ne sont PAS gates — c'est la communication Qarte→merchant qui doit continuer.

**Backfill mig 164** (decision produit, "trop d'impayes") : pour les past_due deja en base, `past_due_since = COALESCE(past_due_sms1_sent_at, updated_at)` UNIQUEMENT si > 72h → bloque immediatement les past_due > 72h, laisse les recents passer par le flow webhook normal.

**Override admin** : pas implemente en V1 (a voir plus tard si besoin de debloquer manuellement un faux positif Stripe).

### Cas Stripe force-cancel apres echecs (cron de reconciliation, mai 2026)
Apres 4 retries Stripe (configurable, ~21 jours par defaut via Stripe Smart Retries), si tous les paiements echouent, Stripe envoie `customer.subscription.deleted`. Notre webhook ([webhook/route.ts:265-292](../src/app/api/stripe/webhook/route.ts#L265-L292)) :
- Set `subscription_status = 'canceled'` + `stripe_subscription_id = NULL`
- N'envoie PAS d'email (le webhook reste muet — choix assume : le commentaire d'origine "email deja envoye via 'canceling'" est trompeur pour le force-cancel, c'est le cron de reconciliation ci-dessous qui couvre)
- `past_due_since` reste defini (innocent — `isPastDueBlocked` filtre sur status — mais stale)

**Blocage maintenu** : `isMerchantBlocked()` continue a retourner true via la branche `trial_expired` (canceled n'est pas dans active/canceling/past_due dans `getTrialStatus`). Dashboard redirect + 8 routes API 403 + SuspendedBanner restent actifs.

**Cron de reconciliation `/api/cron/stripe-reconcile`** (`0 9 * * *`, mai 2026) : ferme le trou si le webhook `customer.subscription.deleted` n'arrive jamais (downtime, event delivery failed cote Stripe). Selectionne les merchants `past_due` avec `past_due_since > 14j` (`STALE_PAST_DUE_DAYS`), interroge `stripe.subscriptions.retrieve` pour chacun :
- Statut Stripe `canceled` ou `incomplete_expired` OU 404 (`resource_missing`) → on aligne en `canceled` cote DB (atomic `UPDATE ... WHERE subscription_status='past_due'`, no-race avec webhook live), reset `past_due_since`, vide `stripe_subscription_id`, puis envoi `SubscriptionForceCanceledEmail` (template dedie, ton informatif sur l'auto-cancel + 30j de conservation des donnees, CTA reactivation).
- Statut Stripe encore vivant → on laisse le webhook faire son travail (probable retry final en cours).
- Pas de `stripe_subscription_id` → force-cancel direct (signal fort apres 14j sans aucun lien Stripe).

Fenetre 14j choisie pour rester sous Smart Retries (~21j) avec marge. Idempotent : un merchant deja `canceled` n'est jamais re-selectionne (filtre `subscription_status='past_due'`). Volume attendu : tres petit set / mois.

**Cron `morning` REACTIVATION** prend ensuite le relais : envoie `sendReactivationEmail` a J+7/J+14/J+30 post-cancellation (templates generiques "tu nous manques", code -301/-302/-303).

### Page Abonnement (`/dashboard/subscription`)
- Toggle Mensuel/6 mois avec badge "Recommande" + savings sur 6 mois (mai 2026 : annuel retire du picker pour les nouveaux merchants, garde pour les abonnés annuels existants legacy via `PaidStatusCard`). Type local `PickerInterval = Exclude<BillingInterval, 'annual'>` pour le state du toggle, `BillingInterval` (3 valeurs) pour l'affichage paid status.
- CTA : "Continuer en mensuel" / "Continuer en 6 mois" (sans prix dans le bouton)
- **NFC plus offerte sur les nouveaux plans** (mai 2026) : badge "Carte NFC offerte" + modal NFC retirés du picker. NFC reste en option payante 20€ via Stripe payment link (CTA dans email confirmation pour mensuel + 6 mois). Annuels legacy gardent leur NFC offerte historique (branche `billingInterval === 'annual'` dans `SubscriptionConfirmedEmail.tsx`).
- **Picker carte unique** (juillet 2026, retrait Fidélité) : la fin d'essai n'affiche plus qu'**une carte Tout-en-un** (24€/120€) avec liste complète des avantages (`[...fidelityFeatures, ...allInExtrasFeatures]`). La carte Fidélité + le CTA `chooseFidelityCta` sont retirés du choix. `handleSubscribe` ne pousse plus que `all_in` ; `checkout/route.ts` force `tierChoice='all_in'`. La modale « changer de plan » ne propose plus que `all_in` (upgrade pour les abonnés Fidélité existants) et `canChangeTier` n'est vrai que pour un abonné Fidélité non-legacy ou un super_admin. `change-tier/route.ts` rejette `newTier='fidelity'` (400). Affichage des abonnés Fidélité actuels (`PaidStatusCard`, `TIER_PRICE_LABELS.fidelity`) conservé.
- **Features + prix + titre tier-aware** (avril 2026, maj mai 2026 pour 6 mois, prix Fidelite 14€/70€ juin 2026) : `buildPlan(tier, interval, locale)` calcule prix + daily + label + savings% dynamiquement. Lookup `SMS_FEATURE_KEY` + `FALLBACK_PLAN_PRICE` + `TIER_PRICE_LABELS` remplacent les ternaires nested (3 valeurs : monthly/semestrial/annual). `featuresByTier` : Fidelite = 8 features (retire planning, SMS, duo offer), Tout-en-un = 10 features complete. Email SubscriptionConfirmed split `introFidelity` / `introAllIn`. Lookup `PLAN_LABEL_KEY` + `NEXT_BILLING_KEY` dans le template. Lookup `SMS_FEATURE_KEY` + `FALLBACK_PLAN_PRICE` + `TIER_PRICE_LABELS` remplacent les ternaires nested (3 valeurs : monthly/semestrial/annual). `featuresByTier` : Fidelite = 8 features (retire planning, SMS, duo offer), Tout-en-un = 10 features complete. Titre hero = "Qarte Fidelite · Mensuel" / "Qarte Tout-en-un · 6 mois" selon selection. Hint sous titre depend du tier (tierFidelityHint / tierAllInHint, i18n). Email SubscriptionConfirmed split `introFidelity` / `introAllIn` (plus de "100 SMS debloques" hardcode pour Fidelite). Lookup `PLAN_LABEL_KEY` + `NEXT_BILLING_KEY` dans le template.
- Reassurance sous CTA (icones ShieldCheck/Check/CreditCard) visible all screens
- Textes explicatifs sous CTAs canceled ("Tes clients ne peuvent plus tamponner") et past_due
- Countdown trial, syncing indicator, billing card avec methode paiement
- **Bouton "Gerer mon abonnement"** (etat `active`) → ouvre directement le **portail Stripe** (`handleOpenPortal`) pour gerer carte bancaire, factures, abonnement. Sous-texte "Carte bancaire, factures, abonnement". Lien discret en dessous "Annuler mon abonnement" (underline gris) → declenche le save-offer modal (`handleOpenCancelFlow`). Anciennement le bouton "Gerer" ouvrait directement le flow d'annulation, ce qui empechait les pros de changer leur carte.
- **Prix affiche = vrai prix Stripe** (pour merchants payants `active` / `canceling` / `past_due`) : la page lit `unit_amount` de la subscription via `/api/stripe/payment-method` (etendu pour retourner `subscription: { unit_amount, currency, interval, interval_count }`). Helper `buildPlanFromSubscription()` derive les valeurs d'affichage et detecte automatiquement le 6 mois (`interval=month && interval_count=6`). Couvre 4 cas sans aucune migration DB : (1) anciens grandfathered (19€/mois ou 180€/an avant le 2026-04-05) — voient leur tarif d'epoque, (2) mensuel post-split (19€/24€), (3) **6 mois post-mai 2026 (95€/120€, monthly equivalent 16€/20€)**, (4) annuels post-split legacy (190€/240€). Les coupons Stripe ne sont **pas** appliques (ils s'ajoutent au niveau facture, pas sur `unit_amount`). Trial / canceled / no-sub voient le prix public via `buildPlan(tier, picker, locale)` selon le tier courant du selecteur. Pour le fallback annuel legacy (PaidStatusCard sans subscriptionInfo), import direct de `PLAN_PRICES` (`lib/landing-pricing.ts`) au lieu de hardcoder 190/240.
- **Marketing AutomationsTab tier-gated** : merchants Fidelite voient un bandeau amber en haut ("anniversaire offert, parrainage via pack") et toutes les cartes SMS sont grisees+hint "Reserve Tout-en-un" sauf `referral_reward_sms_enabled` (activable mais consomme un pack — note `fidelityReferralPackNote`). Helper `gateCard(field, otherDisabled, otherHint)` priorise le gate tier. Voir `src/lib/plan-tiers.ts` et `isFidelityFreeSms` / `QUOTA_EXEMPT_SMS_TYPES` dans `src/lib/sms.ts`.
- **getMerchantMonthlyPrice** (utils) retourne prix correct pour legacy (pre-split = 19€) ET post-split tier (Fidelite=19€ / Tout-en-un=24€). Utilise par `/admin/analytics` MRR + tier breakdown.
- **Gating SMS campagnes pour non-abonnés (mai 2026)** : bouton submit campagne SMS désactivé si `!isPaidMerchant(merchant)` (helper `lib/sms.ts`, gate UI `SmsTab.tsx` + défense API `/api/sms/campaign/submit:51` qui renvoie 403). Le merchant trial peut préparer le contenu et choisir l'audience mais pas envoyer. Bandeau orange "Souscris pour envoyer tes campagnes" + CTA `/dashboard/subscription` remplace l'ancien message "prépare maintenant" trompeur. Helpers `isPaidStatus(s)` + `isPaidMerchant(m)` factorisent 4 anciennes duplications du cast `(PAID_STATUSES as readonly string[]).includes(...)`.
- **Plan Fidélité = capacités exactes** (mai 2026) : `PlanFeatures` dans `src/lib/plan-tiers.ts` définit les flags par tier. Fidélité a `marketingSms: true` (peut envoyer des campagnes SMS via achat de pack uniquement, quota mensuel = 0), `giftCards: false` (bons cadeaux bloqués — gating à 5 niveaux : nav, page dashboard, API settings PATCH, API request POST côté vitrine publique, bouton "Offrir un bon" sur `/p/[slug]`). Auto SMS Fidélité : **anniversaire seul offert** (ni quota ni pack) via `isFidelityFreeSms` ; le parrainage (`referral_reward`) est activable mais **consomme un pack** (juin 2026). `QUOTA_EXEMPT_SMS_TYPES = ['birthday', 'referral_reward']` = exclus du compteur quota (tous tiers), distinct du bypass gratuité. Seul toggle activable côté UI Fidélité = `referral_reward_sms_enabled` via `FIDELITY_AVAILABLE_FIELDS` dans `AutomationsTab.tsx`. Bouton de réservation **externe** (`merchant.booking_url` Planity/Booksy/etc.) reste 100% accessible aux Fidélité (par design). Bloqué Fidélité : `planning`, `bookingOnline` (résa Qarte native), `memberPrograms`, `contest`, `giftCards`. `SmsBalancePanel` détecte `quota === 0` → mode `packOnly` (pas de barre, copy "X SMS dans mon pack" + blocage rouge "Prends un pack" si vide). Les écrans `PlanUpgradeCTA` reçoivent leur copy via `useTranslations` (clé `planUpgradeCta.discoverAllIn` pour le bouton défaut — bug i18n FR hardcodé fixé en passant). Copy upgrade refondue selon skills `paywall-upgrade-cro` + `copywriting` : titres outcome-led ("Tes résas tombent pendant que tu travailles"), descriptions avec exemples concrets vocabulaire beauté.

---

## 9. Emails (38 templates)

**i18n** : Tous les templates utilisent `getEmailT(locale)` de `src/emails/translations/{fr,en}.ts`. La locale vient de `merchants.locale`. Aucun texte hardcode FR restant. `getEmailT` supporte les cles imbriquees a N niveaux (ex: `paymentFailed.step1.heading`).

**Sign-off harmonisé** ([`src/emails/EmailSignoff.tsx`](../src/emails/EmailSignoff.tsx), nov 2026) : composant partagé qui rend la fin de mail "L'équipe Qarte 💜" avec highlight purple `#4b0082` font-weight 600 + ligne grise au-dessus pour le prefix optionnel. API : `<EmailSignoff prefix={...} italic>{...}</EmailSignoff>`. Utilisé par 56 templates (3 patterns absorbés : sans prefix / avec prefix `signaturePrefix` / italic pour SmsPack & SmsQuota). Centralise la typo + couleur du sign-off — un seul endroit pour ajuster à l'avenir. Skipped : `ReactivationEmail` (sans highlight) et `ReferralPromoEmail` (sans sign-off du tout, CTA-only).

### Onboarding (epure — max 1 email/jour)
WelcomeEmail, IncompleteSignupEmail (+15min + +2h), GuidedSignupEmail (J+1 incomplete), ProgramReminderEmail (J+1 non configure, mentionne interconnexion booking→fidelite), QRCodeEmail (une fois configure), FirstClientScriptEmail (J+2 post-config, 0 scans), VitrineReminderEmail (J+3, vitrine vide), PlanningReminderEmail (J+4, planning desactive, mentionne interconnexion booking→carte fidelite auto)

**Abandon signup** : 3 relances escaladees — T+15min (Resend schedule), T+2h (Resend schedule), T+24h (cron morning -150). Les 2 emails schedules sont annules si le merchant complete son inscription.

**Supprimes** : ProgramReminderDay2Email (J+2), ProgramReminderDay3Email (J+3), Day5CheckinEmail, QuickCheckEmail (J+4), AutoSuggestRewardEmail (J+5) — trop d'emails les premiers jours, doublon de ton

### Engagement
FirstScanEmail (2e visite), **FirstBookingEmail (1ere resa en ligne, tracking -105)**, FirstRewardEmail, Tier2UpsellEmail, PendingPointsEmail (Shield), WeeklyDigestEmail (DESACTIVE)

### Retention & Trial (epure)
TrialEndingEmail (J-2 uniquement — etait J-3 + J-1), TrialExpiredEmail (J+1 uniquement — etait J+1 + J+2), InactiveMerchantDay7/14/30Email

### Stripe & Post-subscription
SubscriptionConfirmedEmail, PaymentFailedEmail (4 steps dunning: J+0 webhook, J+3/J+7/J+10 cron — ton escalade progressif), SubscriptionCanceledEmail (annulation volontaire), **SubscriptionForceCanceledEmail (cron `stripe-reconcile` — force-cancel auto après échecs Stripe, ton informatif + 30j de conservation)**, SubscriptionReactivatedEmail, ReactivationEmail (J+7/14/30), **ReferralPromoEmail (J+2 post-abonnement — "Gagne 10€ par pro recommande", lien `?ref={slug}`)**, **ReferralReminderEmail (J+14 et J+30 post-abo, tracking -316/-317, uniquement si 0 referrals)**

### Cancel flow — Save offer
Modal dans `/dashboard/subscription` : quand le merchant clique sur le lien discret "Annuler mon abonnement", questionnaire raison d'annulation (6 choix). Si "trop cher" → offre **-25% pendant 2 mois** avec code `2MOISQARTEPRO25` (coupon Stripe `percent_off=25, duration=repeating, duration_in_months=2`). Note : le `2MOISQARTEPRO25` en `percent_off` sur-deduit le forfait 6 mois (25% de 120€ = 30€ au lieu de ~2 mois), a migrer en `amount_off` si reutilise sur du 6 mois.

**Tracking churn (mig 127, avril 2026)** : la raison cliquee est POST-ee a `/api/merchant/cancellation-reason` au moment du select (avant meme l'eventuel passage en portail Stripe), persistee dans `merchants.cancellation_reason` + `cancellation_reason_at` (CHECK constraint sur les 6 valeurs). Pixels FB + TikTok firent un event `cancelIntent(reason)` au meme moment pour optimisation des audiences ads. Modal de confirmation finale ajoutee entre le bouton "Continuer" du save-offer et le portail Stripe (point de non-retour) : copy `finalCancel*` (FR/EN), bouton rouge "Oui, annuler definitivement" + retour possible vers le save-offer.

### Autres
BirthdayNotificationEmail, GracePeriodSetupEmail, ProductUpdateEmail, AnnouncementMaPageEmail, WinBackEmail (envoi manuel admin), BookingNotificationEmail (transactionnel), SlotReleasedEmail (acompte non recu — cron `deposit-expiration`, mentionne la possibilite de recuperer la resa depuis le dashboard), **BlogDigestEmail** (avril 2026 — envoie 1 article de blog tous les 3+ jours, source `src/data/blog-articles.ts`, cron `/api/cron/blog-digest`, idempotence via table `blog_email_dispatches` mig 125)

### Codes promo
Tous les codes promo emails ont ete supprimes (QARTE50, QARTEBOOST, QARTELAST, QARTECHALLENGE2026, QARTEPROEHJT). Aucun code de reduction n'est envoye automatiquement.

### Cron Jobs
| Cron | Horaire | Description |
|------|---------|-------------|
| `/api/cron/morning` | 08:00 UTC | **Emails billing-critical** : trial (J-2/J+1), reactivation, dunning, incomplete signup T+24h, grace period setup + cleanup tracking |
| `/api/cron/email-onboarding` | 10:00 UTC | **Emails setup progressif** : program reminder J+1, social proof J+3, vitrine J+3, planning J+4, QR code, first client script |
| `/api/cron/email-engagement` | 13:00 UTC | **Emails engagement** : first scan/booking/reward, tier 2 upsell, inactifs J+7/14/30, referral promo J+2, referral reminders J+14/30, pending points |
| `/api/cron/morning-jobs` | 07:00 UTC (9h Paris ete / 8h hiver) | Vouchers anniversaire + push client + email merchant + push merchant + **warning acomptes expirant dans 4h**. SMS anniversaire skip ici (hors plage legale < 10h local) — fallback via `sms-hourly` |
| `/api/cron/morning-push` | 07:00 UTC (9h Paris ete / 8h hiver) | Push 10h (scheduled), push automations (inactifs/recompense/events), push trial reminders, **daily digest merchant** (X RDV aujourd'hui) |
| `/api/cron/evening` | 17:00 UTC | Push 19h (timezone-aware) + warning acomptes expirant dans 4h + SMS rappel J-1 |
| `/api/cron/deposit-expiration` | toutes les 15 min | **Auto-liberation acomptes expires** (unique source de verite) : snapshot resa dans `booking_deposit_failures` puis wipe du slot + push + email merchant. Lag max 15 min. Batch fillers + `batchGetUserEmails` |
| `/api/cron/weekly-recap` | 17:00 UTC dimanche | Push recap semaine a venir aux merchants (X RDV, ~Y€ prevus, 7 jours glissants) |
| `/api/cron/blog-digest` | 06:30 UTC (8h30 Paris ete / 7h30 hiver) | **Diffusion des nouveautes** : envoie le prochain NOUVEL article (non diffuse) tous les 3+ jours min, du plus ancien au plus recent. **Audience** : tous les abonnes payants (`active`/`canceling`/`past_due`) quelle que soit la date d'inscription + trials inscrits depuis < 21 jours (`RECENT_TRIAL_SIGNUP_DAYS = 21`, onboarding educatif). Source `src/data/blog-articles.ts`. **Throttle global** entre articles via table `blog_email_dispatches` (mig 125). **Dedup per-merchant** via table `blog_email_recipients` (mig 126, PK `(article_slug, merchant_id)`). Template `BlogDigestEmail.tsx`. Respecte `canEmail()`. Envoi cadence via `sendPaced()` (lots de 4 / 1,1 s, ≤ 5/s Resend — corrige un risque de 429 sur gros volume). |
| `/api/cron/blog-drip` | 08:00 UTC | **Sequence d'accueil (drip)** : envoie aux ESSAIS (`trial`) inscrits depuis ≤ 90 j (`DRIP_WINDOW_DAYS`) le back-catalogue d'articles, **du plus recent au plus ancien**, **1 tous les 2 jours par salon** (`DRIP_SPACING_MS`), jusqu'a epuisement des articles. Premier envoi seulement si inscrit depuis ≥ 24 h (`DRIP_MIN_AGE_MS`, ne pas telescoper l'accueil J0). **S'arrete a la conversion** (un salon qui devient payant sort du statut `trial` → plus cible ; il garde la diffusion des nouveautes via `blog-digest`). Logique pure testable dans `src/lib/blog-drip.ts` (`isDueForDrip`, `pickNextDripArticle`). **Zero doublon** : meme table `blog_email_recipients` (dedup par article) + espacement 2 j calcule sur `MAX(sent_at)` (inclut les mails du `blog-digest`). **N'ecrit QUE dans `blog_email_recipients`** (jamais `blog_email_dispatches`, sinon `blog-digest` sauterait l'article pour les payants). Envoi cadence `sendPaced()`. Dry-run : `?dry=1`. Aucune migration (la table a deja `sent_at`). |
| `/api/cron/monthly-contest` | 08:00 UTC, 1er du mois | Tirage au sort mensuel : pick random parmi clients ayant un RDV le mois precedent (online + manuels, hors `__blocked__` et annulations), insert merchant_contests, push + email merchant (template ContestWinnerEmail) |
| `/api/cron/stripe-reconcile` | 09:00 UTC | Reconciliation force-cancel Stripe : aligne en `canceled` les merchants `past_due` > 14j dont l'abo Stripe est `canceled`/404, envoie `SubscriptionForceCanceledEmail`. Ferme le trou des `customer.subscription.deleted` ratees |
| `/api/cron/reactivation` | — | Deprecie (integre dans morning, section 7) |

### Anti-spam & Delivrabilite
- `List-Unsubscribe` + `List-Unsubscribe-Post` headers (RFC 8058, one-click unsubscribe)
- One-click unsubscribe endpoint : `POST /api/email/unsubscribe?token=` (HMAC token par merchant, expire 90j)
- Lien GET dans footer email pour desinscription via navigateur
- Dedup via `pending_email_tracking` table
- WhatsApp retire de tous les emails (delivrabilite)
- Bounce/complaint webhook : `POST /api/resend/webhook` (signature svix). Marque `email_bounced_at` (bounce) ou `email_unsubscribed_at` (complaint) sur merchants
- Crons filtrent les merchants avec `email_bounced_at` ou `email_unsubscribed_at` non null (plus aucun email envoye)
- Tags Resend sur chaque email (categorie) pour analytics dans le dashboard Resend
- Env var : `RESEND_WEBHOOK_SECRET` (svix signing secret depuis Resend dashboard)

---

## 10. Pages Principales

### Landing (`/`)
Hero → FeaturesGridSection (**3 cards** "100/0%/0€" : badge chiffre + titre [SMS inclus / Commission acomptes / Programme fidelite digitale] inline, desc full-width — grid `grid-cols-1 md:grid-cols-3`) → **PageProSection** (acquisition : vitrine + planning + acomptes — titre "Tes résas en ligne, **0% de commission**.") → **FideliteSection** (retention : titre "Le programme de fidélité digitale, **inclus dans ton forfait 24€**." — la ligne "tout seul 14€/mois" a été retirée avec le plan Fidélité, juillet 2026) → SocialProofMergedSection (4 temoignages reels Farida T./Yam Nails/Ericka B./L'Beauty by Lindsay + case study Nail Salon by Elodie fusionnes — grid `md:grid-cols-2 lg:grid-cols-4`, fond `bg-white`) → PricingSectionCondensed → FAQ → Footer. **PricingTransitionSection supprimée** (juillet 2026) : elle justifiait le choix entre 2 plans, devenu sans objet avec le retrait Fidélité. **PricingSectionCondensed = carte unique Tout-en-un** (24€). Ordre cycle client : acquisition → retention → preuves → pricing. Toutes les sections landing utilisent des emojis au lieu d'icones Lucide. Typo landing : titres de section en Playfair Display italic sur les mots gradient + surlignage indigo. CTAs primary uniformement `bg-gradient-to-r from-indigo-600 to-violet-600`. Espacement vertical sections uniformise sur `py-16 md:py-20`.

**FeaturesGridSection rework avril 2026** : **3 cards** au lieu de 6 (suppression bookingTitle/contestTitle/reviewsTitle + cleanup keys mortes). Titre section : "Facturé chez les concurrents." + highlight italic indigo "0€ chez Qarte." Subtitle pivoté vers économies annuelles uniformisees a 1 150€ (idem hero/FAQ a14, fini la divergence 700€ vs 1150€). Cards = badge chiffre a gauche + titre en ligne (pas de duplication du chiffre dans le titre, lecture en parallele [chiffre] [feature]) :
- **100** badge + "SMS inclus chaque mois"
- **0%** badge + "Commission sur tes acomptes"
- **0€** badge + "Programme de fidélité digitale"

> **Juin 2026** : les 3 sous-lignes « competitor » (« Chez Booksy 20% sur tes RDV », « Planity option fidélité ~25€/mois », « Booksy SMS ~0,10€ ») ont été **supprimées** — affirmations fausses (Planity/Booksy ne commissionnent pas les RDV, abonnement fixe). Cf. section « Repositionnement sans commission ».

Typo cards normalisee sur l'echelle Tailwind standard (`text-lg md:text-xl` titre / `text-sm md:text-base` desc) — fini les pixel-locked sizes.

Hero (rework avril 2026, **Burger King vs McDo style** sur l'objection prix) :
- titlePart1 (noir, 2 lignes via `\n`) : "Tu paies 85€ par mois\nchez la plateforme N°1 ?"
- titlePart2 (rose-500) : "Chez Qarte, c'est 24€."
- subtitle parite + bonus + chiffre : "Mêmes résas, mêmes SMS, même planning. Un programme de fidélité digitale offert en plus. Tu économises près de 1 150€ par an." (anaphore "même × 3" repond a l'objection switching cost)
- ctaPrimary : "Créer ma page beauté gratuitement" (gradient indigo→violet)
- ctaSubtext : "3 jours gratuits · Sans carte bancaire" (1 ligne sobre, leve l'incertitude duree gratuite)
- "85€/mois" wrappe avec U+2060 (Word Joiner) entre 85€/mois pour empecher le navigateur de couper a la barre oblique sur mobile
- Code splitter title supporte `\n+` ou separateur de phrase (`/(?<=[.?!])\s+/`)
- Hero mockup : `HeroPersonMockup` (style Bookin Beautiful) — photo pro beauté générée Imagen 4 (fond supprimé via rembg, `public/images/hero-person-4-crop.png`, z-20 au centre), 3 cartes flottantes : **SMS rappel** (top, z-30), **Rdv du jour** (gauche, z-10, -rotate-6), **Fidélité** (droite, z-10, +rotate-6). Container 580×620px, scale responsive 0.62→1, `min-w-0` sur colonnes grid pour éviter overflow mobile.
- Hero responsive : single-col jusqu'a `xl` (1280px+) ou bascule en 2-col `[1fr_1.2fr]` (image col elargie pour contenir mockup 580px sans overlap). iPad Pro 13" portrait (1024×1366) reste single-col, evite chevauchement texte/image. Pill social proof au-dessus H1 affiche logos top 5 marchands DB via `getTopMerchants()` server-side cache 7j.
- MobileStickyCta : sticky bottom mobile-only, copy synchro avec hero ("Creer ma page beaute gratuitement"). Cache automatiquement quand `#footer-cta` entre dans le viewport (IntersectionObserver) pour ne pas couvrir la checklist du footer.
- SocialProofMerged avatars : 4 logos hardcodes en local (`public/images/testimonials/{laila,ericka,yam,lindsay}.{jpeg,png}`) — pas de query DB runtime, simple. Farida T. (pas de compte) affichee en cercle colore "F". Roles alignes au shop_type DB reel : Yam=Prothesiste ongulaire, Ericka=Institut de beaute, Lindsay=Institut de beaute. Mini-citation Doux Regard (fausse) remplacee par Laila (mini dans FideliteSection, role corrige Estheticienne→Prothesiste ongulaire). JSON-LD Reviews dans `src/app/layout.tsx` itere sur les 4 testimonials. Case study Nail Salon by Elodie en bloc separe (fond `bg-stone-900`), CTA contextuel "Demarrer mes 3 jours gratuits" (au lieu du generique "Tester gratuit, sans CB" qui tuait le momentum narratif).
Footer badge Google Reviews : logo Google couleur + 5 etoiles + "5.0 sur Google" — sous "Concu avec amour a Marseille par Tenga Labs" dans FooterDark

SocialProof bandeau : "Plus d'un millier de **pros de la beaute** attirent et **fidelisent** avec Qarte" — mots cles en indigo-600

Demos accessibles via : bouton hero → demo carte fidelite, page vitrine `/p/demo-*`, selecteur tampons/cagnotte sur carte demo.

**SEO getqarte.com (avril 2026)** : meta description mise a jour pour forcer "Qarte" en premier mot (reduit le hijack par footer dans Google SERP) : *"Qarte — l'app tout-en-un des salons de beaute : carte de fidelite digitale, reservation en ligne sans commission, page salon. Essai 3 jours."* LandingNav desktop + mobile ajoute liens **Blog** + **Comparatifs** (pointe `/compare/planity`) pour influencer les sitelinks Google (pages nav-level > pages footer-only).
Demo popup (sessionStorage) : explique les 2 piliers (carte + vitrine) au premier affichage de la demo carte.
CTA uniforme : "Essayer gratuitement" (toutes sections). Positionnement : page pro (acquisition) + programme fidelite (retention) = un seul outil. Lien en bio = feature principale.

**Landing rework avril 2026 — VOC-driven** (skills `copywriting`, `page-cro`, `product-marketing-context`, `competitor-alternatives`) :
- Douleurs adressees : DMs Insta chaotiques (phone VOC), commissions cachees Booksy/Planity (Anne-Lise + Oceane WhatsApp), supplements Book in Beautiful (Oceane), anxiety PWA install (Anne-Lise), interface intuitive (multiple merchants).
- Differenciateurs explicites : 0% commission acompte (lien own Revolut/Stripe/PayPal), SMS inclus, fidelite creee auto a chaque resa (interconnexion).
- Banniere Planity/Booksy/Book in Beautiful = 2 options (garde / migre) au lieu de simple compat — repond a JTBD Four Forces (push/pull/habit/anxiety).
- Liens compare colores aux marques : Qarte violet · Planity noir · Booksy sky-500 · Book in Beautiful rose-500.
- Scroll reduit ~750px : fusion planning+SMS dans PageProSection (-450px), paddings py reduits (-300px).
- **Mention service à domicile** (avril 29) : `pagePro.planningDesc` raccourcie + bénéfice business mis en avant (`<accent>Tu te déplaces ? ... — tu cases plus de clientes dans ta journée sans jamais courir.</accent>`) — rendu via `t.rich()` avec span surligneur indigo (pattern `bg-indigo-100/70 -skew-x-3` derrière le texte). Bullet pricing condensé devient "Réservation en ligne — 0% commission · salon ou domicile". `/pricing` FAQ : nouvelle Q7 "Je travaille à domicile, est-ce que Qarte est compatible ?" (capture long-tail SEO + rassure niche pros mobiles). Pas de section dédiée volontairement (10-15% du marché — éviter de diluer le message principal Planity-killer).

### Login Client (`/customer`)
Fond gradient mesh anime (orbes indigo/violet/rose), 4 mini cartes de fidelite flottantes (Framer Motion), formulaire glass-morphism (`bg-white/70 backdrop-blur-2xl`), footer "Propulse par Qarte en France"

### Wallet Client (`/customer/cards`)
Design Apple Wallet, fond `bg-[#f7f6fb]`, greeting typographique, cartes avec header merchant colore, glow reward-ready, dual tier barres

### Carte Fidelite Client (`/customer/card/[merchantId]`)
Header colore avec nom merchant. Boutons conditionnels dans le header : "Membre" (si member card active), "Reserver" (si `booking_url`), **"Infos"** (si `slug` — lien vers `/p/[slug]`, toujours affiche).

**Prochains rendez-vous** : section `UpcomingAppointmentsSection` (si `planning_enabled` et RDV a venir). Design compact : card blanche avec **bordure 2px merchant primary color** + shadow coloree, icone header 7x7, items `rounded-lg` avec fond `${p}08` + bordure `${p}1a`, date+heure **inline** (heure en merchant color avec icone `Clock`), services en liste a puces colorees, status acompte en **pill badge** (amber `Hourglass` si en attente, emerald `Check` si confirme). Message "Pour modifier ou annuler, contactez {shop} sur ses reseaux" en footer dans la card avec liseret top. **Placee juste avant le bloc parrainage** (pas entre offre et tampons).
**CardHeader — bouton sous le nom du merchant** : si `auto_booking_enabled && slug` → bouton unique **"Infos & reservations"** pointant vers `/p/[slug]` (la vitrine contient infos + resa Qarte). Sinon : boutons separes "Reserver" (vers `booking_url` externe) + "Infos" (vers `/p/[slug]`).
**StampsSection — descriptions de recompenses** : plus de Playfair italic, remplace par `font-bold` sans serif, colore en `merchantColor` (palier 1) et `secondaryColor || merchantColor` (palier 2). Accents `amber-800` quand palier 1 ready, `violet-800` quand palier 2 unlocked.

**Historique enrichi** : `HistorySection` affiche visites, ajustements, redemptions, vouchers + **RDV passes** (icone Calendar purple, noms services). API `/api/customers/card` retourne `upcomingAppointments` + `pastAppointments` en parallele.

**Badge cycle couronne** : quand un client complete un cycle (redeem palier unique ou palier 2 si dual), un badge "Xe carte" avec icone Crown apparait au-dessus de la grille de tampons. Couleur progressive : rose (1 cycle), violet (2-3), dore (4+). Calcule depuis `redemptions` (pas de colonne DB). Single tier = count all redemptions, dual tier = count tier 2 only.

### Scan (`/scan/[code]`)
Inscription rapide, validation passage, progression fidelite, detection `?ref=` pour parrainage

### Dashboard (`/dashboard`)

**Accueil refondu (avril 2026)** : structure adaptative Fidelite vs All-In.

**Ordre mobile** :
1. Greeting simple (pas de gradient) : `Bonjour {shop_name}` + motivation du jour
2. `OnboardingChecklist` — trial uniquement
3. **`HeroToday`** (`src/components/dashboard/HeroToday.tsx`) — gradient brand violet :
   - Mode All-In (planning enabled) : `X RDV · Y€` + timeline 4 RDV du jour + lien planning
   - Mode Fidelite : `X tampons · Y recompenses du jour` + 3 clientes proches palier 1 (mode visit only) + lien clients
4. `PendingDepositsWidget` (si planning enabled + count > 0)
5. **`ToSeeList`** (`src/components/dashboard/ToSeeList.tsx`) — one-liners compacts : anniversaires (avec prenoms), parrainages a valider, offres bienvenue. Icones colorees (pink/blue/amber).
6. **`WeekTiles`** (`src/components/dashboard/WeekTiles.tsx`) — 2 tiles flat colorees (Visites + Recompenses cette semaine vs precedente, fond emerald/red/slate selon trend)
7. `PendingPointsWidget` Shield (si `totalCustomers > 0`) — actions inline validation
8. Activity feed — liste dense, icones colorees (scan emerald, reward pink, referral blue, welcome amber)
9. **`SmsRecent`** (`src/components/dashboard/SmsRecent.tsx`) — section finale, collapsible, 5 derniers SMS envoyes (type + prenom client via join phone_to ↔ customers.phone_number scope merchant), quota pill, lien "Configurer" → `/dashboard/marketing?tab=automations`

**Supprime de l'accueil** : stats mensuelles (StatsCards total/actives/visits/redemptions), cagnotte StatsCards, Weekly Comparison Card, carte Birthdays pink, raccourcis mobile — tout migre vers `/dashboard/customers` ou ToSeeList.

**Palette reduite** : brand violet (hero uniquement), slate-900/500/100 (95%), emerald/red (tendances). Plus de rainbow 9 couleurs. Chaque section ToSee/WeekTile a sa couleur semantique sur l'icone seulement.

**Cache localStorage** : `qarte_dashboard_stats_v2_${merchantId}` (bumpe post-purge des stats). Invalide automatiquement au pull-to-refresh.

**Pull-to-Refresh** (`src/components/shared/PullToRefresh.tsx`, avril 2026) : `PullToRefreshProvider` monte dans le layout dashboard, hook `usePullToRefreshRegister(fn)` utilise par `/dashboard`, `/dashboard/planning`, `/dashboard/stats` pour enregistrer un silent refetch. Touch only (desktop ignore), indicateur `RefreshCw` indigo sous la top bar, threshold 70px, haptic feedback, listeners window attaches une seule fois via `isRefreshing` en ref. Chaque page consommatrice expose `{ silent?: boolean }` sur son fetch interne pour skipper le flash spinner. Pas de lib externe, ~200 lignes.

**Queries conditionnelles** : `todayVisitsCount`, `todayRedemptionsCount`, `nearRewardCustomers` gatees sur `!planning_enabled` (HeroToday mode planning les ignore, evite 3 requetes inutiles pour merchants All-In).

**Page Statistiques** (`/dashboard/stats`, avril 2026) : gatee sur plan tier `all_in` (`requirePlanFeature('planning')` cote API, UpgradeLock cote UI pour fidelity). Entree via `/plus` menu (`SECONDARY_ITEMS` dans `nav-config.ts`). Card d'entree sur la home apres `WeekTiles`. Floor dur avril 2026 (`STATS_FLOOR_YEAR/MONTH`). Filtres : pills mois scrollable + pills semaines (apparait quand un mois est actif, format « mer 1 → dim 5 »). Fill rate calcule depuis `opening_hours` (option B, formule `bookedMinutes / max(0, openMinutes - blockedMinutes)` — marche en mode libre ET creneaux). No-show tracking via `slot.attendance_status` (mig 124, valeurs `pending|attended|no_show|cancelled`) — boutons Venue/Absente sur `BookingDetailsModal` pour slots passes uniquement. API : `GET /api/dashboard/stats?merchantId=X&from=YYYY-MM-DD&to=YYYY-MM-DD`, `PATCH /api/planning/attendance`. **CA et no-show** (mai 2026) : un RDV `no_show` ne compte plus le prix de la prestation dans le CA (prestation non realisee) — il vaut uniquement l'acompte conserve si `deposit_confirmed=true`, sinon 0. Helper unique `noShowRevenue()` dans `src/lib/deposit.ts`, partage entre la page Stats (KPI CA + timeline CA/jour) et la pastille « CA du jour » de l'agenda (`computeDayRevenue` dans `planning/utils.ts`, qui recoit la config acompte du merchant via DayView/WeekView). Le « Top prestations » continue de compter les prestas des no-show (indicateur de popularite, pas de CA).

**Mois futurs dans Stats** (avril 2026) : le selecteur de mois affiche M+1 et M+2 si `>=1` booking confirme dedans. Endpoint dedie `GET /api/dashboard/stats/future-months` (cache 60s) interroge `merchant_planning_slots` pour la fenetre [premier jour M+1, dernier jour M+2] et retourne les mois distincts. Pills futures stylisees outlined indigo avec icone `ArrowUpRight`, distinctes des passes (gris) et de l'active (`#4b0082` solid). En mode futur (`isFuture = month > currentMonthKey`), labels nuances : "CA attendu", "Resas attendues", "Remplissage previsionnel". KPI non-pertinents (no-show, nouvelles clientes, taux retour, vouchers, parrainages) en mode `dimmed` (opacity-60 + valeur `—` + sub *Disponible apres la periode*). DeltaPill masque, charts secondaires (timeline new customers, top clients) masques, empty state dedie *"Pas encore de resas confirmees — c'est devant toi"*. Auto-scroll de la pill active au mount via `pillsContainerRef`/`activePillRef` quand des futures arrivent (defensif mobile <360px).

**Soft-prompt attendance matin** (`AttendanceCheckPrompt`, mig 137, avril 2026) : pour eviter au merchant de cliquer Venue/Absente sur chaque RDV passe, le cron `morning-jobs` bulk-update tous les slots passes (`attendance_status IS NULL OR = pending`, hors blocked et fillers) en `attended`. Le matin sur `/dashboard`, un widget compact apparait : *"Hier tu as eu N resas. Tout le monde est venu ?"* avec CTA principal full-width emerald-600 *"Tout bon, journee validee"* (1 tap = dismiss) ou expand list pour flipper individuellement en `no_show` (toggle 1-tap par RDV). Endpoint unique `/api/dashboard/attendance-check` : `GET` retourne `{showPrompt, bookings}` en se basant sur `merchants.last_attendance_check_at < startOfTodayLocal` (timezone via `getTodayForCountry(country)`), `POST` set `last_attendance_check_at = NOW()`. Gated dashboard `planning_enabled`. Tap targets >=44px (DESIGN.md mobile spec).

**Ban etendu aux flux client-facing** (avril 2026) : le bouton "Bannir" du modal client (action destructive du kebab dans `CustomerManagementModal`) ajoute le numero a `banned_numbers`. Avant cette MAJ, seuls `/api/checkin` (scan QR mode tampons) et `/api/cagnotte/checkin` (scan QR mode cagnotte) consultaient cette table — un client banni pouvait toujours reserver via la vitrine. Desormais 3 flux supplementaires bloquent : `/api/planning/book`, `/api/welcome` (offre nouveaux clients), `/api/referrals` (parrainage). Pattern uniforme via `getAllPhoneFormats()` (cohrence cross-border FR/BE/CH). Erreur 403 avec message neutre cote vitrine *"Ce numero ne peut pas reserver ici. Contactez directement le salon."*

**Quick Actions widget** (`src/components/dashboard/QuickActions.tsx`, avril 2026) : rendu sur `/dashboard/stats` entre le selector et les KPIs, section « A toi de jouer ». API `GET /api/dashboard/quick-actions?merchantId=X` (cache `private, max-age=60`) retourne top 3 par priorite sur 13 triggers : marquer presence, nouveau client, agenda vide demain, anniversaire semaine, proche recompense, recompenser VIP, clients inactifs 60j, suggerer acompte (no-show > 15 %), activer rappel J-0, campagne SMS, booster parrainage, activer SMS expiration voucher, activer SMS avis. 4 triggers ont une logique 2-etats selon les toggles auto-SMS et `PAID_STATUSES`. Action « marquer presence » ouvre `MarkAttendanceModal` (parent owns slots, modal stateless). `QuickActionIcon` type : strings `'flower'|'gem'|'lightbulb'|...`, icon map avec 13 icons cote widget.

**Liste clients** (`/dashboard/customers`) : design minimaliste sans avatar lettre — dot de statut colore (gris=en cours, vert=recompense prete, violet=tier 2) + nom + cloche push inline. Mobile cards + desktop table.

**Navigation sidebar** (desktop) : Accueil, Fidelite (icone Heart), Vitrine, QR code & Supports, Planning, Clients, Parrainage, Notifications, Abonnement, Parametres. **Brand header** : "Qarte" texte gradient uniquement (plus de Q carre depuis avril 2026).

**Bottom nav mobile (feature flag `NEXT_PUBLIC_MOBILE_BOTTOM_NAV=1`)** : 5 tabs — Accueil, Agenda, Clientes, QR, Plus. Chaque tab a sa couleur semantique visible en permanence (indigo/cyan/emerald/violet/violet). Dot indicator 4px sous label actif. Haptic 8ms au tap. "Plus" ouvre un bottom sheet compact demi-ecran droite (`MoreSheet.tsx`) avec items secondaires (Fidelite, Vitrine, Notifs, Parrainage, Abonnement, Parametres) + WhatsApp help + logout icone. NotificationBell top-right mobile (cercle 36px plat, plus de glass card). Config centralisee dans `src/app/[locale]/dashboard/_nav/nav-config.ts`. Hook `useVirtualKeyboardVisible` masque le bottom nav quand clavier iOS ouvre.
- **Membres** (`/dashboard/members`) : retire de la nav, accessible via bouton "Programmes VIP" dans Clients
- **Ma Page** (`/dashboard/public-page`) : 3 sections collapsibles avec bordure coloree et header gradient — "Mon salon" (emerald: InfoSection), "Contenu" (pink: PhotosSection, ServicesSection), "Acquisition" (violet: WelcomeSection, PromoSection). Sub-components dans fichiers separes, exposes via `forwardRef`/`useImperativeHandle` avec `save()`. Autosave debounce 1.5s : chaque enfant appelle `onDirty`, le parent orchestre `Promise.all` sur les `save()`. Barre de completion SVG ring (7 items : nom, adresse, bio, logo, horaires, reseaux, bienvenue) — lien page publique visible seulement si completion >= 3/7. Deux modals au niveau page : help modal (explication page) et welcome help modal (remonte depuis WelcomeSection). **ServicesSection** : edition d'une prestation permet de **changer sa categorie** via pills (et de **creer une nouvelle categorie inline** depuis le formulaire d'edition, auto-selectionnee apres creation).
- **Parametres** (`/dashboard/settings`) : email (lecture seule), type commerce, telephone, infos compte, export CSV, zone danger. Nom et adresse geres dans Ma Page uniquement.
- **Parrainage** (`/dashboard/referrals`) : config parrainage uniquement (toggle, recompenses parrain/filleul). Stats et tableau filtre (vrais parrainages uniquement, welcome exclus).
- **QR Code & Supports** (`/dashboard/qr-download`) : QR code + Kit reseaux sociaux (image HD, legendes, grille 2x2 coloree de 4 tips + lien cross-promo vers Ma Page). Post-QR modal redirige vers Ma Page.

### Admin (`/admin`)
Metriques startup (MRR, churn, ARPU, LTV), lifecycle segments, health score, annonces, leads, analytics, tracking. **Exclut les comptes admin** des stats. Feature adoption (`/api/admin/analytics`, page `/admin/analytics` onglet Activation) : 26 flags trackés — logo, parrainage, anniversaire, offre nouveaux clients, jours doubles, planning, shield, palier 2, PWA, avis Google, booking URL, résa en ligne, **RDV de suivi +3/+6**, **service à domicile**, **acompte**, **annulation client**, **modification client**, **bons cadeaux**, **jeu concours**, **offre duo**, **offre étudiant**, prestations, photos, mode cagnotte, planning créneaux, planning libre. Health score : /100 (programme +15, logo +10, reseaux +5, avis +5, reservation +5, clients +10-20, **activité/récence merchant +5-25**, parrainage +5, shield +5, palier2 +5, bienvenue +5, anniversaire +3, double jours +2, planning +5, resa en ligne +5). **Activité merchant (juin 2026) — basée sur `merchants.last_seen_at` (dernière ouverture du dashboard, MAJ dans `MerchantContext`), et NON plus sur les scans clients** : alimente le badge lifecycle Actif/Inactif Xj/« Jamais connecté » (`getLifecycleStage`), la colonne Activité + le tri (liste), la récence du health score (liste + détail : <3j +25, <7j +20, <14j +10, <30j +5), et le KPI « Actifs 7j » de l'accueil admin (merchants avec `last_seen_at` ≤ 7j). La fiche marchand affiche « Dernière connexion ». **Dashboard** : 3 stat cards planning (Planning actif, Resa en ligne, Mode Libre). Badges merchants : Admin, NC, Shield pending, Resa/Planning, Libre, PWA, Bienvenue, Cagnotte, Page. **Detail merchant** : stat planning "X reservations / Y creneaux" + "Resas en ligne (total)" + "Resas manuelles (total)" (`booked_online=false`, icône UserPlus), feature badges (Planning, Mode Libre, Buffer Xmin, Annulation J-X, Modif J-X), horaires avec pause dejeuner. **WhatsApp** : dropdown 2 onglets (Marketing 4 msgs + Tuto 2 msgs), constante `ADMIN_CONTACT_NAME` — sur liste et detail.

**Notification Bell** (mig 104) : icone cloche dans le header dashboard (mobile top-right fixe + desktop sidebar) avec badge rouge unread count. Dropdown 10 dernières notifs avec emoji par type (📅 booking, ❌ annulé, 🔄 déplacé, ⏰ acompte expiré, ⚠️ acompte bientôt, 🎂 anniversaire, 🎉 concours, 👋 onboarding, 🔔 default). "Tout lu" pour marquer comme lues. Click → deep link vers la bonne date du planning. Polling 60s. API `/api/merchant-notifications` (GET + PATCH). Composant `src/components/dashboard/NotificationBell.tsx`.

**Monitoring crédits SMS providers** (`/admin/sms` Aperçu) : 2 cards live `OVH` + `SMS Partner` affichant le solde restant chez les providers (différent de la conso merchant). Helpers `getOvhCredit()` ([`src/lib/ovh-sms.ts`](../src/lib/ovh-sms.ts)) + `getSmsPartnerCredit()` ([`src/lib/sms-partner.ts`](../src/lib/sms-partner.ts) — lit `data.credits.creditSms` du `GET /v1/me`). Route `/api/admin/sms/credits` cache module-level 5min. Cron daily `/api/cron/sms-credits-check` (8h UTC) → email alerte `contact@getqarte.com` si crédit `<50` (constante `SMS_CREDIT_LOW_THRESHOLD` partagée), dedup via `app_config(sms_credit_alert_*_last_sent_at)`, reset auto si crédit ≥75. Voir [`docs/sms-system.md`](./sms-system.md#monitoring-crédits-providers-ovh--sms-partner).

### Page Publique Programme (`/p/[slug]`)
Bio reseaux sociaux, sans auth. **JAMAIS de QR code ni lien /scan/** sur cette page (sauf CTA offre nouveaux clients → `/scan/{code}?welcome=`).
**Pas de pixels FB/TT ni cookie banner** sur cette page (c'est la vitrine du merchant, pas la landing Qarte). Seul `trackCtaClick` (Vercel Analytics, first-party, exempt RGPD) est conserve. Le `CookieBanner` detecte `/p/` et ne s'affiche pas.

**Trial expire — suspension customer-facing** : `getTrialStatus().isTrialExpired` (true des la fin d'essai sans abo, incluant la grace) bloque les actions client-facing. Bandeau rouge sticky `<SuspendedBanner />` (shared, clef i18n `common.suspendedBanner`) affiche sur `/p/[slug]` ET `/scan/[code]`. Bouton "Reserver" + slots desactives (opacity-50 + disabled). APIs client-facing (checkin, cagnotte/checkin, planning/book, welcome, referrals, merchant-offers/claim, vouchers/use) retournent 403. Les emails grace/expiration (`GracePeriodSetupEmail`, `TrialExpiredEmail`) continuent de se declencher normalement sur `isInGracePeriod`/`isFullyExpired`.

**Ordre des sections :**
1. Hero (logo glow couleurs merchant, nom gradient, adresse + badge "Y aller", bio glassmorphism)
1b. **Shortcut "Mes RDV & fidelite"** (premium card gradient merchant + shimmer + watermark) — visible uniquement si cookie `qarte_cust` present cote serveur (client deja passe par Qarte). Pointe vers `/customer/card/[merchantId]` qui regroupe RDV a venir + carte fidelite. Lu dans `page.tsx` via `cookies()` et passe en prop `hasPhoneCookie` a `ProgrammeView`. Pose lors d'une resa/checkin/register/login (voir section Cookie client).
2. CTA "Prendre rendez-vous" (conditionnel sur `booking_url`) + sticky bar quand hors viewport + detection plateforme ("via Planity/Treatwell/Fresha/Instagram/TikTok/WhatsApp/..." via `detectBookingPlatform()` dans utils.ts — 15 plateformes detectees)
3. Horaires (liste verticale par groupes de jours consecutifs aux horaires strictement identiques — ex: `Lun–Ven · 10:00–14:00, 16:00–20:00` / `Sam · 10:00–14:00` / `Dim · Fermé`. Groupage via `slotSignature()` qui fusionne uniquement si `open|close|break_start|break_end` sont egaux. Pastille **Ouvert / Fermé** (emerald / gris) en haut a droite calculee depuis l'heure courante du fuseau merchant via `isOpenNow()` (gere la pause dejeuner). Ligne du jour courant highlight bg `${primary}0F` + texte couleur merchant)
4. Planning disponibilites (si `planning_enabled` : banniere message libre + creneaux glissants groupes par mois, preview 4 jours + bouton "Voir plus", creneaux du jour passes masques automatiquement). **Horizon de reservation configurable** (mig 168) : `merchants.booking_horizon_days` (30/60/90, defaut 90). Reglable dans `/dashboard/planning` > Parametres > Resa en ligne (card "Reservations a l'avance", pills 1/2/3 mois). S'applique aux 2 modes. `src/lib/booking-window.ts` reste la source unique : `BOOKING_HORIZON_DAYS=90` (defaut) + `BOOKING_HORIZON_OPTIONS` + `normalizeBookingHorizon()` (coerce la valeur DB, fallback 90). Lu par `api/planning/route.ts` (GET public), `p/[slug]/page.tsx` (SSR), `BookingModal.tsx` (maxDate calendrier) et `api/planning/book/route.ts` (garde serveur anti-spoof). **Delai minimum avant reservation** (mig 181, borne basse miroir de l'horizon) : `merchants.booking_min_lead_hours` (0/24/48, defaut 0 = aucun → incidence nulle). Anti derniere minute : une cliente ne peut reserver qu'au-dela du delai. Reglable dans Planning > Parametres (card "Delai minimum de reservation", chips Aucun/24h/48h). Le delai (en heures) peut couvrir plusieurs jours → on raisonne en instants : `isSlotBeforeLeadTime()` (generalise `isSlotInPast`, court-circuit si 0) + `leadCutoffDate()` (borne calendrier). Enforce sur book (`slot_before_lead_time`), customer-edit reschedule, listing public, free-slots + free-availability (mode libre) ; filtre cote vitrine (ProgrammeView + BookingModal : jours entiers dans la fenetre desactives, jour-frontiere partiellement dispo). Resa manuelle dashboard non bridee ; RDV de suivi jamais bloques.
5. Offre nouveaux clients (CTA conditionnel si `welcome_offer_enabled`, pointe vers `/scan/{code}?welcome=`)
5b. Offre promo (amber custom layout flex, depuis `merchant_offers`, valeur `-X%` à droite en `primary_color` merchant, CTA vers `/scan/{code}?offer={id}` si `!canBookOnline`)
6. Prestations (collapsible, ferme par defaut, "Mes prestations", icone gradient + glow)
6b. **Jeu concours du mois** (violet custom layout flex, juste apres prestations pour visibilite max — mai 2026 : sorti de "Avantages exclusifs", ré-positionné après prestations + redesign matching promo banner). Visible si `contest_enabled && contest_prize`. **Le lot affiché est le lot planifié du mois courant si défini, sinon `contest_prize`** (résolu serveur dans `getMerchantData` qui écrase `contest_prize` avec le `merchant_contest_prizes` du mois). Valeur `J-{daysUntilContestDraw}` à droite en `primary_color` merchant (countdown jusqu'au 1er du mois prochain = date du tirage cron `monthly-contest`). Crée urgence subtile pour pousser à reserver MAINTENANT et participer au tirage.
7. Carte fidelite simulee ("Carte de fidelite" + texte explicatif recompenses)
8. Palier 2 (si `tier2_enabled`)
9. Avantages exclusifs (anniversaire, parrainage, jours bonus)
10. Bon cadeau "offrir" (gradient merchant primary→secondary, si `gift_card_enabled` + tier `all_in`)
11. Galerie photos realisations (lightbox, grid 3 cols, max 6 photos depuis `merchant_photos`)
12. Reseaux sociaux (icones Instagram/Facebook/TikTok/WhatsApp/Snapchat). **WhatsApp auto-format** : si le merchant saisit `06 12 34 56 78` dans le dashboard, `normalizeSocialUrl('whatsapp')` dans `public-page/InfoSection.tsx` appelle `formatPhoneNumber()` pour convertir en E.164 selon `merchant.country` avant de generer `https://wa.me/33612345678`. Supporte les 10 pays PHONE_CONFIG.
13. CTA merchant ("Cree ta page beaute gratuitement")

**Design :** glassmorphism (`bg-white/70 backdrop-blur-sm border-white/60`) sur sections avantages, prestations, photos. Badge hero : "Qarte — La fidelite digitale des pros de la beaute et du bien-etre".

- JSON-LD `LocalBusiness` (name, address, image, url, makesOffer)
- SEO: `generateMetadata()` avec og:image (1ere photo ou logo), description dynamique
- **QR desktop flottant** : bloc fixe bottom-right (visible `lg:` uniquement) avec `BrandedQRCode` aux couleurs merchant — permet de scanner pour ouvrir sur mobile
- **Bouton "retour en haut"** : pastille ronde fixe bottom-right (couleur `primary_color` merchant, icône `ArrowUp`), apparaît après ~600px de scroll (fade+scale via `AnimatePresence`), scroll smooth vers le haut. Écouteur scroll passif + throttle rAF + garde anti no-op. Se décale en `bottom-20` au-dessus du bandeau démo. Libellé i18n `common.backToTop`

### Page Boutique — Carte NFC (`/boutique`)
Page produit immersive pour commander la carte NFC (20€, paiement Stripe one-shot via `STRIPE_NFC_URL`, livraison 7j). Refonte mai 2026 : vitrine produit alignée sur l'identité landing (gradient `#4b0082`→violet, Bodoni italic sur les mots-clés, accent fuchsia). Sections : hero drenched violet avec carte mise en scène (flottement + tilt, `useReducedMotion` respecté) → comparaison QR vs NFC → 3 étapes → grille réassurance 4 (compatible tous tels, sans app, sans abonnement, rien à recharger) → FAQ accordéon 5 questions → CTA final. Tutoiement merchant (cohérent landing). `LandingNav minimal` + `FooterDark`. i18n `boutique.*` FR + EN.

---

## 11. Design & UX

### Couleurs
- **Brand/Dashboard:** `#4b0082` (violet profond — emails, headers)
- **DB default merchant cards:** `#654EDA` / `#9D8FE8`
- **Landing CTAs:** Gradient `indigo-600` → `violet-600`
- **Landing emotion:** Rose/Pink (blobs hero, reward card)
- **PWA Icon:** Gradient indigo → rose
- **PWA Manifests:** 2 manifests distincts — `/manifest.webmanifest` (Next.js, `name: 'Qarte'`, `scope: '/customer'`) pour la carte client, `/api/manifest/pro` (API route, `name: 'Qarte Pro'`, `scope: '/dashboard'`) pour le dashboard merchant. Le hook `useInstallPrompt` injecte dynamiquement le manifest Pro via `<link rel="manifest">` sur le dashboard
- **Viewport PWA** (fix avril 2026) : `export const viewport` dans `src/app/layout.tsx` — `initial-scale=1`, `maximum-scale=1`, `viewport-fit=cover`, `theme-color=#4b0082`. Meta Apple : `apple-mobile-web-app-capable`, `-status-bar-style=default`, `-title=Qarte`, `mobile-web-app-capable`, `format-detection=telephone=no`. Corrige les bugs de clics figes en PWA iOS (tap delay 300ms, hit-test decale, safe-area home indicator). Fix s'applique aux PWA deja installees automatiquement (SW sans fetch handler = pas de cache HTML)

### Style
- Glassmorphism auth pages (`backdrop-blur-xl`, `bg-white/80`), fond lavande `#f7f6fb` avec 3 blobs animes (drift 10-14s) + 4 cartes de fidelite flottantes (Framer Motion) — meme background que `/customer`
- Cartes `rounded-2xl`/`rounded-3xl`, ombres douces
- Framer Motion animations, sidebar mobile = bottom sheet 50vh
- `cn()` pour classes conditionnelles

### Animations landing (passe emil-design-eng, mai 2026)
- `tailwind.config.ts` : `future.hoverOnlyWhenSupported = true` — **tous** les utilitaires `hover:` sont gates derriere `@media (hover: hover) and (pointer: fine)` (plus de faux `:hover` au tap mobile, 80% du trafic)
- Aucun `transition: all` dans `src/components/landing/` — proprietes explicites partout (`transition-[transform,box-shadow]` sur cartes/CTA, `transition-colors`, `transition-shadow`)
- Les reveals Framer `whileInView` utilisent un `transform` string (`translateY()`/`scale()`) au lieu des raccourcis `x`/`y`/`scale` — hardware-accelerated, pas de frames perdues au scroll
- Entrees `scale` >= 0.9 (jamais `scale(0)`), durees UI < 300ms, `motion-safe:` sur les boucles `animate-float-subtle`

### SEO
- Title: "Qarte - Carte de fidelite digitale pour salons de beaute"
- JSON-LD: Organization + SoftwareApplication (landing), LocalBusiness (page /p/[slug]), Article + BreadcrumbList + FAQPage (blog)
- Sitemap: pages statiques + blog + demos + compare (pages merchant exclues — decouverte organique)
- Pages merchant indexables mais PAS dans le sitemap (evite les sitelinks Google sous getqarte.com)
- `/scan/` et `/customer/` : noindex + robots disallow

### Blog (12 articles SEO/AEO — refresh avril-juin 2026)
- **Strategie funnel** : TOFU (acquisition) + MOFU (pain point) + BOFU (commercial intent)
- **Optimisation AEO** : answer-first paragraphs 40-60 mots, tables comparatives, statistiques sourcees (Square, BrightLocal, Bain, Beauty Business France), FAQPage + Article + Organization + SoftwareApplication + WebPage schema graph-linked via @id (mai 2026)
- **Articles actifs** (registre `src/data/blog-articles.ts`) :
  - `/blog/beauty-profs-2026-salon-beaute-marseille` — Événement juin 2026, salon pro Beauty Profs (14-15 nov 2026, Parc Chanot Marseille), angle niche ongles/cils-sourcils « pourquoi y aller » + fil rouge Qarte (remplir l'agenda après le salon). Schema **Event** (dates/lieu) en plus de Article+FAQ. Version neutre (Qarte n'expose pas / stand non décidé). Cover `article-12-cover.png` (Imagen, id:12). Faits vérifiés via beauty-profs.com (pas de prix/horaire inventé) (7 min)
  - `/blog/instagram-salon-de-beaute` — TOFU/MOFU juin 2026, "transformer tes abonnées en clientes" (tunnel abonnée→cliente, 7 idées de contenu, lien en bio, conversion+fidélité auto). Cluster fort volume : instagram salon coiffure/esthéticienne, idées posts, lien en bio. Maille vers ne-pas-mettre-lien-planity-bio + clients-planity-booksy + carte-fidelite + comment-attirer. Cover `article-11-cover.png` générée (Imagen, entrée `id:11` dans `scripts/generate_blog_covers.py`). `layout.tsx` dédié (9 min)
  - `/blog/augmenter-chiffre-affaires-salon-beaute` — mai 2026, 7 leviers de CA (fidélisation, no-show, bons cadeaux, panier moyen) (12 min)
  - `/blog/carte-fidelite-dematerialisee-salon-beaute` — BOFU mai 2026, carte digitale vs papier (comparatif outils, prix, parcours cliente 3 étapes) (8 min)
  - `/blog/service-domicile-salon-beaute-rayon-trajets` — niche pros mobiles, rayon + calcul trajets (5 min)
  - `/blog/acompte-rdv-salon-sans-commission` — BOFU mai 2026, angle "100% acompte direct sur compte pro via lien Revolut/PayPal/SumUp". Meta/FAQ/H1 adoucis en juin 2026 (frais de paiement sans % chiffrés) ; le corps garde encore 2 tableaux détaillés (frais Stripe ~1,8%, à revoir) (6 min)
  - `/blog/avis-planity-booksy-ne-tappartiennent-pas` — MOFU avril 2026, avis Google vs marketplace (5 min)
  - `/blog/ne-pas-mettre-lien-planity-bio-instagram` — MOFU avril 2026, anti-bait Instagram bio (5 min)
  - `/blog/clients-planity-booksy-ne-reviennent-jamais` — MOFU avril 2026, retention vs trafic marketplace (5 min)
  - `/blog/comment-attirer-clientes-salon-beaute` — TOFU, 12 strategies acquisition (10 min)
  - `/blog/eviter-no-show-salon-rendez-vous` — MOFU, methode 6 etapes anti-no-show + modele CGV (8 min)
  - `/blog/logiciel-reservation-en-ligne-salon-beaute` — BOFU, comparatif Planity/Treatwell/Booksy/Qarte (9 min)
- **Structure** : `src/app/[locale]/blog/<slug>/page.tsx` — page client avec JSON-LD inline, layout `[locale]/blog/layout.tsx` server avec `generateMetadata` locale-aware (metadata par défaut de l'index `/blog`). **Metadata par article** (juin 2026) : chaque article a un `layout.tsx` dédié dans son dossier avec `generateMetadata` (title unique + meta description + canonical + alternates + OG = cover de l'article, FR/EN), sinon l'article hériterait du titre générique du blog. Fait pour les 12 articles. Pour tout nouvel article, penser : `layout.tsx` dédié + entrée dans `src/data/blog-articles.ts` (registre `/blog` + cron blog-digest) + entrée dans `src/app/sitemap.ts` (liste codée en dur) + cover `article-N-cover.png` (entrée `id:N` dans `scripts/generate_blog_covers.py`)
- **Schema graph (mai 2026, article acompte-rdv-salon-sans-commission)** : Organization + SoftwareApplication (offers 24€/240€/Trial 7j) + WebPage + ImageObject + BreadcrumbList + Article (mentions des concurrents) + FAQPage, tous interconnectes via `@id`. Pattern a propager sur les autres articles
- **Email update** (`ProductUpdateEmail.tsx`) : lien pointe sur article comparatif logiciels (BOFU intent)
- **Process redaction** : `seo-audit` + `ai-seo` + `copywriting` + `schema-markup` skills, plus passe agent senior SEO (recherche concurrence reelle + volumes + SERP audit) avant brief, plus 3 agents audit en parallele post-redaction (copywriting + ai-seo + schema-markup) avant publication

---

## 12. Analytics & Tracking

- **GTM:** GTM-T5Z84DPV | **GA4:** G-WM3XVQ38BD
- **Facebook Pixel:** 1438158154679532 (PageView, Lead, CompleteRegistration, StartTrial, Purchase, InitiateCheckout)
- **TikTok Pixel:** D6FCUKBC77UC649NN2J0 (PageView, ClickButton, CompleteRegistration, Subscribe)
- **Microsoft Clarity:** vjx7g9ttax
- **Facebook CAPI:** server-side Purchase sur webhook Stripe (dedup event_id)
- **Admin Analytics** (`/admin/analytics`) : dashboard consolide 6 onglets (Revenue/Funnel/Activation/Engagement/Automations/Growth) — remplace les anciennes pages `/admin/metriques` + `/admin/tracking` (fusionnees en avril 2026). **Revenue tab** sépare le billing en 3 : Mensuel / 6 mois / Annuel (KPI card + `SplitBar` par intervalle) — le 6 mois (`semestrial`) n'est plus agrégé avec l'annuel (`semestrialMrr`/`semestrialCount` dans la réponse `/api/admin/analytics`). Couvre MRR + tier mix + ARPU + churn + mrrHistory, funnel signup + trial-to-paid + avgTimeToConvert, activationRate + feature adoption 26 flags, engagement actifs 7j/30j + scans trend + top 10, push/email automation + booking conversion. **Growth tab refondu (mig 155)** : 5 KPI cards rolling 4 sem (net new paying + delta, WAU/MAU, share online, cohort 4w retention, gift cards CA) + 3 charts hebdo (BarChart stacked vitrine vs manuel, LineChart acquisition+scans, ComposedChart funnel SaaS) + mini-chart marketing SMS trial + section cumulative (référrals + vouchers by source). 2 routes : `/api/admin/analytics` (5 onglets) + `/api/admin/analytics/growth` (Growth tab dédié, 2 RPCs Postgres + cache 5min keyé sur weeksBack).
- **CTA tracking** : `trackCtaClick(name, location)` sur tous les CTAs signup (13 landing + 4 demo), stocke `signup_source` en localStorage → DB merchants. Visible dans `/admin/merchants`. `trackFaqOpened` capte les questions FAQ lues.
- **Affiliation** (`/admin/affiliation`) : liens partenaires avec commission % personnalisable, suivi inscriptions + conversions. Lien format `?ref=SLUG` → `signup_source = 'affiliate_{slug}'`. Bandeau personnalise sur la page signup. Table `affiliate_links` (mig 081). API publique `/api/affiliate/resolve` pour resoudre slug → nom partenaire. 2 onglets : "Liens actifs" (existant) + "Demandes" (candidatures ambassadeur avec approve/reject)
- **Programme Ambassadeur** (`/ambassadeur`) : page publique avec formulaire candidature (prenom, nom, email, telephone, profil, message, code personnalise). 20% commission recurrente. Flow : formulaire → `POST /api/ambassador/apply` (rate limited) → insert `ambassador_applications` (mig 110) → email notification admin → admin approve/reject dans `/admin/affiliation` → a l'approbation : slug auto-genere ou personnalise, insert `affiliate_links`, email bienvenue ambassadeur (`AmbassadorWelcomeEmail.tsx`)
- **Pages comparatif** (`/compare/[competitor]`) + **alternatives** (`/alternatives/[competitor]`, même `CompareContent` variant `alternative`) : **Planity, Booksy, Book in Beautiful, Treatwell, Fresha** (5 concurrents, juin 2026 +Treatwell/Fresha). `COMPETITORS` codé en dur dans les 2 `page.tsx` + type `Competitor` + map `competitorValue` (chaque ligne `FEATURES`) + clés i18n par concurrent (`{c}_name/desc/sms/commission/google_reviews/app/inactive_reminders/tldr/chooseThem/bestFor1-3` + `metaTitle{C}/metaDesc{C}/altMetaTitle{C}/altMetaDesc{C}`, FR+EN) + entrée sitemap. **Treatwell/Fresha = modèle marketplace à commission** (Treatwell 25% / Fresha 20% sur les nouvelles clientes), positionnés honnêtement (forces : caisse, équipe, stock, marketplace ; faits vérifiés sur sites officiels, pas de prix inventé). `planity_tldr` corrigé juin 2026 (Planity fait aussi caisse + un peu de fidélité, ne plus dire « se limite à la prise de RDV »). TL;DR + tableau features + section "Pour qui" + FAQ. Liens dans le footer landing. Matrice `FEATURES` dans `CompareContent.tsx` (juin 2026, équilibrée/honnête) : lignes **en faveur des concurrents** (Logiciel de caisse, Multi-utilisateur, Gestion des stocks, App requise) + lignes neutres (SMS rappels « Inclus » 2 côtés, Acompte « Inclus » 2 côtés, Commission 0%/0% sauf Boost Booksy) + avantages Qarte (fidélité tampons+cagnotte QR/NFC, vitrine réseaux, parrainage, offres, relances). Avis Google : concurrents = « Avis propriété Planity/Booksy » (custom). Lignes Notifications push et QR/NFC supprimées. **Ton neutralisé (juin 2026)** : `compare.heroTitle` passé d'un angle agressif (« Tu paies {competitor} pour réserver. Et la fidélité ? ») à un titre factuel **« Qarte ou {competitor} : les principales différences »** (clé templatée, vaut pour les 5 pages) ; `finalCtaTitle` jab « Tes clientes méritent mieux qu'une simple réservation » → « Réservation, fidélité et vitrine réunies ». `planity_chooseThem` reconnaît la fidélité **basique** de Planity (dans son logiciel de caisse, sans tampons ni QR/NFC, d'où le ❌ honnête sur la ligne `feature_loyalty` qui nomme précisément « tampons + cagnotte QR/NFC ») et précise que la vitrine sert à afficher réseaux sociaux + produits. `chooseQarteDesc` enrichi (budget serré + active sur les réseaux + tout-en-un). **Reframe « app » (PWA)** : ligne `feature_app_download` renommée **« App obligatoire pour réserver »** (Qarte `appQarte` = « Non, appli en option » car la PWA reste dispo ; concurrents « Oui, app requise ») — évite de prétendre faussement que Qarte n'a aucune app. Em dashes purgés de tout le namespace `compare` (faqA1, metaTitles, altMetaTitles, altMigration) pour conformité impeccable.

- **Repositionnement sans commission (juin 2026)** : suite à vérification (Planity/Booksy = abonnement fixe, **0 commission sur les RDV** ; seul le Boost Booksy commissionne les nouvelles clientes du marketplace ; Treatwell = vraie commission marketplace), tous les claims « le concurrent prend une commission » ont été retirés (landing FeaturesGrid + PagePro + FAQ a14/a15, `/pricing` tableau, `/compare` + `/alternatives` reason2/metas/tldr, pricing.md, combien-coute-booksy recadré sur le Boost, blog clients-planity-booksy/logiciel-reservation/ne-pas-mettre-lien, momentum emails réactivation). « 0% commission » conservé uniquement quand ça décrit **Qarte** (vrai : acomptes via lien propre du pro). Argumentaire recentré : **prix fixe plus bas + tout-en-un + pas d'app + vitrine réseaux/SEO**. Évite le risque de publicité comparative trompeuse (art. L122-1).

---

## 13. Variables d'Environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
STRIPE_PRICE_ID_ANNUAL=
RESEND_API_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
ADMIN_SECRET_CODE=
CRON_SECRET=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA4_ID=
FACEBOOK_CAPI_ACCESS_TOKEN=
NEXT_PUBLIC_APP_URL=
CONTACT_EMAIL=
OPENROUTESERVICE_API_KEY=  # Mode service à domicile, signup gratuit https://openrouteservice.org/dev/
```

---

## 14. Conventions

### Imports : React/Next → externes → internes → libs → types
### Nommage : PascalCase (composants, types), camelCase (utils), kebab-case (routes API)
### Styles : Tailwind inline, `cn()` conditionnel
### Hooks : TOUS les hooks (useState, useEffect, useMemo, useCallback, useRef, useTranslations, useLocale, useRouter, etc.) DOIVENT etre declares AVANT tout early return conditionnel. Jamais de hook apres un `if (...) return`. Regle React absolue — violation = crash #310 en prod.

---

## 15. Terminologie

| Terme | Signification |
|-------|---------------|
| passage / tampon | Visite client validee (scan QR) |
| palier | Niveau recompense (tier 1 / tier 2) |
| scan_code | Code unique merchant pour QR (8 chars) |
| referral_code (merchant) | Code parrainage merchant (QARTE-XXXX) |
| referral_code (carte) | Code parrainage client (6 chars) |
| voucher | Bon de recompense (parrainage/birthday/redemption) |
| shield | Systeme anti-fraude Qarte Shield |
| cagnotte | Cashback cumule (% du montant depense) |

---

## 16. Securite — QR Code

**Le QR code et l'URL `/scan/[code]` ne doivent JAMAIS apparaitre sur une page publique.**
Le scan est reserve au merchant (affiche en boutique). Exposer le lien permettrait de s'octroyer des tampons frauduleusement.

---

## 17. Capacite

| Metrique | Capacite |
|----------|----------|
| Marchands | ~5000-8000 |
| Checkins/jour | ~20,000 |
| Push/envoi | ~5,000 |
| Clients/marchand | ~2,000 |
| Prestations/marchand | **60** (`MAX_SERVICES_PER_MERCHANT` dans `lib/plan-tiers.ts`) — hard limit serveur + soft limit UI (forme d'ajout cachée au-delà). Bumpé de 50→60 en mai 2026. Au-delà, l'UX vitrine se dégrade (modal résa devient un mur) — recommander aux pros de grouper en catégories. Catégories : 10 max ([api/services/route.ts:100](../src/app/api/services/route.ts#L100)) |

*Details dans `docs/AUDIT-SCALABILITE.md`*

---

## 18. Marketing Skills (ressource externe)

**Path :** `/Users/judicaelahmedtraore/Documents/SAAS/marketing skills for ai agent/skills/`

34 skills marketing (Corey Haines, Agent Skills spec) — chaque dossier contient un `SKILL.md` a lire avant la tache correspondante. A utiliser pour toute tache marketing/SEO/copy sur Qarte (audit SEO, redaction blog, landing copy, comparatifs, CRO, etc.).

### Principaux skills
- **SEO / AEO** : `seo-audit`, `ai-seo`, `schema-markup`, `programmatic-seo`, `site-architecture`
- **Content / Copy** : `content-strategy`, `copywriting`, `copy-editing`, `social-content`
- **CRO** : `page-cro`, `signup-flow-cro`, `onboarding-cro`, `form-cro`, `popup-cro`, `paywall-upgrade-cro`, `ab-test-setup`
- **Acquisition** : `paid-ads`, `ad-creative`, `cold-email`, `email-sequence`, `referral-program`, `competitor-alternatives`, `lead-magnets`, `free-tool-strategy`, `community-marketing`, `launch-strategy`, `marketing-ideas`
- **Retention / Revenue** : `churn-prevention`, `pricing-strategy`, `customer-research`, `marketing-psychology`, `analytics-tracking`, `revops`, `sales-enablement`, `product-marketing-context`

### Methodologie
1. Identifier les 2-4 skills pertinents pour la tache
2. Read les `SKILL.md` en parallele
3. Appliquer la methode (ne pas improviser)

### Historique
- Blog refresh avril 2026 : `ai-seo` + `content-strategy` + `copywriting` + `schema-markup` → 3 articles funnel TOFU/MOFU/BOFU
- Audit SEO landing avril 2026 : `seo-audit` + `ai-seo` + `schema-markup` + `copywriting` → 27 findings, 3 critiques corrigees (JSON-LD dedupe, hreflang EN, canonical)
