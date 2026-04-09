# Qarte SaaS — Contexte Projet

> Document principal du projet. Pour le schema DB complet, voir `docs/supabase-context.md`.

---

## 1. Overview

**Qarte** — Plateforme SaaS de cartes de fidelite digitales via QR/NFC.

- **URL:** getqarte.com | **Deploiement:** Vercel
- **Langues:** Francais uniquement (EN desactive via redirect 301, infra conservee) via `next-intl` | **Version:** 0.1.0
- **Pays:** FR, BE, CH uniquement (signup + PhoneInput)
- **Ton FR:** tutoiement dashboard merchant, vouvoiement client-facing
- **Essai:** 7 jours | **Prix:** 24€/mois ou 240€/an
- **Cible:** Salons de beaute (coiffeurs, barbiers, instituts, ongleries, spas, estheticiennes)
- **Entite:** SAS Tenga Labs — 60 rue Francois 1er, 75008 Paris

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
├── emails/               # 34 templates React Email + BaseLayout
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

### Offre de Bienvenue (mig 056)
- Code welcome par merchant (`welcome_referral_code`, genere a l'activation)
- Lien `/scan/{code}?welcome={welcome_code}` → banner "Offre de bienvenue" + inscription
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
- **Crons** (morning/morning-jobs/morning-push/evening) : utilisent `getTodayInParis()` intentionnellement (batch FR, pas per-merchant)
- `last_visit_date` : toujours set dans le fuseau du merchant via `getTodayForCountry(merchant.country)`
- `verifyMerchantOwnership()` dans push/schedule et offers retourne `country` pour eviter requete DB supplementaire

### Formatage Heures/Dates (locale-aware)
- `formatTime(time, locale)` : FR → `14h` / `14h30` | EN → `2:00 PM` / `2:30 PM`
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
- **Delai d'acompte** : `deposit_deadline_hours` (merchant config 1h/2h/3h/4h + custom, default 1h, NULL=libre). `deposit_deadline_at` (TIMESTAMPTZ sur le slot) calcule par `computeDepositDeadline()` dans `api/planning/book/route.ts` avec **grace nuit silencieuse** : si la deadline brute tombe entre 22h et 9h heure merchant, elle est repoussee a 9h du matin (large marge reveil). Cap absolu : RDV - 4h. Si RDV dans moins de 4h, pas de deadline. Auto-liberation par cron morning-jobs + evening. Le client ne voit jamais l'heure exacte (incite a payer tout de suite). Message statique dans la config dashboard informe le merchant de la grace nuit. **Encart info merchant** sous le delai : rappelle qu'il recoit un email + notif push a chaque resa et doit valider vite, avec warning spam ("ajoute contact@qarte.fr a tes contacts").
- **Source reservation** : `booked_online` BOOLEAN (mig 088) — true si reserve via `/api/planning/book` (vitrine), false si cree manuellement par le merchant. Utilise dans admin activite pour distinguer "Reservation en ligne" vs "Reservation manuelle"
- **Priorite resa Qarte vs externe** : quand `auto_booking_enabled`, le CTA externe (`booking_url`) est masque sur la vitrine et la carte de fidelite affiche un seul lien "Reserver" vers `/p/{slug}`. Warning dans les settings si les deux sont configures
- **Guard offres vitrine** : les sections offre bienvenue et promo utilisent `canBookOnline = auto_booking_enabled && planningSlots.length > 0`. Si resa en ligne activee mais aucun creneau disponible, fallback vers le mode scan (bouton "En profiter" + lien `/scan/{code}`)
- **Annulation/modification par le client** (mig 096-097) : `allow_customer_cancel` + `allow_customer_reschedule` (2 toggles independants) + `cancel_deadline_days` / `reschedule_deadline_days` (delais separes en jours avant le RDV, min 1 = la veille). API `DELETE/PATCH /api/planning/customer-edit` (auth cookie phone). Boutons "Annuler" (rouge) et "Modifier" (couleur merchant) dans `UpcomingAppointmentsSection` sur la carte client. Modal bottom-sheet pour confirmation annulation + modal reschedule (selecteur date horizontal + grille horaires, charge slots via `GET /api/planning?public=true`). Push + email au merchant. Tous les RDV sont editables (pas de restriction `booked_online`)
- Multi-services, photos inspiration, photos resultat ("avant/apres"), liens sociaux clients
- 1 creneau = 1 ligne en DB (date + heure debut). `client_name IS NULL` = disponible, rempli = pris
- Dashboard `/dashboard/planning` : 4 onglets (Creneaux, Reservations, Resa en ligne, Parametres)
  - **Creneaux** : vue semaine (drag & drop inter-jours), vue jour (timeline 8h-21h), ajout creneaux (heures predefinies + custom), copie semaine, story Instagram
  - **Reservations** : tous les RDV reserves (a venir + passes), modal detail (prestations, duree, prix, acompte, notes, photos, historique client), boutons modifier + confirmer/annuler acompte + **ajouter a mon agenda** (export .ics RFC 5545 client-side via `src/lib/ics.ts`, compatible Apple Calendar / Google Calendar, timezone merchant)
  - **Resa en ligne** : toggle activation, config acompte (lien, pourcentage ou montant fixe, message), info et warning si lien externe
  - **Parametres** : message libre public, conditions de reservation
- **Couleurs services** : palette 10 couleurs attribuees automatiquement aux services, affichees sur les creneaux en vue semaine/jour
- **Historique client** : dans le modal booking, affiche les RDV passes du client (via `GET /api/planning?customerId=`)
- **Photos resultat** : photos "apres" prestation (max 3/creneau), separees des photos inspiration. Groupees sous un depliant "Photos" (Avant/Apres) dans le modal edition
- Flow edition : clic slot reserve → direct modal edition (skip selection client). Clic slot libre → Modal 1 (choix/creation client) → Modal 2 (edition)
- **Modal selection client** : recherche par nom OU telephone (API normalise le numero en E.164 via `getAllPhoneFormats`). Bouton "Passer" masque si un numero est saisi (force creation client). Bouton "Etape suivante" masque si aucun client selectionne
- **Modal edition** : prestations selectionnees en haut, non-selectionnees en dessous (4 visibles + "Voir X autres" expandable). Toggle SMS confirmation (nouveau RDV uniquement). Overlay deplacement avec toggle SMS. Overlay annulation avec confirmation + toggle SMS
- **Creation client depuis planning** : reutilise `/api/customers/create`. Si client existe deja (409), l'API retourne `customer_id` et le planning le reutilise automatiquement
- **Auto-creation client + voucher bienvenue** : a la reservation en ligne, si nouveau client, creation automatique du customer + carte fidelite + voucher bienvenue (si `welcome_offer_enabled`)
- Tables : `merchant_planning_slots` (mig 063+065+083+084), `planning_slot_services` (mig 071), `planning_slot_photos` (mig 072), `planning_slot_result_photos` (mig 074)
- Colonnes `instagram_handle`, `tiktok_handle`, `facebook_url` sur `customers` (mig 073)
- API `/api/planning` (GET avec join services+photos+result_photos+customer social, filtre `customerId`/POST/PATCH avec cascade fillers/DELETE avec cascade fillers) + `/api/planning/book` (POST public, rate-limited) + `/api/planning/copy-week` + `/api/planning/photos` + `/api/planning/result-photos` + `/api/planning/shift-slot` + `/api/customers/social`
- Helpers partages : `_photo-helpers.ts`, `computeDepositAmount()` dans `planning/utils.ts`
- Page publique `/p/[slug]` : section "Disponibilites" (60j glissants, groupes par mois, preview 4 jours + bouton Voir plus), banniere message libre

### Programmes Membres
- Cartes de membre avec validite, avantages personnalises
- Tables `member_programs` + `member_cards`

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
- `POST /api/merchants/referral-config` — Config parrainage + offre bienvenue (merchant auth)

### Offre de bienvenue
- `GET /api/welcome?code=` — Valider code welcome (public)
- `POST /api/welcome` — Inscription via offre bienvenue. Accepte les clients existants si `current_stamps === 0` et pas de voucher welcome/referral existant (ex: client cree via planning). Bloque si stamps > 0 ou voucher deja attribue.
- `POST /api/vouchers/grant` — Attribution manuelle voucher welcome/promo (merchant auth). Verification stamps + doublons. `PATCH` = consommer, `DELETE` = retirer, `GET` = lister vouchers client
- Offre de bienvenue : eligible si nouveau client OU client existant avec 0 tampons et sans voucher welcome/referral

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
  - `birthday` — voeux + cadeau anniversaire (cron morning-jobs)
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
- `GET /api/stripe/payment-method` — Methode de paiement active

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
- `/api/admin/merchants/[id]` — GET stats (21 queries paralleles : clients, visites, redemptions, referrals, services, photos, planning slots+bookings, **resas en attente d'acompte**, push, vouchers)/PATCH notes. Page detail affiche les liens externes du merchant (booking_url, deposit_link avec montant/%, review_link, reseaux sociaux). StatCard "Resas en attente d'acompte" avec icone sablier + highlight ambre si > 0.
- `/api/admin/merchants-data` — liste globale agregation : ajoute `pendingDepositsCounts` par merchant (derive de `slotsList` deja charge, zero query supplementaire). Badge orange sablier sur la ligne merchant dans `/admin/merchants` (desktop + mobile) pour reperer d'un coup d'oeil les merchants qui ont des resas bloquees.
- `/api/admin/activity-feed` — Timeline activite (scans, inscriptions, recompenses, nouveaux clients, vouchers, reservations planning, offres bienvenue, messages). Optimise : fetch merchants par IDs references uniquement
- `/api/admin/announcements` — CRUD annonces
- `/api/admin/tracking` — GET aggregation globale (12 queries paralleles) : funnel signup, engagement scans, feature adoption, push/email stats, planning/offres, croissance clients
- `/api/admin/incomplete-signups`, `/api/admin/prospects`, `/api/admin/tasks`, `/api/admin/merchant-emails`

---

## 7. Inscription & Onboarding

1. **Phase 1:** Email + password (`/auth/merchant/signup`) — filet typo email
2. **Phase 2:** Infos commerce (`/auth/merchant/signup/complete`)
3. **Personnalisation** (`/dashboard/personalize`) — logo + ambiance couleurs (12 palettes : Elegant, Glamour, Moderne, Zen, Sable, Dore, Ocean, Passion, Menthe, Indigo, Terracotta, Noir). Sauvegarde `logo_url`, `primary_color`, `secondary_color` puis redirige vers `/dashboard/program`. Page onboarding-only (pas dans la sidebar). **Défaut UI : Glamour** — si le merchant a encore les couleurs par défaut DB (`#654EDA`/`#9D8FE8`, aucune palette ne les propose), la page pré-coche Glamour pour éviter de laisser aucune palette sélectionnée. **Guards critiques** : (1) init couleurs/logo se déclenche une seule fois (`initialized` flag) pour éviter écrasement par background refetch ; (2) bouton Continuer désactivé pendant upload (`disabled={saving || uploading}`) ; (3) pas de `refetch()` avant `router.push` — évite race condition session qui redirigeait vers `/auth/merchant` ; (4) erreur upload affichée (`uploadError` state, clé i18n `personalize.uploadError`) ; (5) extension fichier fallback `png|jpg` si absente.
4. **Welcome** (`/dashboard/welcome`) — redirige vers `/dashboard/program` (page legacy conservee pour eviter 404 sur URLs bookmarkees).
5. `/dashboard/program` → config (couleurs, stamps, reward, extras : parrainage, avis Google, duo, jours x2, anniversaire)
6. Premiere sauvegarde → modal "Ton programme est en ligne !" → "Voir le parcours client" (`/scan/{code}`) ou "Plus tard" → `/dashboard/qr-download`
7. QR download → modal (1x) "Aide-nous a te rendre visible" → "Completer ma page" (`/dashboard/public-page`)
8. `isFirstSetup` = true quand `reward_description` is null
9. Email QR code envoye a la premiere config

**OnboardingChecklist** : 15 etapes en 3 groupes accordion (Fidelite 6, Vitrine 5, Planning 4). Groupe Fidelite : programme, logo, QR, parrainage, anniversaire, 1er client. Groupe Vitrine : bio, adresse, photos, prestations, reseaux. Groupe Planning : activer planning, creneaux, resa en ligne, 1ere resa. Progress ring SVG par groupe + barre globale. Celebrations sparkles (sparkleSubtle par etape, sparkleMedium par groupe, sparkleGrand quand 15/15). Auto-dismiss 3 jours apres completion. Visible en trial uniquement. **CTA "S'abonner" standalone** : bloc amber toujours visible entre la barre de progression et les groupes (hors groupes, ne compte pas dans le score). **Dismiss avec confirmation** : cliquer X bascule le header en mode confirmation ("Il te reste X etapes") avec boutons "Oui, fermer" / "Continuer" — fermeture directe sans confirmation si tout est complete.

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

---

## 9. Emails (34 templates)

**i18n** : Tous les templates utilisent `getEmailT(locale)` de `src/emails/translations/{fr,en}.ts`. La locale vient de `merchants.locale`. Aucun texte hardcode FR restant.

### Onboarding
WelcomeEmail, IncompleteSignupEmail (+1h), IncompleteSignupReminder2Email (+3h), ProgramReminderEmail (J+1), ProgramReminderDay2Email (J+2, par shop_type), ProgramReminderDay3Email (J+3), QRCodeEmail, FirstClientScriptEmail (J+2 post-config), QuickCheckEmail (J+4 si 0 scans), ChallengeCompletedEmail (DESACTIVE)

### Engagement
FirstScanEmail (2e visite), Day5CheckinEmail, FirstRewardEmail, Tier2UpsellEmail, WeeklyDigestEmail, PendingPointsEmail (Shield)

### Retention & Trial
TrialEndingEmail (J-5/3/1), TrialExpiredEmail (J+1/3/5), InactiveMerchantDay7/14/30Email

### Stripe
SubscriptionConfirmedEmail, PaymentFailedEmail, SubscriptionCanceledEmail, SubscriptionReactivatedEmail, ReactivationEmail (J+7/14/30, sans code promo)

### Autres
GuidedSignupEmail, LastChanceSignupEmail, AutoSuggestRewardEmail, BirthdayNotificationEmail, GracePeriodSetupEmail, ProductUpdateEmail, SetupForYouEmail, AnnouncementMaPageEmail, WinBackEmail (envoi manuel admin — 3 features, sans code promo), VitrineReminderEmail (J+3), PlanningReminderEmail (J+4)

### Codes promo
Tous les codes promo emails ont ete supprimes (QARTE50, QARTEBOOST, QARTELAST, QARTECHALLENGE2026, QARTEPROEHJT). Aucun code de reduction n'est envoye automatiquement.

### Cron Jobs
| Cron | Horaire | Description |
|------|---------|-------------|
| `/api/cron/morning` | 09:00 UTC | Emails : essai, onboarding, milestones, inactifs, reactivation, lifecycle, pending. Prefetch unique merchants/emails/tracking — filtres JS par section |
| `/api/cron/morning-jobs` | 09:15 UTC | Vouchers anniversaire (timezone-aware) + SMS anniversaire + auto-liberation acomptes expires |
| `/api/cron/morning-push` | 09:30 UTC | Push 10h (scheduled), push automations (inactifs/recompense/events), push trial reminders |
| `/api/cron/evening` | 17:00 UTC | Push 19h (timezone-aware) + check acomptes expires + SMS rappel J-1 |
| `/api/cron/monthly-contest` | 08:00 UTC, 1er du mois | Tirage au sort mensuel : pick random parmi clients ayant reserve le mois precedent, insert merchant_contests, push + email merchant |
| `/api/cron/reactivation` | — | Deprecie (integre dans morning, section 7) |

### Anti-spam
- `List-Unsubscribe` + `List-Unsubscribe-Post` headers
- Dedup via `pending_email_tracking` table
- WhatsApp retire de tous les emails (delivrabilite)

---

## 10. Pages Principales

### Landing (`/`)
Hero (mockup iPhone de face: greeting, prochain RDV, parrainage, fidelite tampons, recompense, historique) → SocialProof → FeaturesGridSection (grille 3x3, 9 features avec emojis: reservations "mode libre ou creneaux", rappels SMS+push, page pro, regles, fidelite, photos, suivi, relances, avis Google — cartes blanches animees framer-motion, fond blanc + ambient glow + grain) → FideliteSection (light, 4 blocs: programme+QR, relances+anniversaires, avis Google, journal client) → PageProSection (dark, 4 blocs: planning "horaires ou creneaux", SMS automatiques, SEO, bienvenue) → Testimonials (5 cards, carousel mobile) → Pricing (image+prix bandeau, 8 features courtes style Notion — Reservations en ligne, SMS de rappels et confirmations inclus, Programme de fidelite, Acompte en ligne, Parrainage automatique, Avis Google, Reference sur Google, Clients illimites — prix annuel, badges confiance) → FAQ (12 questions, Q4 explique mode libre + creneaux) → Footer (FooterCta + FooterDark). Toutes les sections landing utilisent des emojis au lieu d'icones Lucide pour les badges et visuels decoratifs. Typo landing : titres de section en Playfair Display italic sur les mots gradient + surlignage indigo (sections light) ou sans surlignage (sections dark). Separateurs dot+traits. CTAs differencies : noir (FideliteSection), blanc (PageProSection), gradient violet (Hero). Grain texture SVG sur FideliteSection

Hero titre : "La facon la plus simple de **remplir ton agenda et fidéliser tes clientes.**"
Hero subtitle : "Vitrine en ligne, reservations, fidelite, rappels SMS — tout est inclus, sans outil complique."
Hero CTAs : "Essai gratuit" (primary, glassmorphism violet) + "Voir la demo" (secondary, glassmorphism dark) — empiles sur mobile, cote a cote desktop
Hero badges features : 4 pilules blanches avec coche verte — "Vitrine en ligne", "Reservations", "Fidelite", "Rappels SMS"
Footer badge Google Reviews : logo Google couleur + 5 etoiles + "5.0 sur Google" — sous "Concu avec amour a Marseille par Tenga Labs" dans FooterDark

SocialProof bandeau : "Plus d'un millier de **pros de la beaute** attirent et **fidelisent** avec Qarte" — mots cles en indigo-600

Demos accessibles via : bouton hero → demo carte fidelite, page vitrine `/p/demo-*`, selecteur tampons/cagnotte sur carte demo.
Demo popup (sessionStorage) : explique les 2 piliers (carte + vitrine) au premier affichage de la demo carte.
CTA uniforme : "Essayer gratuitement" (toutes sections). Positionnement : page pro (acquisition) + programme fidelite (retention) = un seul outil. Lien en bio = feature principale.

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
Stats temps reel, programme fidelite, QR code & Kit promo, gestion clients (4 filtres + CustomerManagementModal 5 onglets : Points, Cadeaux/Offres fusionne, Historique avec RDV planning, Journal de suivi client, Supprimer), push notifications, abonnement, parrainage, parametres. **Widget "Prochains rendez-vous"** : 5 prochains RDV bookes groupes Aujourd'hui/A venir, clic → deep link `/dashboard/planning?slot=id` ouvre le modal detail. **Welcome claims** : 3 derniers vouchers bienvenue dans la section activite recente. Raccourcis mobile : Ma Page (gradient indigo-violet 400), Fidelite (gradient pink-rose 400), Planning (gradient cyan-blue 400), Clients (gris), QR Code (gris), Abonnement (gris).

**Navigation sidebar** : Accueil, Programme de fidelite, Ma Page, QR code & Supports, Planning, Clients, Parrainage, Notifications, Abonnement, Parametres
- **Membres** (`/dashboard/members`) : retire de la nav, accessible via bouton "Programmes VIP" dans Clients
- **Ma Page** (`/dashboard/public-page`) : 3 sections collapsibles avec bordure coloree et header gradient — "Mon salon" (emerald: InfoSection), "Contenu" (pink: PhotosSection, ServicesSection), "Acquisition" (violet: WelcomeSection, PromoSection). Sub-components dans fichiers separes, exposes via `forwardRef`/`useImperativeHandle` avec `save()`. Autosave debounce 1.5s : chaque enfant appelle `onDirty`, le parent orchestre `Promise.all` sur les `save()`. Barre de completion SVG ring (7 items : nom, adresse, bio, logo, horaires, reseaux, bienvenue) — lien page publique visible seulement si completion >= 3/7. Deux modals au niveau page : help modal (explication page) et welcome help modal (remonte depuis WelcomeSection).
- **Parametres** (`/dashboard/settings`) : email (lecture seule), type commerce, telephone, infos compte, export CSV, zone danger. Nom et adresse geres dans Ma Page uniquement.
- **Parrainage** (`/dashboard/referrals`) : config parrainage uniquement (toggle, recompenses parrain/filleul). Stats et tableau filtre (vrais parrainages uniquement, welcome exclus).
- **QR Code & Supports** (`/dashboard/qr-download`) : QR code + Kit reseaux sociaux (image HD, legendes, grille 2x2 coloree de 4 tips + lien cross-promo vers Ma Page). Post-QR modal redirige vers Ma Page.

### Admin (`/admin`)
Metriques startup (MRR, churn, ARPU, LTV), lifecycle segments, health score, annonces, leads, analytics, depenses, tracking. **Exclut les comptes admin** des stats. Feature adoption : 15 features trackees (programme, logo, reseaux, parrainage, anniversaire, reservation, avis, offre active, PWA, shield, palier 2, offre bienvenue, double jours, adresse, mode cagnotte). Health score : /100 (programme +15, logo +10, reseaux +5, avis +5, reservation +5, clients +10-20, activite +15, recence +5-10, parrainage +5, shield +5, palier2 +5, bienvenue +5, anniversaire +3, double jours +2, planning +5, resa en ligne +5). **Dashboard** : 3 stat cards planning (Planning actif, Resa en ligne, Mode Libre). Badges merchants : Admin, NC, Shield pending, Resa/Planning, Libre, PWA, Bienvenue, Cagnotte, Page. **Detail merchant** : stat planning "X reservations / Y creneaux" + "Resas en ligne (total)", feature badges (Planning, Mode Libre, Buffer Xmin, Annulation J-X, Modif J-X), horaires avec pause dejeuner. **WhatsApp** : dropdown 2 onglets (Marketing 4 msgs + Tuto 2 msgs), constante `ADMIN_CONTACT_NAME` — sur liste et detail.

**Notification Bell** (mig 104) : icone cloche dans le header dashboard (mobile top-right fixe + desktop sidebar) avec badge rouge unread count. Dropdown 10 dernières notifs avec emoji par type (📅 booking, ❌ annulé, 🔄 déplacé, ⏰ acompte expiré, ⚠️ acompte bientôt, 🎂 anniversaire, 🎉 concours, 👋 onboarding, 🔔 default). "Tout lu" pour marquer comme lues. Click → deep link vers la bonne date du planning. Polling 60s. API `/api/merchant-notifications` (GET + PATCH). Composant `src/components/dashboard/NotificationBell.tsx`.

### Page Publique Programme (`/p/[slug]`)
Bio reseaux sociaux, sans auth. **JAMAIS de QR code ni lien /scan/** sur cette page (sauf CTA offre bienvenue → `/scan/{code}?welcome=`).

**Ordre des sections :**
1. Hero (logo glow couleurs merchant, nom gradient, adresse + badge "Y aller", bio glassmorphism)
1b. **Shortcut "Mes RDV & fidelite"** (premium card gradient merchant + shimmer + watermark) — visible uniquement si cookie `qarte_cust` present cote serveur (client deja passe par Qarte). Pointe vers `/customer/card/[merchantId]` qui regroupe RDV a venir + carte fidelite. Lu dans `page.tsx` via `cookies()` et passe en prop `hasPhoneCookie` a `ProgrammeView`. Pose lors d'une resa/checkin/register/login (voir section Cookie client).
2. CTA "Prendre rendez-vous" (conditionnel sur `booking_url`) + sticky bar quand hors viewport + detection plateforme ("via Planity/Treatwell/Fresha/Instagram/TikTok/WhatsApp/..." via `detectBookingPlatform()` dans utils.ts — 15 plateformes detectees)
3. Horaires (grille 7 jours, aujourd'hui mis en evidence)
4. Planning disponibilites (si `planning_enabled` : banniere message libre + creneaux 60j glissants groupes par mois, preview 4 jours + bouton "Voir plus", creneaux du jour passes masques automatiquement)
5. Offre de bienvenue (CTA conditionnel si `welcome_offer_enabled`, pointe vers `/scan/{code}?welcome=`)
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
- JSON-LD: Organization + SoftwareApplication (landing), LocalBusiness (page /p/[slug])
- Sitemap: pages statiques + blog + demos (pages merchant exclues — decouverte organique)
- Pages merchant indexables mais PAS dans le sitemap (evite les sitelinks Google sous getqarte.com)
- `/scan/` et `/customer/` : noindex + robots disallow

---

## 12. Analytics & Tracking

- **GTM:** GTM-T5Z84DPV | **GA4:** G-WM3XVQ38BD
- **Facebook Pixel:** 1438158154679532 (PageView, Lead, CompleteRegistration, StartTrial, Purchase, InitiateCheckout)
- **TikTok Pixel:** D6FCUKBC77UC649NN2J0 (PageView, ClickButton, CompleteRegistration, Subscribe)
- **Microsoft Clarity:** vjx7g9ttax
- **Facebook CAPI:** server-side Purchase sur webhook Stripe (dedup event_id)
- **Admin Tracking** (`/admin/tracking`) : dashboard consolide — funnel inscription (sources, feature choice, trend 90j, conversion), engagement (actifs 7j/30j, scans trend, top 10), adoption features (11 flags), push/email stats, planning/offres, croissance clients (trend, referrals, vouchers par source)
- **CTA tracking** : `trackCtaClick(name, location)` sur tous les CTAs signup (13 landing + 4 demo), stocke `signup_source` en localStorage → DB merchants. Visible dans `/admin/merchants`
- **Affiliation** (`/admin/affiliation`) : liens partenaires avec commission % personnalisable, suivi inscriptions + conversions. Lien format `?ref=SLUG` → `signup_source = 'affiliate_{slug}'`. Bandeau personnalise sur la page signup. Table `affiliate_links` (mig 081). API publique `/api/affiliate/resolve` pour resoudre slug → nom partenaire

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
