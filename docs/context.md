# Qarte SaaS — Contexte Projet

> Document principal du projet. Pour le schema DB complet, voir `docs/supabase-context.md`.

---

## 1. Overview

**Qarte** — Plateforme SaaS tout-en-un : reservation en ligne + fidelite (tampons/cagnotte) + vitrine SEO. Le client qui reserve recoit automatiquement sa carte de fidelite.

- **URL:** getqarte.com | **Deploiement:** Vercel
- **Langues:** Francais uniquement (EN desactive via redirect 301, infra conservee) via `next-intl` | **Version:** 0.1.0
- **Pays:** FR, BE, CH uniquement (signup + PhoneInput)
- **Ton FR:** tutoiement dashboard merchant, vouvoiement client-facing
- **Essai:** 7 jours | **Prix:** 24€/mois ou 240€/an
- **Cible:** Salons de beaute (coiffeurs, barbiers, instituts, ongleries, spas, estheticiennes)
- **Entite:** SAS Tenga Labs — 58 rue de Monceau, CS 48756, 75380 Paris Cedex 08

---

## 2. Tech Stack

- **Next.js** 15.5.12 (App Router) + **React** 18.3.1 + **TypeScript** 5.6.2
- **Tailwind CSS** 3.4.13 + **Framer Motion** (animations)
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- **Stripe** (paiements) + **Resend** (emails) + **OVH SMS** (SMS transactionnels)
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
│   │   └── page.tsx       # Landing page
│   ├── layout.tsx         # Root shell (fonts, analytics)
│   └── [locale]/layout.tsx # Locale layout (NextIntlClientProvider, metadata)
│
├── components/
│   ├── landing/           # Hero, SocialProof, FeaturesGridSection (grille 9 features), FideliteSection (light), PageProSection (dark), Testimonials, Pricing, FAQ, Footer
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
├── AUDIT-MARKETING.md    # Score 67/100
├── AUDIT-SECURITE.md     # Score 92/100
└── AUDIT-SCALABILITE.md  # Score 88/100

supabase/migrations/      # 76 fichiers SQL (001-074 + 008b)
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

**Flux scan** : QR → telephone → **saisie montant** (jauge 5s) → `POST /api/cagnotte/checkin` → meme logique + montant

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
| Saisie client | Rien | Montant depense (jauge 5s) |
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
- Cron morning genere les vouchers anniversaire
- Dashboard accueil : section "Anniversaires a venir" (3 jours, aujourd'hui inclus) si `birthday_gift_enabled`

### Avis Google
- `review_link` sur `merchants` — lien Google review du commerce
- Modal `ReviewModal` declenchee automatiquement : au 1er passage, au 3e passage (`current_stamps === 1 || 3`), apres chaque redeem, apres chaque voucher consomme
- Modal `ReferralModal` declenchee au 2e, 5e, 10e passage (si `referral_program_enabled`). Affiche recompenses parrain+filleul, Web Share API / clipboard. Cooldown 90j (`qarte_referral_shown_{merchantId}`). Guard `!showReviewModal` pour eviter double modal
- Dismiss 90 jours (localStorage `qarte_review_card_dismissed_${merchantId}`)
- Encart permanent `ReviewCard` sur la carte client si `review_link` configure
- `ReviewPrompt` sur la carte (dismissable definitivement via localStorage)
- Config dans `/dashboard/program` (ExtrasSection)

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
- **PhoneInput** (`src/components/ui/PhoneInput.tsx`) : selecteur pays drapeau+indicatif+nom pays, dropdown avec pays prefere en premier, placeholder dynamique, `useMemo` pour tri
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
- **Sitemap** (`src/app/sitemap.ts`) : pages statiques + blog + demos avec alternates FR/EN (PAS de pages merchant — decouverte organique uniquement)
- **robots.ts** : disallow `/api/`, `/dashboard/`, `/admin/`, `/auth/`, `/customer/`, `/scan/`
- **noindex** : `/scan/[code]` et `/customer/card/[merchantId]` (layouts avec `robots: { index: false, follow: false }`)
- **Hreflang** : `<link rel="alternate" hrefLang="fr|en|x-default">` dans root layout `<head>`
- **og:locale:alternate** : dans `[locale]/layout.tsx` (FR ↔ EN)
- **Blog** : `[locale]/blog/layout.tsx` — metadata locale-aware + canonical + alternates
- **/p/[slug]** : `generateMetadata` — titre/description traduits, og:locale, alternates FR/EN
- **Welcome email** : `sendWelcomeEmail` recoit le locale du merchant a la creation
- **Admin pages** : hardcoded `'fr-FR'` acceptable (usage interne uniquement)

### Planning (mig 063-074, 083-086, 088-089)

- **Limites** : 20 creneaux par batch de creation (Zod max), **500 creneaux futurs actifs max par merchant** (mig 089 ajoute 2 partial indexes pour tenir a cette echelle : deposit deadline + booked). Suppression bulk : 200 par requete (client boucle si plus).

- Planning gere par le merchant — mode manuel (le client contacte) OU **reservation en ligne** (`auto_booking_enabled`, mig 083)
- **Reservation en ligne** : le client clique un creneau sur `/p/[slug]`, coche ses prestations, entre son tel/prenom, et confirme. Blocage automatique des creneaux consecutifs selon la duree totale des services. Email notification au merchant (`BookingNotificationEmail`). API `POST /api/planning/book`
- **Multi-slot booking** : quand la duree > 30min, les creneaux consecutifs sont bloques. Le slot principal a les `planning_slot_services`, les fillers ont `primary_slot_id` pointant vers le principal (mig 084). Filtre centralise dans `usePlanningState.slotsByDate`. Cascade PATCH (clear) et DELETE (supprime fillers). **PATCH services** : quand les services changent sur un slot booke en mode creneaux, les fillers sont recalcules (clear anciens + block nouveaux selon nouvelle duree)
- **Acompte** (optionnel) : `deposit_link` + `deposit_link_label` (ex: "Revolut") et optionnellement `deposit_link_2` + `deposit_link_2_label` (ex: "PayPal"), mig 090. Si le label est vide, `detectPaymentProvider()` dans `BookingModal.tsx` devine le nom du provider depuis le domaine (Revolut, PayPal, Lydia, Stripe, SumUp, Wise, Pumpkin, Twint, Payconiq, Venmo, Cash App, Zelle, Monzo, Buy Me a Coffee) — fallback "Payer l'acompte". `deposit_percent` OU `deposit_amount` (fixe). Tristate `deposit_confirmed`: NULL=pas d'acompte, false=en attente, true=confirme. Boutons confirmer ET annuler confirmation dans le dashboard. Modal publique affiche une **liste de choix** si 2 liens configures. Header modal confirm devient "En attente de confirmation" + icone `Hourglass` (au lieu de `CalendarDays`) + message incitatif "Merci de payer rapidement..." (pas d'affichage de deadline cote client, urgence douce). Bouton final unifie "Mes RDV & fidelite" (meme en cas d'acompte en attente) pointant vers `/customer/card/[merchantId]`. Conditions de resa via `booking_message`. Lien affilie Revolut sous les champs.
- **Delai d'acompte** : `deposit_deadline_hours` (merchant config 1h/2h/3h/4h + custom, default 1h, NULL=libre). `deposit_deadline_at` (TIMESTAMPTZ sur le slot) calcule par `computeDepositDeadline()` (helper partage dans `src/lib/deposit.ts`) avec **grace nuit silencieuse** : si la deadline brute tombe entre 22h et 9h heure merchant, elle est repoussee a 9h du matin (large marge reveil). Cap absolu : RDV - 4h. Si RDV dans moins de 4h, pas de deadline. **Auto-liberation par cron horaire dedie `/api/cron/deposit-expiration`** (mig 111, lag max 1h au lieu de 12h en 2x/jour). Le client ne voit jamais l'heure exacte (incite a payer tout de suite). Message statique dans la config dashboard informe le merchant de la grace nuit. **Encart info merchant** sous le delai : rappelle qu'il recoit un email + notif push a chaque resa et doit valider vite, avec warning spam ("ajoute contact@qarte.fr a tes contacts").
- **Archive acomptes echoues** (mig 111) : quand un slot est libere pour acompte non recu, les details de la resa (nom client, tel, services, date/heure, montant acompte attendu) sont **snapshotes dans `booking_deposit_failures` AVANT** le wipe. Le merchant voit l'archive sous les resas dans l'onglet Reservations (section amber repliable, badge compact en haut du summary). 2 actions par ligne : **[Poubelle]** confirm inline → delete definitif / **[Ramener]** ouvre `BringBackBookingModal` (variante legere de `BookingDetailsModal`) : resume readonly + radio "Relancer l'acompte" (SMS avec nouveau lien) OU "Marquer l'acompte comme recu" + checkbox "Envoyer SMS de confirmation". Le ramener reutilise le creneau d'origine (409 si occupe). Helper partage `releaseExpiredDeposits()` dans `src/lib/deposit-release.ts` — unique source de verite (appele uniquement par le cron horaire). `SlotReleasedEmail` reecrit pour mentionner la possibilite de recuperer la resa depuis le dashboard. Evening + morning-jobs gardent seulement le **warning "acompte expirant dans 4h"** (plus aucune release).
- **Source reservation** : `booked_online` BOOLEAN (mig 088) — true si reserve via `/api/planning/book` (vitrine), false si cree manuellement par le merchant. Utilise dans admin activite pour distinguer "Reservation en ligne" vs "Reservation manuelle"
- **Priorite resa Qarte vs externe** : quand `auto_booking_enabled`, le CTA externe (`booking_url`) est masque sur la vitrine et la carte de fidelite affiche un seul lien "Reserver" vers `/p/{slug}`. Warning dans les settings si les deux sont configures
- **Guard offres vitrine** : les sections offre nouveaux clients et promo utilisent `canBookOnline = auto_booking_enabled && planningSlots.length > 0`. Si resa en ligne activee mais aucun creneau disponible, fallback vers le mode scan (bouton "En profiter" + lien `/scan/{code}`)
- **Annulation/modification par le client** (mig 096-097) : `allow_customer_cancel` + `allow_customer_reschedule` (2 toggles independants) + `cancel_deadline_days` / `reschedule_deadline_days` (delais separes en jours avant le RDV, min 1 = la veille). API `DELETE/PATCH /api/planning/customer-edit` (auth cookie phone). Boutons "Annuler" (rouge) et "Modifier" (couleur merchant) dans `UpcomingAppointmentsSection` sur la carte client. Modal bottom-sheet pour confirmation annulation + modal reschedule (selecteur date horizontal + grille horaires, charge slots via `GET /api/planning?public=true`). Push + email au merchant. Tous les RDV sont editables (pas de restriction `booked_online`)
- Multi-services, photos inspiration, photos resultat ("avant/apres"), liens sociaux clients
- 1 creneau = 1 ligne en DB (date + heure debut). `client_name IS NULL` = disponible, rempli = pris
- Dashboard `/dashboard/planning` : 3 onglets (Agenda, Reservations, Parametres) — l'activation resa en ligne a ete fusionnee dans Parametres
  - **Agenda** : **3 vues** — `day` (1 jour, defaut mobile), `2day` (2 jours cote-a-cote, mobile uniquement), `week` (7 jours, defaut >=1024px). Toggle mobile `[1j|2j]`, toggle desktop `[Jour|Semaine]`. Pref persistee dans `localStorage.qarte_planning_view`. Header nav : `Calendar (date picker) | ← | Semaine XX + date range | → | toggle`. Timeline 8h-21h avec graduations 15/30/45. **CA du jour** affiche en pill emerald (headers DayView + WeekView) : somme `service.price` des slots confirmes (`client_name` present, pas `__blocked__`), formate via `formatCurrency(merchant.country)` — vu en `utils.ts:computeDayRevenue`. En mode `2day`, le 2e jour (J+1) est highlight `bg-indigo-100` (vs `bg-indigo-600` pour le jour primaire). Menu kebab pour actions semaine (story Instagram, copie semaine, vider jour/semaine). Mode libre : overlays hachures FERME/PAUSE depuis `merchant.opening_hours`. Slot cards Booksy-style : heure debut-fin (bold, en haut) → prestations (text-sm bold, line-clamp-2, visible d'un coup d'oeil) → nom client (discret, en bas)
  - **Reservations** : tous les RDV reserves (a venir + passes), groupes par jour avec **bande stats** en tete (2 chips : RDV + Total estime dans devise merchant, icones CalendarDays/Wallet sur fond degrade indigo-violet). Empty state enrichi : "Partage ton lien partout sur tous tes reseaux pour commencer a avoir tes premieres reservations". Heure affichee sur 2 lignes : **heure debut** (indigo bold) + **heure fin** (gray-500, text-sm) calculee via `endTimeFromStart(start, duration)` — lecture "de 9h00 a 10h30" en un coup d'oeil
  - **Parametres** : 3 sections colorees — **Mon agenda** (indigo : mode creneaux/libre, tampon inter-RDV), **Resa en ligne** (emerald : toggle activation + conditions + acompte + annulation client), **Communication** (violet : push, message libre public, SMS)
- **Modal unifie `BookingDetailsModal`** : **un seul modal** pour les 2 onglets (Agenda ET Reservations). Clic sur une resa dans la liste Reservations → ouvre directement BookingDetailsModal (plus de modal light inline). Header : icone `CalendarPlus` (export .ics RFC 5545 via `src/lib/ics.ts`) a cote du X. Footer 3 boutons flex-1 equilibres : `[Check Enregistrer]` indigo solid / `[CalendarClock Deplacer]` gray outline / `[Trash2 Annuler]` red outline. Pour slot vide (rare) : `[Enregistrer]` flex-1 + `[Trash2]` icon. Overlay Deplacer + overlay Annuler (avec toggles SMS). **Onglets Photos / Notes / Historique** unifies en une seule barre `<TabButton>` (mutuellement exclusive) avec pastilles compteur : nombre pour Photos, point indigo si note saisie, rien pour Historique. Un seul panneau rendu a la fois — gain vertical massif vs 3 accordeons empiles
- **Wrapper `PlanningModal`** (`planning/PlanningModal.tsx`) : shell partage overlay + Framer Motion + container + sub-components `<ModalHeader>` (icone tintee, titre, sous-titre, badge, actions, X) et `<ModalFooter>` (flex gap-2). Utilise par AddSlotsModal, ConfirmDeleteSlotsModal, et les 3 modaux inline de `page.tsx` (bloquer creneau, supprimer bloc, changer mode). Tokens unifies : `bg-red-600` pour danger, `text-xs font-bold rounded-xl py-2.5` pour boutons footer, `focus:ring-indigo-500/20`. Sizes `sm`/`md`/`lg`. BookingDetailsModal et ClientSelectModal gardent leur shell custom (overlays internes complexes)
- **Vue Semaine / 2-jours (`WeekView`)** : composant generique pilote par `weekDays: Date[]` — grille `48px + N colonnes` (N = `weekDays.length`). Desktop = 7 cols, mode `2day` = 2 cols (`[selectedDay, selectedDay+1]`). Compact header inline (weekday+date sur une ligne) quand `weekDays.length <= 2`. Prop optionnel `secondarySelectedStr` pour highlight intermediaire (J+1 en 2-day). Chaque colonne = mini day header cliquable + pill CA du jour + timeline overlays/slot cards condenses (text-[9px]/-[10px]). Constantes + helpers partages dans `timelineShared.ts`. Donnees per-day memoizees (`columnData` useMemo) incluent `revenue` pour eviter recalcul.
- **Deplacer un RDV — mode libre** : l'overlay Deplacer fetch `GET /api/planning/free-slots?merchantId=&date=&totalDuration=` quand la date change. L'API retourne UNIQUEMENT les heures ou le RDV rentre (tient compte de `opening_hours`, bookings existants, blocs, `buffer_minutes`, pause dejeuner). Pendant le fetch : spinner. Si aucun slot : warning amber "Pas de creneau dispo ce jour". Input custom en fallback
- **Deplacer un RDV — mode creneaux** : les chips pre-existantes (slots vides) sont filtrees par duree consecutive. Si le RDV dure 2h, ne propose pas 14h quand 14h30 est deja pris (calcul `needed = ceil(duree / 30)` + verification que les N slots suivants sont tous vides)
- **Couleurs services** : palette 10 couleurs vives (niveau 500-600) attribuees automatiquement aux services. Slots bookes affiches en bande saturee style Booksy (fond vif 90% opacity, bord gauche 4px, texte blanc). Slots bloques (incl. FERME/PAUSE mode libre) en hachures diagonales + pill blanc
- **Historique client** : dans le modal booking, affiche les RDV passes du client (via `GET /api/planning?customerId=`)
- **Photos resultat** : photos "apres" prestation (max 3/creneau), separees des photos inspiration. Groupees sous un depliant "Photos" (Avant/Apres) dans le modal edition
- Flow edition : clic slot reserve → direct modal edition (skip selection client). Clic slot libre → Modal 1 (choix/creation client) → Modal 2 (edition)
- **Modal selection client** : recherche par nom OU telephone (API normalise le numero en E.164 via `getAllPhoneFormats`). Bouton "Passer" masque si un numero est saisi (force creation client). Bouton "Etape suivante" masque si aucun client selectionne
- **Modal nouveau RDV manuel (mode libre)** : wizard 2 etapes via state `manualStep` (1|2). Etape 1 = Prestations + Creneau (date/heure) + warning conflit 409 + bouton Forcer ; etape 2 = Client (recherche/creation + voucher grants) + Notes + toggle SMS + erreurs de save. Header : badge `1/2`·`2/2` + barre de progression indigo→violet. Footer dynamique (`Annuler`/`Suivant` puis `Retour`/`Confirmer`). Conflit au submit → bounce auto etape 1. Auto-clear du conflit sur changement date/heure. API `POST /api/planning/manual-booking` accepte `send_sms` → `sendBookingSms('confirmation_no_deposit')`
- **SMS opt-in dans les modals planning** (4 toggles opt-in desactives par defaut, grises + badge "Pro" en trial, visibles uniquement si slot a un numero) : `confirmation_no_deposit` (mode creneaux via BookingDetailsModal sur slot libre + mode libre via manual-booking modal), `confirmation_deposit` (validation acompte), `booking_moved` (overlay deplacement), `booking_cancelled` (overlay annulation). Rappel J-1 automatique par cron evening pour tous RDV futurs
- **Creation client depuis planning** : reutilise `/api/customers/create`. Si client existe deja (409), l'API retourne `customer_id` et le planning le reutilise automatiquement
- **Auto-creation client + voucher nouveaux clients** : a la reservation en ligne, si nouveau client, creation automatique du customer + carte fidelite + voucher nouveaux clients (si `welcome_offer_enabled`)
- Tables : `merchant_planning_slots` (mig 063+065+083+084), `planning_slot_services` (mig 071), `planning_slot_photos` (mig 072), `planning_slot_result_photos` (mig 074), `booking_deposit_failures` (mig 111)
- Colonnes `instagram_handle`, `tiktok_handle`, `facebook_url` sur `customers` (mig 073)
- API `/api/planning` (GET avec join services+photos+result_photos+customer social, filtre `customerId`/POST/PATCH avec cascade fillers/DELETE avec cascade fillers) + `/api/planning/book` (POST public, rate-limited) + `/api/planning/copy-week` + `/api/planning/photos` + `/api/planning/result-photos` + `/api/planning/shift-slot` + `/api/planning/deposit-failures` (GET list + DELETE) + `/api/planning/deposit-failures/bring-back` (POST) + `/api/customers/social`
- Helpers partages : `_photo-helpers.ts`, `computeDepositAmount()` + `computeDepositDeadline()` (dans `src/lib/deposit.ts`, re-exportes depuis `planning/utils.ts` pour backcompat), `releaseExpiredDeposits()` (dans `src/lib/deposit-release.ts`, single source of truth pour libere+archive), `endTimeFromStart(start, duration)`, `formatDateLong(d, locale)`, `computeDayRevenue(slots, serviceMap)`, `getISOWeekNumber(d)` dans `planning/utils.ts`
- Page publique `/p/[slug]` : section "Disponibilites" (60j glissants, groupes par mois, preview 4 jours + bouton Voir plus), banniere message libre
- `display_phone` (mig 108) : numero fixe/portable affiche sur vitrine publique (E.164 sans +), configurable dans dashboard > Ma Vitrine > Mon salon avec PhoneInput + selecteur pays, affiche formate avec drapeau sur `/p/[slug]` + lien `tel:` cliquable, prioritaire dans JSON-LD `telephone`
- **Bandeau "Page suspendue"** : bandeau rouge sticky en haut de `/p/[slug]` pour merchants expires. Condition : `subscription_status` hors active/canceling/past_due, ET si trial → verifie `trial_ends_at + 3j grace`. Message : "Page suspendue — compte inactif. Un abonnement est necessaire pour reactiver cette page." Pression sociale pour inciter le merchant a s'abonner. Note : `subscription_status` reste `trial` en DB meme apres expiration (jamais mute automatiquement), d'ou la verification sur `trial_ends_at`.
- **Bandeau demo** : bandeau fixe bottom sur pages demo (`isDemo`) : "Mode demo — les actions sont desactivees" + CTA "Creer mon compte".
- **Acompte** : toggle on/off dans parametres planning (`depositEnabled` state local, sync au load). `computeDepositAmount()` cappe au prix total (`Math.min`). Si acompte >= prix → affiche "Paiement integral" au lieu de "Acompte" (vitrine + dashboard).
- **Reply OK warm-up** : texte sous bouton signup "Reponds OK a l'email pour activer tes 7 jours d'essai gratuit" + encart jaune dans Welcome email demandant de repondre OK (warm-up deliverabilite)

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

### Churn Retention Survey (mig 106)
- **Trigger** : merchants fully expired (> J+3) et `churn_survey_seen_at IS NULL` sont rediriges par le dashboard layout vers `/dashboard/survey` au lieu de `/dashboard/subscription`
- **Questionnaire** : 4 questions (blocker, missing_feature optionnel, features_tested multi, would_convince), avec textarea libre finale
- **Bonus variable selon Q4** : `CHURN_BONUS_DAYS_BY_CONVINCE` dans `churn-survey-config.ts` — lower_price +2j, longer_trial +7j, team_demo +5j, more_features +2j, nothing +2j. Calcul `GREATEST(NOW(), current) + bonus days` + pose `churn_survey_seen_at` (one-shot definitif)
- **Skip** : lien "Passer" discret → redirect direct vers `/dashboard/subscription` SANS poser de flag. Le merchant revoit le questionnaire a la prochaine visite (incite a repondre)
- **Promo conditionnelle** : si `would_convince === 'lower_price'`, la page de succes affiche un code Stripe `3MOISQARTEPRO25` (-25% sur 3 premiers mois)
- **Demo equipe** : si `would_convince === 'team_demo'`, email admin envoye a `contact@getqarte.com` (shop_name, email, phone, blocker, commentaire) + message "On te contacte sous 24h" dans la page de succes
- **Email de relance** : `ChurnSurveyReminderEmail` envoye par cron morning au J+3 (tracking code -213, idempotent)
- **Admin view** : `/admin/churn-surveys` avec stats agregees (blockers/convinces/features/converted count), filtres + recherche + expand par ligne pour voir toutes les reponses
- **Source unique** : `src/lib/churn-survey-config.ts` — enums partages entre Zod API, client page, admin page
- **Table** : `merchant_churn_surveys` (UNIQUE merchant_id) + colonne `merchants.churn_survey_seen_at TIMESTAMPTZ`
- **Routes** : `POST /api/churn-survey` (merchant auth), `GET /api/admin/churn-surveys` (admin auth)
- **Flow email post-survey** : apres completion du survey + bonus, les merchants ne recoivent plus les emails trial generiques (TrialEnding/TrialExpired). A la place, emails cibles selon `would_convince` :
  - `PostSurveyFollowUpEmail` (tracking -221 mid-bonus, -222 dernier jour) : contenu adapte par variant (lower_price = rappel promo, longer_trial = features pas testees, team_demo = suivi demo, more_features = nouveautes, nothing = social proof)
  - `PostSurveyLastChanceEmail` (tracking -223, J+1 apres expiration bonus) : urgence finale, CTA subscription
  - Guard dans cron morning Section 1 : `if (churn_survey_seen_at) continue` → skip emails trial generiques
  - Nouvelle Section 1b dans cron morning : fetch `would_convince` depuis `merchant_churn_surveys`, calcul midDay/lastDay selon bonus days
- **Scripts one-off** :
  - `scripts/send-churn-survey-email.mjs` — relance churn survey aux merchants deja expired au moment du deploy (tracking -213)
  - `scripts/send-features-recap.mjs` — recap des 6 features cles (vitrine, planning, SMS, fidelite, bienvenue, avis Google) avec gift box bonus pointant vers `/dashboard/survey` (tracking -214, scheduled_at Resend)

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
- `POST /api/vouchers/use` — Consommer voucher (auto-cree voucher parrain si referral). Bonus +1 stamp sauf birthday et sauf si visite confirmee aujourd'hui (evite double stamp scan+voucher)
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
- **Verification abonnement reel** : `useMerchantPushNotifications` verifie au montage `pushManager.getSubscription()` (pas localStorage seul) — corrige le cas ou iOS revoque l'endpoint apres inactivite, le hook se resynchronise avec la realite serveur
- **SW controller workaround** : `sw.js` n'appelle plus `clients.claim()` (causait crash React removeChild sur personalize mobile). Pour eviter le "Registration failed - push service error" sur Chrome Android / iOS PWA quand le SW vient d'etre installe, `subscribeToPush()` detecte `navigator.serviceWorker.controller === null` apres `serviceWorker.ready` et **reload la page une fois** (flag sessionStorage anti-loop, cleared apres subscribe reussi)
- **Pas de toggles** : toutes les notifs actives par defaut pour tout merchant abonne au push

### SMS (OVH Cloud)
- **Client API** : `src/lib/ovh-sms.ts` — signature HMAC-SHA1 custom, fire-and-forget, pas de npm package
- **Service** : `src/lib/sms.ts` — dedup via `sms_logs`, quota 100 SMS/mois inclus (0,075€ au-dela), templates FR/EN < 160 chars
- **Reserve aux abonnes actifs** (pas trial) — message CTA dans dashboard + planning settings
- **7 types de SMS** :
  - `reminder_j1` — rappel la veille a 19h (cron evening)
  - `confirmation_no_deposit` — confirmation manuelle par le merchant (toggle opt-in dans BookingDetailsModal)
  - `confirmation_deposit` — validation acompte par le merchant avec toggle opt-in (BookingDetailsModal + ReservationsSection)
  - `booking_moved` — notification client quand le merchant deplace un RDV (toggle opt-in dans move overlay)
  - `booking_cancelled` — notification client quand le merchant annule un RDV (toggle opt-in dans cancel overlay)
  - `birthday` — voeux + cadeau anniversaire, personnalise avec le prenom du client (cron morning-jobs)
  - `referral_reward` — notification parrain quand le filleul utilise sa recompense (`POST /api/vouchers/use`)
- **Toggles SMS merchant** : 4 toggles opt-in dans les modaux planning (confirmation nouveau RDV, validation acompte, deplacement, annulation). Design harmonise : bandeau cliquable + toggle switch. Desactive par defaut. En trial : grise + badge "Pro". Visible uniquement si le slot a un numero de telephone. Aucun auto-envoi — toujours opt-in.
- **Compteur SMS** : visible dans dashboard principal + planning parametres (barre de progression), cycle aligne sur la date d'abonnement Stripe (`billing_period_start`)
- **Booking modal client** : pas de SMS a la reservation sans acompte (rappel J-1 suffit). Hint "un SMS de rappel vous sera envoye la veille".
- **Landing** : SMS mis en avant dans Hero (badge), FeaturesGrid, PageProSection (bloc dedie avec visual 2 SMS), Pricing, FAQ (Q4+Q12)
- **Admin** : `/admin/sms` — metriques uniquement (total, ce mois, echecs, cout) + breakdown par merchant avec plage de dates du cycle de facturation. Les toggles globaux ont ete supprimes — le merchant controle par action.
- **Admin activite** : badges "Acompte en attente" / "Acompte OK" sur les reservations
- **Env vars** : `OVH_APP_KEY`, `OVH_APP_SECRET`, `OVH_CONSUMER_KEY`, `OVH_SMS_SERVICE`, `OVH_SMS_SENDER`
- **Sender** : "Qarte" (en attente validation OVH, fallback numero court via `senderForResponse`)
- **Migrations** : 092 (sms_logs + app_config), 093 (birthday + referral types), 094 (booking_moved + booking_cancelled types)

### Stripe
- `POST /api/stripe/checkout` — Session paiement (verifie customer Stripe)
- `POST /api/stripe/webhook` — 5 events (checkout.completed, sub.updated, sub.deleted, invoice.failed, invoice.succeeded)
- `POST /api/stripe/portal` — Portail client Stripe
- `GET /api/stripe/payment-method` — Methode de paiement active + **subscription price** (`unit_amount`, `currency`, `interval`) pour afficher le vrai tarif du merchant (gere grandfathered + tarifs negocies). Fetch parallele customer + subscriptions (limit:3 pour gerer churn-resub-churn), filtre statuses `active`/`trialing`/`past_due`

### Photos merchant
- `POST /api/photos` — Upload photo realisation (auth, magic bytes, max 6, compress client via `compressOfferImage`)
- `DELETE /api/photos` — Supprimer photo + fichier storage (auth, ownership)

### Prestations
- `GET /api/services?merchantId=` — Liste services + categories (public). Champs: name, price, position, category_id, duration, description, price_from
- `POST /api/services` — CRUD services et categories (merchant auth, type discrimine: 'service' | 'category')
- Services: duration (int, min, nullable), description (text, nullable), price_from (bool, "a partir de")

### Planning
- `GET /api/planning?merchantId=&from=&to=` — Slots merchant (auth, join services avec noms+photos+result_photos+customer social) ou `&public=true` (dispo only, 30j). `&booked=true` filtre les creneaux reserves uniquement. `&customerId=` filtre par client
- `POST /api/planning` — Creation batch creneaux (max 20/requete, 200 actifs total)
- `PATCH /api/planning` — Marquer creneau pris/libre (client_name, phone, service_ids[], notes)
- `DELETE /api/planning` — Supprimer creneaux (batch slotIds, max 200/requete, client batch si plus)
- `POST /api/planning/copy-week` — Copier horaires d'une semaine vers une autre
- `POST/DELETE /api/planning/photos` — Upload/suppression photos inspiration (max 3/creneau, magic bytes, rate limit)
- `POST/DELETE /api/planning/result-photos` — Upload/suppression photos resultat (max 3/creneau, magic bytes, rate limit, helpers partages avec photos)
- `POST /api/planning/shift-slot` — Decaler un creneau (newTime + newDate optionnel pour deplacements inter-jours, verifie UNIQUE). Param `force?: boolean` : si `true` ET le slot source est booke → utilise la fonction Postgres atomique `move_booking()` (mig 091) qui transfere les champs booking + FKs (`planning_slot_services`, `planning_slot_photos`, `planning_slot_result_photos`, `customer_notes`) vers le slot cible. Source devient un slot libre dispo pour rebook, cible est reutilisee si existante vide ou creee si absente. Rejette les resas multi-creneaux (pas encore supporte). Bouton "Deplacer" dans `BookingDetailsModal` ouvre un overlay inline avec date picker + pills creneaux libres + input heure custom.

### Journal de suivi client
- `GET/POST/PATCH/DELETE /api/customer-notes` — CRUD notes client (auth merchant, Zod)
- Table `customer_notes` (mig 080) : content, note_type (string libre), pinned, slot_id optionnel
- Types predefinis : general, allergy, preference, formula, observation + tags custom
- 5e onglet "Journal" dans CustomerManagementModal (BookOpen icon teal)
- Notes epinglees visibles comme "Memo client" dans BookingDetailsModal avant chaque RDV
- Photos resultat agglomerees depuis tous les RDV passes (lazy-loaded)
- Styles types partages via `src/lib/note-styles.ts` (getTypeStyle)

### Jeu concours mensuel
- `GET /api/contest?merchantId=` — Historique tirages (auth, 12 derniers)
- `PATCH /api/contest` — Sauvegarde config (contestEnabled, contestPrize)
- `GET /api/contest/participants?merchantId=` — Nombre participants uniques du mois courant
- `GET /api/cron/monthly-contest` — Cron 1er du mois : tirage, insert merchant_contests, push + email merchant

### Clients (social)
- `PATCH /api/customers/social` — MAJ liens sociaux (instagram_handle, tiktok_handle, facebook_url)

### Admin
- `/api/admin/merchants/[id]` — GET stats (21 queries paralleles : clients, visites, redemptions, referrals, services, photos, planning slots+bookings, **resas en attente d'acompte**, push, vouchers)/PATCH notes. Page detail (`/admin/merchants/[id]`) avec sections **collapsibles** (CollapsibleCard) : Programme de fidélité, Vitrine en ligne, Emails envoyés. Stats compactes (CompactStat). Programme fidélité tracke toutes les features : mode visite/cagnotte, paliers, anniversaire, parrainage, shield, jours x2, **offre duo**, **offre étudiant**, **jeu concours**. Vitrine tracke : planning, resa en ligne, mode libre/buffer, annulation/modif J-x, deposit_deadline_hours, **bienvenue**, **lien sur carte**, deposit_link/2 + labels, planning_message + booking_message. Liens & Réseaux inclut **WhatsApp** + 2eme deposit link. Bio = bouton compact qui révèle le texte. Email tracking labels complets (-100→-308 + -150 signup incomplet, -213 churn survey, -214 recap features, -304 vitrine reminder, -308 planning reminder).
- `/api/admin/merchants-data` — liste globale agregation : ajoute `pendingDepositsCounts` par merchant (derive de `slotsList` deja charge, zero query supplementaire). Badge orange sablier sur la ligne merchant dans `/admin/merchants` (desktop + mobile) pour reperer d'un coup d'oeil les merchants qui ont des resas bloquees.
- `/api/admin/activity-feed` — Timeline activite (scans, inscriptions, recompenses, nouveaux clients, vouchers, reservations planning, offres bienvenue, messages). Optimise : fetch merchants par IDs references uniquement
- `/api/admin/announcements` — CRUD annonces
- `/api/admin/tracking` — GET aggregation globale (12 queries paralleles) : funnel signup, engagement scans, feature adoption (dont mode planning creneaux/libre), push/email stats, planning/offres, croissance clients
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

**OnboardingChecklist** : 15 etapes en 2 groupes accordion. Groupe "Essentiel pour lancer" (7, icone `Rocket`) : programme, logo, bio, prestations, planning, resa en ligne, QR. Groupe "Pour aller plus loin" (8, icone `Sparkles`) : adresse, photos, creneaux, parrainage, anniversaire, reseaux, 1er client, 1ere resa. **Design harmonise avec la home** : container `bg-white border-gray-100 rounded-2xl md:rounded-3xl shadow-sm` (sans glassmorphism/stripe tricolore), palette plum uniforme (`#4b0082`) pour icones/progress/step indicators, emerald pour done, amber pour CTA s'abonner. Progress ring SVG plum par groupe + barre globale plum. Celebrations sparkles (sparkleSubtle par etape, sparkleMedium par groupe, sparkleGrand quand tout complete). Auto-dismiss 3 jours apres completion. Visible en trial uniquement. **CTA "S'abonner" standalone** : bloc amber toujours visible entre la barre de progression et les groupes. **Dismiss avec confirmation** : cliquer X bascule le header en mode confirmation ("Il te reste X etapes") avec boutons "Oui, fermer" / "Continuer" — fermeture directe sans confirmation si tout est complete.

**ZeroScansCoach** : 3 etapes interconnectees avec fleches (ArrowDown) montrant le parcours client : (1) "Ta vitrine attire" → vitrine, (2) "Elles reservent en ligne" → planning, (3) "Carte fidelite automatique" (resultat auto, pas de lien). Visible quand 0 scans en trial.

**MilestoneModal** : celebrations in-app trial only. 6 milestones one-shot : vitrine_live (bio+adresse), services_added (1+ prestation), planning_active (planning active), first_scan (1+ client), first_booking (1+ resa en ligne), first_reward (1+ recompense). Modal glassmorphism centree + sparkleGrand() + Framer Motion. Dedup localStorage permanent (`qarte_milestone_{type}_{merchantId}`). Priorite d'affichage : vitrine > services > planning > scan > booking > reward. 1 seul modal par chargement. Queries milestone conditionnelles `subscription_status === 'trial'`.

**Dashboard accueil — ordre des sections** : Greeting → OnboardingChecklist (trial) → Raccourcis mobile → Prochains RDV (avec badges acompte) → Anniversaires (urgent) → Stats cards → Cagnotte → Referrals/Welcome highlights → SMS quota → Weekly comparison (avec phrase tendance) → Activity feed (timeline 8 events : scans, recompenses, parrainages, offres bienvenue — sans bookings, geres par la notification bell) → Shield + PendingPoints (en bas). Les bookings sont retires de l'activite recente car la notification bell les couvre.

**Score programme** : cercle sticky 0-100% (recompense 25pts, logo 20pts, reseaux 15pts, avis 15pts, reservation 10pts, palier2 10pts, jours x2 5pts)

**Boutons save unifies** : tous `bg-indigo-600 hover:bg-indigo-700` (default), `bg-emerald-600` (saved), `rounded-xl`, icone Check/Loader2. Coherent sur Ma Page, Programme, Parrainage, Parametres, Planning.

**Planning module harmony** : tabs/hero/toggles/pills deposit/save button tous unifies en indigo (plus d'emerald/violet accent mixte). Emerald reserve au feedback "saved" et aux status success semantiques.

**BookingModal vitrine — section acompte** : fond + bordure + icone + CTA "Payer acompte" utilisent les couleurs du merchant (`primary_color` / `secondary_color` via styles inline avec opacites hex `0D`/`1A`/`26`). Plus d'ambre. `RewardCard` et `TierProgressDisplay` : tier 2 = gradient inverse des couleurs merchant (plus de violet Qarte hardcode `#8B5CF6`).

**Headers unifies** : tous `bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]` avec titre gradient `from-indigo-600 to-violet-600`.

**Jeu concours mensuel** (mig 105) : merchants activent `contest_enabled` + configurent `contest_prize`. Clients ayant reserve pendant le mois participent automatiquement (dedup par customer_id, slots avec client_name NOT NULL + primary_slot_id IS NULL). Cron `monthly-contest` le 1er du mois tire un gagnant au hasard, insert `merchant_contests`, push + email merchant. Page dediee `/dashboard/contest` (admin-only via `super_admins` check dans le sidebar). Generation story Instagram (4:5, `ContestWinnerStory.tsx`, meme pattern glassmorphism que `SocialMediaTemplate.tsx`). Badge concours sur vitrine `/p/[slug]` si actif. Emoji `🎉` dans NotificationBell pour type `contest_winner`.

---

## 8. Stripe & Abonnement

### Pricing dual-devise
- **FR (EUR):** `PLAN` (24€/mois) + `PLAN_ANNUAL` (240€/an) — `STRIPE_PRICE_ID` + `STRIPE_PRICE_ID_ANNUAL`
- **EN (USD):** `PLAN_EN` ($24/mo) + `PLAN_ANNUAL_EN` ($240/yr) — `STRIPE_PRICE_ID_EN` + `STRIPE_PRICE_ID_ANNUAL_EN`
- Selection basee sur `merchant.locale` dans `/api/stripe/checkout`
- Locale Stripe UI : `fr` ou `en` selon merchant.locale
- Config dans `src/lib/stripe.ts`

### Statuts
| Statut | Description |
|--------|-------------|
| `trial` | Periode d'essai (7 jours) |
| `active` | Abonnement actif |
| `canceling` | Annulation programmee (cancel_at_period_end=true) |
| `canceled` | Annule (orthographe US) |
| `past_due` | Paiement en retard (traite comme actif) |

### Machine d'etats Webhook
| Evenement Stripe | Statut DB | Email |
|-----------------|-----------|-------|
| checkout.session.completed | `active` | SubscriptionConfirmedEmail (annuel: NFC offerte, mensuel: NFC en option 20€) |
| subscription.updated (cancel_at_period_end) | `canceling` | SubscriptionCanceledEmail |
| subscription.updated (canceling→active) | `active` | SubscriptionReactivatedEmail |
| subscription.deleted | `canceled` | — |
| invoice.payment_failed | `past_due` | PaymentFailedEmail |
| invoice.payment_succeeded (recovery) | `active` | SubscriptionConfirmedEmail |

**Grace period** : 3 jours apres expiration (lecture seule), suppression apres 3 jours.

### Page Abonnement (`/dashboard/subscription`)
- Toggle mensuel/annuel avec badge "Recommande" sur annuel
- CTA : "Continuer en mensuel" / "Continuer en annuel" (sans prix dans le bouton)
- Plan annuel : badge cliquable "Carte NFC offerte" → modal explicatif avec photo reelle + description + livraison 7 jours
- 10 features courtes style Notion (labels courts, factuels), ordre : Reservations en ligne, 100 SMS/mois inclus, Clients illimites, Programme de fidelite, Vitrine en ligne, QR Code + Carte NFC, Parrainage automatique, Offre duo, Notifications push, 0% de commission — Reservations + SMS en premier et en gras (indigo), grid 2 colonnes desktop + mobile compact
- Reassurance sous CTA (icones ShieldCheck/Check/CreditCard) visible all screens
- Textes explicatifs sous CTAs canceled ("Tes clients ne peuvent plus tamponner") et past_due
- Countdown trial, syncing indicator, billing card avec methode paiement
- **Bouton "Gerer mon abonnement"** (etat `active`) → ouvre directement le **portail Stripe** (`handleOpenPortal`) pour gerer carte bancaire, factures, abonnement. Sous-texte "Carte bancaire, factures, abonnement". Lien discret en dessous "Annuler mon abonnement" (underline gris) → declenche le save-offer modal (`handleOpenCancelFlow`). Anciennement le bouton "Gerer" ouvrait directement le flow d'annulation, ce qui empechait les pros de changer leur carte.
- **Prix affiche = vrai prix Stripe** (pour merchants payants `active` / `canceling` / `past_due`) : la page lit `unit_amount` de la subscription via `/api/stripe/payment-method` (etendu pour retourner aussi `subscription: { unit_amount, currency, interval }`). Helper `buildPlanFromSubscription()` derive les valeurs d'affichage. Couvre 3 cas sans aucune migration DB : (1) anciens grandfathered (19€/mois ou 180€/an avant le 2026-04-05) — voient leur tarif d'epoque, (2) nouveaux (24€/240€) — voient le tarif public, (3) tarifs negocies (modifier le Price dans Stripe → s'affiche automatiquement). Les coupons Stripe ne sont **pas** appliques (ils s'ajoutent au niveau facture, pas sur `unit_amount`). Trial / canceled / no-sub voient le prix public PLANS (24€/240€) car ils paieront ce prix en (re)souscrivant. Pour annuel grandfathered, masque la ligne "288€ → 240€/an -17%" (ne s'applique pas).

---

## 9. Emails (37 templates)

**i18n** : Tous les templates utilisent `getEmailT(locale)` de `src/emails/translations/{fr,en}.ts`. La locale vient de `merchants.locale`. Aucun texte hardcode FR restant. `getEmailT` supporte les cles imbriquees a N niveaux (ex: `paymentFailed.step1.heading`, `postSurveyFollowUp.lowerPrice.intro`).

### Onboarding (epure — max 1 email/jour)
WelcomeEmail, IncompleteSignupEmail (+15min + +2h), GuidedSignupEmail (J+1 incomplete), ProgramReminderEmail (J+1 non configure, mentionne interconnexion booking→fidelite), QRCodeEmail (une fois configure), FirstClientScriptEmail (J+2 post-config, 0 scans), VitrineReminderEmail (J+3, vitrine vide), PlanningReminderEmail (J+4, planning desactive, mentionne interconnexion booking→carte fidelite auto)

**Abandon signup** : 3 relances escaladees — T+15min (Resend schedule), T+2h (Resend schedule), T+24h (cron morning -150). Les 2 emails schedules sont annules si le merchant complete son inscription.

**Supprimes** : ProgramReminderDay2Email (J+2), ProgramReminderDay3Email (J+3), Day5CheckinEmail, QuickCheckEmail (J+4), AutoSuggestRewardEmail (J+5) — trop d'emails les premiers jours, doublon de ton

### Engagement
FirstScanEmail (2e visite), **FirstBookingEmail (1ere resa en ligne, tracking -105)**, FirstRewardEmail, Tier2UpsellEmail, PendingPointsEmail (Shield), WeeklyDigestEmail (DESACTIVE)

### Retention & Trial (epure)
TrialEndingEmail (J-2 uniquement — etait J-3 + J-1), TrialExpiredEmail (J+1 uniquement — etait J+1 + J+2), ChurnSurveyReminderEmail (J+3 fully expired — code -213, vers `/dashboard/survey`, bonus +2 jours), PostSurveyFollowUpEmail (mid-bonus -221, last day -222 — contenu cible par variant would_convince), PostSurveyLastChanceEmail (J+1 post-expiration bonus -223), InactiveMerchantDay7/14/30Email

### Stripe & Post-subscription
SubscriptionConfirmedEmail, PaymentFailedEmail (4 steps dunning: J+0 webhook, J+3/J+7/J+10 cron — ton escalade progressif), SubscriptionCanceledEmail, SubscriptionReactivatedEmail, ReactivationEmail (J+7/14/30), **ReferralPromoEmail (J+2 post-abonnement — "Gagne 10€ par pro recommande", lien `?ref={slug}`)**, **ReferralReminderEmail (J+14 et J+30 post-abo, tracking -316/-317, uniquement si 0 referrals)**

### Cancel flow — Save offer
Modal dans `/dashboard/subscription` : quand le merchant clique sur le lien discret "Annuler mon abonnement", questionnaire raison d'annulation (6 choix). Si "trop cher" → offre 2 mois offerts avec code `2MOISQARTEPRO25`. Churn survey post-expiration → 3 mois offerts avec code `3MOISQARTEPRO25` (remplace QARTEPRO10)

### Autres
BirthdayNotificationEmail, GracePeriodSetupEmail, ProductUpdateEmail, AnnouncementMaPageEmail, WinBackEmail (envoi manuel admin), BookingNotificationEmail (transactionnel), SlotReleasedEmail (acompte non recu — cron horaire `deposit-expiration`, mentionne la possibilite de recuperer la resa depuis le dashboard)

### Codes promo
Tous les codes promo emails ont ete supprimes (QARTE50, QARTEBOOST, QARTELAST, QARTECHALLENGE2026, QARTEPROEHJT). Aucun code de reduction n'est envoye automatiquement.

### Cron Jobs
| Cron | Horaire | Description |
|------|---------|-------------|
| `/api/cron/morning` | 08:00 UTC | **Emails billing-critical** : trial (J-2/J+1/churn), post-survey, reactivation, dunning, incomplete signup T+24h, grace period setup + cleanup tracking |
| `/api/cron/email-onboarding` | 10:00 UTC | **Emails setup progressif** : program reminder J+1, social proof J+3, vitrine J+3, planning J+4, QR code, first client script |
| `/api/cron/email-engagement` | 13:00 UTC | **Emails engagement** : first scan/booking/reward, tier 2 upsell, inactifs J+7/14/30, referral promo J+2, referral reminders J+14/30, pending points |
| `/api/cron/morning-jobs` | 09:15 UTC | Vouchers anniversaire (timezone-aware) + SMS anniversaire + **warning acomptes expirant dans 4h** (push merchant only) |
| `/api/cron/morning-push` | 05:00 UTC (~7h Paris) | Push 10h (scheduled), push automations (inactifs/recompense/events), push trial reminders, **daily digest merchant** (X RDV aujourd'hui), **birthday push merchant** + SMS anniversaire client |
| `/api/cron/evening` | 17:00 UTC | Push 19h (timezone-aware) + warning acomptes expirant dans 4h + SMS rappel J-1 |
| `/api/cron/deposit-expiration` | toutes les heures | **Auto-liberation acomptes expires** (unique source de verite) : snapshot resa dans `booking_deposit_failures` puis wipe du slot + push + email merchant. Lag max 1h. Batch fillers + `batchGetUserEmails` |
| `/api/cron/weekly-recap` | 17:00 UTC dimanche | Push recap semaine a venir aux merchants (X RDV, ~Y€ prevus, 7 jours glissants) |
| `/api/cron/monthly-contest` | 08:00 UTC, 1er du mois | Tirage au sort mensuel : pick random parmi clients ayant reserve le mois precedent, insert merchant_contests, push + email merchant |
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
Hero (mockup iPhone de face: greeting, prochain RDV, parrainage, fidelite tampons, recompense, historique) → SocialProof → FeaturesGridSection (**grille 3x2, 6 cards VOC-aligned** avec emojis : lien en bio 🔗, 0% commission 💸, fidelite adoree 💜, SMS inclus 🔔, avis Google ⭐, app installable 📱 — cartes blanches animees framer-motion, fond blanc + ambient glow + grain, desc 3 lignes line-clamp) → FideliteSection (light, 3 blocs : programme+QR, relances+anniversaires, avis Google + **banniere 2 options** Planity/Booksy/Book in Beautiful : Option 1 garde ton outil + ajoute fidelite, Option 2 migre tout chez Qarte (recommande) — emojis 🤝/🚀, gradient brand pour Option 2, liens compare colores aux marques) → PageProSection (dark, **3 blocs** : planning+SMS fusionnes "des resas qui tombent toutes seules + rappels SMS", SEO "sans comprendre rien au SEO", **acompte 0% commission** "ton lien Revolut/Stripe/PayPal" — bloc welcome remplace par acompte) → Testimonials (5 cards, carousel mobile) → CaseStudySection (Nail Salon by Elodie : **+45% clientes regulieres** en 6 mois, 1 hero metric XL + 2 small metrics — titre aligne sur le chiffre reel, plus de "+270€/mois estime", avatar deduplique) → Pricing (image+prix bandeau, **9 features** courtes — les 4 premieres en gras + plus grosses : Reservations en ligne, Programme de fidelite, SMS de rappels et confirmations inclus, **Application pro sur ton telephone** ; puis Acompte en ligne, Parrainage automatique, Avis Google, Reference sur Google, Clients illimites — prix annuel, badges confiance) → FAQ (10 questions, Q1 = "Y a-t-il une application ?", Q2 = uniquement programme de fidelite) → Footer (FooterCta + FooterDark). Toutes les sections landing utilisent des emojis au lieu d'icones Lucide pour les badges et visuels decoratifs. Typo landing : titres de section en Playfair Display italic sur les mots gradient + surlignage indigo (sections light) ou sans surlignage (sections dark). Separateurs dot+traits. CTAs differencies : noir (FideliteSection), blanc (PageProSection), gradient violet (Hero). Grain texture SVG sur FideliteSection. **Paddings reduits** py-14 md:py-20 (vs py-20 md:py-28 avant) sur toutes les sections pour landing plus compacte.

Hero titre : "Remplis ton salon, fidélise tes clientes" + part 2 gradient "sans galérer avec les DMs."
Hero subtitle : "Un lien à mettre en bio Insta, les résas en direct, la carte de fidélité pour chaque cliente. Tout compris, sans commission sur les acomptes, sans supplément SMS."
Hero CTAs : "Essai gratuit en 2 min" (primary, glassmorphism violet) — un seul CTA. "Voir la demo" supprime du hero
Hero badges features VOC : 4 pilules blanches — "Ton lien en bio", "0% commission", "SMS inclus", "Fidélité auto" (vs anciens generiques Vitrine/Resa/Fidelite/SMS)
Hero mockup : `LoyaltyCardMockup` (vue cliente, phone 280×570) avec **icones Lucide** (CalendarCheck, UserPlus, Heart, Gift) au lieu d'emojis pour meilleure lisibilite. **Badge SMS flottant** en overlay (texte exact du template `src/lib/sms.ts:reminder_j1` : "Rappel : RDV demain à 14h30 chez Elodie Nails Studio. Cumulez vos points fidélité lors de votre passage !") — responsive : centre au-dessus du phone sur mobile, droite sur sm/md, gauche sur lg+ pour eviter clipping.
Footer badge Google Reviews : logo Google couleur + 5 etoiles + "5.0 sur Google" — sous "Concu avec amour a Marseille par Tenga Labs" dans FooterDark

SocialProof bandeau : "Plus d'un millier de **pros de la beaute** attirent et **fidelisent** avec Qarte" — mots cles en indigo-600

Demos accessibles via : bouton hero → demo carte fidelite, page vitrine `/p/demo-*`, selecteur tampons/cagnotte sur carte demo.
Demo popup (sessionStorage) : explique les 2 piliers (carte + vitrine) au premier affichage de la demo carte.
CTA uniforme : "Essayer gratuitement" (toutes sections). Positionnement : page pro (acquisition) + programme fidelite (retention) = un seul outil. Lien en bio = feature principale.

**Landing rework avril 2026 — VOC-driven** (skills `copywriting`, `page-cro`, `product-marketing-context`, `competitor-alternatives`) :
- Douleurs adressees : DMs Insta chaotiques (phone VOC), commissions cachees Booksy/Planity (Anne-Lise + Oceane WhatsApp), supplements Book in Beautiful (Oceane), anxiety PWA install (Anne-Lise), interface intuitive (multiple merchants).
- Differenciateurs explicites : 0% commission acompte (lien own Revolut/Stripe/PayPal), SMS inclus, fidelite creee auto a chaque resa (interconnexion).
- Banniere Planity/Booksy/Book in Beautiful = 2 options (garde / migre) au lieu de simple compat — repond a JTBD Four Forces (push/pull/habit/anxiety).
- Liens compare colores aux marques : Qarte violet · Planity noir · Booksy sky-500 · Book in Beautiful rose-500.
- Scroll reduit ~750px : fusion planning+SMS dans PageProSection (-450px), paddings py reduits (-300px).

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
Stats temps reel, programme fidelite, QR code & Kit promo, gestion clients (4 filtres + CustomerManagementModal 5 onglets : Points, Cadeaux/Offres fusionne, Historique avec RDV planning, Journal de suivi client, Supprimer), push notifications, abonnement, parrainage, parametres. **Liste clients** : design minimaliste sans avatar lettre — dot de statut colore (gris=en cours, vert=recompense prete, violet=tier 2) + nom + cloche push inline. Mobile cards + desktop table. **Widget "Prochains rendez-vous"** : 5 prochains RDV bookes groupes Aujourd'hui/A venir, clic → deep link `/dashboard/planning?slot=id` ouvre le modal detail. **Welcome claims** : 3 derniers vouchers bienvenue dans la section activite recente. Raccourcis mobile : Ma Page (gradient indigo-violet 400), Fidelite (gradient pink-rose 400), Planning (gradient cyan-blue 400), Clients (gris), QR Code (gris), Abonnement (gris).

**Navigation sidebar** : Accueil, Programme de fidelite, Ma Page, QR code & Supports, Planning, Clients, Parrainage, Notifications, Abonnement, Parametres
- **Membres** (`/dashboard/members`) : retire de la nav, accessible via bouton "Programmes VIP" dans Clients
- **Ma Page** (`/dashboard/public-page`) : 3 sections collapsibles avec bordure coloree et header gradient — "Mon salon" (emerald: InfoSection), "Contenu" (pink: PhotosSection, ServicesSection), "Acquisition" (violet: WelcomeSection, PromoSection). Sub-components dans fichiers separes, exposes via `forwardRef`/`useImperativeHandle` avec `save()`. Autosave debounce 1.5s : chaque enfant appelle `onDirty`, le parent orchestre `Promise.all` sur les `save()`. Barre de completion SVG ring (7 items : nom, adresse, bio, logo, horaires, reseaux, bienvenue) — lien page publique visible seulement si completion >= 3/7. Deux modals au niveau page : help modal (explication page) et welcome help modal (remonte depuis WelcomeSection). **ServicesSection** : edition d'une prestation permet de **changer sa categorie** via pills (et de **creer une nouvelle categorie inline** depuis le formulaire d'edition, auto-selectionnee apres creation).
- **Parametres** (`/dashboard/settings`) : email (lecture seule), type commerce, telephone, infos compte, export CSV, zone danger. Nom et adresse geres dans Ma Page uniquement.
- **Parrainage** (`/dashboard/referrals`) : config parrainage uniquement (toggle, recompenses parrain/filleul). Stats et tableau filtre (vrais parrainages uniquement, welcome exclus).
- **QR Code & Supports** (`/dashboard/qr-download`) : QR code + Kit reseaux sociaux (image HD, legendes, grille 2x2 coloree de 4 tips + lien cross-promo vers Ma Page). Post-QR modal redirige vers Ma Page.

### Admin (`/admin`)
Metriques startup (MRR, churn, ARPU, LTV), lifecycle segments, health score, annonces, leads, analytics, depenses, tracking. **Exclut les comptes admin** des stats. Feature adoption : 15 features trackees (programme, logo, reseaux, parrainage, anniversaire, reservation, avis, offre active, PWA, shield, palier 2, offre nouveaux clients, double jours, adresse, mode cagnotte). Health score : /100 (programme +15, logo +10, reseaux +5, avis +5, reservation +5, clients +10-20, activite +15, recence +5-10, parrainage +5, shield +5, palier2 +5, bienvenue +5, anniversaire +3, double jours +2, planning +5, resa en ligne +5). **Dashboard** : 3 stat cards planning (Planning actif, Resa en ligne, Mode Libre). Badges merchants : Admin, NC, Shield pending, Resa/Planning, Libre, PWA, Bienvenue, Cagnotte, Page. **Detail merchant** : stat planning "X reservations / Y creneaux" + "Resas en ligne (total)", feature badges (Planning, Mode Libre, Buffer Xmin, Annulation J-X, Modif J-X), horaires avec pause dejeuner. **WhatsApp** : dropdown 2 onglets (Marketing 4 msgs + Tuto 2 msgs), constante `ADMIN_CONTACT_NAME` — sur liste et detail.

**Notification Bell** (mig 104) : icone cloche dans le header dashboard (mobile top-right fixe + desktop sidebar) avec badge rouge unread count. Dropdown 10 dernières notifs avec emoji par type (📅 booking, ❌ annulé, 🔄 déplacé, ⏰ acompte expiré, ⚠️ acompte bientôt, 🎂 anniversaire, 🎉 concours, 👋 onboarding, 🔔 default). "Tout lu" pour marquer comme lues. Click → deep link vers la bonne date du planning. Polling 60s. API `/api/merchant-notifications` (GET + PATCH). Composant `src/components/dashboard/NotificationBell.tsx`.

### Page Publique Programme (`/p/[slug]`)
Bio reseaux sociaux, sans auth. **JAMAIS de QR code ni lien /scan/** sur cette page (sauf CTA offre nouveaux clients → `/scan/{code}?welcome=`).
**Pas de pixels FB/TT ni cookie banner** sur cette page (c'est la vitrine du merchant, pas la landing Qarte). Seul `trackCtaClick` (Vercel Analytics, first-party, exempt RGPD) est conserve. Le `CookieBanner` detecte `/p/` et ne s'affiche pas.

**Ordre des sections :**
1. Hero (logo glow couleurs merchant, nom gradient, adresse + badge "Y aller", bio glassmorphism)
1b. **Shortcut "Mes RDV & fidelite"** (premium card gradient merchant + shimmer + watermark) — visible uniquement si cookie `qarte_cust` present cote serveur (client deja passe par Qarte). Pointe vers `/customer/card/[merchantId]` qui regroupe RDV a venir + carte fidelite. Lu dans `page.tsx` via `cookies()` et passe en prop `hasPhoneCookie` a `ProgrammeView`. Pose lors d'une resa/checkin/register/login (voir section Cookie client).
2. CTA "Prendre rendez-vous" (conditionnel sur `booking_url`) + sticky bar quand hors viewport + detection plateforme ("via Planity/Treatwell/Fresha/Instagram/TikTok/WhatsApp/..." via `detectBookingPlatform()` dans utils.ts — 15 plateformes detectees)
3. Horaires (grille 7 jours, aujourd'hui mis en evidence)
4. Planning disponibilites (si `planning_enabled` : banniere message libre + creneaux 60j glissants groupes par mois, preview 4 jours + bouton "Voir plus", creneaux du jour passes masques automatiquement)
5. Offre nouveaux clients (CTA conditionnel si `welcome_offer_enabled`, pointe vers `/scan/{code}?welcome=`)
5b. Offre promo (amber, depuis `merchant_offers`, CTA vers `/scan/{code}?offer={id}`)
6. Carte fidelite simulee ("Carte de fidelite" + texte explicatif recompenses)
7. Palier 2 (si `tier2_enabled`)
8. Avantages exclusifs (anniversaire, parrainage, jours bonus)
9. Galerie photos realisations (lightbox, grid 3 cols, max 6 photos depuis `merchant_photos`)
10. Prestations (collapsible, ferme par defaut, "Mes prestations", icone gradient + glow)
11. Reseaux sociaux (icones Instagram/Facebook/TikTok/WhatsApp/Snapchat). **WhatsApp auto-format** : si le merchant saisit `06 12 34 56 78` dans le dashboard, `normalizeSocialUrl('whatsapp')` dans `public-page/InfoSection.tsx` appelle `formatPhoneNumber()` pour convertir en E.164 selon `merchant.country` avant de generer `https://wa.me/33612345678`. Supporte les 10 pays PHONE_CONFIG.
12. CTA merchant ("Cree ta page beaute gratuitement")

**Design :** glassmorphism (`bg-white/70 backdrop-blur-sm border-white/60`) sur sections avantages, prestations, photos. Badge hero : "Qarte — La fidelite digitale des pros de la beaute et du bien-etre".

- JSON-LD `LocalBusiness` (name, address, image, url, makesOffer)
- SEO: `generateMetadata()` avec og:image (1ere photo ou logo), description dynamique
- **QR desktop flottant** : bloc fixe bottom-right (visible `lg:` uniquement) avec `BrandedQRCode` aux couleurs merchant — permet de scanner pour ouvrir sur mobile

---

## 11. Design & UX

### Couleurs
- **Brand/Dashboard:** `#4b0082` (violet profond — emails, headers)
- **DB default merchant cards:** `#654EDA` / `#9D8FE8`
- **Landing CTAs:** Gradient `indigo-600` → `violet-600`
- **Landing emotion:** Rose/Pink (blobs hero, reward card)
- **PWA Icon:** Gradient indigo → rose
- **PWA Manifests:** 2 manifests distincts — `/manifest.webmanifest` (Next.js, `name: 'Qarte'`, `scope: '/customer'`) pour la carte client, `/api/manifest/pro` (API route, `name: 'Qarte Pro'`, `scope: '/dashboard'`) pour le dashboard merchant. Le hook `useInstallPrompt` injecte dynamiquement le manifest Pro via `<link rel="manifest">` sur le dashboard

### Style
- Glassmorphism auth pages (`backdrop-blur-xl`, `bg-white/80`), fond lavande `#f7f6fb` avec 3 blobs animes (drift 10-14s) + 4 cartes de fidelite flottantes (Framer Motion) — meme background que `/customer`
- Cartes `rounded-2xl`/`rounded-3xl`, ombres douces
- Framer Motion animations, sidebar mobile = bottom sheet 50vh
- `cn()` pour classes conditionnelles

### SEO
- Title: "Qarte - Carte de fidelite digitale pour salons de beaute"
- JSON-LD: Organization + SoftwareApplication (landing), LocalBusiness (page /p/[slug]), Article + BreadcrumbList + FAQPage (blog)
- Sitemap: pages statiques + blog + demos + compare (pages merchant exclues — decouverte organique)
- Pages merchant indexables mais PAS dans le sitemap (evite les sitelinks Google sous getqarte.com)
- `/scan/` et `/customer/` : noindex + robots disallow

### Blog (3 articles SEO/AEO — refresh avril 2026)
- **Strategie funnel** : TOFU (acquisition) + MOFU (pain point) + BOFU (commercial intent)
- **Optimisation AEO** : answer-first paragraphs 40-60 mots, tables comparatives, statistiques sourcees (Square, BrightLocal, Bain, Beauty Business France), FAQPage schema reutilise dans le contenu visible
- **Articles actifs** :
  - `/blog/comment-attirer-clientes-salon-beaute` — TOFU, 12 strategies acquisition (10 min)
  - `/blog/eviter-no-show-salon-rendez-vous` — MOFU, methode 6 etapes anti-no-show + modele CGV (8 min)
  - `/blog/logiciel-reservation-en-ligne-salon-beaute` — BOFU, comparatif Planity/Treatwell/Booksy/Qarte (9 min)
- **Structure** : `src/app/[locale]/blog/<slug>/{page.tsx, layout.tsx}` — page client avec JSON-LD inline, layout server avec `generateMetadata` locale-aware
- **Email update** (`ProductUpdateEmail.tsx`) : lien pointe sur article comparatif logiciels (BOFU intent)

---

## 12. Analytics & Tracking

- **GTM:** GTM-T5Z84DPV | **GA4:** G-WM3XVQ38BD
- **Facebook Pixel:** 1438158154679532 (PageView, Lead, CompleteRegistration, StartTrial, Purchase, InitiateCheckout)
- **TikTok Pixel:** D6FCUKBC77UC649NN2J0 (PageView, ClickButton, CompleteRegistration, Subscribe)
- **Microsoft Clarity:** vjx7g9ttax
- **Facebook CAPI:** server-side Purchase sur webhook Stripe (dedup event_id)
- **Admin Tracking** (`/admin/tracking`) : dashboard consolide — funnel inscription (sources, feature choice, trend 90j, conversion), engagement (actifs 7j/30j, scans trend, top 10), adoption features (11 flags), push/email stats, planning/offres, croissance clients (trend, referrals, vouchers par source)
- **CTA tracking** : `trackCtaClick(name, location)` sur tous les CTAs signup (13 landing + 4 demo), stocke `signup_source` en localStorage → DB merchants. Visible dans `/admin/merchants`
- **Affiliation** (`/admin/affiliation`) : liens partenaires avec commission % personnalisable, suivi inscriptions + conversions. Lien format `?ref=SLUG` → `signup_source = 'affiliate_{slug}'`. Bandeau personnalise sur la page signup. Table `affiliate_links` (mig 081). API publique `/api/affiliate/resolve` pour resoudre slug → nom partenaire. 2 onglets : "Liens actifs" (existant) + "Demandes" (candidatures ambassadeur avec approve/reject)
- **Programme Ambassadeur** (`/ambassadeur`) : page publique avec formulaire candidature (prenom, nom, email, telephone, profil, message, code personnalise). 20% commission recurrente. Flow : formulaire → `POST /api/ambassador/apply` (rate limited) → insert `ambassador_applications` (mig 110) → email notification admin → admin approve/reject dans `/admin/affiliation` → a l'approbation : slug auto-genere ou personnalise, insert `affiliate_links`, email bienvenue ambassadeur (`AmbassadorWelcomeEmail.tsx`)
- **Pages comparatif** (`/compare/[competitor]`) : Planity, Booksy, Book in Beautiful. TL;DR + tableau features + section "Pour qui" + FAQ. Liens dans le footer landing

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
