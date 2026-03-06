# Qarte SaaS - Project Context

## 1. Overview

**Qarte** est une plateforme SaaS de digitalisation des cartes de fidelite. Elle permet aux commercants (instituts de beaute, ongleries, salons de coiffure, restaurants...) de creer et gerer des programmes de fidelite digitaux via QR codes.

- **URL:** getqarte.com
- **Version:** 0.1.0
- **Langue:** Francais
- **Essai:** 7 jours gratuits
- **Prix:** 19€/mois ou 190€/an
- **Entite juridique:** SAS Tenga Labs — 60 rue François 1er, 75008 Paris — Capital 5 000€ — +33 6 07 44 74 20

---

## 2. Tech Stack

### Framework & Runtime
- **Next.js** 15.5.12 (App Router)
- **React** 18.3.1
- **TypeScript** 5.6.2

### Styling
- **Tailwind CSS** 3.4.13
- Couleur primaire: `#654EDA`
- Couleur secondaire: `#9D8FE8`

### Backend & Database
- **Supabase** (PostgreSQL)
- **Stripe** (paiements)
- **Resend** (emails)

### Libraries Cles
- **Framer Motion** - animations
- **Recharts** - graphiques
- **Lucide React** - icones
- **jsPDF** - generation PDF
- **QRCode** - QR codes
- **Web Push** - notifications push

---

## 3. Structure du Projet

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Routes API
│   ├── auth/              # Pages authentification
│   ├── dashboard/         # Dashboard commercant
│   ├── admin/             # Dashboard admin
│   ├── customer/          # Pages client
│   ├── scan/[code]/       # Scan QR dynamique
│   ├── boutique/          # Page boutique carte NFC (presentation + lien Stripe)
│   └── page.tsx           # Landing page (composition de composants)
│
├── components/
│   ├── landing/           # 17 composants landing (Hero, SocialProof, LoyaltyModes, BentoFeatures, Testimonials, Pricing, FAQ, Footer...)
│   ├── ui/                # Composants UI (Button, Input, Modal, Select...)
│   ├── shared/            # Header, Footer, CookieBanner, QRScanner
│   ├── dashboard/         # CustomerManagementModal (inline name/birthday edit, pills header, stepper +/- ajustement, banner succes inline), CustomerAdjustTab, CustomerRewardsTab, CustomerHistoryTab, CustomerDangerZone, PendingPointsWidget, OnboardingChecklist, ZeroScansCoach
│   ├── loyalty/           # Composants fidelite (InstallPrompts, HistorySection, ExclusiveOffer, MemberCardModal, StampsSection, RewardCard, RedeemModal, StickyRedeemBar, SocialLinks, ScanSuccessStep, CardSkeleton, CardHeader, BirthdaySection, VoucherRewards, VoucherModals, ReviewModal, ReviewCard)
│   ├── marketing/         # SocialMediaTemplate
│   └── analytics/         # GTM, tracking, FacebookPixel, MicrosoftClarity
│
├── lib/                   # Utilitaires
│   ├── supabase.ts       # Client Supabase
│   ├── stripe.ts         # Client Stripe
│   ├── analytics.ts      # Tracking events
│   ├── push.ts           # Notifications push (clients)
│   ├── logger.ts         # Logger structuré
│   ├── scripts.ts        # Scripts verbaux par shop_type (emails + dashboard)
│   └── utils.ts          # Helpers (PHONE_CONFIG, formatPhoneNumber, validatePhone, displayPhoneNumber, generateReferralCode, suggestEmailCorrection, EMAIL_DOMAINS)
│
├── emails/               # Templates React Email (33 templates + BaseLayout)
│   ├── BaseLayout.tsx             # Layout de base (header violet, footer)
│   ├── WelcomeEmail.tsx           # Bienvenue (urgence + temoignage)
│   ├── IncompleteSignupEmail.tsx  # Relance inscription +1h
│   ├── IncompleteSignupReminder2Email.tsx # Relance inscription +3h
│   ├── ProgramReminderEmail.tsx   # Rappel programme J+1
│   ├── ProgramReminderDay2Email.tsx # Rappel programme J+2 (par shop_type)
│   ├── ProgramReminderDay3Email.tsx # Rappel programme J+3 (urgence)
│   ├── TrialEndingEmail.tsx       # Fin essai J-5/3/1
│   ├── TrialExpiredEmail.tsx      # Essai expire J+1/3/5
│   ├── InactiveMerchantDay7Email.tsx  # Inactif J+7 (diagnostic)
│   ├── InactiveMerchantDay14Email.tsx # Inactif J+14 (pression)
│   ├── InactiveMerchantDay30Email.tsx # Inactif J+30 (check-in)
│   ├── FirstScanEmail.tsx         # Premier scan (celebration + bloc parrainage)
│   ├── Day5CheckinEmail.tsx       # Check-in J+5
│   ├── FirstRewardEmail.tsx       # Premiere recompense
│   ├── Tier2UpsellEmail.tsx       # Upsell palier VIP
│   ├── WeeklyDigestEmail.tsx      # Bilan hebdomadaire
│   ├── PendingPointsEmail.tsx     # Passages en attente (Shield)
│   ├── QRCodeEmail.tsx            # QR code + kit reseaux sociaux (merged)
│   ├── FirstClientScriptEmail.tsx # Script verbal J+2 post-config (par shop_type)
│   ├── QuickCheckEmail.tsx        # Check-in J+4 post-config (0 scans)
│   ├── SubscriptionConfirmedEmail.tsx # Confirmation abonnement (Stripe)
│   ├── PaymentFailedEmail.tsx     # Echec paiement (Stripe)
│   ├── SubscriptionCanceledEmail.tsx # Annulation abonnement (Stripe)
│   ├── SubscriptionReactivatedEmail.tsx # Reactivation abonnement (canceling→active)
│   ├── ChallengeCompletedEmail.tsx # Defi reussi 5 clients/3 jours (codes promo)
│   ├── GuidedSignupEmail.tsx      # Relance inscription incomplete T+24h
│   ├── LastChanceSignupEmail.tsx   # Derniere chance inscription
│   ├── ReactivationEmail.tsx      # Win-back J+7/14/30 (codes promo)
│   ├── AutoSuggestRewardEmail.tsx  # Suggestion recompense J+5 si non configuree (par shop_type)
│   ├── BirthdayNotificationEmail.tsx # Notification merchant : clients fetant leur anniversaire (cron)
│   ├── GracePeriodSetupEmail.tsx   # Grace period : offre setup done-for-you (J+10)
│   ├── ProductUpdateEmail.tsx      # Newsletter produit hebdomadaire
│   └── SetupForYouEmail.tsx        # Setup assiste T+72h si inscription incomplete
│
├── hooks/
│   └── useInView.ts     # Hook IntersectionObserver (landing)
│
├── types/index.ts        # Types TypeScript
├── contexts/             # React contexts
└── middleware.ts         # Auth middleware

docs/
├── context.md            # Contexte projet (ce fichier)
├── AUDIT-MARKETING.md    # Audit marketing complet (CMO senior, landing, SEO, emails, analytics)
├── AUDIT-SECURITE.md     # Audit securite (OWASP, RLS, auth, API)
└── AUDIT-SCALABILITE.md  # Audit scalabilite (DB, API, cron, frontend)

supabase/
└── migrations/           # 52 migrations SQL
    ├── 001-025           # Schema initial + fixes
    ├── 026-033           # Trial, spelling, reactivation, country, shield, referral
    ├── 034               # Trial 7 jours (down from 15)
    ├── 035               # Referrals table RLS
    ├── 036               # Merchant no_contact + admin notes
    ├── 037               # Birthday gift
    ├── 038               # Restrict RLS policies
    ├── 039               # Schema drift fix
    ├── 040               # Push automation events
    ├── 041               # Audit fixes
    ├── 042               # Medium audit fixes
    ├── 043               # PWA installed tracking
    ├── 044               # Admin announcements
    ├── 045               # Announcement link URL
    ├── 046               # Performance indexes v2
    ├── 047               # Shop type refactor
    ├── 048               # Double stamp days (double_days_enabled, double_days_of_week)
    ├── 049               # UNIQUE constraint on merchants.user_id (fix duplicate signups)
    └── 050               # Cagnotte mode (loyalty_mode, cagnotte_percent, cagnotte_tier2_percent, current_amount, amount_spent)

public/
├── images/              # Images statiques (mockups, temoignages, email-banner)
└── sw.js                # Service worker PWA
```

---

## 4. Base de Donnees (Tables Principales)

### merchants
- `id`, `user_id` (UNIQUE), `slug`, `scan_code`
- `shop_name`, `shop_type`, `shop_address`, `phone`
- `country` (MerchantCountry: 'FR' | 'BE' | 'CH' | 'LU', default 'FR')
- `logo_url`, `primary_color`, `secondary_color`
- `instagram_url`, `facebook_url`, `tiktok_url`, `booking_url`, `review_link`
- `loyalty_mode` ('visit' | 'cagnotte') — mode fidelite (visit = tampons, cagnotte = cashback %)
- `stamps_required`, `reward_description`
- `tier2_enabled`, `tier2_stamps_required`, `tier2_reward_description`
- `referral_code` (VARCHAR 10, UNIQUE — ex: `QARTE-AB3K`)
- `referral_program_enabled`, `referral_reward_referrer`, `referral_reward_referred`
- `trial_ends_at`, `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`
- `billing_interval` ('monthly' | 'annual', default 'monthly')
- `shield_enabled` (Qarte Shield)
- `birthday_gift_enabled`, `birthday_gift_description`
- `cagnotte_percent` (NUMERIC 5,2) — pourcentage cashback palier 1
- `cagnotte_tier2_percent` (NUMERIC 5,2) — pourcentage cashback palier 2
- `double_days_enabled` (BOOLEAN DEFAULT false) — jours x2 actifs
- `double_days_of_week` (TEXT DEFAULT '[]') — JSON array JS getDay() values (0=Dim, 1=Lun…6=Sam)

### customers
- `id`, `phone_number` (format E.164 sans +, ex: `33612345678`), `first_name`, `last_name`

### loyalty_cards
- `id`, `customer_id`, `merchant_id`
- `current_stamps`, `stamps_target`, `last_visit_date`, `current_amount` (NUMERIC 10,2 — cumul EUR cagnotte)
- `referral_code` (VARCHAR 8, UNIQUE — code parrainage client)

### visits
- `id`, `loyalty_card_id`, `merchant_id`, `customer_id`
- `points_earned`, `visited_at`, `amount_spent` (NUMERIC 10,2 — montant depense cagnotte)
- `status` ('confirmed' | 'pending' | 'rejected')
- `ip_address`, `ip_hash`, `flagged_reason`

### vouchers
- `id`, `loyalty_card_id`, `merchant_id`, `customer_id`
- `reward_description`, `is_used`, `used_at`, `expires_at`

### referrals
- `id`, `merchant_id`, `referrer_customer_id`, `referrer_card_id`
- `referred_customer_id`, `referred_card_id`
- `referred_voucher_id`, `referrer_voucher_id`
- `status` ('pending' | 'completed')
- UNIQUE `(merchant_id, referred_customer_id)` — 1 parrainage par filleul par merchant

### redemptions
- `id`, `loyalty_card_id`, `merchant_id`, `customer_id`, `stamps_used`, `tier`
- `amount_accumulated` (NUMERIC 10,2 — cumul au moment du redeem, cagnotte)
- `reward_percent` (NUMERIC 5,2 — % applique, cagnotte)
- `reward_value` (NUMERIC 10,2 — valeur EUR calculee, cagnotte)

### point_adjustments
- `id`, `loyalty_card_id`, `merchant_id`, `customer_id`
- `adjustment` (INTEGER), `reason` (TEXT)
- `adjusted_by` (UUID), `adjusted_at` (TIMESTAMPTZ)
- Note: colonne `adjusted_at` (pas `created_at`)

### Autres tables
- `banned_numbers`
- `push_subscriptions`, `push_history`, `scheduled_push`
- `pending_email_tracking`
- `member_programs`, `member_cards`
- `super_admins`, `admin_expenses`, `admin_fixed_costs`
- `admin_notes`, `admin_tasks`, `prospects`

### REGLES DE SECURITE IMPERATIVE — QR CODE & LIEN DE SCAN
**Le QR code et l'URL `/scan/[code]` ne doivent JAMAIS apparaître sur une page publique.**
Toute implémentation de page publique (bio réseaux sociaux, landing programme, partage...) doit être dépourvue de tout lien ou QR code de scan. Le scan est réservé au merchant (affiché en boutique). Exposer le lien permettrait à n'importe qui de s'octroyer des tampons frauduleusement.

### Securite RLS
Toutes les tables ont **Row Level Security (RLS)** active avec policies appropriees :
- Tables publiques : `customers`, `loyalty_cards`, `visits`, `referrals`, `vouchers` (lecture/ecriture via scan)
- Tables merchants : acces filtre par `user_id`
- Tables admin : acces via `super_admins` ou `service_role` uniquement
- Tables internes : `service_role` uniquement (cron jobs, API)

---

## 5. Routes API Principales

### Fidelite (mode visit)
- `POST /api/checkin` - Enregistrer un passage (parallelise: 5 groupes Promise.all, cree customer+card si besoin). Rejette les merchants cagnotte.
- `POST /api/redeem` - Utiliser un bon (merchant auth). Rejette les merchants cagnotte.
- `POST /api/redeem-public` - Utiliser un bon (client auth cookie). Rejette les merchants cagnotte.
- `POST /api/adjust-points` - Ajustement manuel (stamps + amount_adjustment pour cagnotte)

### Fidelite (mode cagnotte)
- `POST /api/cagnotte/checkin` - Enregistrer un passage + montant depense. Calcule cashback tier 1/tier 2. Shield compatible.
- `POST /api/cagnotte/redeem` - Utiliser cashback (merchant auth). Calcule reward_value = current_amount * percent. Reset current_amount.
- `POST /api/cagnotte/redeem-public` - Utiliser cashback (client auth cookie). Meme logique.

### Clients
- `POST /api/customers/create` - Creer client + carte fidelite (merchant auth, dedup telephone, historique creation dans point_adjustments)
- `POST /api/customers/register` - Inscription client
- `GET /api/customers/card` - Carte de fidelite
- `POST /api/customers/cards` - Toutes les cartes (auth via cookie, rate limit 10/min)
- `PUT /api/customers/update-name` - Modifier nom/prenom client (merchant auth + ownership check)

### Commercants
- `POST /api/merchants/create` - Creer commercant (pre-remplit `stamps_required` selon shop_type, `reward_description` laisse null). Idempotent : retourne le merchant existant si deja cree (guard + catch UNIQUE 23505)
- `GET /api/merchants/preview` - Donnees publiques merchant (preview carte)
- `GET /api/merchant/stats` - Statistiques

### Parrainage Client
- `GET /api/referrals?code=` - Info code parrainage (merchant, parrain, recompense)
- `POST /api/referrals` - Inscription filleul (cree customer + carte + voucher filleul)
- `POST /api/vouchers/use` - Consommer voucher (auto-cree voucher parrain si referral)
- `POST /api/merchants/referral-config` - Sauvegarder config parrainage (auth merchant)

### Push & Marketing
- `POST /api/push/subscribe` - S'abonner aux push (clients)
- `POST /api/push/send` - Envoyer notification (sent_count = clients uniques dedupliques par telephone)
- `GET /api/offers` - Offres promotionnelles

### Paiements
- `POST /api/stripe/checkout` - Creer session paiement (verifie que le customer Stripe existe encore)
- `POST /api/stripe/webhook` - Webhook Stripe (5 events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed, invoice.payment_succeeded)
- `POST /api/stripe/portal` - Creer session portail client Stripe
- `GET /api/stripe/payment-method` - Recuperer methode de paiement active

### Admin
- `/api/admin/merchants/[id]` - Gestion commercants (GET stats + weeklyScans + lastVisitDate + healthScore, PATCH no_contact/admin_notes)
- `/api/admin/announcements` - CRUD annonces (GET/POST/PATCH/DELETE)
  - target_filter: `all` | `trial` | `active` | `pwa_installed` | `pwa_trial` | `admin`
- `/api/admin/incomplete-signups` - Inscriptions incompletes (auth sans merchant, 48h)
- `/api/admin/prospects` - Leads/prospects
- `/api/admin/tasks` - Taches admin
- `/api/admin/merchant-emails` - Emails merchants (auth admin)

---

## 6. Fonctionnalites Cles

### Systeme de Fidelite
- Check-in par QR code (API parallelisee — 5 groupes Promise.all, ~300-600ms)
- Accumulation de tampons/points (mode visit) ou montant depense (mode cagnotte)
- 2 paliers de recompenses (visit : cadeau libre, cagnotte : % cashback)
- Historique des passages
- Suggestions de programme par type de commerce (MerchantSettingsForm)
- 10 palettes couleurs (6 mobile + 4 desktop-only)
- Preview carte client avec donnees simulees (`?preview=true`)
- Reward card dual-tier : celebration mode (gradient + shimmer + pulsing) quand recompense prete, motivational preview sinon
- Footer "Propulse par Qarte" avec lien vers landing (texte seul, sans icone)
- **ReviewModal** : modal glamour post-recompense (avis Google) — declenchee apres utilisation d'un bon de recompense ou d'un voucher parrainage, si `review_link` renseigne. 5 etoiles animees amber, anti-spam 90 jours via localStorage (`qarte_review_asked_${merchantId}`). z-index 60.
- **ReviewCard** : encart avis Google en bas de la carte fidelite (entre SocialLinks et footer). Design amber compact, 5 etoiles, CTA "Laisser un avis", dismiss "J'ai deja laisse un avis" (90j cooldown localStorage `qarte_review_card_dismissed_${merchantId}`). Cache en preview. Independant du ReviewModal.
- **Mode Cagnotte** : alternative au mode tampons. Le client cumule ses depenses en EUR. Apres N passages, il recoit X% de cashback sur le montant cumule. Configurable dans `/dashboard/program` (toggle visit/cagnotte, slider %). Scan page demande le montant depense. `CagnotteSection` affiche le cumul + grille de tampons visuels. Emails et page publique adaptent automatiquement le texte ("cashback" vs "cadeau"). Routes API separees (`/api/cagnotte/*`), les routes standards rejettent les merchants cagnotte.
- **Aide choix de mode** : bouton `?` (HelpCircle) sur chaque mode dans `/dashboard/program`. Ouvre un modal (bottom-sheet mobile, centre desktop) avec explication detaillee en 4 etapes numerotees + exemples concrets. Bouton `?` en `div role="button"` (pas `<button>`) pour eviter le nesting interdit par HTML spec.
- **Historique creation client** : a la creation d'un client (via `/api/customers/create` ou depuis la page membres), un `point_adjustment` est insere avec reason "Creation du client" + details (passages, montant cagnotte).
- **Jours x2 (Double Stamp Days)** : le merchant configure des jours de la semaine ou chaque passage compte double (2 tampons au lieu de 1). `double_days_enabled` + `double_days_of_week` (JSON array getDay()). Calcul dans `getPointsEarned()` (module-level dans checkin/route.ts, timezone Paris). Affiché dans ScanSuccessStep (message "Jour x{N}" + badge amber) et sous la grille de tampons dans StampsSection. Configurable dans dashboard /program (section collapsible en bas de page). Helpers centralises dans utils.ts : `parseDoubleDays()`, `formatDoubleDays()`, `DAY_LABELS`, `WEEK_ORDER`.

### Support Multi-Pays
- Pays supportes : France (FR), Belgique (BE), Suisse (CH), Luxembourg (LU)
- Numeros stockes en format E.164 sans `+` (ex: `33612345678`, `32475123456`)
- `PHONE_CONFIG` par pays : prefix international, longueur, placeholder
- `formatPhoneNumber(phone, country)` : local → E.164
- `validatePhone(phone, country)` : validation prefix + longueur
- `displayPhoneNumber(phone, country)` : E.164 → format local lisible
- Selecteur pays a l'onboarding merchant
- Backward-compatible : default `'FR'` pour anciens numeros

### Qarte Shield (Verification automatique)
- Quarantaine des visites inhabituelles (2+ scans/jour meme client)
- Detection IP duplicates
- Moderation manuelle (valider/refuser)
- Bannissement numeros
- Wording merchant-facing : "verification automatique" (pas "anti-fraude")

### Inscription 2 Phases & Onboarding
- **Phase 1:** Email + mot de passe (page `/auth/merchant/signup`) — filet typo email au submit ("Vouliez-vous dire X ?")
- **Phase 2:** Infos commerce (page `/auth/merchant/signup/complete`)
- **Flux post-inscription:** Phase 2 → `/dashboard/program` → sauvegarde → preview carte → `/dashboard/qr-download`
  - Premiere config programme redirige vers la preview carte client (`?preview=true&onboarding=true`)
  - Preview affiche la carte avec donnees simulees (VIP, offre, progression ~80%)
  - Bouton CTA sticky "Valider et generer mon QR code" redirige vers `/dashboard/qr-download`
  - Cache merchant mis a jour avant redirect (chargement QR instantane)
  - Page QR utilise `useMerchant()` (contexte partage, pas de fetch duplique)
  - Modal post-QR download (one-shot localStorage) : "Annoncez la nouvelle !" → redirige vers Kit reseaux
  - Modal post-social download (one-shot localStorage) : "Des centaines de salons cartonnent" → lien /pros
- **Score programme:** Cercle sticky (disparait a 100%) affichant le % de completion base sur 7 criteres (recompense 25pts, logo 20pts, reseaux 15pts, avis 15pts, reservation 10pts, palier2 10pts, jours x2 5pts)
- **Pre-remplissage programme:** A la creation du merchant, seul `stamps_required` est pre-rempli selon le `shop_type`. `reward_description` reste `null` pour que les emails ProgramReminder J+1/2/3 se declenchent et guident le merchant vers la configuration
- **Email relance inscription incomplete:** Programme via Resend `scheduledAt` (+1h apres Phase 1)
  - Endpoint `/api/emails/schedule-incomplete` appele apres signUp
  - Email ID stocke dans `user_metadata`, annule si Phase 2 completee
- Admin : suivi des inscriptions incompletes dans `/admin/leads`

### Marketing & Push
- Notifications push clients : programmees (10h et 18h), manuelles, automations (welcome, close_to_reward, reward_ready, inactive, reward_reminder)
- Kit reseaux sociaux (SocialMediaTemplate, visuel 4:5 + legendes Instagram)
- Ebook telechargeable (lead generation)

### Parrainage Client
- Code parrainage unique par carte fidelite (`referral_code` 6 caracteres)
- Bouton "Parrainer un ami" sur carte client (Web Share API + fallback clipboard)
- Lien `/scan/[code]?ref=[referral_code]` — banner parrain + inscription filleul
- Voucher filleul auto-cree a l'inscription, voucher parrain auto-cree quand filleul consomme
- Bouton "Utiliser" self-service sur carte client (pas d'action merchant)
- Dashboard `/dashboard/referrals` : toggle on/off, config recompenses, stats, tableau de suivi
- Statuts : `pending` (filleul inscrit) → `completed` (filleul a consomme)
- Message d'accueil quotidien rotatif sous le prenom client (10 phrases motivationnelles)
- Bouton "Reserver" dans header carte (pill) + dans SocialLinks (bouton pleine largeur)
- Lien de reservation configurable dans dashboard (section "Liens & Reseaux")
- Normalisation automatique des URLs (ajout https:// si absent) a la sauvegarde
- Offres marketing decouplee du push : offre creee meme si 0 abonnes push

### Onboarding Checklist (Dashboard)
- 6 etapes : programme, logo, reseau social, preview client, QR code, 2 premiers scans
- Deep-link `?section=social` auto-ouvre le collapse reseaux sociaux dans la page programme
- Confetti a la completion de toutes les etapes (une seule fois — persiste via `qarte_checklist_completed_at_${merchantId}` en localStorage, verifie avant de re-tirer)
- Auto-dismiss 3 jours apres completion, dismiss session via bouton X
- Visible uniquement en periode d'essai (`subscription_status === 'trial'`)

### Admin
- Page detail merchant (`/admin/merchants/[id]`) : section "Liens & Reseaux" (Instagram, Facebook, TikTok, reservation, avis Google) cliquables
- Badge parrainage actif/inactif dans les badges statut
- Section "Progression onboarding" : 5 items checklist + barre de progression par merchant

### Programmes Membres
- Cartes de membre avec validite
- Avantages personnalises

---

## 7. Variables d'Environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
STRIPE_PRICE_ID_ANNUAL=

# Email (Resend)
RESEND_API_KEY=

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Admin
ADMIN_SECRET_CODE=
CRON_SECRET=

# Analytics
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA4_ID=

# Facebook Conversions API
FACEBOOK_CAPI_ACCESS_TOKEN=
# FACEBOOK_CAPI_TEST_CODE=  # Pour test dans Events Manager

# App
NEXT_PUBLIC_APP_URL=
CONTACT_EMAIL=
```

---

## 8. Analytics & Tracking

- **Google Tag Manager:** GTM-T5Z84DPV
- **Google Analytics 4:** G-WM3XVQ38BD
- **Facebook Pixel:** 1438158154679532
- **TikTok Pixel:** D6FCUKBC77UC649NN2J0
- **Microsoft Clarity:** vjx7g9ttax (heatmaps, session recordings, scroll tracking)
- **Google Search Console:** verifie (DNS TXT + meta tag)
- **Vercel Analytics**

### Evenements Facebook Pixel (client-side)
- `PageView` - automatique
- `Lead` - generation lead
- `CompleteRegistration` - inscription terminee (Phase 2 completee)
- `StartTrial` - debut essai (fire avec CompleteRegistration apres Phase 2)
- `Purchase` - souscription Stripe (avec `eventID` pour dedup CAPI)
- `InitiateCheckout` - clic signup
- `ScrollDepth` - profondeur scroll

### Evenements TikTok Pixel (client-side)
- `PageView` - automatique (`ttq.page()`, re-fire sur chaque route SPA)
- `ClickButton` - clic CTA (landing, essai-gratuit, comparatif, avec content params)
- `CompleteRegistration` - inscription terminee (avec content params)
- `StartTrial` - debut essai (fire avec CompleteRegistration)
- `Subscribe` - souscription Stripe (value, currency, content_name par plan)
- `ttq.identify()` - advanced matching (email, phone, externalId hashes SHA-256)

### Facebook Conversions API (CAPI, server-side)
- **Fichier:** `src/lib/facebook-capi.ts`
- **Declencheur:** Webhook Stripe `checkout.session.completed`
- **Event:** `Purchase` (19€ mensuel / 190€ annuel)
- **Dedup:** `event_id` = `sub_{merchant_id}_{timestamp}` (partage entre Pixel client + CAPI serveur)
- **User data:** Email hashe SHA256 (conforme RGPD)
- **Env var:** `FACEBOOK_CAPI_ACCESS_TOKEN` (genere dans Facebook Business Manager)
- **Pattern:** Fire-and-forget avec `.catch()` (ne bloque jamais le webhook)

---

## 9. Deploiement

- **Plateforme:** Vercel
- **Domaine:** getqarte.com
- **Build:** `npm run build`
- **Dev:** `npm run dev`

---

## 10. Commandes Utiles

```bash
# Developpement
npm run dev

# Build production
npm run build

# Linter
npm run lint

# Emails (preview)
npm run email
```

---

## 11. Notes de Developpement

### Types de Commerce (SHOP_TYPES)
- coiffeur, barbier
- institut_beaute, onglerie, spa
- estheticienne, massage, epilation
- autre

### Pays Supportes (MerchantCountry)
- `FR` France (prefix 33, local 10 chiffres)
- `BE` Belgique (prefix 32, local 9-10 chiffres)
- `CH` Suisse (prefix 41, local 10 chiffres)
- `LU` Luxembourg (prefix 352, local 9 chiffres, pas de 0 initial)

### Statuts Abonnement (SubscriptionStatus)
- `trial` - periode d'essai
- `active` - abonnement actif
- `canceled` - annule (orthographe US)
- `canceling` - annulation programmee (fin de periode, cancel_at_period_end=true)
- `past_due` - paiement en retard (traite comme abonne actif, pas bloque)

### Machine d'etats Stripe → DB
| Evenement Stripe | Statut DB | Email |
|-----------------|-----------|-------|
| checkout.session.completed | `active` | SubscriptionConfirmedEmail |
| subscription.updated (cancel_at_period_end=true) | `canceling` | SubscriptionCanceledEmail |
| subscription.updated (canceling→active) | `active` | SubscriptionReactivatedEmail |
| subscription.updated (trialing, post-checkout) | `active` | — |
| subscription.deleted | `canceled` | — |
| invoice.payment_failed | `past_due` | PaymentFailedEmail |
| invoice.payment_succeeded (past_due→active) | `active` | SubscriptionConfirmedEmail |

### Checkout robustesse
- Verifie que le `stripe_customer_id` existe encore sur Stripe avant de creer la session
- Si le customer a ete supprime manuellement, en recree un nouveau et nettoie `stripe_subscription_id`

### Statuts Visites (Qarte Shield)
- `confirmed` - validee
- `pending` - en attente moderation
- `rejected` - rejetee

---

## 12. Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `src/app/page.tsx` | Landing page (8 sections: Hero, SocialProof, LoyaltyModes, BentoFeatures, Testimonials, Pricing, FAQ, Footer) |
| `src/components/landing/` | 13 composants landing (Hero, SocialProof, LoyaltyModes, BentoFeatures, Testimonials, Pricing, FAQ, Footer + utilitaires) |
| `src/middleware.ts` | Protection routes authentifiees |
| `src/lib/supabase.ts` | Client Supabase |
| `src/lib/stripe.ts` | Client Stripe (mensuel + annuel) |
| `src/lib/email.ts` | Envoi emails (Resend) |
| `src/types/index.ts` | Definitions TypeScript |
| `src/components/analytics/FacebookPixel.tsx` | Tracking FB Pixel (client-side, avec eventID dedup) |
| `src/components/analytics/TikTokPixel.tsx` | Tracking TikTok Pixel (client-side, SPA page tracker) |
| `src/lib/facebook-capi.ts` | Facebook Conversions API (server-side Purchase) |
| `tailwind.config.ts` | Config Tailwind (couleurs, fonts) |
| `next.config.mjs` | Config Next.js (securite, images) |
| `src/app/api/cron/morning/route.ts` | Cron principal (4 taches) |
| `src/app/api/stripe/webhook/route.ts` | Webhook Stripe (5 events, machine d'etats) |
| `src/app/api/stripe/checkout/route.ts` | Checkout Stripe (verification customer) |
| `src/app/api/referrals/route.ts` | API parrainage client (GET info + POST inscription) |
| `src/app/api/vouchers/use/route.ts` | API consommation voucher + auto-creation parrain |
| `src/app/dashboard/referrals/page.tsx` | Dashboard parrainage (config + stats + tableau) |
| `supabase/migrations/` | 52 migrations SQL |
| `src/app/api/cagnotte/checkin/route.ts` | API checkin cagnotte (montant + cashback) |
| `src/app/api/cagnotte/redeem/route.ts` | API redeem cagnotte (merchant auth) |
| `src/app/api/cagnotte/redeem-public/route.ts` | API redeem cagnotte (client auth) |
| `src/components/loyalty/CagnotteSection.tsx` | Affichage cumul + grille stamps cagnotte |

---

## 13. Design & UX

### Palette de Couleurs
- **Primaire:** `#4b0082` (violet profond — emails, headers dashboard, branding)
- **Secondaire:** `#654EDA` (violet)
- **Landing CTAs:** Gradient `indigo-600` → `violet-600` (unifie sur tous les boutons)
- **Landing emotion:** Rose/Pink (blobs hero, reward card, titres accent)
- **Landing succes:** Emerald (etape 3 FeaturesSection uniquement)
- **PWA Icon:** Gradient indigo → rose (`#4f46e5` → `#ec4899`) — "Q" blanc italic bold
- **Fond landing:** Hero rose/pink blobs, Features slate-50, Pricing/HowItWorks white

### SEO
- **Title global** : "Qarte - Carte de fidelite digitale pour salons de beaute"
- **Template** : `%s | Qarte`
- **Keywords** : carte de fidelite, salon de coiffure, barbier, institut de beaute, onglerie
- **Structured data** : JSON-LD Organization + SoftwareApplication (layout.tsx)
- Toutes les pages publiques ont des metadata specifiques (title + description + openGraph)

### Style Visuel
- **Dashboard headers:** `bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]`, gradient texte `from-[#4b0082] to-violet-600`
- **Glassmorphism:** Utilise sur les pages auth et essai-gratuit
  - `backdrop-blur-xl`, `bg-white/80`, bordures transparentes
  - Blobs decoratifs animes en arriere-plan
- **Cartes:** `rounded-2xl` ou `rounded-3xl`, ombres douces
- **Boutons:** Gradients indigo-violet, hover effects, transitions fluides
- **Animations:** Framer Motion pour les entrees/sorties
- **Sidebar mobile:** Bottom sheet 50vh avec drag-to-dismiss (Framer Motion spring)

### Composants UI Reutilisables (`src/components/ui/`)
- Button, Input, Select, Modal, Badge
- Toast notifications
- Skeleton loaders

---

## 14. Business Model

### Tarification
- **Essai gratuit:** 7 jours
- **Abonnement mensuel:** 19€/mois
- **Abonnement annuel:** 190€/an (equivalent ~15,83€/mois, -17%)
- **Periode de grace:** 3 jours apres expiration (lecture seule)
- **Suppression:** Donnees supprimees 3 jours apres expiration

### Cible
- Salons de coiffure, barbiers
- Instituts de beaute, ongleries
- Spas, estheticiennes
- Salons de massage, centres d'epilation

---

## 15. Terminologie

| Terme | Signification |
|-------|---------------|
| passage | Visite client validee (scan QR) |
| tampon | Synonyme de passage (icone coeur sur la carte) |
| palier | Niveau de recompense (tier1, tier2) |
| scan_code | Code unique du commercant pour le QR |
| referral_code (merchant) | Code parrainage unique merchant (QARTE-XXXX) |
| referral_code (loyalty_card) | Code parrainage unique client (6 chars, ex: XY7Z9K) |
| voucher | Recompense parrainage (filleul ou parrain) |
| slug | URL-friendly du nom de commerce |
| shield | Systeme anti-fraude Qarte Shield |

---

## 16. Pages Principales

### Landing (`/`)
- Hero : "Le programme de fidelite qui fait revenir vos clients."
  - Sous-titre : "Fini les cartes papier perdues. QR code, points, recompenses — tout est automatique."
  - CTA primaire : "Essayez gratuitement" → signup (indigo→violet)
  - CTA secondaire : "Voir une demo" → demo onglerie (ghost button, border indigo)
  - Note CTA : "Sans carte bancaire, c'est promis :)"
  - Mockup iPhone carte fidelite (coeurs, reward card rose)
  - Badges flottants : avis Google, point ajoute, parrainage, notification push
  - Menu desktop/mobile : Tarifs, Contact, Espace Pro
- SocialProof : "Elles fidelisent avec Qarte" (bandeau defilant top merchants)
- LoyaltyModes : "Un programme qui s'adapte a ton salon."
  - 2 cartes : Mode Passages (grille tampons, brushing offert) vs Mode Cagnotte (barre progres, 10% cagnotte cumulee, icone Wallet + badge €)
  - CTA "Essayer gratuitement pendant 7 jours" + "Sans carte bancaire"
- BentoFeatures : grille bento (QR/NFC compact, carte fidelite, personnalisation, relance inactifs, etc.)
- Testimonials : "Elles en parlent mieux que nous" (4 conversations WhatsApp/iMessage/Instagram)
- Pricing : "Un prix, tout inclus" — 19€/mois, CTA "Lancer mon essai gratuit"
- FAQ : "On repond a toutes vos questions" (11 questions dont parrainage) + WhatsApp CTA
- Footer : compose de `FooterCta` (CTA "Rejoignez les pros") + `FooterDark` (dark footer 4 colonnes : Logo, Support contact, Liens rapides, Reseaux sociaux). Les 2 composants sont reutilisables independamment.
- ScrollToTopButton : bottom-24 mobile (au-dessus sticky), bottom-6 desktop
- Ton amical et direct ("On s'occupe du reste", "On gere pour vous", "c'est promis")
- Blog SEO : 3 articles (coiffure, onglerie, institut) avec images
- JSON-LD structured data : Organization + SoftwareApplication (layout.tsx)
- Sitemap : /, /pricing, /blog, 3 articles blog, /contact, /pros, /auth/merchant/signup (9 pages)
- Pages legales (cgv, mentions-legales, politique-confidentialite) : clic droit desactive via `NoRightClick` wrapper

### Wallet Client (`/customer/cards`)
- Design premium inspire Apple Wallet — fond `bg-[#f7f6fb]` (blanc tinte lavande)
- Header minimal : "Qarte" gradient text `text-2xl font-black` + telephone + `LogOut` discret
- Greeting typographique : "Bonjour," (`text-base text-gray-400`) + "Prenom." (`text-4xl font-black`) sur deux lignes, point editorial. Fallback "Mes cartes." si pas de prenom.
- Grille max 2 colonnes (`sm:grid-cols-2`), Framer Motion stagger `delay: index * 0.07`
- Chaque carte : header colore merchant (`linear-gradient(135deg, primary_color, primary_colorcc)`) + section blanche progress bar + texte "X sur Y passages · reward_description"
- Etat "recompense prete" : glow couleur merchant via `boxShadow` inline + badge "Pret !" dans header (remplace ChevronRight)
- Dual tier : 2 barres empilees avec labels Palier 1 / Palier 2 (Trophy icon)

### Admin (`/admin`)
- Dashboard : metriques startup (MRR, churn, ARPU, LTV) + segments d'action lifecycle (trial expiring, inactive, canceling, past_due)
- Metriques : split mensuel/annuel sous MRR + adoption des fonctionnalites (11 features avec barres de progression)
- Merchants : liste cliquable (navigation vers detail), filtres par statut + pays + shop type + PWA, tri sur toutes les colonnes (urgence, activite, auj., clients, sante)
- Merchants : health score 0-100 (dot colore + score numerique, tri + export CSV)
- Annonces : bannières in-app pour merchants + filtre combine PWA+Essai
- Leads : onglet Incompletes + Aujourd'hui + Messages
- Analytics, Revenus, Depenses
- Marketing, Prospects, Notes, Taches
- Activity : vue "hier" (`?date=yesterday`) pour suivi activite merchants
- Merchant detail : section "Liens & Reseaux" (social links, booking, avis Google), badge parrainage, progression onboarding, badge sante, billing_interval affiché dans badge statut (Actif mensuel/annuel)
- **Toutes les stats excluent les comptes admin** (via `super_admins` table)

### Dashboard (`/dashboard`)
- Sidebar navigation (bottom sheet mobile, sidebar desktop)
- Sidebar : logo merchant affiché en haut (logo_url si disponible, sinon initiale du nom) + pill PRO pour abonnés
- Statistiques temps reel + comparaison semaine precedente
- Stats "Clients inscrits" et "Clients actifs (30j)" cliquables → `/dashboard/customers`
- Gestion programme fidelite (suggestions par shop_type, 10 palettes couleurs)
- Page QR code & Kit promo (2 onglets : QR code + Kit reseaux sociaux avec SocialMediaTemplate)
- Gestion clients — 4 filtres (Notifiables, Inactifs 21j+, Proches recompense, Recompense dispo) + recherche nom/telephone + edit inline nom/prenom/anniversaire
- CustomerManagementModal : 4 onglets (Points, Cadeaux, Historique, Supprimer). Stepper +/- pour ajustement points, input raison, banner succes inline 2s (modal reste ouvert). Delete/ban ferme le modal. Historique combine visits + adjustments + redemptions trie par date, editable (visits).
- Marketing (push notifications)
- Page abonnement avec countdown timer + polling 1s (30 tentatives max, early exit si deja active) apres retour checkout/portail Stripe + prix journalier (0,63€/jour mensuel, 0,52€/jour annuel)
- Settings : badge abonnement Pro (Crown icon, mensuel/annuel, lien Gérer → /dashboard/subscription)
- Parrainage merchant : encart en haut de Settings (code QARTE-XXXX + copier + partager via Web Share API)
- Parrainage client : page `/dashboard/referrals` (toggle, config recompenses, stats, tableau de suivi)
- Headers harmonises (violet #4b0082)

### Scan (`/scan/[code]`)
- Page publique pour clients
- Inscription rapide (nom + telephone) — skip register API, checkin cree tout en 1 appel
- Validation passage
- Affichage progression fidelite
- Utilisation recompense
- Placeholder telephone dynamique selon pays merchant
- Detection `?ref=` : banner parrain, inscription filleul via `/api/referrals`, ecran succes referral

### Boutique Carte NFC (`/boutique`)
- Page de presentation et achat de la carte NFC Qarte (20€ livraison comprise)
- Lien Stripe direct pour l'achat
- 3 etapes : poser la carte (comptoir ou cou), cliente approche son tel, page s'ouvre et elle valide
- Utilise `LandingNav minimal` + `FooterDark` (pas FooterCta)
- Layout separe pour metadata SEO (page client component)

### Page Pros (`/pros`)
- Page publique social proof : grille de merchants avec logo, couleurs, recompense, liens reseaux
- Donnees cachees 3 jours (`unstable_cache`, `revalidate: 259200`)
- Exclut admins (`super_admins`) et merchants inscrits depuis moins de 3 jours
- Tri : abonnes actifs d'abord, puis par score de completude decroissant
- Accessible depuis le Kit reseaux (`/dashboard/qr-download` onglet social) et modal post-download

---

## 17. Conventions de Code

### Imports
```typescript
// 1. React/Next
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Composants externes
import { motion } from 'framer-motion';

// 3. Composants internes
import { Button } from '@/components/ui';

// 4. Libs/Utils
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// 5. Types
import type { Merchant } from '@/types';
```

### Nommage
- Composants: PascalCase (`SocialMediaTemplate.tsx`)
- Utilitaires: camelCase (`generateQRCode`)
- Types: PascalCase (`Merchant`, `LoyaltyCard`)
- Routes API: kebab-case (`/api/adjust-points`)

### Styles
- Tailwind CSS classes directement dans JSX
- `cn()` pour classes conditionnelles
- Variables CSS pour couleurs theme dans `globals.css`

---

## 18. Cron Jobs

| Cron | Horaire | Description |
|------|---------|-------------|
| `/api/cron/morning` | 09:00 UTC (= 10h Paris hiver / 11h Paris été) | Emails essai, rappel programme J+1, rappels pending, push 10h, vouchers anniversaire |
| `/api/cron/evening` | 17:00 UTC (= 18h Paris hiver / 19h Paris été) | Push notifications programmees 18h |
| `/api/cron/reactivation` | 10:00 UTC | Emails win-back J+7/14/30 |

---

## 19. Emails Transactionnels (33 templates)

### Onboarding & Activation
| Email | Declencheur |
|-------|-------------|
| WelcomeEmail | Inscription commercant (Phase 2 completee) |
| IncompleteSignupEmail | Phase 1 sans Phase 2 (+1h via Resend scheduledAt) |
| IncompleteSignupReminder2Email | Relance #2 (+3h via Resend scheduledAt) |
| ProgramReminderEmail | Programme non configure J+1 (cron morning) |
| ProgramReminderDay2Email | Programme non configure J+2, personnalise par shop_type (cron morning) |
| ProgramReminderDay3Email | Programme non configure J+3, urgence + done-for-you (cron morning) |
| QRCodeEmail | QR code + kit reseaux sociaux (apres config programme, endpoint `/api/emails/qr-code` + cron morning). Section kit conditionnelle sur `rewardDescription`. |
| FirstClientScriptEmail | Script verbal personnalise par shop_type J+2 post-config (cron morning) |
| QuickCheckEmail | Check-in J+4 si 0 scans — 3 options diagnostic (cron morning) |
| ChallengeCompletedEmail | ~~Defi reussi 5 clients/3 jours~~ — **DESACTIVE** (template conserve, logique cron supprimee) |

### Engagement & Milestones
| Email | Declencheur |
|-------|-------------|
| FirstScanEmail | 2eme visite confirmee — celebration 1er vrai client + bloc parrainage si referral_code (cron morning) |
| Day5CheckinEmail | Check-in J+5 — bilan premiere semaine, skip si 0 scans (cron morning) |
| FirstRewardEmail | Premiere recompense debloquee (cron morning) |
| Tier2UpsellEmail | Upsell palier 2 VIP — 10+ clients (cron morning) |
| WeeklyDigestEmail | Bilan hebdomadaire — scans, clients, recompenses (cron morning) |
| PendingPointsEmail | Passages en attente J+0/1/2/3 — Shield (cron morning) |

### Retention & Trial
| Email | Declencheur |
|-------|-------------|
| TrialEndingEmail | J-5, J-3 et J-1 avant fin essai (cron morning) |
| TrialExpiredEmail | Essai expire J+1/3/5 (cron morning) |
| InactiveMerchantDay7Email | Merchant inactif J+7 — diagnostic (cron morning) |
| InactiveMerchantDay14Email | Merchant inactif J+14 — pression concurrentielle (cron morning) |
| InactiveMerchantDay30Email | Merchant inactif J+30 — check-in personnel (cron morning) |

### Stripe & Paiement
| Email | Declencheur |
|-------|-------------|
| SubscriptionConfirmedEmail | checkout.session.completed + invoice.payment_succeeded recovery (webhook Stripe). Affiche plan mensuel/annuel via `billingInterval`. Section NFC universelle : carte en option 20€ avec bouton Stripe pour tous (mensuel et annuel). |
| PaymentFailedEmail | invoice.payment_failed (webhook Stripe) |
| SubscriptionCanceledEmail | customer.subscription.updated → canceling (webhook Stripe, date de fin Stripe) |
| SubscriptionReactivatedEmail | customer.subscription.updated → canceling→active (webhook Stripe, reactivation via portail) |
| ReactivationEmail | Win-back J+7/14/30 — codes promo QARTE50/QARTEBOOST/QARTELAST (cron reactivation) |

### Autre
| Email | Declencheur |
|-------|-------------|
| GuidedSignupEmail | Relance inscription incomplete T+24h (cron morning) |
| LastChanceSignupEmail | Derniere chance inscription (cron morning) |
| AutoSuggestRewardEmail | Suggestion recompense J+5 si non configuree, par shop_type (cron morning) |
| BirthdayNotificationEmail | Notification merchant : clients fetant leur anniversaire aujourd'hui (cron morning) |
| GracePeriodSetupEmail | Grace period : offre setup done-for-you J+10 (cron morning) |
| ProductUpdateEmail | Newsletter produit hebdomadaire |
| SetupForYouEmail | Setup assiste T+72h si inscription incomplete (cron morning) |

### Headers Anti-spam & Delivrabilite
```typescript
export const EMAIL_HEADERS = {
  'List-Unsubscribe': '<mailto:unsubscribe@getqarte.com?subject=unsubscribe>',
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
};
```
- **WhatsApp retire de tous les emails** (mars 2025) pour ameliorer la delivrabilite. Remplace par "Repondez a cet email". Seule exception : QRCodeEmail (contexte partage reseaux sociaux).

---

## 20. Documentation

| Fichier | Description |
|---------|-------------|
| `docs/context.md` | Contexte projet (ce fichier) |
| `docs/AUDIT-MARKETING.md` | Audit marketing complet (CMO senior, landing, SEO, emails, analytics) |
| `docs/AUDIT-SECURITE.md` | Audit securite (OWASP, RLS, auth, API) |
| `docs/AUDIT-SCALABILITE.md` | Audit scalabilite (DB, API, cron, frontend) |

---

## 21. Capacite Actuelle

| Metrique | Capacite |
|----------|----------|
| Marchands | ~500-800 (plafond : Supabase Free 10 connexions) |
| Checkins/jour | ~20,000 |
| Push/envoi | ~5,000 (batch 50, pause 100ms) |
| Clients/marchand | ~2,000 |

*Pour plus de details, voir `docs/AUDIT-SCALABILITE.md`*
