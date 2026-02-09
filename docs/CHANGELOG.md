# Changelog - Qarte SaaS

Historique des deploiements et modifications.

---

## [2026-02-09] - Stripe emails + subscription UX

### Deploiement #18 - Fix emails Stripe + polling + sidebar banners
**Commits:** `76aaef4` → `3eb3440`

#### Changements
- **fix:** 3 correctifs emails webhook Stripe
  - Email annulation envoye au `customer.subscription.updated` → canceling (avant : `subscription.deleted` trop tard)
  - Email recovery envoye au `invoice.payment_succeeded` quand retour past_due → active
  - Date fin abonnement utilise `subscription.cancel_at` Stripe (avant : `new Date()` incorrect)
- **fix:** `SubscriptionConfirmedEmail` — date facturation dynamique
  - Prop `nextBillingDate` optionnelle (calcul depuis `trial_ends_at`)
  - Suppression prix hardcode `19€/mois` → `Plan Pro` generique
- **fix:** Polling apres retour portail Stripe
  - `sessionStorage` flag avant navigation vers portail
  - Polling 2s × 8 tentatives max pour detecter changement statut webhook
  - Appel `refetchContext()` pour invalider cache MerchantContext
- **fix:** Sidebar — banner `canceling` orange + texte lien trial dynamique
  - Nouveau banner orange "Annulation en fin de periode" pour statut `canceling`
  - Texte lien trial : "Voir l'abonnement" si carte ajoutee, "Ajouter une carte" sinon
- **style:** Social-kit header harmonise avec style dashboard violet
- **fix:** Palettes couleurs — swap Dore/Rose (Dore visible sur mobile)
- **docs:** context.md — 24 templates emails, multi-pays, Stripe triggers

#### Fichiers modifies (13)
| Fichier | Modification |
|---------|--------------|
| `src/app/api/stripe/webhook/route.ts` | 3 fixes emails (canceling, recovery, endDate) |
| `src/app/dashboard/subscription/page.tsx` | Polling portal return + refetchContext |
| `src/app/dashboard/layout.tsx` | Banner canceling + texte lien trial dynamique |
| `src/app/dashboard/social-kit/page.tsx` | Header harmonise violet |
| `src/emails/SubscriptionConfirmedEmail.tsx` | Prop nextBillingDate, suppression prix hardcode |
| `src/lib/email.ts` | Signature sendSubscriptionConfirmedEmail + nextBillingDate |
| `src/app/dashboard/program/page.tsx` | Swap Dore/Rose palettes |
| `docs/context.md` | 24 templates, multi-pays, Stripe triggers |
| `docs/CHANGELOG.md` | Ce deploiement |
| `package.json` | +@react-email/preview-server devDep |
| `package-lock.json` | Lock file update |
| `tsconfig.tsbuildinfo` | Build info |
| `MAJ du 08:02/audit-securite.md` | Minor fix |

---

## [2026-02-09] - Performance + Dashboard polish

### Deploiement #17 - Parallelisation checkin API + harmonisation dashboard
**Commits:** `995c804` → `76aaef4`

#### Changements
- **perf:** Parallelisation API checkin — 11 requetes sequentielles → 5 groupes paralleles (Promise.all)
  - Step 2 : banned check + customer fetch en parallele
  - Step 4 : loyalty card + recent visit (idempotency) + today scans (shield) en parallele
  - Step 8 : pending count + tier2 redemption en parallele
  - Utilisation `maybeSingle()` au lieu de `single()` pour gestion null propre
  - Latence estimee : ~600-1200ms → ~300-600ms (-50%)
- **perf:** Scan page — skip API `/api/customers/register` pour nouveaux clients
  - `processCheckin` cree directement customer + card + visit en 1 seul appel API
  - Signature changee : `(cust: Customer)` → `(customerInfo: { first_name, last_name })`
  - `customer_id` retourne dans la reponse checkin pour reconstruire le state client
- **fix:** `customer_id` manquant dans la reponse duplicate checkin (idempotency early-return)
- **style:** Harmonisation headers 8 pages dashboard
  - Style unifie : `bg-[#4b0082]/[0.04] border border-[#4b0082]/[0.08]`
  - Gradient texte : `from-[#4b0082] to-violet-600`
  - Pages : accueil, programme, QR, clients, membres, marketing, abonnement, parametres
- **fix:** Bouton preview duplique sur page programme (breakpoint `lg:block` → `hidden lg:block`)
- **fix:** Sidebar mobile — bottom sheet 50vh au lieu de sidebar pleine largeur
  - Drag-to-dismiss, backdrop tap-to-close
  - Animation spring avec Framer Motion
- **fix:** Subscription page — UX cancelled-during-trial
  - Affichage "Essai annule" au lieu de "Abonnement annule" si annule pendant trial
  - CTA "Reprendre mon essai gratuit" au lieu de "Se reabonner"
- **fix:** Webhook `customer.subscription.updated` — detection `trialing + cancel_at_period_end`
  - Avant : statut `trial` (incorrect), apres : statut `canceling`
  - Cas inverse : merchant annule resiliation → retour `active` (pas `trial`)
- **feat:** 4 palettes desktop-only (Terracotta, Ocean, Foret, Noir & Or)

#### Fichiers modifies (14)
| Fichier | Modification |
|---------|--------------|
| `src/app/api/checkin/route.ts` | Parallelisation Promise.all, maybeSingle, customer_id response |
| `src/app/scan/[code]/page.tsx` | Skip register API, nouvelle signature processCheckin |
| `src/app/dashboard/page.tsx` | Header harmonise |
| `src/app/dashboard/program/page.tsx` | Header harmonise + fix bouton preview duplique |
| `src/app/dashboard/qr-download/page.tsx` | Header harmonise |
| `src/app/dashboard/customers/page.tsx` | Header harmonise |
| `src/app/dashboard/members/page.tsx` | Header harmonise |
| `src/app/dashboard/marketing/page.tsx` | Header harmonise |
| `src/app/dashboard/subscription/page.tsx` | Header harmonise + UX cancelled-during-trial |
| `src/app/dashboard/settings/page.tsx` | Header harmonise |
| `src/components/shared/Sidebar.tsx` | Bottom sheet mobile + drag-to-dismiss |
| `src/app/api/stripe/webhook/route.ts` | Fix trialing+cancel_at_period_end |
| `src/components/loyalty/MerchantSettingsForm.tsx` | 4 palettes desktop-only |

---

## [2026-02-09] - Mobile responsive + QR + palettes

### Deploiement #16 - Audit responsive + couleurs beaute
**Commits:** `8d98ff1` → `b5de032`

#### Changements
- **style:** Audit responsive complet mobile — polices et paddings reduits
  - Fonts: `text-3xl` → `text-xl md:text-3xl`, `text-xl` → `text-base md:text-xl`
  - Paddings: `p-8` → `p-5 md:p-8`, `gap-8` → `gap-4 md:gap-6`
  - Boutons: `h-14` → `h-10 md:h-14`
- **fix:** Hamburger menu overlap avec header sur mobile
- **feat:** Bouton preview programme visible mobile+tablet (`lg:hidden`)
- **fix:** Page QR download — utilise layout sidebar (etait en pleine page)
- **fix:** Page abonnement — bouton duplique supprime, texte reduit
- **fix:** Stripe checkout — gere `checkout.session.expired` et `incomplete` subscriptions
  - Ignore `customer.subscription.deleted` pour subscriptions `incomplete`/`incomplete_expired`
- **feat:** 6 palettes couleurs beaute mobile (Rose Poudre, Mauve, Terracotta, etc.)
- **fix:** Logique CTA abonnement corrigee selon statut merchant

#### Fichiers modifies (8+)
| Fichier | Modification |
|---------|--------------|
| `src/app/dashboard/subscription/page.tsx` | Responsive + bouton duplique + CTA logique |
| `src/app/dashboard/qr-download/page.tsx` | Layout sidebar |
| `src/app/dashboard/program/page.tsx` | Bouton preview mobile |
| `src/components/shared/Sidebar.tsx` | Fix hamburger overlap |
| `src/components/loyalty/MerchantSettingsForm.tsx` | 6 palettes beaute |
| `src/app/api/stripe/webhook/route.ts` | Gestion incomplete subscriptions |
| Multiple dashboard pages | Responsive fonts/paddings |

---

## [2026-02-09] - Support multi-pays telephone

### Deploiement #15 - FR/BE/CH/LU telephone + migration E.164
**Commit:** `89ac4ce`

#### Changements
- **feat:** Support 4 pays (France, Belgique, Suisse, Luxembourg) pour numeros de telephone
  - Nouveau type `MerchantCountry = 'FR' | 'BE' | 'CH' | 'LU'`
  - `COUNTRIES` mapping, `PHONE_CONFIG` par pays (prefix, longueur, placeholder)
  - Champ `country` dans interface `Merchant` et table `merchants`
- **feat:** Stockage numeros en format E.164 sans `+` (ex: `33612345678`, `32475123456`)
  - `formatPhoneNumber(phone, country)` convertit local → E.164
  - `validatePhone(phone, country)` valide prefix + longueur
  - `displayPhoneNumber(phone, country)` E.164 → format local lisible
- **feat:** Selecteur pays a l'onboarding merchant (signup/complete)
  - Placeholder telephone dynamique selon pays
- **refactor:** API checkin restructuree — format phone APRES fetch merchant (pour avoir `merchant.country`)
- **fix:** API customers/create — ajout `formatPhoneNumber` (manquant avant)
- **feat:** Filtre par pays dans admin merchants
- Migration SQL : colonne `country` + conversion phones FR existants vers E.164

#### Nouveaux fichiers (1)
```
supabase/migrations/029_add_merchant_country_and_e164.sql
```

#### Fichiers modifies (14)
| Fichier | Modification |
|---------|--------------|
| `src/types/index.ts` | +MerchantCountry, +COUNTRIES, +country dans Merchant |
| `src/lib/utils.ts` | +PHONE_CONFIG, refonte formatPhoneNumber/validatePhone, +displayPhoneNumber |
| `src/app/auth/merchant/signup/complete/page.tsx` | +Select pays, placeholder dynamique |
| `src/app/api/merchants/create/route.ts` | +country dans insert |
| `src/app/api/checkin/route.ts` | Restructure : format phone apres fetch merchant |
| `src/app/api/customers/create/route.ts` | +formatPhoneNumber (bug fix) |
| `src/app/scan/[code]/page.tsx` | Placeholder + format avec merchant.country |
| `src/app/dashboard/customers/page.tsx` | Modal + affichage |
| `src/app/dashboard/settings/page.tsx` | Placeholder + affichage pays |
| `src/app/customer/page.tsx` | Backward-compatible (default FR) |
| `src/app/admin/merchants/page.tsx` | +filtre pays |
| 3 fichiers admin | Simplifier formatPhoneForWhatsApp |

---

## [2026-02-09] - Admin dashboard + refonte emails

### Deploiement #14 - Metriques startup admin + emails #4b0082
**Commits:** `95936ce` → `0166b0c`

#### Changements
- **feat:** Admin dashboard metriques startup (MRR, churn, ARPU, LTV, NPS)
  - Actions du jour (follow up trial, relances, leads)
- **feat:** Admin merchants — actions rapides, activite recente, alertes
- **feat:** Admin leads — onglet inscriptions incompletes cliquable
- **feat:** Kit reseaux sociaux — page telechargement visuel + email marketing
- **refactor:** Refonte complete templates emails
  - Couleur primaire `#4b0082` (violet profond)
  - Banniere email (email-banner.png)
  - Signatures email coherentes
- **feat:** Codes promo progressifs dans emails (QARTE50, QARTEBOOST, QARTELAST)
- **feat:** ReactivationEmail avec escalade urgence J+7/J+14/J+30
- **fix:** Rate limit Resend — envoi sequentiel avec 600ms entre chaque email
- **fix:** test-emails utilise ADMIN_SECRET_CODE
- **feat:** SubscriptionConfirmedEmail envoyee apres checkout reussi

#### Fichiers modifies (15+)
| Fichier | Modification |
|---------|--------------|
| `src/app/admin/page.tsx` | +metriques startup, +actions du jour |
| `src/app/admin/merchants/page.tsx` | +actions rapides, +activite, +alertes |
| `src/app/admin/leads/page.tsx` | +onglet cliquable |
| `src/app/dashboard/social-kit/page.tsx` | Nouvelle page |
| `src/emails/*.tsx` | Refonte couleur #4b0082, banniere, signatures |
| `src/lib/email.ts` | +sendSubscriptionConfirmedEmail, +codes promo |
| `src/app/api/stripe/webhook/route.ts` | +email confirmation abonnement |

---

## [2026-02-08] - Security + Shield + components

### Deploiement #13 - Audit securite, Shield, composants, social kit
**Commits:** `0c08b3a` → `11e364c`

#### Changements
- **security:** Stripe webhook verification renforcee + checkout validation
- **security:** Respect rate limit Resend 2 req/s sur tous les envois
- **fix:** Audit Qarte Shield — 6 bugs corriges
  - Quarantaine, detection IP, moderation, affichage
- **refactor:** Extraction 6 composants + 1 hook depuis pages card et scan
  - Meilleure separation des responsabilites
- **refactor:** Smart install bar, texte inclusif (genre neutre), historique 30j
- **refactor:** Suppression QR scanner (inutilise)
- **fix:** Prevention auto-checkins repetes a l'ouverture PWA
- **feat:** Kit reseaux sociaux (social-kit) — templates visuels
- **feat:** Dashboard comparaison semaine precedente
- **feat:** Reward sticky priority + tier2 dans social kit
- **fix:** Affichage dual-tier coherent sur ecrans pending et already-checked
- **fix:** Audit design carte client + redirect post-scan anti-doublon
- **fix:** Boutons retour style indigo/violet + responsive dashboard
- **feat:** Scan reward visibility, tier2 suggestions, leads cliquables
- **fix:** Page abonnement UX — toast, double loader, success/cancel feedback
- **fix:** Badges footer non-verifies supprimes

#### Fichiers modifies (20+)
| Fichier | Modification |
|---------|--------------|
| `src/app/api/stripe/webhook/route.ts` | +signature verification |
| `src/app/scan/[code]/page.tsx` | +anti-auto-checkin, +shield fixes, +dual-tier |
| `src/app/customer/card/[merchantId]/page.tsx` | +design audit, +composants extraits |
| `src/app/dashboard/social-kit/page.tsx` | Nouvelle page social kit |
| `src/app/dashboard/page.tsx` | +comparaison semaine |
| `src/app/dashboard/subscription/page.tsx` | +toast, +feedback |
| `src/components/shared/Sidebar.tsx` | +smart install bar |
| Multiple scan/card components | Extraction + refactor |

---

## [2026-02-08] - Landing hero + demo + settings

### Deploiement #12 - Hero copy, page demo, bouton demo, settings
**Commits:** `27c6508` → `bba0d1e`

#### Changements
- **feat:** Page demo (`/demo`) avec 3 cartes fictives (coiffeur, onglerie, institut)
  - Selecteur de type de commerce pour switcher entre les demos
  - Donnees hardcodees pour `demo-coiffeur`, `demo-onglerie`, `demo-institut`
  - CTA "Creer mon programme gratuit" en bas de page
- **feat:** Bouton "Voir une demo" ajoute dans HeroSection (lien direct vers demo onglerie)
  - Style gradient rose-bleu (from-pink-500 to-indigo-500)
- **feat:** Preview carte en mode demo (`?preview=true&demo=true`)
  - Banniere et CTA adaptes au mode demo
- **copy:** Nouveau titre hero : "Le programme de fidelite qui fait revenir vos clientes."
  - Gradient rose-pink-violet sur "revenir vos clientes."
  - Sous-titre : "Concu pour les instituts de beaute, ongleries et salons"
- **style:** Tailles hero agrandies pour remplir ~760px de viewport
  - h1 `text-3xl md:text-5xl lg:text-6xl`, subtitle `text-base lg:text-lg`
  - Espacement `space-y-6 lg:space-y-8`
- **style:** Mockup iPhone avec animation `bounce-gentle` (sautille doucement)
- **refactor:** Bouton "Supprimer mon compte" remplace par lien contact dans settings
- **style:** Badges preview ameliores sur page programme mobile

#### Nouveaux fichiers (2)
```
src/app/demo/page.tsx
src/app/demo/layout.tsx
```

#### Fichiers modifies (4)
| Fichier | Modification |
|---------|--------------|
| `src/components/landing/HeroSection.tsx` | Nouveau titre, sous-titre beaute, bouton demo, tailles agrandies, mockup bounce |
| `src/app/globals.css` | +animation `bounce-gentle` |
| `src/app/customer/card/[merchantId]/page.tsx` | +mode demo avec donnees hardcodees |
| `src/app/dashboard/program/page.tsx` | Fix badges preview mobile |

---

## [2026-02-08] - Preview carte + onboarding ameliore

### Deploiement #11 - Preview carte client, suggestions programme, countdown
**Commit:** `b2bf092`

#### Changements
- **feat:** Preview carte client (`?preview=true`) avec donnees simulees
  - Nouvel endpoint `GET /api/merchants/preview` (donnees publiques merchant)
  - Carte simulee : progression ~80% tier1, carte VIP, offre marketing
  - Banniere "Mode previsualisation" / "Voici ce que verront vos clients !"
  - Mode onboarding (`?preview=true&onboarding=true`) avec CTA sticky "Valider et generer mon QR code"
- **feat:** Redirect onboarding passe par preview avant QR download
  - Programme → preview carte → QR download (au lieu de programme → QR direct)
- **feat:** Suggestions programme par type de commerce (MerchantSettingsForm)
  - Suggestions contextuelles (nom reward, nb tampons) selon shop_type
  - Remplace l'ancien ProgramGuide
- **feat:** Pre-remplissage programme a la creation merchant (`stamps_required`, `reward_description` selon shop_type)
- **feat:** Countdown timer sur page abonnement (jours/heures/minutes restants essai)
- **feat:** TrialEndingEmail envoye a J-5 en plus de J-3/J-1
- **style:** Suppression CTA "Demander une demo" de la HeroSection landing

#### Nouveaux fichiers (1)
```
src/app/api/merchants/preview/route.ts
```

#### Fichiers supprimes (1)
```
src/components/loyalty/ProgramGuide.tsx
```

#### Fichiers modifies (9)
| Fichier | Modification |
|---------|--------------|
| `src/app/customer/card/[merchantId]/page.tsx` | +mode preview, +mock data, +banniere, +CTA onboarding |
| `src/app/dashboard/program/page.tsx` | Mockup iPhone supprime, redirect onboarding → preview, lien preview |
| `src/components/loyalty/MerchantSettingsForm.tsx` | +suggestions par shop_type, -ProgramGuide |
| `src/components/loyalty/index.ts` | -export ProgramGuide |
| `src/app/api/merchants/create/route.ts` | +pre-remplissage programme par shop_type |
| `src/app/api/cron/morning/route.ts` | +J-5 TrialEndingEmail |
| `src/app/dashboard/subscription/page.tsx` | +countdown timer fin essai |
| `src/components/landing/HeroSection.tsx` | -CTA "Demander une demo" |
| `docs/context.md` | Mise a jour onboarding flow, routes, features |

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

*Derniere mise a jour: 9 fevrier 2026*
