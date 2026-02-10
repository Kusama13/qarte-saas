# Qarte SaaS - Project Context

## 1. Overview

**Qarte** est une plateforme SaaS de digitalisation des cartes de fidelite. Elle permet aux commercants (instituts de beaute, ongleries, salons de coiffure, restaurants...) de creer et gerer des programmes de fidelite digitaux via QR codes.

- **URL:** getqarte.com
- **Version:** 0.1.0
- **Langue:** Francais
- **Essai:** 15 jours gratuits
- **Prix:** 19€/mois ou 190€/an

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
│   ├── dashboard/         # Dashboard commercant (+ social-kit/)
│   ├── admin/             # Dashboard admin
│   ├── customer/          # Pages client
│   ├── scan/[code]/       # Scan QR dynamique
│   ├── essai-gratuit/     # Landing offre essai (Facebook Ads)
│   ├── ebook/             # Landing ebook (lead generation)
│   └── page.tsx           # Landing page (composition de composants)
│
├── components/
│   ├── landing/           # 12 composants landing (Hero, Features, Pricing, FAQ...)
│   ├── ui/                # Composants UI (Button, Input, Modal, Select...)
│   ├── shared/            # Header, Footer, CookieBanner, QRScanner
│   ├── dashboard/         # AdjustPointsModal, CustomerManagementModal, PendingPointsWidget, OnboardingChecklist
│   ├── loyalty/           # Composants fidelite
│   ├── marketing/         # FlyerTemplate
│   └── analytics/         # GTM, tracking, FacebookPixel
│
├── lib/                   # Utilitaires
│   ├── supabase.ts       # Client Supabase
│   ├── stripe.ts         # Client Stripe
│   ├── analytics.ts      # Tracking events
│   ├── push.ts           # Notifications push
│   ├── logger.ts         # Logger structuré
│   └── utils.ts          # Helpers (PHONE_CONFIG, formatPhoneNumber, validatePhone, displayPhoneNumber, generateReferralCode)
│
├── emails/               # Templates React Email (25 templates + BaseLayout)
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
│   ├── QRCodeEmail.tsx            # QR code pret
│   ├── SocialKitEmail.tsx         # Kit reseaux sociaux
│   ├── SubscriptionConfirmedEmail.tsx # Confirmation abonnement (Stripe)
│   ├── PaymentFailedEmail.tsx     # Echec paiement (Stripe)
│   ├── SubscriptionCanceledEmail.tsx # Annulation abonnement (Stripe)
│   ├── SubscriptionReactivatedEmail.tsx # Reactivation abonnement (canceling→active)
│   ├── ReactivationEmail.tsx      # Win-back J+7/14/30 (codes promo)
│   └── EbookEmail.tsx             # Telechargement ebook
│
├── hooks/
│   └── useInView.ts     # Hook IntersectionObserver (landing)
│
├── types/index.ts        # Types TypeScript
├── contexts/             # React contexts
└── middleware.ts         # Auth middleware

docs/
├── context.md            # Contexte projet (ce fichier)
├── ROADMAP-AUDIT.md      # Roadmap, audit, emails, changelog (document unifie)
└── roadmap/              # Backups code (mode article, scheduled push)

supabase/
└── migrations/           # 33 migrations SQL
    ├── 001-025           # Schema initial + fixes
    ├── 026               # Trial period 15 jours
    ├── 027               # Spelling cancelled→canceled
    ├── 028               # Reactivation email tracking
    ├── 029               # Merchant country + E.164 phone migration
    ├── 030               # Shield + divers
    ├── 031               # last_seen_at column
    ├── 032               # Fix updated_at trigger (exclut last_seen_at)
    └── 033               # Add referral_code (parrainage merchant)

public/
├── images/              # Images statiques
│   └── logos/           # 10 logos clients reels (grayscale marquee landing)
├── ebooks/              # Ressources ebook
└── sw.js                # Service worker PWA
```

---

## 4. Base de Donnees (Tables Principales)

### merchants
- `id`, `user_id`, `slug`, `scan_code`
- `shop_name`, `shop_type`, `shop_address`, `phone`
- `country` (MerchantCountry: 'FR' | 'BE' | 'CH' | 'LU', default 'FR')
- `logo_url`, `primary_color`, `secondary_color`
- `loyalty_mode` ('visit' | 'article')
- `stamps_required`, `reward_description`
- `tier2_enabled`, `tier2_stamps_required`, `tier2_reward_description`
- `referral_code` (VARCHAR 10, UNIQUE — ex: `QARTE-AB3K`)
- `trial_ends_at`, `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`
- `shield_enabled` (Qarte Shield)

### customers
- `id`, `phone_number` (format E.164 sans +, ex: `33612345678`), `first_name`, `last_name`

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
- `pending_email_tracking`
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
- `POST /api/checkin` - Enregistrer un passage (parallelise: 5 groupes Promise.all, cree customer+card si besoin)
- `POST /api/redeem` - Utiliser un bon
- `POST /api/adjust-points` - Ajustement manuel

### Clients
- `POST /api/customers/register` - Inscription client
- `GET /api/customers/card` - Carte de fidelite
- `GET /api/customers/cards` - Toutes les cartes

### Commercants
- `POST /api/merchants/create` - Creer commercant (pre-remplit `stamps_required` selon shop_type, `reward_description` laisse null)
- `GET /api/merchants/preview` - Donnees publiques merchant (preview carte)
- `GET /api/merchant/stats` - Statistiques

### Push & Marketing
- `POST /api/push/subscribe` - S'abonner aux push
- `POST /api/push/send` - Envoyer notification (sent_count = clients uniques dedupliques par telephone)
- `GET /api/offers` - Offres promotionnelles

### Paiements
- `POST /api/stripe/checkout` - Creer session paiement (verifie que le customer Stripe existe encore)
- `POST /api/stripe/webhook` - Webhook Stripe (5 events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed, invoice.payment_succeeded)
- `POST /api/stripe/portal` - Creer session portail client Stripe
- `GET /api/stripe/payment-method` - Recuperer methode de paiement active

### Admin
- `/api/admin/merchants/[id]` - Gestion commercants
- `/api/admin/incomplete-signups` - Inscriptions incompletes (auth sans merchant, 48h)
- `/api/admin/prospects` - Leads/prospects
- `/api/admin/tasks` - Taches admin
- `/api/admin/merchant-emails` - Emails merchants (auth admin)

---

## 6. Fonctionnalites Cles

### Systeme de Fidelite
- Check-in par QR code (API parallelisee — 5 groupes Promise.all, ~300-600ms)
- Accumulation de tampons/points
- 2 paliers de recompenses
- Mode visite ou mode article
- Historique des passages
- Suggestions de programme par type de commerce (MerchantSettingsForm)
- 10 palettes couleurs (6 mobile + 4 desktop-only)
- Preview carte client avec donnees simulees (`?preview=true`)

### Support Multi-Pays
- Pays supportes : France (FR), Belgique (BE), Suisse (CH), Luxembourg (LU)
- Numeros stockes en format E.164 sans `+` (ex: `33612345678`, `32475123456`)
- `PHONE_CONFIG` par pays : prefix international, longueur, placeholder
- `formatPhoneNumber(phone, country)` : local → E.164
- `validatePhone(phone, country)` : validation prefix + longueur
- `displayPhoneNumber(phone, country)` : E.164 → format local lisible
- Selecteur pays a l'onboarding merchant
- Backward-compatible : default `'FR'` pour anciens numeros

### Qarte Shield (Anti-fraude)
- Quarantaine des visites suspectes
- Detection IP duplicates
- Moderation manuelle
- Bannissement numeros

### Inscription 2 Phases & Onboarding
- **Phase 1:** Email + mot de passe (page `/auth/merchant/signup`)
- **Phase 2:** Infos commerce (page `/auth/merchant/signup/complete`)
- **Flux post-inscription:** Phase 2 → `/dashboard/program` → sauvegarde → preview carte → `/dashboard/qr-download`
  - Premiere config programme redirige vers la preview carte client (`?preview=true&onboarding=true`)
  - Preview affiche la carte avec donnees simulees (VIP, offre, progression ~80%)
  - Bouton CTA sticky "Valider et generer mon QR code" redirige vers `/dashboard/qr-download`
  - Cache merchant mis a jour avant redirect (chargement QR instantane)
  - Page QR utilise `useMerchant()` (contexte partage, pas de fetch duplique)
- **Pre-remplissage programme:** A la creation du merchant, seul `stamps_required` est pre-rempli selon le `shop_type`. `reward_description` reste `null` pour que les emails ProgramReminder J+1/2/3 se declenchent et guident le merchant vers la configuration
- **Email relance inscription incomplete:** Programme via Resend `scheduledAt` (+1h apres Phase 1)
  - Endpoint `/api/emails/schedule-incomplete` appele apres signUp
  - Email ID stocke dans `user_metadata`, annule si Phase 2 completee
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
| `src/app/page.tsx` | Landing page (composition de 12 composants) |
| `src/components/landing/` | 12 composants landing (Hero, FAQ, Pricing...) |
| `src/middleware.ts` | Protection routes authentifiees |
| `src/lib/supabase.ts` | Client Supabase |
| `src/lib/stripe.ts` | Client Stripe (mensuel + annuel) |
| `src/lib/email.ts` | Envoi emails (Resend) |
| `src/types/index.ts` | Definitions TypeScript |
| `src/components/analytics/FacebookPixel.tsx` | Tracking FB |
| `tailwind.config.ts` | Config Tailwind (couleurs, fonts) |
| `next.config.mjs` | Config Next.js (securite, images) |
| `src/app/api/cron/morning/route.ts` | Cron principal (4 taches) |
| `src/app/api/stripe/webhook/route.ts` | Webhook Stripe (5 events, machine d'etats) |
| `src/app/api/stripe/checkout/route.ts` | Checkout Stripe (verification customer) |
| `supabase/migrations/` | 33 migrations SQL |

---

## 13. Design & UX

### Palette de Couleurs
- **Primaire:** `#4b0082` (violet profond — emails, headers dashboard, branding)
- **Secondaire:** `#654EDA` (violet)
- **Accent:** Rose/Pink pour les CTAs
- **PWA Icon:** Gradient indigo → rose (`#4f46e5` → `#ec4899`) — "Q" blanc italic bold
- **Fond:** Gradients violet vers rose (landing)

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
- **Essai gratuit:** 15 jours
- **Abonnement mensuel:** 19€/mois
- **Abonnement annuel:** 190€/an (equivalent ~15,83€/mois, -17%)
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
| referral_code | Code parrainage unique merchant (QARTE-XXXX) |
| slug | URL-friendly du nom de commerce |
| shield | Systeme anti-fraude Qarte Shield |

---

## 16. Pages Principales

### Landing (`/`)
- Hero : "Le programme de fidelite qui fait revenir vos clientes."
  - Sous-titre niche beaute (instituts, ongleries, salons)
  - CTA primaire : "Essayer gratuitement" → signup
  - CTA secondaire : "Voir une demo" → demo onglerie (outline style)
  - Mockup iPhone avec screenshot carte client (bounce animation)
- Bandeau logos clients defilant (10 vrais logos, grayscale marquee, FOMO "rejoignez-les")
- Section "Comment ca marche" (3 etapes)
- Temoignage client (Nail Salon by Elodie)
- Pricing, FAQ, CTA
- Blog SEO : 3 articles (coiffure, onglerie, institut) avec images
- Page comparatif `/qarte-vs-carte-papier`

### Demo (`/demo`)
- Galerie 3 cartes fictives : coiffeur, onglerie, institut
- Selecteur de type de commerce
- Lien vers preview carte (`/customer/card/demo-{type}?preview=true&demo=true`)
- CTA "Creer mon programme gratuit"

### Admin (`/admin`)
- Dashboard : metriques startup (MRR, churn, ARPU, LTV) + segments d'action lifecycle (trial expiring, inactive, canceling, past_due)
- Merchants : liste, filtres par statut + pays, actions rapides, activite, alertes
- Leads : onglet Incompletes + Aujourd'hui + Messages
- Analytics, Metriques, Revenus, Depenses
- Marketing, Prospects, Notes, Taches
- Activity : vue "hier" (`?date=yesterday`) pour suivi activite merchants
- **Toutes les stats excluent les comptes admin** (via `super_admins` table)

### Dashboard (`/dashboard`)
- Sidebar navigation (bottom sheet mobile, sidebar desktop)
- Statistiques temps reel + comparaison semaine precedente
- Gestion programme fidelite (suggestions par shop_type, 10 palettes couleurs)
- Telechargement QR/flyers + kit reseaux sociaux
- Gestion clients
- Marketing (push notifications)
- Page abonnement avec countdown timer + polling 1s apres retour checkout/portail Stripe + prix journalier (0,63€/jour mensuel, 0,52€/jour annuel)
- Kit reseaux sociaux (visuel + legendes Instagram)
- Parrainage : encart en haut de Settings (code + copier + partager via Web Share API)
- Headers harmonises (violet #4b0082)

### Scan (`/scan/[code]`)
- Page publique pour clients
- Inscription rapide (nom + telephone) — skip register API, checkin cree tout en 1 appel
- Validation passage
- Affichage progression fidelite
- Utilisation recompense
- Placeholder telephone dynamique selon pays merchant

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
| `/api/cron/morning` | 09:00 UTC | Emails essai, rappel programme J+1, rappels pending, push 10h |
| `/api/cron/evening` | 18:00 UTC | Push notifications programmees 18h |
| `/api/cron/reactivation` | 10:00 UTC | Emails win-back J+7/14/30 |

---

## 19. Emails Transactionnels (25 templates)

### Onboarding & Activation
| Email | Declencheur |
|-------|-------------|
| WelcomeEmail | Inscription commercant (Phase 2 completee) |
| IncompleteSignupEmail | Phase 1 sans Phase 2 (+1h via Resend scheduledAt) |
| IncompleteSignupReminder2Email | Relance #2 (+3h via Resend scheduledAt) |
| ProgramReminderEmail | Programme non configure J+1 (cron morning) |
| ProgramReminderDay2Email | Programme non configure J+2, personnalise par shop_type (cron morning) |
| ProgramReminderDay3Email | Programme non configure J+3, urgence + done-for-you (cron morning) |
| QRCodeEmail | QR code pret (apres config programme, endpoint `/api/emails/qr-code` + cron morning) |
| SocialKitEmail | Kit reseaux sociaux pret (API email/social-kit) |

### Engagement & Milestones
| Email | Declencheur |
|-------|-------------|
| FirstScanEmail | 2eme visite confirmee — celebration 1er vrai client + bloc parrainage si referral_code (cron morning) |
| Day5CheckinEmail | Check-in J+5 — bilan premiere semaine (cron morning) |
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
| SubscriptionConfirmedEmail | checkout.session.completed + invoice.payment_succeeded recovery (webhook Stripe) |
| PaymentFailedEmail | invoice.payment_failed (webhook Stripe) |
| SubscriptionCanceledEmail | customer.subscription.updated → canceling (webhook Stripe, date de fin Stripe) |
| SubscriptionReactivatedEmail | customer.subscription.updated → canceling→active (webhook Stripe, reactivation via portail) |
| ReactivationEmail | Win-back J+7/14/30 — codes promo QARTE50/QARTEBOOST/QARTELAST (cron reactivation) |

### Autre
| Email | Declencheur |
|-------|-------------|
| EbookEmail | Telechargement ebook |

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
| `docs/context.md` | Contexte projet (ce fichier) |
| `docs/ROADMAP-AUDIT.md` | Roadmap, audit, emails, changelog (document unifie) |

---

## 21. Capacite Actuelle

| Metrique | Capacite |
|----------|----------|
| Marchands | ~300-500 |
| Checkins/jour | ~20,000 |
| Push/envoi | ~100 (non optimise) |
| Clients/marchand | ~2,000 |

*Pour plus de details, voir `docs/AUDIT_SCALABILITE.md`*
