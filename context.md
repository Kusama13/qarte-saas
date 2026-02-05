# Qarte SaaS - Project Context

## 1. Overview

**Qarte** est une plateforme SaaS de digitalisation des cartes de fidelite. Elle permet aux commercants (instituts de beaute, ongleries, salons de coiffure, restaurants...) de creer et gerer des programmes de fidelite digitaux via QR codes.

- **URL:** getqarte.com
- **Version:** 0.1.0
- **Langue:** Francais
- **Essai:** 15 jours gratuits
- **Prix:** 19€/mois

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
│   ├── offre-speciale/    # Landing retargeting (exit popup)
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
│   ├── WelcomeEmail.tsx           # Email bienvenue (urgence + temoignage)
│   ├── TrialEndingEmail.tsx       # Rappel fin essai
│   ├── TrialExpiredEmail.tsx      # Essai expire
│   ├── PendingPointsEmail.tsx     # Passages en attente
│   ├── ProgramReminderEmail.tsx   # Rappel config programme (J+1)
│   ├── IncompleteSignupEmail.tsx  # Relance inscription incomplete (2-3h)
│   ├── PaymentFailedEmail.tsx     # Echec paiement Stripe
│   ├── SubscriptionCanceledEmail.tsx # Annulation abonnement
│   ├── ReactivationEmail.tsx      # Win-back J+7/14/30
│   └── EbookEmail.tsx             # Telechargement ebook
│
├── types/index.ts        # Types TypeScript
├── contexts/             # React contexts
└── middleware.ts         # Auth middleware

supabase/
└── migrations/           # 28+ migrations SQL
    ├── 001-025           # Schema initial + fixes
    ├── 026               # Trial period 15 jours
    ├── 027               # Spelling cancelled→canceled
    ├── 028               # Reactivation email tracking
    └── 011               # tool_leads table (ebook leads)

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
- `redemptions`, `point_adjustments`, `banned_numbers`
- `push_subscriptions`, `push_history`, `scheduled_push`
- `demo_leads`, `tool_leads`, `pending_email_tracking`
- `member_programs`, `member_cards`
- `super_admins`, `admin_expenses`, `admin_fixed_costs`
- `admin_notes`, `admin_tasks`, `prospects`

### Securite RLS
Toutes les tables ont **Row Level Security (RLS)** active avec policies appropriees :
- Tables publiques : `customers`, `loyalty_cards`, `visits` (lecture/ecriture via scan)
- Tables merchants : acces filtre par `user_id`
- Tables admin : acces via `super_admins` ou `service_role` uniquement
- Tables internes : `service_role` uniquement (cron jobs, API)

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
- `/api/admin/incomplete-signups` - Inscriptions incompletes (auth sans merchant, 48h)
- `/api/admin/prospects` - Leads/prospects
- `/api/admin/tasks` - Taches admin
- `/api/leads/tools` - Leads ebook (POST public, GET admin)

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

### Inscription 2 Phases & Onboarding
- **Phase 1:** Email + mot de passe (page `/auth/merchant/signup`)
- **Phase 2:** Infos commerce (page `/auth/merchant/signup/complete`)
- **Flux post-inscription:** Phase 2 → `/dashboard/program` → sauvegarde → `/dashboard/qr-download`
  - Premiere config programme redirige automatiquement vers la page QR
  - Prefetch de la route QR au chargement de la page programme
  - Cache merchant mis a jour avant redirect (chargement QR instantane)
  - Page QR utilise `useMerchant()` (contexte partage, pas de fetch duplique)
- Email de relance automatique si Phase 2 non completee (2-3h, via cron morning)
- Admin : suivi des inscriptions incompletes dans `/admin/leads`

### Marketing
- Notifications push programmees (10h et 18h)
- Templates flyers/cartes (PDF)
- Ebook telechargeable (lead generation)

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
- coiffeur, barbier
- institut_beaute, onglerie, spa
- estheticienne, massage, epilation
- autre

### Statuts Abonnement
- `trial` - periode d'essai
- `active` - abonnement actif
- `canceled` - annule (orthographe US)
- `canceling` - annulation en cours (fin de periode)
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
| `src/app/offre-speciale/page.tsx` | Landing retargeting avec exit popup |
| `src/middleware.ts` | Protection routes authentifiees |
| `src/lib/supabase.ts` | Client Supabase |
| `src/lib/email.ts` | Envoi emails (Resend) |
| `src/types/index.ts` | Definitions TypeScript |
| `src/components/FacebookPixel.tsx` | Tracking FB |
| `tailwind.config.ts` | Config Tailwind (couleurs, fonts) |
| `next.config.mjs` | Config Next.js (securite, images) |
| `src/app/api/cron/morning/route.ts` | Cron principal (5 taches) |
| `supabase/migrations/` | 28+ migrations SQL |

---

## 13. Design & UX

### Palette de Couleurs
- **Primaire:** `#5167fc` (indigo/bleu)
- **Secondaire:** `#654EDA` (violet)
- **Accent:** Rose/Pink pour les CTAs
- **Fond:** Gradients violet vers rose (landing)

### Style Visuel
- **Glassmorphism:** Utilise sur les pages auth et offre-speciale
  - `backdrop-blur-xl`, `bg-white/80`, bordures transparentes
  - Blobs decoratifs animes en arriere-plan
- **Cartes:** `rounded-2xl` ou `rounded-3xl`, ombres douces
- **Boutons:** Gradients, hover effects, transitions fluides
- **Animations:** Framer Motion pour les entrees/sorties

### Composants UI Reutilisables (`src/components/ui/`)
- Button, Input, Select, Modal, Badge
- Toast notifications
- Skeleton loaders

---

## 14. Business Model

### Tarification
- **Essai gratuit:** 15 jours
- **Abonnement:** 19€/mois
- **Periode de grace:** 7 jours apres expiration (lecture seule)
- **Suppression:** Donnees supprimees 7 jours apres expiration

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
| tampon | Synonyme de passage (reference cartes papier) |
| palier | Niveau de recompense (tier1, tier2) |
| scan_code | Code unique du commercant pour le QR |
| slug | URL-friendly du nom de commerce |
| shield | Systeme anti-fraude Qarte Shield |

---

## 16. Pages Principales

### Landing (`/`)
- Hero avec demo interactive
- Section "Comment ca marche" (3 etapes)
- Temoignage client (Nail Salon by Elodie)
- Pricing, FAQ, CTA

### Offre Speciale (`/offre-speciale`)
- Page retargeting avec urgence
- Glassmorphism design
- Temoignage integre
- 15 jours gratuits

### Admin (`/admin`)
- Merchants : liste, filtres par statut, detail par commercant
- Leads : onglet Inscriptions incompletes (48h) + onglet Ebook
- Analytics, Metriques, Revenus, Depenses
- Marketing, Prospects, Notes, Taches

### Dashboard (`/dashboard`)
- Sidebar navigation
- Statistiques temps reel
- Gestion programme fidelite
- Telechargement QR/flyers
- Gestion clients
- Marketing (push notifications)

### Scan (`/scan/[code]`)
- Page publique pour clients
- Inscription rapide (nom + telephone)
- Validation passage
- Affichage progression fidelite
- Utilisation recompense

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
- Composants: PascalCase (`FlyerTemplate.tsx`)
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
| `/api/cron/morning` | 05:00 UTC | Inscriptions incompletes (2-3h), emails essai, rappel programme J+1, rappels pending, push 10h |
| `/api/cron/evening` | 18:00 UTC | Push notifications programmees 18h |
| `/api/cron/reactivation` | 10:00 UTC | Emails win-back J+7/14/30 |

---

## 19. Emails Transactionnels

| Email | Declencheur |
|-------|-------------|
| WelcomeEmail | Inscription commercant (Phase 2 completee) |
| IncompleteSignupEmail | Phase 1 sans Phase 2 (2-3h, cron morning) |
| ProgramReminderEmail | Programme non configure J+1 (cron morning) |
| TrialEndingEmail | J-3 et J-1 avant fin essai (cron morning) |
| TrialExpiredEmail | Essai expire J+1/3/5 (cron morning) |
| PendingPointsEmail | Passages en attente J+0/1/2/3 (cron morning) |
| EbookEmail | Telechargement ebook |
| PaymentFailedEmail | Echec paiement Stripe (webhook) |
| SubscriptionCanceledEmail | Annulation abonnement (webhook) |
| ReactivationEmail | Win-back J+7/14/30 apres annulation (cron reactivation) |

### Headers Anti-spam
```typescript
export const EMAIL_HEADERS = {
  'List-Unsubscribe': '<mailto:unsubscribe@getqarte.com?subject=unsubscribe>',
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
};
```

---

## 20. Documentation

| Fichier | Description |
|---------|-------------|
| `context.md` | Contexte projet (ce fichier) |
| `AUDIT_COMPLET.md` | Audit securite/qualite |
| `docs/AUDIT_SCALABILITE.md` | Audit performance/scalabilite |
| `docs/CHANGELOG.md` | Historique deploiements |

---

## 21. Capacite Actuelle

| Metrique | Capacite |
|----------|----------|
| Marchands | ~300-500 |
| Checkins/jour | ~20,000 |
| Push/envoi | ~100 (non optimise) |
| Clients/marchand | ~2,000 |

*Pour plus de details, voir `docs/AUDIT_SCALABILITE.md`*
