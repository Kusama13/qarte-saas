# Qarte — Roadmap, Audit & Changelog
## Fevrier 2026

---

# PARTIE 1 : ROADMAP FEATURES

## 1.1 Conversion trial → payant

### Funnel actuel

```
Signup (email+password)
  → Onboarding (logo, couleur, programme)
    → Premier scan (QR code en caisse)
      → Engagement (scans reguliers)
        → Conversion (paiement a J+14)
          → Retention (renouvellement mensuel)
```

**Benchmarks SaaS :**
- Opt-in free trial (sans CB) : **18-25%** conversion
- Opt-out free trial (avec CB) : **45-55%** conversion
- Qarte utilise le modele opt-in → cible realiste : **20-25%**

### Frictions identifiees

| # | Friction | Statut | Detail |
|---|----------|--------|--------|
| 1 | Programme jamais configure | ✅ Attenue | Suggestions cliquables par metier (MerchantSettingsForm). `reward_description` null a la creation → emails ProgramReminder J+1/2/3 se declenchent. |
| 2 | QR code jamais imprime | ✅ Attenue | QRCodeEmail envoye auto apres config. CTA "Telechargez votre QR code" dans preview banner. |
| 2b | Programme configure mais 0 scans | ✅ Attenue | Sequence J+2 (FirstClientScriptEmail) + J+4 (QuickCheckEmail) + ZeroScansCoach dashboard. Day5 skip si 0 scans. |
| 3 | Pas de "aha moment" avant J+14 | ❌ A faire | Objectif gamifie, celebration milestones. |
| 4 | Checkout frictionnel | ✅ Partiel | Fix checkout Stripe (customer supprime → recree auto). Fix `past_due` non bloquant. Coherence UI sidebar + page abonnement. |

## 1.2 Features — Du plus facile au plus complexe

### Niveau 1 : QUICK WINS (1-4h)

| # | Feature | Effort | Statut |
|---|---------|--------|--------|
| F1 | Presets recompense par metier | 1-2h | ✅ FAIT — `MerchantSettingsForm.tsx` (palier 1 + palier 2) |
| F2 | Email QR code auto post-setup | 1h | ✅ FAIT — `QRCodeEmail.tsx` + trigger auto + cron morning |
| F3 | Celebration premier scan (confetti + notif) | 1h | ❌ A FAIRE |
| F4 | Stats enrichies carte client | 2h | ❌ A FAIRE |
| F5 | Bouton "Partager mon programme" | 2-3h | ~~Retire~~ |
| F6 | Templates push enrichis (+10 templates) | 2h | ❌ A FAIRE |

### Niveau 2 : FEATURES MOYENNES (4-8h)

| # | Feature | Effort | Statut |
|---|---------|--------|--------|
| F7 | Onboarding checklist gamifiee | 4h | ✅ FAIT — `OnboardingChecklist.tsx`, 5 etapes, confetti, trial only |
| F8 | Birthday Club (anniversaire clients) | 6h | ❌ A FAIRE |
| F9 | Parrainage merchant | 3h | ✅ FAIT — code QARTE-XXXX, Settings + FirstScanEmail, Web Share API |
| F10 | Scratch & Win gamification | 6h | ❌ A FAIRE |
| F21 | Parrainage client (filleul/parrain) | 8h | ✅ FAIT — APIs, scan ?ref=, carte client, dashboard /referrals |
| F11 | Mode articles (points par euro) | 4-5h | ❌ A FAIRE |
| F12 | Export CSV/PDF enrichi | 5h | ❌ A FAIRE |
| F13 | Push geolocalisee | 6-8h | ❌ A FAIRE |

### Niveau 3 : FEATURES AVANCEES (1-3 jours)

| # | Feature | Effort | Statut |
|---|---------|--------|--------|
| F14 | Multi-location | 2-3j | ❌ A FAIRE |
| F15 | Analytics avance (cohorts, heatmap, LTV) | 2j | ❌ A FAIRE |
| F16 | Google Reviews automatise | 1-2j | ❌ A FAIRE |
| F17 | Apple/Google Wallet pass | 2-3j | ❌ A FAIRE |
| F18 | API publique + Webhooks | 3j | ❌ A FAIRE |
| F19 | Booking leger (prise de RDV) | 3-5j | ❌ A FAIRE |
| F20 | Tiered pricing (Starter/Pro/Business) | 2-3j | ❌ A FAIRE |

## 1.3 Matrice de priorisation

| # | Feature | Effort | Impact Conv. | Impact Retention | Priorite |
|---|---------|--------|-------------|-----------------|----------|
| F1 | ~~Presets recompense~~ | ~~1-2h~~ | ★★★★★ | ★★ | **✅ FAIT** |
| F2 | ~~Email QR code auto~~ | ~~1-2h~~ | ★★★★ | ★★★ | **✅ FAIT** |
| F3 | Celebration 1er scan | 1h | ★★★ | ★★★ | **P0** |
| F6 | Templates push | 2h | ★★ | ★★★★ | **P1** |
| F4 | Stats carte client | 2h | ★★ | ★★★ | **P1** |
| F7 | ~~Checklist gamifiee~~ | ~~4h~~ | ★★★★★ | ★★★ | **✅ FAIT** |
| F8 | Birthday Club | 6h | ★★★ | ★★★★★ | **P1** |
| F10 | Scratch & Win | 6h | ★★ | ★★★★★ | **P2** |
| F9 | ~~Parrainage merchant~~ | ~~3h~~ | ★★★★ | ★★★ | **✅ FAIT** |
| F21 | ~~Parrainage client~~ | ~~8h~~ | ★★★★★ | ★★★★★ | **✅ FAIT** |
| F11 | Mode articles | 4-5h | ★★ | ★★★ | **P2** |
| F12 | Export CSV/PDF | 5h | ★ | ★★★ | **P2** |
| F16 | Google Reviews auto | 1-2j | ★★★★ | ★★★★ | **P2** |
| F13 | Push geolocalisee | 6-8h | ★★ | ★★★★ | **P3** |
| F15 | Analytics avance | 2j | ★★ | ★★★★ | **P3** |
| F17 | Apple/Google Wallet | 2-3j | ★★★ | ★★★★ | **P3** |
| F14 | Multi-location | 2-3j | ★★★★ | ★★★ | **P3** |
| F20 | Tiered pricing | 2-3j | ★★★★★ | ★★★ | **P3** |
| F18 | API publique | 3j | ★★★ | ★★ | **P4** |
| F19 | Booking leger | 3-5j | ★★★★ | ★★★★ | **P4** |

## 1.4 Micro-SaaS Cross — Beauty Tech

| # | Idee | Effort | Synergie Qarte | TAM | Priorite |
|---|------|--------|----------------|-----|----------|
| 1 | **ReviewBoost** — Collecteur avis Google | 1-2 sem | ★★★★ | ★★★★★ | **#1** |
| 2 | **BeautyMenu** — Menu digital instituts | 2 sem | ★★★★ | ★★★★ | **#2** |
| 3 | **WaitlistApp** — File d'attente digitale | 2-3 sem | ★★★★ | ★★★ | **#3** |
| 4 | **BeautyPay** — Pourboires digitaux | 2-3 sem | ★★★ | ★★★★ | **#4** |
| 5 | **BeautyKit** — Contenu social auto | 3-4 sem | ★★★ | ★★★★★ | **#5** |
| 6 | **StaffBoard** — Planning employes | 3-4 sem | ★★ | ★★★ | **#6** |

---

# PARTIE 2 : AUDIT — Etat au 10 fevrier 2026

## 2.1 Problemes restants

### Securite

| # | Severite | Probleme | Fichier | Action |
|---|----------|----------|---------|--------|
| 1 | MEDIUM | `getSession()` dans pages admin (ne valide pas le JWT) | `admin/leads/page.tsx`, `admin/page.tsx` | Remplacer par `getUser()` |
| 2 | LOW | Rate limiting in-memory (Map) ne persiste pas entre cold starts | `api/checkin/route.ts` | OK pour le moment, passer a Redis si besoin |

### Qualite code

| # | Severite | Probleme | Fichier | Action |
|---|----------|----------|---------|--------|
| 1 | HIGH | Fichier ~1300 lignes (optimise: useMemo, fonctions pures, composants loyalty extraits) | `customer/card/[merchantId]/page.tsx` | Splitter davantage |
| 2 | HIGH | Fichier ~1200 lignes (referral flow ajoute) | `scan/[code]/page.tsx` | Splitter en composants |
| 3 | MEDIUM | Fichier 573 lignes | `admin/merchants/page.tsx` | Acceptable, surveiller |

### Marketing

| # | Severite | Probleme | Action |
|---|----------|----------|--------|
| 1 | ~~MEDIUM~~ | ~~Social proof "150+ instituts, 12,000+ clientes"~~ | **✅ RETIRE** — faux chiffres supprimes du hero |
| 2 | ~~LOW~~ | ~~Structured data SEO manquant~~ | **✅ FAIT** — JSON-LD Organization + SoftwareApplication dans layout.tsx |
| 3 | LOW | Framer Motion dans 12 composants landing (non lazy-loaded) | Dynamic import below-fold |

### Infrastructure

| # | Severite | Probleme | Action |
|---|----------|----------|--------|
| 1 | LOW | Pas de monitoring erreurs (Sentry) | Ajouter quand trafic augmente |

## 2.2 Problemes resolus

Tous ces points ont ete verifies dans le code au 10/02/2026 :

| Probleme | Resolution |
|----------|-----------|
| Trial 14→15 jours | Migration 026 : `NOW() + INTERVAL '15 days'` |
| Spelling canceled/cancelled | Migration 027 : constraint + update data |
| Path traversal upload | MIME whitelist (jpeg, png, webp, gif) + UUID filename |
| Auth bypass member-programs | `getUser()` + verification merchant ownership |
| Stripe error details exposes | Message generique, erreur loguee serveur uniquement |
| console.log en production | 0 occurrences dans `src/app/api/` |
| Pages legales manquantes | `/politique-confidentialite`, `/mentions-legales`, `/cgv` presentes |
| Index customers(phone_number) | Index present dans migration 001 |
| Types manquants (tier, scan_code) | Ajoutes dans `src/types/index.ts` |
| Apple/Google Wallet badges footer | Retires du footer |
| Checkin API sequentiel | Parallelise avec 5 groupes Promise.all (~300-600ms) |
| Push notifications sequentielles | `Promise.allSettled` pour envoi parallele |
| N+1 admin merchants | Batch query (1001 → 3 requetes) |
| Scan page visit_id comme loyalty_card_id | Checkin retourne `loyalty_card_id`, scan l'utilise |
| Members insert sans merchant_id | `merchant_id` + `formatPhoneNumber` ajoutes |
| Redemptions orphelines (race condition) | Stamp update atomique AVANT redemption insert |
| `.single()` crash 0 rows (PGRST116) | `.maybeSingle()` sur 9+ routes API |
| Empty `.in()` retourne tout | Guard `cardIds.length > 0` |
| Rate limiting manquant register/preview | Rate limit ajoute (15-30/min) |
| Offer duration cap incoherent (3 vs 30) | `Math.min(30, ...)` API + client |
| Cookie decode inconsistency cards page | `decodeURIComponent` ajoute |

---

# PARTIE 3 : SCALABILITE

## 3.1 Capacite actuelle

| Metrique | Capacite | Limite |
|----------|----------|--------|
| Marchands | ~300-500 | Crons timeout a 500+ |
| Checkins/jour | ~20,000 | Index visits OK |
| Clients/marchand | ~2,000 | Admin optimise |
| Push/envoi | ~5,000 | Parallelise (Promise.allSettled) |

### Echelle de confiance

| Echelle | Status |
|---------|--------|
| 0-300 marchands | ✅ OK |
| 300-500 marchands | ⚠️ Limite |
| 500+ marchands | 🔴 Fixes requis |

## 3.2 Optimisations appliquees

| Optimisation | Fichier | Impact |
|-------------|---------|--------|
| Parallelisation checkin (5 groupes Promise.all) | `api/checkin/route.ts` | ~600-1200ms → ~300-600ms |
| Parallelisation push (Promise.allSettled) | `api/push/send/route.ts` | Envoi parallele |
| Batch query admin merchants | `admin/merchants/page.tsx` | 1001 → 3 requetes |
| Index DB (visits, loyalty_cards, push, customers) | Migrations | -80-90% temps requete |
| Cache localStorage merchant (2 min TTL) | Dashboard | Moins de fetches |
| Skip register API pour nouveaux clients | `scan/[code]/page.tsx` | 1 appel API au lieu de 2 |

## 3.3 Problemes restants

| # | Priorite | Probleme | Fichier | Solution |
|---|----------|----------|---------|----------|
| 1 | P1 | Crons email sequentiels (intentionnel: rate limit Resend 2 req/s) | `api/cron/morning/route.ts` | Acceptable. Batching avec 600ms entre envois. |
| 2 | P2 | Push subscribers sans pagination | `api/push/subscribers/route.ts` | Ajouter `.limit(1000)` + pagination |
| 3 | P2 | Visits moderate — N+1 dans boucle | `api/visits/moderate/route.ts` | Batch UPDATE avec array |
| 4 | P3 | Pas de pagination sur `/api/redemptions`, `/api/member-cards` | Divers | Ajouter pagination |
| 5 | P3 | Rate limiting en memoire (ne persiste pas entre cold starts) | `api/checkin/route.ts` | Passer a Redis quand necessaire |

## 3.4 Capacite cible (apres tous les fixes)

| Metrique | Actuel | Cible |
|----------|--------|-------|
| Marchands max | 500 | **10,000+** |
| Checkins/jour | 20,000 | **500,000** |
| Push/jour | 50,000 | **5,000,000** |
| Temps cron | 30-60 min | **5 min** |

---

# PARTIE 4 : EMAILS (30 templates)

## 4.1 Parcours Signup (temps reel)

| # | Email | Declencheur | Quand |
|---|-------|-------------|-------|
| 1 | **IncompleteSignupEmail** | Phase 1 signup | +1h (Resend scheduledAt) |
| 2 | **IncompleteSignupReminder2Email** | Phase 1 signup | +3h (Resend scheduledAt) |
| 3 | **WelcomeEmail** | Phase 2 completee | Immediat |
| 4 | **NewMerchantNotification** | Phase 2 completee | Immediat → admin |

> Emails #1-2 annules automatiquement si signup complete avant l'envoi.

## 4.2 Onboarding — Programme non configure (cron morning 09:00)

| # | Email | Condition | Quand |
|---|-------|-----------|-------|
| 5 | **ProgramReminderEmail** | `reward_description` NULL | J+1 |
| 6 | **ProgramReminderDay2Email** | `reward_description` NULL | J+2 (par shop_type) |
| 7 | **ProgramReminderDay3Email** | `reward_description` NULL | J+3 (urgence) |

## 4.3 Post-configuration programme (temps reel)

| # | Email | Declencheur | Quand |
|---|-------|-------------|-------|
| 8 | **QRCodeEmail** | Programme configure | Immediat + cron morning (inclut kit reseaux si rewardDescription) |
| 9 | **FirstClientScriptEmail** | QR envoye + 0 scans | J+2 post-config (cron morning) |
| 10 | **QuickCheckEmail** | QR envoye + 0 scans | J+4 post-config (cron morning) |

## 4.4 Engagement & Milestones (cron morning 09:00)

| # | Email | Condition | Quand |
|---|-------|-----------|-------|
| 11 | **FirstScanEmail** | 2eme visite confirmee | J+1 apres premier scan |
| 12 | **Day5CheckinEmail** | 5 jours apres signup, skip si 0 scans | J+5 |
| 13 | **FirstRewardEmail** | 1ere recompense debloquee | J+1 apres recompense |
| 14 | **Tier2UpsellEmail** | 50+ clients, tier2 non active | Cron morning |
| 15 | **WeeklyDigestEmail** | Merchant actif avec scans | Lundi (cron morning) |

## 4.5 Inactivite (cron morning 09:00)

| # | Email | Condition | Quand |
|---|-------|-----------|-------|
| 16 | **InactiveMerchantDay7Email** | 0 visite depuis 7j | D+7 (diagnostic) |
| 17 | **InactiveMerchantDay14Email** | 0 visite depuis 14j | D+14 (pression) |
| 18 | **InactiveMerchantDay30Email** | 0 visite depuis 30j | D+30 (message perso) |

## 4.6 Trial (cron morning 09:00)

| # | Email | Condition | Quand |
|---|-------|-----------|-------|
| 19 | **TrialEndingEmail** | Trial actif | J-5, J-3, J-1 |
| 20 | **TrialExpiredEmail** | Trial expire | J+1, J+3, J+5 |

## 4.7 Points en attente — Qarte Shield (cron morning 09:00)

| # | Email | Condition | Quand |
|---|-------|-----------|-------|
| 21 | **PendingPointsEmail** (alerte) | Visites `pending` | D+0, D+1 |
| 22 | **PendingPointsEmail** (rappel) | Visites `pending` toujours | D+2, D+3 |

## 4.8 Stripe & Paiement (webhook temps reel)

| # | Email | Evenement Stripe | Quand |
|---|-------|-----------------|-------|
| 23 | **SubscriptionConfirmedEmail** | `checkout.session.completed` | Immediat |
| 24 | **SubscriptionConfirmedEmail** | `invoice.payment_succeeded` (recovery) | Immediat |
| 25 | **PaymentFailedEmail** | `invoice.payment_failed` | Immediat |
| 26 | **SubscriptionCanceledEmail** | `subscription.updated` → canceling | Immediat |
| 27 | **SubscriptionReactivatedEmail** | `subscription.updated` → canceling→active | Immediat |

## 4.9 Win-back (cron reactivation 10:00)

| # | Email | Condition | Quand |
|---|-------|-----------|-------|
| 28 | **ReactivationEmail** (QARTE50) | `canceled` | J+7 |
| 29 | **ReactivationEmail** (QARTEBOOST) | `canceled` | J+14 |
| 30 | **ReactivationEmail** (QARTELAST) | `canceled` | J+30 |

## 4.10 Autre

| # | Email | Declencheur |
|---|-------|-------------|
| 31 | **EbookEmail** | Formulaire `/ebook` |

## 4.11 Timeline complete d'un commercant

```
SIGNUP
  +0       WelcomeEmail
  +0       NewMerchantNotification → admin
  +1h      [IncompleteSignupEmail si pas fini]
  +3h      [IncompleteSignupReminder2Email si toujours pas fini]

ONBOARDING (si programme pas configure)
  +1 jour  ProgramReminderEmail
  +2 jours ProgramReminderDay2Email (par shop_type)
  +3 jours ProgramReminderDay3Email (urgence)

POST-CONFIG PROGRAMME
  +0       QRCodeEmail (immediat, inclut kit reseaux si rewardDescription)
  +2 jours FirstClientScriptEmail (script verbal par shop_type, si 0 scans)
  +4 jours QuickCheckEmail (diagnostic 3 options, si 0 scans)

ENGAGEMENT
  +1j apres 1er scan   FirstScanEmail (+ bloc parrainage)
  +5 jours             Day5CheckinEmail (skip si 0 scans)
  +1j apres 1ere rec.  FirstRewardEmail
  10+ clients          Tier2UpsellEmail
  Hebdomadaire         WeeklyDigestEmail

INACTIVITE (programme configure, 0 check-in)
  +7 jours   InactiveMerchantDay7Email
  +14 jours  InactiveMerchantDay14Email
  +30 jours  InactiveMerchantDay30Email

TRIAL
  -5 jours  TrialEndingEmail
  -3 jours  TrialEndingEmail
  -1 jour   TrialEndingEmail
  +1 jour   TrialExpiredEmail (grace period)
  +3 jours  TrialExpiredEmail
  +5 jours  TrialExpiredEmail

PAIEMENT (Stripe webhook)
  [checkout OK]       SubscriptionConfirmedEmail
  [echec paiement]    PaymentFailedEmail
  [recovery]          SubscriptionConfirmedEmail

ANNULATION
  [canceling]    SubscriptionCanceledEmail
  [reactivation] SubscriptionReactivatedEmail
  +7 jours       ReactivationEmail (QARTE50)
  +14 jours      ReactivationEmail (QARTEBOOST)
  +30 jours      ReactivationEmail (QARTELAST)

SHIELD (points en attente)
  D+0  PendingPointsEmail (alerte)
  D+1  PendingPointsEmail (alerte)
  D+2  PendingPointsEmail (rappel)
  D+3  PendingPointsEmail (rappel)
```

## 4.12 Notes techniques emails

- **Provider** : Resend (2 req/s max)
- **Rate limiting** : batch de 2 + 600ms entre les batches
- **Anti-spam** : headers `List-Unsubscribe` + `List-Unsubscribe-Post` sur tous les emails
- **Emails programmes** : via `scheduledAt` de Resend (IncompleteSignup +1h, Reminder2 +3h)
- **Tracking doublons** : tables `pending_email_tracking` et `reactivation_email_tracking`
- **Codes tracking** : -100 FirstScan, -101 FirstReward, -102 Tier2Upsell, -103 QRCode+Kit, -106 FirstClientScript, -107 QuickCheck
- **Layout** : `BaseLayout.tsx` (header violet #4b0082, footer)

---

# PARTIE 5 : PLAN D'ACTION — 30 jours

## Travail realise (08-10 fev)

### Bugs critiques corriges
- [x] Fix checkout Stripe quand customer supprime manuellement
- [x] Fix `past_due` traite comme essai expire
- [x] Coherence UI abonnement : banner sidebar `past_due` + badge page subscription
- [x] Fix `updated_at` trigger qui se declenchait sur `last_seen_at` (migration 032)
- [x] Admin stats excluent les comptes admin (via `super_admins`)

### Features & UX
- [x] **F1** : Suggestions cliquables par metier palier 1 + palier 2
- [x] **F2** : QRCodeEmail envoye auto apres config programme
- [x] **F7** : Onboarding checklist gamifiee 5 etapes (confetti, trial only)
- [x] **F9** : Parrainage merchant v1 (code QARTE-XXXX, Settings, FirstScanEmail, Web Share API)
- [x] Suppression pre-remplissage `reward_description` → emails ProgramReminder fonctionnent
- [x] ~~SocialKitEmail~~ supprime — fusionne dans QRCodeEmail
- [x] FirstScanEmail seuil passe a 2 visites
- [x] Renommage `/offre-speciale` → `/essai-gratuit`
- [x] Preview banner sticky CTA "Telechargez votre QR code"
- [x] Admin leads auto-refresh 30s
- [x] Admin activite : vue "hier" (`?date=yesterday`)
- [x] Trial reactivation : merchants expired < 7j (cron morning)
- [x] Logo PWA gradient indigo → rose
- [x] Fix push `sent_count` : clients uniques (deduplique par telephone)
- [x] Prix journalier sous prix mensuel/annuel (0,63€/jour)
- [x] Fix QRCodeEmail reecrit (menu → fidelite)
- [x] Nettoyage dead code (QRCardTemplate, OnboardingGuide)
- [x] Coupons Stripe : QARTEBOOST, QARTELAST
- [x] SEO metadata niche beaute (coiffeurs, barbiers, instituts, ongleries) sur toutes les pages
- [x] Metadata creees pour /ebook et /essai-gratuit (etaient orphelines)
- [x] /essai-gratuit ajoute au sitemap (priority 0.9)

### Marketing & Landing (10 fev)
- [x] Blog SEO : 3 articles (coiffure, onglerie, institut) + images Unsplash
- [x] Page `/qarte-vs-carte-papier` (comparatif)
- [x] FAQ pricing + RGPD ajoutees
- [x] JSON-LD structured data (Organization + SoftwareApplication)
- [x] Bloc parrainage dans emails (FirstScan, Inactive)
- [x] Bandeau noms clients defilant (texte marquee, gradient rose)
- [x] Hero : retire faux social proof (150+, 4.9/5, 12000+)
- [x] Hero : CTA "Essayer gratuitement", bouton demo secondaire (outline)
- [x] Footer + blog : liens blog, comparatif, contact

### Funnel activation post-config (11 fev)
- [x] FirstClientScriptEmail J+2 (script verbal par shop_type, 0 scans)
- [x] QuickCheckEmail J+4 (diagnostic 3 options, 0 scans)
- [x] ZeroScansCoach dashboard (remplace empty state par coaching 3 etapes)
- [x] `src/lib/scripts.ts` (constantes scripts verbaux partagees)
- [x] Fix OnboardingChecklist etape 4 (label + href /qr-download)
- [x] Skip Day5CheckinEmail pour 0-scan merchants

### Landing refonte UX & couleurs (11 fev)
- [x] FeaturesSection : CSS Grid 3x3 (remplace SVG arrows casses)
- [x] FeaturesSection : titre "Notifiez vos client(e)s au meilleur moment" + subtitle push
- [x] ReferralSection : nouvelle section landing parrainage (3 cards, stats, CTA)
- [x] HeroSection : badge flottant parrainage (remplace stat +42% Recurrence)
- [x] PricingSection : +2 features (Programme de parrainage, Lien de reservation)
- [x] FAQSection : +1 question parrainage
- [x] URL normalisation : auto-ajout `https://` sur tous les champs liens dashboard
- [x] Harmonie couleurs landing : 9 familles → 4 (indigo/violet, rose/pink, emerald, gray)
- [x] Tous les CTAs unifies indigo-600 → violet-600 (Hero, HowItWorks, Pricing, MobileStickyCta)
- [x] PricingSection : suppression shimmer, glow, backdrop-blur → card epuree
- [x] PricingSection : checkmarks emerald → indigo
- [x] Hero : demo CTA ghost button, reward card rose, blobs simplifies
- [x] ComparisonSection retiree du flow landing
- [x] Ecriture inclusive client(e)s partout (Features, FAQ)
- [x] MobileStickyCta : gradient corrige (pink→indigo → indigo→violet)
- [x] ScrollToTopButton : bottom-24 mobile (au-dessus sticky CTA)
- [x] Icone tampons : Footprints → Heart (carte client + historique)
- [x] Fix &circlearrowleft; → ↺ (entite HTML non supportee JSX)

### Refonte carte client (12 fev)
- [x] Reward card celebration mode (gradient + shimmer + pulsing icon)
- [x] Dual-tier awareness (Palier 1/2 dynamique)
- [x] Footer "Propulse par Qarte" avec lien landing
- [x] Optimisation page: useMemo, fonctions pures extraites, dead code supprime
- [x] ReviewPrompt redesign compact
- [x] MemberCardModal redesign premium
- [x] Nettoyage logos clients inutilises
- [x] **F21** : Programme parrainage client complet (APIs + scan + carte + dashboard)
- [x] Harmonisation design : shadows, borders, cards uniformes
- [x] Message d'accueil quotidien rotatif (10 phrases motivationnelles)
- [x] SocialLinks redesigne en card style
- [x] Referral button redesigne en card blanche + bouton compact

## Semaine 1 (10-16 fev)
- [ ] **F3** : Celebration premier scan (1h)
- [ ] Plan admin merchants (barre actions, badges alerte, WhatsApp)

## Semaine 2 (17-23 fev)
- [ ] **F6** : Templates push enrichis (2h)
- [ ] **F4** : Stats enrichies carte client (2h)

## Semaine 3 (24 fev - 2 mars)
- [ ] **F8** : Birthday Club (6h)

## Semaine 4 (3-9 mars)
- [ ] **F10** : Scratch & Win gamification (6h)
- [ ] **F16** : Google Reviews automatise (1-2j)
- [ ] Demarrer prototype **ReviewBoost** (micro-SaaS #1)

## KPIs a suivre

1. **Taux de completion setup** (signup → programme configure)
2. **Time to first scan** (signup → premier scan client)
3. **Trial-to-paid conversion rate**
4. **30-day merchant retention**
5. **Monthly churn rate**
6. **MRR growth**

---

# PARTIE 6 : CHANGELOG

## [2026-02-12] — Onboarding checklist, admin parrainage + progression, UX fixes

### Dashboard onboarding checklist
- **feat:** 6 etapes checklist : programme, logo, reseau social, preview client, QR code, 2 premiers scans
- **feat:** Deep-link `?section=social` vers section reseaux sociaux (auto-open collapse + scroll)
- **feat:** Etape "Simuler l'experience client" → preview carte (`?preview=true`)
- **refactor:** Retrait etapes push/parrainage (incoherentes au debut), reduction 8→6 etapes

### Admin merchant detail
- **feat:** Badge parrainage actif/inactif (violet/gris) dans badges statut
- **feat:** Section "Progression onboarding" : 5 items checklist + barre de progression

### PWA carte client
- **fix:** Retrait badge "Notifications actives" (inutile visuellement)

### Dashboard page clients
- **perf:** `useMerchant()` au lieu de re-fetch auth + merchant (economise 2 requetes ~150ms)
- **perf:** `Promise.all` cards + push subscribers en parallele (~50-60% plus rapide)

### AdjustPointsModal
- **fix:** Boutons +1/-1 incrementaux (accumulent au lieu de remplacer)

### ReviewPrompt
- **fix:** Background `bg-white/70 backdrop-blur-sm` (harmonise avec SocialLinks)

---

## [2026-02-12] — Audit bugs complet, admin social links, landing cleanup

### Audit bugs complet (10+ fixes critiques)
- **fix(CRITICAL):** Scan page utilisait `visit_id` comme `loyalty_card_id` — corrige dans checkin API + scan page
- **fix(CRITICAL):** Members page — `merchant_id` manquant a l'insertion client + `formatPhoneNumber` absent
- **fix(HIGH):** Redemptions orphelines — reorder atomic stamp update AVANT redemption insert (redeem + redeem-public)
- **fix(HIGH):** `.single()` → `.maybeSingle()` sur 9+ fichiers API (evite crash PGRST116 sur 0 rows)
- **fix(MEDIUM):** Empty array `.in()` guard sur customers/cards (evite retour de TOUTES les redemptions)
- **fix(MEDIUM):** Rate limiting ajoute sur customers/register (GET 15/min, POST 10/min) et merchants/preview (30/min)
- **fix(MEDIUM):** Offer duration cap 3 → 30 jours (API + client-side)
- **fix(MEDIUM):** Cookie decode inconsistency — `decodeURIComponent` ajoute dans cards page
- **fix(MEDIUM):** Redemptions API — phone rendu obligatoire pour securite

### Marketing page
- **fix:** Offre creee meme si 0 abonnes push (decouplage offre/push)
- **fix:** `handleSchedule` sauvegarde l'offre avant de programmer le push
- **fix:** `getDurationDays()` cap client-side a 30 jours (coherence API)

### Admin merchant detail
- **feat:** Section "Liens & Reseaux" dans `/admin/merchants/[id]` — pills cliquables Instagram, Facebook, TikTok, Reservation, Avis Google

### Landing
- **fix:** "Solutions" retire du menu desktop et mobile

## [2026-02-12] — Landing parrainage, reservation, URL normalization

### Landing page
**Commit:** `33e5390`
- **feat:** ReferralSection — nouvelle section parrainage landing (3 cards visuelles, stats x3/+25%/0€, CTA)
- **copy:** FeaturesSection titre change → "Notifiez vos client(e)s au meilleur moment" + subtitle push
- **feat:** HeroSection — badge flottant parrainage "Marie a parraine Sophie" (remplace stat +42%)
- **feat:** PricingSection — +2 features (Programme de parrainage, Lien de reservation)
- **feat:** FAQSection — +1 question "Comment fonctionne le programme de parrainage ?"
- **copy:** Ecriture inclusive ReferralSection (client(e)s, ambassadeur/rice, nouveaux/elles)

### Dashboard
- **fix:** URL normalization — auto-ajout `https://` sur 5 champs liens (review, instagram, facebook, tiktok, booking)

## [2026-02-12] — Programme parrainage client, harmonisation design, message accueil

### Programme de parrainage client (F21)
**Commit:** `f34670c`
- **feat:** `POST /api/referrals` — inscription filleul (cree customer + carte + voucher, anti-doublon, anti-parrainage soi-meme)
- **feat:** `GET /api/referrals?code=` — info code parrainage (merchant, parrain, recompense)
- **feat:** `POST /api/vouchers/use` — consommation voucher self-service + auto-creation voucher parrain si referral
- **feat:** `POST /api/merchants/referral-config` — sauvegarde config parrainage (auth merchant)
- **feat:** Scan page `?ref=` detection — banner parrain, inscription filleul, ecran succes referral
- **feat:** Carte client — bouton "Parrainer un ami" (Web Share API + fallback clipboard)
- **feat:** Carte client — section "Mes recompenses" avec vouchers + bouton "Utiliser"
- **feat:** Dashboard `/dashboard/referrals` — toggle on/off, 2 inputs recompenses, 3 compteurs stats, tableau parrainages
- **feat:** Sidebar dashboard — lien "Parrainage" ajoute
- **feat:** `generateReferralCode()` dans utils.ts (6 chars alphanum sans ambiguite)
- **feat:** Auto-generation `referral_code` sur loyalty_cards (checkin + referral creation)
- **types:** `Referral`, `Voucher`, `ReferralStatus` ajoutes dans types/index.ts

### Harmonisation design carte client
- **style:** Shadows uniformes `shadow-lg shadow-gray-200/50` sur toutes les cartes blanches
- **style:** Borders uniformes `border border-gray-100/80 rounded-2xl`
- **style:** SocialLinks redesigne — `bg-white/70 backdrop-blur-sm` avec card style standard
- **style:** Push notification banner — icone dans carre teinte merchant, card style uniforme
- **style:** Referral button — redesigne en card blanche avec icone gradient + bouton compact "Partager"
- **style:** RewardCard not-ready — `shadow-lg shadow-gray-200/50` (harmonise)
- **style:** HistorySection border `border-gray-100/80` (harmonise)

### Message d'accueil quotidien
- **feat:** 10 phrases motivationnelles rotatives (1 par jour, stable via day-of-year)
- **ui:** Texte italic gris sous le prenom client ("Vous etes resplendissante !", "On adore vous revoir !", etc.)

## [2026-02-12] — Refonte carte client, reward celebration, optimisation

### Carte client (`customer/card/[merchantId]/page.tsx`)
- **ui:** Reward card redesign — celebration mode (gradient merchant + shimmer sweep + pulsing icon) quand recompense prete
- **ui:** Reward card motivational preview — icone + description + "Plus que X passages" quand pas prete
- **feat:** Dual-tier awareness — reward card affiche dynamiquement Palier 1 ou Palier 2 selon l'etat de la carte
- **ui:** Footer "Propulse par Qarte" avec lien vers landing (logo Q gradient indigo→violet)
- **perf:** `useMemo` pour 10 computed values (isRewardReady, isTier2Ready, effectiveTier1Redeemed, etc.)
- **perf:** Fonctions pures (`formatRewardText`, `getLoyaltyLabel`, `MerchantOffer` interface) extraites hors composant
- **cleanup:** Suppression dead code — `getLoyaltyIcon()`, `offerExpanded` state, imports inutilises (ChevronDown, ChevronUp)

### Composants loyalty
- **ui:** `ReviewPrompt.tsx` — redesign compact (etoiles + CTA "J'y vais", dismiss permanent localStorage)
- **ui:** `MemberCardModal.tsx` — redesign premium dark card
- **ui:** `HistorySection.tsx` — espacement reduit (mb-4)

### Nettoyage
- **delete:** 10 logos clients inutilises (`public/images/logos/`)

## [2026-02-11] — Merge QR + Social Kit, cleanup, admin emails

### Merge QR code + Kit reseaux sociaux
**Commit:** `dfa29eb`
- **refactor:** Merge `/dashboard/social-kit` dans `/dashboard/qr-download` — 2 onglets (QR code + Kit reseaux)
- **refactor:** Merge SocialKitEmail dans QRCodeEmail — section kit conditionnelle sur `rewardDescription`
- **delete:** Suppression page social-kit, API route, email template, admin button, FlyerTemplate orphelin
- **feat:** Section "Emails envoyes" dans admin merchant detail (tracking codes -100 a -107)
- **fix:** Label tracking -102 corrige (Upsell Tier 2, pas Bilan hebdomadaire)
- **refactor:** Cron morning — suppression section social kit, QR section enrichie avec donnees merchant completes
- **style:** Branding "Propulse par getqarte.com" en white pill partout (SocialMediaTemplate, QR card)
- **delete:** Page test/qr-preview (mock data dev only)

### Funnel activation post-config + Landing refonte

### Funnel "Programme configure → Premier scan"
**Commit:** `3bcaf14`
- **feat:** FirstClientScriptEmail J+2 — script verbal personnalise par shop_type (coiffeur, onglerie, spa...)
- **feat:** QuickCheckEmail J+4 — diagnostic court avec 3 options (QR pas imprime, ne sait pas presenter, autre)
- **feat:** ZeroScansCoach — composant dashboard remplacant l'empty state par coaching 3 etapes
- **feat:** `src/lib/scripts.ts` — constantes scripts verbaux partagees (emails + dashboard)
- **fix:** OnboardingChecklist etape 4 — label "Obtenir mes 2 premiers scans" + href `/qr-download`
- **optim:** Day5CheckinEmail skip pour merchants 0 scans (couvert par J+2 et J+4)

### Landing refonte UX, harmonie couleurs, icone coeur
**Commit:** `f41847c`

### Landing & UX
- **refactor:** FeaturesSection CSS Grid 3x3 (remplace SVG arrows desalignes)
- **copy:** Titre "Avec Qarte, vos client(e)s ne vous oublient plus." + subtitle "Pendant que vous travaillez, Qarte fidelise."
- **style:** Audit harmonie couleurs — 9 familles → 4 (indigo/violet actions, rose/pink emotion, emerald succes, gray neutre)
- **style:** Tous CTAs unifies `indigo-600→violet-600` (Hero, HowItWorks, Pricing, MobileStickyCta)
- **style:** PricingSection epuree — suppression shimmer, glow, backdrop-blur, checkmarks indigo
- **style:** Hero — demo CTA ghost button, reward card rose, blobs simplifies
- **fix:** ComparisonSection retiree du flow landing (redondante)
- **copy:** Ecriture inclusive client(e)s partout (Features, FAQ)
- **fix:** MobileStickyCta gradient corrige
- **fix:** ScrollToTopButton position mobile (au-dessus sticky CTA)
- **feat:** Icone tampons Footprints → Heart (carte client + historique)
- **fix:** Entite HTML `&circlearrowleft;` → caractere Unicode ↺

## [2026-02-10] — Marketing landing, blog SEO, bandeau clients
**Commits:** `753558d`, `e553555`, `4110f17`, `906a4d4`, `949e4c6`, `5ce4a3a`, `402fa8b`, `85e80fb`, `5fb6533`, `02f4c5c`

### Landing & Marketing
- **feat:** Blog SEO — 3 articles longs (coiffure, onglerie, institut) + images Unsplash
- **feat:** Page `/qarte-vs-carte-papier` (comparatif papier vs digital)
- **feat:** FAQ pricing + RGPD ajoutees a la landing
- **feat:** JSON-LD structured data (Organization + SoftwareApplication)
- **feat:** Bloc parrainage insere dans emails (FirstScan, Inactive)
- **feat:** Bandeau noms clients defilant (texte marquee gradient rose + FOMO)
- **fix:** Retire faux social proof du hero (150+ instituts, 4.9/5, 12000+ clientes)
- **fix:** Hero CTA "Essayer gratuitement", bouton demo secondaire (outline)
- **feat:** Footer liens blog, comparatif, contact
- **seo:** Metadata niche beaute sur toutes les pages (coiffeurs, barbiers, instituts, ongleries)
- **seo:** Metadata creees pour /ebook et /essai-gratuit (etaient orphelines SEO)
- **seo:** /essai-gratuit ajoute au sitemap + blog articles + comparatif
- **seo:** JSON-LD structured data Organization + SoftwareApplication (layout.tsx)

### Produit
- **fix:** QRCodeEmail reecrit de zero (ancien template parlait de "QR code menu")
- **fix:** Nettoyage QRCardTemplate.tsx (dead code), fix test-emails preview
- **feat:** Prix journalier affiche sous le prix mensuel/annuel (0,63€/jour)
- **feat:** Logo PWA gradient indigo → rose (#4f46e5 → #ec4899)
- **fix:** Push `sent_count` clients uniques (deduplique par telephone)
- **fix:** Parrainage — liste tous les types de commerce + texte "apres inscription"

## [2026-02-09] — Stripe emails, subscription UX, parallelisation, multi-pays

### Deploiement #18 — Fix emails Stripe + polling + sidebar banners
- **fix:** Email annulation → `canceling` (avant: `subscription.deleted` trop tard)
- **fix:** Email recovery → `past_due` → `active`
- **fix:** Date fin abonnement utilise `subscription.cancel_at` Stripe
- **fix:** Polling apres retour portail Stripe (sessionStorage + 2s × 8 tentatives)
- **fix:** Sidebar banner `canceling` orange + texte lien trial dynamique

### Deploiement #17 — Parallelisation checkin API + harmonisation dashboard
- **perf:** API checkin 11 requetes → 5 groupes Promise.all (-50% latence)
- **perf:** Scan page skip API `/api/customers/register` (1 appel au lieu de 2)
- **style:** Harmonisation headers 8 pages dashboard (violet #4b0082)
- **fix:** Sidebar mobile bottom sheet 50vh (drag-to-dismiss, Framer Motion)
- **fix:** Webhook trialing + cancel_at_period_end → `canceling`
- **feat:** 4 palettes desktop-only (Terracotta, Ocean, Foret, Noir & Or)

### Deploiement #16 — Audit responsive + couleurs beaute
- **style:** Audit responsive complet mobile (fonts, paddings, boutons reduits)
- **fix:** Hamburger menu overlap mobile
- **fix:** Page QR download → layout sidebar
- **fix:** Stripe checkout → gestion `checkout.session.expired` et `incomplete`
- **feat:** 6 palettes couleurs beaute mobile

### Deploiement #15 — FR/BE/CH/LU telephone + migration E.164
- **feat:** Support 4 pays (FR, BE, CH, LU) — format E.164 sans `+`
- **feat:** `formatPhoneNumber()`, `validatePhone()`, `displayPhoneNumber()`
- **feat:** Selecteur pays onboarding + filtre pays admin
- **refactor:** API checkin restructuree (format phone apres fetch merchant)

### Deploiement #14 — Metriques startup admin + emails #4b0082
- **feat:** Admin dashboard metriques (MRR, churn, ARPU, LTV)
- **feat:** Admin merchants actions rapides, activite, alertes
- **refactor:** Refonte templates emails → couleur #4b0082
- **feat:** Codes promo progressifs (QARTE50, QARTEBOOST, QARTELAST)
- **feat:** SubscriptionConfirmedEmail apres checkout

## [2026-02-08] — Securite, Shield, demo, preview carte

### Deploiement #13 — Audit securite + Shield + social kit
- **security:** Stripe webhook verification + checkout validation
- **fix:** 6 bugs Qarte Shield corriges
- **refactor:** Extraction 6 composants + 1 hook (card/scan)
- **feat:** Kit reseaux sociaux + dashboard comparaison semaine
- **fix:** Prevention auto-checkins repetes a l'ouverture PWA

### Deploiement #12 — Hero copy, page demo, settings
- **feat:** Page `/demo` (3 cartes fictives: coiffeur, onglerie, institut)
- **feat:** Bouton "Voir une demo" dans HeroSection
- **copy:** "Le programme de fidelite qui fait revenir vos clientes."
- **style:** Mockup iPhone bounce animation

### Deploiement #11 — Preview carte client, countdown
- **feat:** Preview carte (`?preview=true`) avec donnees simulees
- **feat:** Redirect onboarding passe par preview avant QR download
- **feat:** Suggestions programme par shop_type (MerchantSettingsForm)
- **feat:** Countdown timer page abonnement
- **feat:** TrialEndingEmail a J-5 (en plus de J-3/J-1)

### Deploiement #10 — Tarif annuel + cron refactor
- **feat:** Tarif annuel 190€/an (toggle mensuel/annuel)
- **refactor:** Cron morning/evening/reactivation refactores

## [2026-02-06] — Admin + fixes

- **feat:** Inscriptions du jour sur accueil admin + badges programme
- **feat:** Masquer comptes admin par defaut
- **fix:** Detection programme via `reward_description`
- **fix:** Race condition `schedule-incomplete` signup

## [2026-02-05] — Inscription 2 phases

### Deploiement #6 — Email relance via Resend scheduledAt
- **feat:** IncompleteSignupEmail programme +1h via Resend scheduledAt
- **feat:** Annulation automatique si Phase 2 completee

### Deploiement #5 — Optimisation flux onboarding
- **perf:** Page QR utilise `useMerchant()` (pas de fetch duplique)
- **feat:** Premiere sauvegarde programme redirige vers QR download

### Deploiement #4 — Suppression GuidedTour
- **fix:** Suppression `GuidedTour.tsx` (bloquait tous les clics)
- **feat:** Redirect post-inscription → `/dashboard/program`

### Deploiement #3 — Leads & Nettoyage
- **refactor:** Inscriptions incompletes deplacees vers `/admin/leads`
- **delete:** Suppression outils gratuits (qr-menu, qr-wifi, lien-avis) — -2744 lignes

### Deploiement #2 — Corrections audit
- **security:** `getUser()` au lieu de `getSession()` dans signup/complete
- **security:** Rate limiting sur `/api/merchants/check`
- **perf:** Pagination `listUsers` dans cron morning

### Deploiement #1 — Inscription 2 phases & emails
- **feat:** Inscription 2 phases (email+mdp → infos commerce)
- **feat:** Email relance inscription incomplete (2-3h)
- **feat:** Email rappel configuration programme J+1
- **feat:** Cron morning 5 taches

## [2026-02-04] — Performance + emails + migrations

### Deploiement #2 — Performance
- **perf:** Fix N+1 admin merchants (1001 → 3 requetes)

### Deploiement #1 — Emails & Anti-spam
- **feat:** PaymentFailedEmail, SubscriptionCanceledEmail, ReactivationEmail
- **feat:** Cron reactivation (10:00 UTC)
- **feat:** Anti-spam headers sur tous les emails
- **feat:** Index DB (visits, loyalty_cards, push_subscriptions)

### Migrations SQL
- 026 : Trial 14→15 jours
- 027 : Spelling cancelled→canceled + constraint
- 028 : Reactivation email tracking
- 029 : Merchant country + E.164 migration
- 030 : Shield + divers
- 031 : last_seen_at column
- 032 : Fix updated_at trigger (exclut last_seen_at)
- 033 : Add referral_code (parrainage merchant)

---

*Derniere mise a jour : 12 fevrier 2026*
*Statuts verifies contre le code source le 12/02/2026. Onboarding checklist + admin progression + audit bugs + landing cleanup.*
