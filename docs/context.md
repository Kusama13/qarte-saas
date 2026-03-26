# Qarte SaaS — Contexte Projet

> Document principal du projet. Pour le schema DB complet, voir `docs/supabase-context.md`.

---

## 1. Overview

**Qarte** — Plateforme SaaS de cartes de fidelite digitales via QR/NFC.

- **URL:** getqarte.com | **Deploiement:** Vercel
- **Langues:** Francais (defaut, sans prefixe URL) + Anglais (`/en/*`) via `next-intl` | **Version:** 0.1.0
- **Ton FR:** tutoiement dashboard merchant, vouvoiement client-facing
- **Essai:** 7 jours | **Prix FR:** 19€/mois ou 190€/an | **Prix EN:** $19/mo ou $190/yr
- **Cible:** Salons de beaute (coiffeurs, barbiers, instituts, ongleries, spas, estheticiennes)
- **Entite:** SAS Tenga Labs — 60 rue Francois 1er, 75008 Paris

---

## 2. Tech Stack

- **Next.js** 15.5.12 (App Router) + **React** 18.3.1 + **TypeScript** 5.6.2
- **Tailwind CSS** 3.4.13 + **Framer Motion** (animations)
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- **Stripe** (paiements) + **Resend** (emails)
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
│   │   ├── dashboard/     # Dashboard merchant (protected) + onboarding (personalize, welcome)
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
│   ├── landing/           # Hero, SocialProof, FideliteSection (light), PageProSection (dark), Testimonials, Pricing, FAQ, Footer
│   ├── ui/                # Button, Input, Modal, Select, Badge, Toast, Skeleton
│   ├── shared/            # Header, Footer, CookieBanner, QRScanner
│   ├── dashboard/         # CustomerManagementModal, AdjustTab, RewardsCombinedTab, HistoryTab, JournalTab, DangerZone, PendingPointsWidget, OnboardingChecklist, ZeroScansCoach
│   ├── loyalty/           # StampsSection, CagnotteSection, RewardCard, RedeemModal, StickyRedeemBar, HistorySection, VoucherRewards, VoucherModals, ReviewModal, ReviewCard, BirthdaySection, SocialLinks, CardHeader, InstallPrompts, UpcomingAppointmentsSection
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

### Push Notifications
- Programmees (10h/18h), manuelles, automations (welcome, close_to_reward, reward_ready, inactive, reward_reminder, events)
- Batched 50, pause 100ms entre batches

### Support Multi-Pays
- 10 pays : FR, BE, CH, LU, US, GB, CA, AU, ES, IT — `PHONE_CONFIG` par pays
- `COUNTRIES_BY_LOCALE` : FR locale → FR/BE/CH/LU | EN locale → US/GB/CA/AU/BE/CH/LU/ES/IT
- E.164 sans + (ex: 33612345678, 15551234567)
- `formatPhoneNumber()`, `validatePhone()`, `displayPhoneNumber()` — tous avec param `country`
- `PhoneInput` composant (`src/components/ui/PhoneInput.tsx`) : selecteur pays drapeau+indicatif, dropdown, placeholder dynamique
- Utilise dans `/customer` (login client), `/auth/merchant/signup/complete` (inscription merchant)

### Fuseaux Horaires (country-aware)
- `COUNTRY_TIMEZONE` map dans `src/lib/utils.ts` : 10 pays → IANA timezone (FR→Europe/Paris, US→America/New_York, etc.)
- `getTimezoneForCountry(country?)` : resout le timezone IANA, defaut Europe/Paris
- `getTodayForCountry(country?)` : YYYY-MM-DD dans le fuseau du merchant
- `getTodayStartForCountry(country?)` : ISO UTC timestamp de minuit dans le fuseau du merchant (pour filtres `gte` DB)
- **Toutes les APIs** utilisent ces fonctions (checkin, cagnotte, stats, planning, offers, push, visits, vouchers)
- `getTodayInParis()` et `getCurrentDateTimeInParis()` marques `@deprecated` — wrappers retrocompatibles
- **Crons** (morning/evening) : utilisent `getTodayInParis()` intentionnellement (batch FR, pas per-merchant)
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

### Planning (mig 063-074)
- Planning avance gere par le merchant : multi-services, photos inspiration, photos resultat ("avant/apres"), liens sociaux clients
- 1 creneau = 1 ligne en DB (date + heure debut). `client_name IS NULL` = disponible, rempli = pris
- Dashboard `/dashboard/planning` : 3 onglets (Creneaux, Reservations, Parametres)
  - **Creneaux** : vue semaine (drag & drop inter-jours), vue jour (timeline 8h-21h), ajout creneaux (heures predefinies + custom), copie semaine, story Instagram
  - **Reservations** : tous les RDV reserves (a venir + passes), modal detail (prestations, duree, prix, notes, photos inspiration + photos resultat cliquables/telechargeable, historique client), bouton modifier
  - **Parametres** : message libre public, conditions de reservation
- **Couleurs services** : palette 10 couleurs attribuees automatiquement aux services, affichees sur les creneaux en vue semaine/jour
- **Historique client** : dans le modal booking, affiche les RDV passes du client (via `GET /api/planning?customerId=`)
- **Photos resultat** : photos "apres" prestation (max 3/creneau), separees des photos inspiration
- Flow edition 2 modals : Modal 1 (choix/creation client + reseaux sociaux Instagram/TikTok/Facebook) → Modal 2 (multi-services avec duree+prix, photos inspiration max 3, photos resultat max 3, notes, detection chevauchement avec options decaler/supprimer)
- **Creation client depuis planning** : reutilise `/api/customers/create`. Si client existe deja (409), l'API retourne `customer_id` et le planning le reutilise automatiquement. Erreurs affichees dans un bandeau rouge
- Tables : `merchant_planning_slots` (mig 063+065), `planning_slot_services` (mig 071, junction multi-services), `planning_slot_photos` (mig 072, max 3 photos inspiration), `planning_slot_result_photos` (mig 074, max 3 photos resultat — meme structure que planning_slot_photos)
- Colonnes `instagram_handle`, `tiktok_handle`, `facebook_url` sur `customers` (mig 073)
- API `/api/planning` (GET avec join services+photos+result_photos+customer social, filtre `customerId`/POST/PATCH avec service_ids[]/DELETE) + `/api/planning/copy-week` + `/api/planning/photos` (POST/DELETE) + `/api/planning/result-photos` (POST/DELETE) + `/api/planning/shift-slot` (POST, supporte `newDate` pour deplacements inter-jours) + `/api/customers/social` (PATCH)
- Helpers partages : `_photo-helpers.ts` (logique commune upload/delete pour photos et result-photos)
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
- `POST /api/vouchers/use` — Consommer voucher (auto-cree voucher parrain si referral)
- `POST /api/merchants/referral-config` — Config parrainage + offre bienvenue (merchant auth)

### Offre de bienvenue
- `GET /api/welcome?code=` — Valider code welcome (public)
- `POST /api/welcome` — Inscription via offre bienvenue. Accepte les clients existants si `current_stamps === 0` et pas de voucher welcome/referral existant (ex: client cree via planning). Bloque si stamps > 0 ou voucher deja attribue.
- `POST /api/vouchers/grant` — Attribution manuelle voucher welcome/promo (merchant auth). Verification stamps + doublons. `PATCH` = consommer, `DELETE` = retirer, `GET` = lister vouchers client
- Offre de bienvenue : eligible si nouveau client OU client existant avec 0 tampons et sans voucher welcome/referral

### Push & Marketing
- `POST /api/push/subscribe` — Abonnement push (auth cookie phone)
- `DELETE /api/push/subscribe` — Desabonnement push (auth cookie phone + ownership)
- `POST /api/push/send` — Envoi notification (rate limit 10/h par IP)
- `GET /api/offers` — Offres promo

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
- `DELETE /api/planning` — Supprimer creneaux (batch slotIds)
- `POST /api/planning/copy-week` — Copier horaires d'une semaine vers une autre
- `POST/DELETE /api/planning/photos` — Upload/suppression photos inspiration (max 3/creneau, magic bytes, rate limit)
- `POST/DELETE /api/planning/result-photos` — Upload/suppression photos resultat (max 3/creneau, magic bytes, rate limit, helpers partages avec photos)
- `POST /api/planning/shift-slot` — Decaler un creneau (newTime + newDate optionnel pour deplacements inter-jours, verifie UNIQUE)

### Journal de suivi client
- `GET/POST/PATCH/DELETE /api/customer-notes` — CRUD notes client (auth merchant, Zod)
- Table `customer_notes` (mig 080) : content, note_type (string libre), pinned, slot_id optionnel
- Types predefinis : general, allergy, preference, formula, observation + tags custom
- 5e onglet "Journal" dans CustomerManagementModal (BookOpen icon teal)
- Notes epinglees visibles comme "Memo client" dans BookingDetailsModal avant chaque RDV
- Photos resultat agglomerees depuis tous les RDV passes (lazy-loaded)
- Styles types partages via `src/lib/note-styles.ts` (getTypeStyle)

### Clients (social)
- `PATCH /api/customers/social` — MAJ liens sociaux (instagram_handle, tiktok_handle, facebook_url)

### Admin
- `/api/admin/merchants/[id]` — GET stats (20 queries paralleles : clients, visites, redemptions, referrals, services, photos, planning slots+bookings, push, vouchers)/PATCH notes
- `/api/admin/activity-feed` — Timeline activite (scans, inscriptions, recompenses, nouveaux clients, vouchers, reservations planning, offres bienvenue, messages). Optimise : fetch merchants par IDs references uniquement
- `/api/admin/announcements` — CRUD annonces
- `/api/admin/tracking` — GET aggregation globale (12 queries paralleles) : funnel signup, engagement scans, feature adoption, push/email stats, planning/offres, croissance clients
- `/api/admin/incomplete-signups`, `/api/admin/prospects`, `/api/admin/tasks`, `/api/admin/merchant-emails`

---

## 7. Inscription & Onboarding

1. **Phase 1:** Email + password (`/auth/merchant/signup`) — filet typo email
2. **Phase 2:** Infos commerce (`/auth/merchant/signup/complete`)
3. **Personnalisation** (`/dashboard/personalize`) — logo + ambiance couleurs (8 palettes). Sauvegarde `logo_url`, `primary_color`, `secondary_color` puis redirige vers welcome. Page onboarding-only (pas dans la sidebar).
4. **Welcome** (`/dashboard/welcome`) — "Qarte t'offre deux super-pouvoirs" : 2 cartes (Programme fidelite → `/dashboard/program`, Ma page pro → `/dashboard/public-page`) + "Je verrai plus tard" → `/dashboard`. Auto-redirect vers `/dashboard` si merchant deja configure et pas venu de l'onboarding. Page onboarding-only (pas dans la sidebar).
5. `/dashboard/program` → config (couleurs, stamps, reward)
6. Premiere sauvegarde → modal "Ton programme est en ligne !" → "Voir le parcours client" (`/scan/{code}`) ou "Plus tard" → `/dashboard/qr-download`
7. QR download → modal (1x) "Aide-nous a te rendre visible" → "Completer ma page" (`/dashboard/public-page`)
8. `isFirstSetup` = true quand `reward_description` is null
9. Email QR code envoye a la premiere config

**OnboardingChecklist** : 8 etapes (programme, logo, reseau social, adresse, photo, simuler experience, QR download, 2 premiers scans), confetti a la completion (one-shot localStorage), auto-dismiss 3 jours apres. Visible seulement en trial.

**Score programme** : cercle sticky 0-100% (recompense 25pts, logo 20pts, reseaux 15pts, avis 15pts, reservation 10pts, palier2 10pts, jours x2 5pts)

**Boutons save unifies** : tous `bg-indigo-600 hover:bg-indigo-700` (default), `bg-emerald-600` (saved), `rounded-xl`, icone Check/Loader2. Coherent sur Ma Page, Programme, Parrainage, Parametres.

**Headers unifies** : tous `bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]` avec titre gradient `from-indigo-600 to-violet-600`.

---

## 8. Stripe & Abonnement

### Pricing dual-devise
- **FR (EUR):** `PLAN` (19€/mois) + `PLAN_ANNUAL` (190€/an) — `STRIPE_PRICE_ID` + `STRIPE_PRICE_ID_ANNUAL`
- **EN (USD):** `PLAN_EN` ($19/mo) + `PLAN_ANNUAL_EN` ($190/yr) — `STRIPE_PRICE_ID_EN` + `STRIPE_PRICE_ID_ANNUAL_EN`
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
- Plan annuel : badge + feature "Carte NFC offerte (valeur 20 €)" en surbrillance indigo
- 8 features cles (liste reduite), grid 2 colonnes desktop + mobile compact
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
SubscriptionConfirmedEmail, PaymentFailedEmail, SubscriptionCanceledEmail, SubscriptionReactivatedEmail, ReactivationEmail (J+7/14/30 codes promo)

### Autres
GuidedSignupEmail, LastChanceSignupEmail, AutoSuggestRewardEmail, BirthdayNotificationEmail, GracePeriodSetupEmail, ProductUpdateEmail, SetupForYouEmail, AnnouncementMaPageEmail

### Cron Jobs
| Cron | Horaire | Description |
|------|---------|-------------|
| `/api/cron/morning` | 09:00 UTC | Emails essai, rappels, push 10h, vouchers anniversaire (timezone-aware via `getTodayForCountry`) |
| `/api/cron/evening` | 17:00 UTC | Push 18h (timezone-aware via `getTodayForCountry`) |
| `/api/cron/reactivation` | 10:00 UTC | Win-back J+7/14/30 |

### Anti-spam
- `List-Unsubscribe` + `List-Unsubscribe-Post` headers
- Dedup via `pending_email_tracking` table
- WhatsApp retire de tous les emails (delivrabilite)

---

## 10. Pages Principales

### Landing (`/`)
Hero (mockup page pro + floating badges) → SocialProof → FideliteSection (light, 3 blocs: programme+QR, relances+anniversaires, avis Google) → PageProSection (dark, 3 blocs: SEO, planning, bienvenue) → Testimonials (5 cards, carousel mobile) → Pricing (image+prix bandeau Booksy-style, epure) → FAQ (8 questions) → Footer (FooterCta + FooterDark)

Hero titre : "Difficile d'attirer de nouvelles clientes. Encore plus de les faire revenir. **Qarte fait les deux, en un lien.**"
Hero subtitle : "Vitrine en ligne, programme de fidelite, planning — tout ce dont ton salon a besoin, dans un seul lien pour ta bio Instagram, TikTok et Google."
Hero CTAs : "Essai gratuit" (primary) + "Voir la demo" (secondary, ouvre demo carte fidelite onglerie)

Demos accessibles via : bouton hero → demo carte fidelite, page vitrine `/p/demo-*`, selecteur tampons/cagnotte sur carte demo.
Demo popup (sessionStorage) : explique les 2 piliers (carte + vitrine) au premier affichage de la demo carte.
CTA uniforme : "Essayer gratuitement" (toutes sections). Positionnement : page pro (acquisition) + programme fidelite (retention) = un seul outil. Lien en bio = feature principale.

### Login Client (`/customer`)
Fond gradient mesh anime (orbes indigo/violet/rose), 4 mini cartes de fidelite flottantes (Framer Motion), formulaire glass-morphism (`bg-white/70 backdrop-blur-2xl`), footer "Propulse par Qarte en France"

### Wallet Client (`/customer/cards`)
Design Apple Wallet, fond `bg-[#f7f6fb]`, greeting typographique, cartes avec header merchant colore, glow reward-ready, dual tier barres

### Carte Fidelite Client (`/customer/card/[merchantId]`)
Header colore avec nom merchant. Boutons conditionnels dans le header : "Membre" (si member card active), "Reserver" (si `booking_url`), **"Infos"** (si `slug` — lien vers `/p/[slug]`, toujours affiche).

**Prochains rendez-vous** : section `UpcomingAppointmentsSection` (si `planning_enabled` et RDV a venir). Max 3 RDV avec date longue, heure, services. Message "Contactez {shop} pour modifier ou annuler" (vouvoiement). Placee entre offre exclusive et tampons.

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
Metriques startup (MRR, churn, ARPU, LTV), lifecycle segments, health score, annonces, leads, analytics, depenses, tracking. **Exclut les comptes admin** des stats. Feature adoption : 15 features trackees (programme, logo, reseaux, parrainage, anniversaire, reservation, avis, offre active, PWA, shield, palier 2, offre bienvenue, double jours, adresse, mode cagnotte). Health score : /100 (programme +15, logo +10, reseaux +5, avis +5, reservation +5, clients +10-20, activite +15, recence +5-10, parrainage +5, shield +5, palier2 +5, bienvenue +5, anniversaire +3, double jours +2). Badges merchants : Admin, NC, Shield pending, PWA, Bienvenue, Cagnotte. **Activite** : timeline 8 types d'evenements (scans, inscriptions, recompenses, nouveaux clients, vouchers, reservations planning, offres bienvenue, messages) avec summary cards et filtres. **Detail merchant** : stat planning "X reservations / Y creneaux" (futurs).

### Page Publique Programme (`/p/[slug]`)
Bio reseaux sociaux, sans auth. **JAMAIS de QR code ni lien /scan/** sur cette page (sauf CTA offre bienvenue → `/scan/{code}?welcome=`).

**Ordre des sections :**
1. Hero (logo glow couleurs merchant, nom gradient, adresse + badge "Y aller", bio glassmorphism)
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
11. Reseaux sociaux (icones Instagram/Facebook/TikTok/WhatsApp/Snapchat)
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

### Style
- Glassmorphism auth pages (`backdrop-blur-xl`, `bg-white/80`)
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
