# Qarte SaaS - Project Context

## 1. Overview

**Qarte** est une plateforme SaaS de digitalisation des cartes de fidelite. Elle permet aux commercants de creer et gerer des programmes de fidelite digitaux via QR codes.

- **URL:** getqarte.com
- **Version:** 0.1.0
- **Langue:** Francais

---

## 2. Tech Stack

### Framework & Runtime
- **Next.js** 15.5.9 (App Router)
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
│   ├── outils-gratuits/   # Outils gratuits (QR menu, wifi, avis)
│   ├── scan/[code]/       # Scan QR dynamique
│   └── page.tsx           # Landing page principale
│
├── components/
│   ├── landing/           # Composants landing (Hero, Features, Pricing...)
│   ├── ui/                # Composants UI (Button, Input, Modal, Select...)
│   ├── shared/            # Header, Footer
│   ├── loyalty/           # Composants fidelite
│   ├── marketing/         # QRCardTemplate, FlyerTemplate
│   ├── analytics/         # GTM, tracking
│   └── FacebookPixel.tsx  # Pixel Facebook
│
├── lib/                   # Utilitaires
│   ├── supabase.ts       # Client Supabase
│   ├── stripe.ts         # Client Stripe
│   ├── analytics.ts      # Tracking events
│   ├── push.ts           # Notifications push
│   └── utils.ts          # Helpers generaux
│
├── emails/               # Templates React Email
│   ├── WelcomeEmail.tsx
│   ├── QRCodeEmail.tsx
│   ├── TrialEndingEmail.tsx
│   └── ...
│
├── types/index.ts        # Types TypeScript
├── contexts/             # React contexts
└── middleware.ts         # Auth middleware

supabase/
└── migrations/           # 22 migrations SQL

public/
├── images/              # Images statiques
├── ebooks/              # Ressources ebook
└── sw.js                # Service worker PWA
```

---

## 4. Base de Donnees (Tables Principales)

### merchants
- `id`, `user_id`, `slug`, `scan_code`
- `shop_name`, `shop_type`, `shop_address`, `phone`
- `logo_url`, `primary_color`, `secondary_color`
- `loyalty_mode` ('visit' | 'article')
- `stamps_required`, `reward_description`
- `tier2_enabled`, `tier2_stamps_required`, `tier2_reward_description`
- `trial_ends_at`, `subscription_status`, `stripe_customer_id`
- `shield_enabled` (Qarte Shield)

### customers
- `id`, `phone_number`, `first_name`, `last_name`

### loyalty_cards
- `id`, `customer_id`, `merchant_id`
- `current_stamps`, `stamps_target`, `last_visit_date`

### visits
- `id`, `loyalty_card_id`, `merchant_id`, `customer_id`
- `points_earned`, `visited_at`
- `status` ('confirmed' | 'pending' | 'rejected')
- `ip_address`, `ip_hash`, `flagged_reason`

### vouchers
- `id`, `loyalty_card_id`, `merchant_id`, `customer_id`
- `reward_description`, `is_used`, `used_at`, `expires_at`

### Autres tables
- `redemptions`, `point_adjustments`, `banned_phone_numbers`
- `push_subscriptions`, `push_notifications`, `scheduled_pushes`
- `merchant_offers`, `demo_leads`, `tool_leads`
- `member_programs`, `member_cards`
- `super_admins`, `admin_expenses`, `admin_fixed_costs`

---

## 5. Routes API Principales

### Fidelite
- `POST /api/checkin` - Enregistrer un passage
- `POST /api/redeem` - Utiliser un bon
- `POST /api/adjust-points` - Ajustement manuel

### Clients
- `POST /api/customers/register` - Inscription client
- `GET /api/customers/card` - Carte de fidelite
- `GET /api/customers/cards` - Toutes les cartes

### Commercants
- `POST /api/merchants/create` - Creer commercant
- `GET /api/merchant/stats` - Statistiques

### Push & Marketing
- `POST /api/push/subscribe` - S'abonner aux push
- `POST /api/push/send` - Envoyer notification
- `GET /api/offers` - Offres promotionnelles

### Paiements
- `POST /api/stripe/checkout` - Creer session paiement
- `POST /api/stripe/webhook` - Webhook Stripe

### Admin
- `/api/admin/merchants/[id]` - Gestion commercants
- `/api/admin/prospects` - Leads/prospects
- `/api/admin/tasks` - Taches admin

---

## 6. Fonctionnalites Cles

### Systeme de Fidelite
- Check-in par QR code
- Accumulation de tampons/points
- 2 paliers de recompenses
- Mode visite ou mode article
- Historique des passages

### Qarte Shield (Anti-fraude)
- Quarantaine des visites suspectes
- Detection IP duplicates
- Moderation manuelle
- Bannissement numeros

### Marketing
- Generateur QR menu gratuit
- Generateur QR WiFi
- Generateur lien avis Google
- Notifications push programmees
- Templates flyers/cartes

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

# App
NEXT_PUBLIC_APP_URL=
CONTACT_EMAIL=
```

---

## 8. Analytics & Tracking

- **Google Tag Manager:** GTM-T5Z84DPV
- **Google Analytics 4:** G-WM3XVQ38BD
- **Facebook Pixel:** 1438158154679532
- **Vercel Analytics**

### Evenements Facebook Pixel
- `PageView` - automatique
- `Lead` - generation lead
- `CompleteRegistration` - inscription terminee
- `StartTrial` - debut essai
- `Subscribe` - abonnement
- `InitiateCheckout` - clic signup
- `ScrollDepth` - profondeur scroll

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
- cafe, restaurant, boulangerie, coiffeur
- institut_beaute, fleuriste, epicerie
- bar, pizzeria, salon_the, glacier
- pressing, bijouterie, boutique_vetements
- cave_vin, fromagerie, chocolaterie
- pharmacie, librairie, autre

### Statuts Abonnement
- `trial` - periode d'essai
- `active` - abonnement actif
- `cancelled` - annule
- `past_due` - paiement en retard

### Statuts Visites (Qarte Shield)
- `confirmed` - validee
- `pending` - en attente moderation
- `rejected` - rejetee

---

## 12. Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `src/app/page.tsx` | Landing page principale (~2200 lignes) |
| `src/middleware.ts` | Protection routes authentifiees |
| `src/lib/supabase.ts` | Client Supabase |
| `src/types/index.ts` | Definitions TypeScript |
| `src/components/FacebookPixel.tsx` | Tracking FB |
| `tailwind.config.ts` | Config Tailwind (couleurs, fonts) |
| `next.config.mjs` | Config Next.js (securite, images) |
