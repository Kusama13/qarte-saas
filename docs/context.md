# Qarte SaaS — Contexte Projet

> Document principal du projet. Pour le schema DB complet, voir `docs/supabase-context.md`.

---

## 1. Overview

**Qarte** — Plateforme SaaS de cartes de fidelite digitales via QR/NFC.

- **URL:** getqarte.com | **Deploiement:** Vercel
- **Langue:** Francais (tutoiement dans le dashboard merchant, vouvoiement pour les textes client-facing) | **Version:** 0.1.0
- **Essai:** 7 jours | **Prix:** 19€/mois ou 190€/an
- **Cible:** Salons de beaute (coiffeurs, barbiers, instituts, ongleries, spas, estheticiennes)
- **Entite:** SAS Tenga Labs — 60 rue Francois 1er, 75008 Paris

---

## 2. Tech Stack

- **Next.js** 15.5.12 (App Router) + **React** 18.3.1 + **TypeScript** 5.6.2
- **Tailwind CSS** 3.4.13 + **Framer Motion** (animations)
- **Supabase** (PostgreSQL + Auth + Storage + RLS)
- **Stripe** (paiements) + **Resend** (emails)
- **Recharts** (graphiques), **Lucide React** (icones), **jsPDF** + **QRCode** (PDF/QR), **Web Push**

---

## 3. Structure du Projet

```
src/
├── app/
│   ├── api/               # Routes API (voir section 6)
│   ├── auth/              # Signup 2 phases + login
│   ├── dashboard/         # Dashboard merchant (protected) + onboarding (personalize, welcome)
│   ├── admin/             # Dashboard admin (super_admins)
│   ├── customer/          # Carte fidelite + wallet
│   ├── scan/[code]/       # Scan QR (page publique)
│   ├── boutique/          # Carte NFC (20€)
│   ├── p/[slug]/          # Page publique programme (bio reseaux)
│   ├── pros/              # Social proof merchants
│   └── page.tsx           # Landing page
│
├── components/
│   ├── landing/           # Hero, SocialProof, LoyaltyModes, BentoFeatures, Testimonials, Pricing, FAQ, Footer
│   ├── ui/                # Button, Input, Modal, Select, Badge, Toast, Skeleton
│   ├── shared/            # Header, Footer, CookieBanner, QRScanner
│   ├── dashboard/         # CustomerManagementModal, AdjustTab, RewardsTab, HistoryTab, DangerZone, PendingPointsWidget, OnboardingChecklist, ZeroScansCoach
│   ├── loyalty/           # StampsSection, CagnotteSection, RewardCard, RedeemModal, StickyRedeemBar, HistorySection, VoucherRewards, VoucherModals, ReviewModal, ReviewCard, BirthdaySection, SocialLinks, CardHeader, InstallPrompts
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
├── AUDIT-SECURITE.md     # Score 93/100
└── AUDIT-SCALABILITE.md  # Score 94/100

supabase/migrations/      # 58 migrations SQL (001-058)
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
- `double_days_enabled` + `double_days_of_week` (JSON array getDay(), timezone Paris)
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
- Config dans Ma Page (`/dashboard/public-page`), banner lecture seule dans Parrainage
- Dashboard parrainage : "Qarte" badge violet dans le tableau pour referrals welcome

### Birthday Gift
- `birth_month` / `birth_day` sur customers, voucher source='birthday'
- Cron morning genere les vouchers anniversaire

### Push Notifications
- Programmees (10h/18h), manuelles, automations (welcome, close_to_reward, reward_ready, inactive, reward_reminder, events)
- Batched 50, pause 100ms entre batches

### Support Multi-Pays
- FR, BE, CH, LU — `PHONE_CONFIG` par pays
- E.164 sans + (ex: 33612345678)
- `formatPhoneNumber()`, `validatePhone()`, `displayPhoneNumber()`

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
- `GET /api/customers/card` — Carte fidelite
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
- `POST /api/welcome` — Inscription via offre bienvenue (cree customer + carte + voucher welcome + referral Qarte)

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

### Admin
- `/api/admin/merchants/[id]` — GET stats/PATCH notes
- `/api/admin/announcements` — CRUD annonces
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
| checkout.session.completed | `active` | SubscriptionConfirmedEmail |
| subscription.updated (cancel_at_period_end) | `canceling` | SubscriptionCanceledEmail |
| subscription.updated (canceling→active) | `active` | SubscriptionReactivatedEmail |
| subscription.deleted | `canceled` | — |
| invoice.payment_failed | `past_due` | PaymentFailedEmail |
| invoice.payment_succeeded (recovery) | `active` | SubscriptionConfirmedEmail |

**Grace period** : 3 jours apres expiration (lecture seule), suppression apres 3 jours.

---

## 9. Emails (34 templates)

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
| `/api/cron/morning` | 09:00 UTC | Emails essai, rappels, push 10h, vouchers anniversaire |
| `/api/cron/evening` | 17:00 UTC | Push 18h |
| `/api/cron/reactivation` | 10:00 UTC | Win-back J+7/14/30 |

### Anti-spam
- `List-Unsubscribe` + `List-Unsubscribe-Post` headers
- Dedup via `pending_email_tracking` table
- WhatsApp retire de tous les emails (delivrabilite)

---

## 10. Pages Principales

### Landing (`/`)
Hero (mockup page pro + floating badges) → SocialProof → LoyaltyModes (4 cartes: SEO Google, Offre bienvenue, Avis Google, Parrainage) → BentoFeatures (bento grid) → Testimonials (WhatsApp/iMessage) → Pricing (19€/mois) → FAQ (11 questions) → Footer (FooterCta + FooterDark)

CTA uniforme : "Booste ton salon en 5 min" (toutes sections). Positionnement : page pro (acquisition) + programme fidelite (retention) = un seul outil.

### Login Client (`/customer`)
Fond gradient mesh anime (orbes indigo/violet/rose), 4 mini cartes de fidelite flottantes (Framer Motion), formulaire glass-morphism (`bg-white/70 backdrop-blur-2xl`), footer "Propulse par Qarte en France"

### Wallet Client (`/customer/cards`)
Design Apple Wallet, fond `bg-[#f7f6fb]`, greeting typographique, cartes avec header merchant colore, glow reward-ready, dual tier barres

### Scan (`/scan/[code]`)
Inscription rapide, validation passage, progression fidelite, detection `?ref=` pour parrainage

### Dashboard (`/dashboard`)
Stats temps reel, programme fidelite, QR code & Kit promo, gestion clients (4 filtres + CustomerManagementModal 4 onglets), push notifications, abonnement, parrainage, parametres. Raccourcis mobile : Ma Page (gradient indigo-violet), Fidelite (gradient pink-rose), QR Code, Clients, Parrainage, Abonnement.

**Navigation sidebar** : Accueil, Programme de fidelite, Ma Page, QR code & Supports, Clients, Parrainage, Notifications, Abonnement, Parametres
- **Membres** (`/dashboard/members`) : retire de la nav, accessible via bouton "Programmes VIP" dans Clients
- **Ma Page** (`/dashboard/public-page`) : gere nom du salon, adresse, lien reservation, offre bienvenue, photos, prestations/categories. Bouton d'aide (?) expliquant l'interet pour attirer de nouveaux clients.
- **Parametres** (`/dashboard/settings`) : email (lecture seule), type commerce, telephone, infos compte, export CSV, zone danger. Nom et adresse geres dans Ma Page uniquement.
- **Parrainage** (`/dashboard/referrals`) : config parrainage uniquement. Offre bienvenue = banner lecture seule renvoyant vers Ma Page.
- **QR Code & Supports** (`/dashboard/qr-download`) : QR code + Kit reseaux sociaux (image HD, legendes, grille 2x2 coloree de 4 tips + lien cross-promo vers Ma Page). Post-QR modal redirige vers Ma Page.

### Admin (`/admin`)
Metriques startup (MRR, churn, ARPU, LTV), lifecycle segments, health score, annonces, leads, analytics, depenses. **Exclut les comptes admin** des stats. Feature adoption : 15 features trackees (programme, logo, reseaux, parrainage, anniversaire, reservation, avis, offre active, PWA, shield, palier 2, offre bienvenue, double jours, adresse, mode cagnotte). Health score : /100 (programme +15, logo +10, reseaux +5, avis +5, reservation +5, clients +10-20, activite +15, recence +5-10, parrainage +5, shield +5, palier2 +5, bienvenue +5, anniversaire +3, double jours +2). Badges merchants : Admin, NC, Shield pending, PWA, Bienvenue, Cagnotte.

### Page Publique Programme (`/p/[slug]`)
Bio reseaux sociaux, sans auth. **JAMAIS de QR code ni lien /scan/** sur cette page (sauf CTA offre bienvenue → `/scan/{code}?welcome=`).

**Ordre des sections :**
1. Hero (logo, nom, adresse, badge Qarte, tagline fidelite)
2. CTA "Prendre rendez-vous" (conditionnel sur `booking_url`) + sticky bar quand hors viewport
3. Offre de bienvenue (CTA conditionnel si `welcome_offer_enabled`, pointe vers `/scan/{code}?welcome=`)
4. Carte fidelite simulee ("Votre future carte")
5. Palier 2 (si `tier2_enabled`)
6. Avantages exclusifs (anniversaire, parrainage, jours bonus)
7. Prestations (collapsible, ferme par defaut, depuis `merchant_services` + `merchant_service_categories`)
8. Reseaux sociaux (icones Instagram/Facebook/TikTok/Snapchat, sans bouton booking)
9. Galerie photos realisations (lightbox, grid 3 cols, max 6 photos depuis `merchant_photos`)
10. CTA merchant ("Vous aussi, fidelisez vos clients")

**Design :** glassmorphism (`bg-white/70 backdrop-blur-sm border-white/60`) sur sections avantages, prestations, photos. Badge hero : "Qarte — La fidelite digitale des pros de la beaute et du bien-etre".

- JSON-LD `LocalBusiness` (name, address, image, url, makesOffer)
- SEO: `generateMetadata()` avec og:image (1ere photo ou logo), description dynamique

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
- Sitemap: 9 pages (/, /pricing, /blog, 3 articles, /contact, /pros, /signup)

---

## 12. Analytics & Tracking

- **GTM:** GTM-T5Z84DPV | **GA4:** G-WM3XVQ38BD
- **Facebook Pixel:** 1438158154679532 (PageView, Lead, CompleteRegistration, StartTrial, Purchase, InitiateCheckout)
- **TikTok Pixel:** D6FCUKBC77UC649NN2J0 (PageView, ClickButton, CompleteRegistration, Subscribe)
- **Microsoft Clarity:** vjx7g9ttax
- **Facebook CAPI:** server-side Purchase sur webhook Stripe (dedup event_id)

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
| Marchands | ~2000-5000 |
| Checkins/jour | ~20,000 |
| Push/envoi | ~5,000 |
| Clients/marchand | ~2,000 |

*Details dans `docs/AUDIT-SCALABILITE.md`*
