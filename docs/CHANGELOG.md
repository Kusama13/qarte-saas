# Changelog - Qarte SaaS

Historique des deploiements et modifications.

---

## [2026-02-08] - Refactor structure + tarif annuel

### Deploiement #10 - Tarif annuel + cron email sequences
**Commit:** `3e96385`

#### Changements
- **feat:** Ajout tarif annuel Stripe (`STRIPE_PRICE_ID_ANNUAL`, 190€/an)
  - Page subscription : toggle mensuel/annuel
  - Checkout route : support `plan=annual` param
  - `src/lib/stripe.ts` : helper `getStripePriceId()`
- **refactor:** Cron morning/evening/reactivation refactores pour sequences email
- **fix:** Scan page shield cooldown
- **style:** CSS animations pour la landing

#### Fichiers modifies (10)
| Fichier | Modification |
|---------|--------------|
| `src/lib/stripe.ts` | +getStripePriceId(), +STRIPE_PRICE_ID_ANNUAL |
| `src/app/api/stripe/checkout/route.ts` | Support plan annuel |
| `src/app/dashboard/subscription/page.tsx` | Toggle mensuel/annuel |
| `src/app/api/cron/morning/route.ts` | Refactor sequences email |
| `src/app/api/cron/evening/route.ts` | Refactor push evening |
| `src/app/api/cron/reactivation/route.ts` | Refactor sequences win-back |
| `src/app/scan/[code]/page.tsx` | Fix shield cooldown |
| `src/app/globals.css` | +animations CSS landing |
| `.env.local.example` | +STRIPE_PRICE_ID_ANNUAL |

---

### Deploiement #9 - Reorganisation structure projet
**Commit:** `9359c83`

#### Changements
- **refactor:** Split `page.tsx` (2000 lignes) en 12 composants landing separes
  - HeroSection, JoinedTodayMarquee, HowItWorksSection, ComparisonSection
  - FeaturesSection, TestimonialsSection, CaseStudySection, PricingSection
  - FAQSection, FooterSection, ScrollToTopButton, MobileStickyCta
  - Barrel export via `index.ts`, memo wrappers dans page.tsx (58 lignes)
- **refactor:** Reorganisation `src/components/` — plus de fichiers loose a la racine
  - `FacebookPixel.tsx` → `analytics/`
  - `CookieBanner.tsx`, `QRScanner.tsx` → `shared/`
  - `CustomerManagementModal.tsx`, `PendingPointsWidget.tsx`, `OnboardingGuide.tsx`, `AdjustPointsModal.tsx` → `dashboard/` (nouveau)
- **refactor:** Fusion `amelioration-a-venir/` + `ameliorations-a-venir/` → `docs/roadmap/`
- **refactor:** `AUDIT_COMPLET.md`, `context.md` → `docs/`
- **chore:** `tsconfig.tsbuildinfo` ajoute au `.gitignore`
- **feat:** Hook `useInView` partage (`src/hooks/useInView.ts`)

#### Fichiers crees (14)
```
src/components/landing/HeroSection.tsx       (270 lignes)
src/components/landing/FeaturesSection.tsx   (514 lignes)
src/components/landing/FAQSection.tsx        (257 lignes)
src/components/landing/TestimonialsSection.tsx (211 lignes)
src/components/landing/CaseStudySection.tsx  (132 lignes)
src/components/landing/ComparisonSection.tsx (123 lignes)
src/components/landing/HowItWorksSection.tsx (122 lignes)
src/components/landing/PricingSection.tsx    (109 lignes)
src/components/landing/FooterSection.tsx     (105 lignes)
src/components/landing/JoinedTodayMarquee.tsx (40 lignes)
src/components/landing/MobileStickyCta.tsx   (38 lignes)
src/components/landing/ScrollToTopButton.tsx (36 lignes)
src/components/landing/index.ts             (barrel export)
src/hooks/useInView.ts
```

#### Fichiers supprimes (5 anciens composants landing)
```
src/components/landing/CTABanner.tsx
src/components/landing/FloatingButton.tsx
src/components/landing/HowItWorks.tsx
src/components/landing/IndustriesSection.tsx
src/components/landing/ProblemSection.tsx
```

#### Impact
- `page.tsx` : 2000 → 58 lignes
- `src/components/` : 0 fichiers loose (7 → 0)
- Imports mis a jour dans 15 fichiers
- TypeScript : 0 erreurs

---

### Deploiement #8 - Copy 15 jours + objections pricing
**Commit:** `38d16fb`

#### Changements
- **copy:** 14→15 jours essai aligne partout (landing, pricing, FAQ)
- **copy:** Objections repondues dans section pricing
- **feat:** Historique marketing visible dans admin

---

### Deploiement #7 - Anti-spam + sequences email onboarding
**Commit:** `bfcbed3`

#### Changements
- **feat:** Sequences email onboarding et marchands inactifs
- **fix:** Anti-spam headers sur tous les emails
- **fix:** Appels Resend sequentiels (pas paralleles) pour eviter rate limit
- **copy:** Hero headline et features rewrite (benefit-first)

---

## [2026-02-06] - Admin improvements + fixes

### Deploiement - Admin & fixes divers
**Commits:** `486014c` → `ed27d59`

#### Changements
- **feat:** Inscriptions du jour sur accueil admin + badges programme
- **feat:** Masquer comptes admin par defaut + bouton afficher
- **fix:** Detection programme via `reward_description` au lieu de `loyalty_programs`
- **fix:** Await email sending dans serverless functions
- **fix:** Race condition `schedule-incomplete` signup
- **copy:** QR download : "Pret a scanner / Sur place ou en deplacement"
- **chore:** Suppression migration `social_images` inutilisee
- **feat:** Delai email incomplet passe a 15mn

---

## [2026-02-05] - Inscription 2 phases, suppression outils gratuits

### Deploiement #6 - Email relance via Resend scheduledAt
**Commit:** `e7a4a46`

#### Changements
- **feat:** Email relance inscription incomplete programme via Resend `scheduledAt` (1h apres Phase 1)
  - Remplace le cron morning qui ne couvrait qu'une fenetre horaire fixe
  - Nouvel endpoint `POST /api/emails/schedule-incomplete`
  - Email ID stocke dans `user_metadata.scheduled_incomplete_email_id`
  - Annulation automatique si Phase 2 completee avant 1h
- **refactor:** Cron morning passe de 5 a 4 taches (section incomplete signups supprimee)

#### Nouveaux fichiers (1)
```
src/app/api/emails/schedule-incomplete/route.ts
```

#### Fichiers modifies (4)
| Fichier | Modification |
|---------|--------------|
| `src/lib/email.ts` | +scheduleIncompleteSignupEmail(), +cancelScheduledEmail() |
| `src/app/auth/merchant/signup/page.tsx` | Appel API schedule apres signUp reussi |
| `src/app/api/merchants/create/route.ts` | Cancel email programme + import cancelScheduledEmail |
| `src/app/api/cron/morning/route.ts` | Retrait section incomplete signups, import, results |

---

### Deploiement #5 - Optimisation flux onboarding
**Commit:** `2d8fc0d`

#### Changements
- **perf:** Page QR utilise `useMerchant()` au lieu d'un fetch duplique (supprime `getUser()` + query merchants)
- **feat:** Premiere sauvegarde programme redirige vers `/dashboard/qr-download`
  - Detection `isFirstSetup` via `reward_description` null
  - Mise a jour cache localStorage avant redirect (chargement QR instantane)
- **perf:** `router.prefetch('/dashboard/qr-download')` au mount de la page programme

#### Fichiers modifies (2)
| Fichier | Modification |
|---------|--------------|
| `src/app/dashboard/program/page.tsx` | +isFirstSetup, +prefetch, +cache update avant redirect |
| `src/app/dashboard/qr-download/page.tsx` | Remplace fetch propre par `useMerchant()` contexte |

---

### Deploiement #4 - Suppression GuidedTour + redirect signup
**Commit:** `26b3b91`

#### Changements
- **fix:** Suppression complete de `GuidedTour.tsx` (bloquait tous les clics sur nouveaux comptes)
  - Overlay `fixed inset-0 z-[9999]` sans `data-tour` attributes = interface bloquee
- **feat:** Redirect post-inscription Phase 2 vers `/dashboard/program` (au lieu de `/dashboard`)

#### Fichiers supprimes (1)
```
src/components/GuidedTour.tsx
```

#### Fichiers modifies (2)
| Fichier | Modification |
|---------|--------------|
| `src/app/dashboard/page.tsx` | Retrait GuidedTour import, state, callbacks, JSX (-370 lignes) |
| `src/app/auth/merchant/signup/complete/page.tsx` | Redirect `/dashboard` → `/dashboard/program` |

---

### Deploiement #3 - Leads & Nettoyage
**Commit:** `075b715`

#### Changements
- **refactor:** Inscriptions incompletes deplacees de `/admin/merchants` vers `/admin/leads`
  - Nouvel onglet "Inscriptions incompletes" a cote de "Ebook"
  - Stats : total (48h) + info relance auto
  - Bouton mailto pour contacter directement
- **delete:** Suppression complete des outils gratuits
  - Pages : `/outils-gratuits/` (qr-menu, qr-wifi, lien-avis) — 8 fichiers
  - API : `/api/emails/qrcode`
  - Nettoyage : sitemap, footer landing, `/api/leads/tools` (garde ebook uniquement)
- **fix:** Filtre 48h sur l'API `/api/admin/incomplete-signups`

#### Fichiers supprimes (10)
```
src/app/outils-gratuits/          # Tout le dossier (8 fichiers)
src/app/api/emails/qrcode/route.ts
```

#### Fichiers modifies (7)
| Fichier | Modification |
|---------|--------------|
| `src/app/admin/leads/page.tsx` | Remplacement onglet outils par inscriptions incompletes |
| `src/app/admin/merchants/page.tsx` | Retrait section incompletes (interface, state, UI) |
| `src/app/api/admin/incomplete-signups/route.ts` | Ajout filtre 48h |
| `src/app/api/leads/tools/route.ts` | validSources reduit a ['ebook'] |
| `src/app/sitemap.ts` | Retrait 3 URLs outils-gratuits |
| `src/app/page.tsx` | Retrait liens outils-gratuits du footer |

#### Impact
- 84 pages (vs 89 avant) — 5 pages outils supprimees
- -2744 lignes de code
- Admin leads unifie (incompletes + ebook)

---

### Deploiement #2 - Corrections audit
**Commit:** `8979fd7`

#### Changements
- **security:** `getUser()` au lieu de `getSession()` dans signup/complete (validation JWT server-side)
- **security:** Rate limiting sur `/api/merchants/check`
- **perf:** Pagination `listUsers` dans cron morning (stop condition par date)
- **analytics:** `trackSignupCompleted` ajoute en Phase 2
- **cleanup:** Import `Lock` inutilise retire de signup

---

### Deploiement #1 - Inscription 2 phases & emails
**Commit:** `9da1cc3`

#### Nouveaux fichiers
```
src/app/auth/merchant/signup/page.tsx          # Phase 1 (email + mdp)
src/app/auth/merchant/signup/complete/page.tsx  # Phase 2 (infos commerce)
src/emails/IncompleteSignupEmail.tsx            # Relance inscription incomplete
src/emails/ProgramReminderEmail.tsx             # Rappel config programme J+1
src/app/api/admin/incomplete-signups/route.ts   # API admin inscriptions incompletes
```

#### Changements majeurs
- **feat:** Inscription commercant en 2 phases
  - Phase 1 : email + mot de passe (page simplifiee)
  - Phase 2 : nom commerce, type, adresse, telephone (apres verification email)
  - Verification email avec code a 6 chiffres entre les 2 phases
- **feat:** Email de relance inscription incomplete (2-3h apres Phase 1 sans Phase 2)
- **feat:** Email rappel configuration programme (J+1 apres inscription)
- **feat:** Redesign email de bienvenue (urgence, temoignage, bouton WhatsApp)
- **feat:** Vue admin inscriptions incompletes
- **feat:** Cron morning etendu (5 taches : incompletes, trial, programme, pending, push)

#### Fichiers modifies
| Fichier | Modification |
|---------|--------------|
| `src/emails/WelcomeEmail.tsx` | Redesign complet (urgence, temoignage, WhatsApp) |
| `src/lib/email.ts` | +sendIncompleteSignupEmail, +sendProgramReminderEmail |
| `src/app/api/cron/morning/route.ts` | +section incompletes, +section programme J+1, pagination listUsers |
| `src/app/admin/merchants/page.tsx` | +section inscriptions incompletes |

---

## [2026-02-04] - Mise a jour majeure

### Deploiement #2 - Performance
**Commit:** `17d1d35`
**Heure:** ~19:30

#### Changements
- **perf:** Fix N+1 query dans admin/merchants/page.tsx
  - Remplace boucle de requetes individuelles par batch query
  - 1000 marchands: 1001 requetes → 3 requetes

#### Impact
- Page admin merchants charge 10x plus vite
- Reduction charge DB significative

---

### Deploiement #1 - Emails & Anti-spam
**Commit:** `ff43d7d`
**Heure:** ~18:00

#### Nouveaux Fichiers
```
src/emails/
├── PaymentFailedEmail.tsx      # Email echec paiement
├── SubscriptionCanceledEmail.tsx # Email annulation
└── ReactivationEmail.tsx       # Email win-back J+7/14/30

src/app/api/cron/
└── reactivation/route.ts       # Cron emails reactivation

supabase/migrations/
├── 026_fix_trial_period.sql    # Trial 14→15 jours
├── 027_fix_subscription_status_spelling.sql # cancelled→canceled
└── 028_reactivation_email_tracking.sql # Table tracking
```

#### Fichiers Modifies
| Fichier | Modification |
|---------|--------------|
| `src/emails/index.ts` | +3 exports nouveaux emails |
| `src/lib/resend.ts` | +EMAIL_HEADERS anti-spam |
| `src/lib/email.ts` | +fonctions envoi + text versions |
| `src/lib/stripe.ts` | API version 2025-12-15.clover |
| `src/app/api/stripe/webhook/route.ts` | +envoi emails sur events |
| `vercel.json` | +cron reactivation 10:00 |

#### Anti-spam
```typescript
export const EMAIL_HEADERS = {
  'List-Unsubscribe': '<mailto:unsubscribe@getqarte.com?subject=unsubscribe>',
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
};
```

#### Autres
- Suppression `console.log` en production
- Remplacement `any` par types corrects
- Dashboard cache localStorage (2 min TTL)
- Admin: suppression bouton delete marchand
- Admin: affichage email dans details marchand

---

## [2026-02-04] - Migrations SQL

### Migration 026 - Trial Period
```sql
ALTER TABLE merchants
ALTER COLUMN trial_ends_at
SET DEFAULT (NOW() + INTERVAL '15 days');
```
**Note:** Affecte uniquement nouveaux marchands

### Migration 027 - Subscription Status Spelling
```sql
UPDATE merchants SET subscription_status = 'canceled'
WHERE subscription_status = 'cancelled';

ALTER TABLE merchants DROP CONSTRAINT merchants_subscription_status_check;
ALTER TABLE merchants ADD CONSTRAINT merchants_subscription_status_check
  CHECK (subscription_status IN ('trial', 'active', 'canceled', 'canceling', 'past_due'));
```

### Migration 028 - Reactivation Tracking
```sql
CREATE TABLE reactivation_emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'day_7', 'day_14', 'day_30'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, email_type)
);
```

### Index Performance (manuel)
```sql
CREATE INDEX idx_visits_customer_merchant_date
  ON visits(customer_id, merchant_id, visited_at DESC);
CREATE INDEX idx_visits_merchant_status
  ON visits(merchant_id, status);
CREATE INDEX idx_loyalty_cards_merchant
  ON loyalty_cards(merchant_id);
CREATE INDEX idx_push_subscriptions_customer
  ON push_subscriptions(customer_id);
```

---

## [2026-02-04] - Corrections DB

### Fix member_programs.duration_months
**Probleme:** Colonne INTEGER, code envoie DECIMAL
**Solution:**
```sql
ALTER TABLE member_programs
ALTER COLUMN duration_months TYPE NUMERIC(6,2);
```

---

## Format des Entrees

```markdown
## [YYYY-MM-DD] - Titre

### Deploiement #N - Description
**Commit:** `hash`
**Heure:** HH:MM

#### Changements
- Description des changements

#### Impact
- Impact sur le projet
```

---

## Commandes Utiles

```bash
# Voir les derniers commits
git log --oneline -10

# Voir les changements d'un commit
git show <hash> --stat

# Deployer sur Vercel
git push origin main

# Verifier le deploiement
vercel logs
```

---

*Derniere mise a jour: 8 fevrier 2026*
