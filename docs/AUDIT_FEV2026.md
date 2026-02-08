# Audit Qarte SaaS - 8 Fevrier 2026

## AUDIT DEV

### SECURITE

| # | Severite | Probleme | Fichier | Action |
|---|----------|----------|---------|--------|
| 1 | MEDIUM | `getSession()` utilise dans pages admin (ne valide pas le JWT) | `admin/leads/page.tsx:44`, `admin/page.tsx:235` | Remplacer par `getUser()` cote client ou valider cote API |
| 2 | LOW | Rate limiting in-memory (Map) ne persiste pas entre les cold starts Vercel | `api/checkin/route.ts:20` | OK pour le moment, passer a Redis si besoin |
| 3 | OK | `.env.local` n'est PAS dans git (`.gitignore` le bloque) | `.gitignore` | Rien a faire |
| 4 | OK | Validation Zod sur `/api/checkin` | `api/checkin/route.ts:11` | Bien |
| 5 | OK | Rate limiting sur `/api/merchants/check` | Present | Bien |
| 6 | OK | Toutes les tables ont RLS active | `supabase/migrations/` | Bien |
| 7 | OK | Pages legales presentes (mentions, CGV, confidentialite, contact) | `src/app/` | Bien |
| 8 | OK | Stripe webhook verifie la signature | `api/stripe/webhook/` | Bien |

### QUALITE CODE

| # | Severite | Probleme | Fichier | Action |
|---|----------|----------|---------|--------|
| 1 | HIGH | Fichier monstre 2327 lignes | `customer/card/[merchantId]/page.tsx` | Splitter en composants (CardHeader, StampGrid, VIPCard, etc.) |
| 2 | HIGH | Fichier 1406 lignes | `scan/[code]/page.tsx` | Splitter en composants |
| 3 | MEDIUM | Fichier 573 lignes | `admin/merchants/page.tsx` | Acceptable mais a surveiller |
| 4 | OK | `any` uniquement dans les tests (16 occurrences) | `__tests__/` | Acceptable |
| 5 | OK | Pas de `console.log` dans le code API production | `src/app/api/` | Bien |
| 6 | OK | Imports bien organises (React > externes > internes > libs > types) | Convention respectee | Bien |

### PERFORMANCE

| # | Severite | Probleme | Action |
|---|----------|----------|--------|
| 1 | LOW | Images mockup chargees en `priority` (OK pour above-fold) | Rien a faire |
| 2 | LOW | Framer Motion importe dans 12 composants landing | Envisager dynamic import pour composants below-fold |
| 3 | OK | N+1 fixe dans admin merchants (batch query) | Deja corrige |
| 4 | OK | Index DB en place (visits, loyalty_cards, push_subscriptions) | Bien |
| 5 | OK | Cache localStorage merchant (2 min TTL) | Bien |

### INFRASTRUCTURE

| # | Severite | Probleme | Action |
|---|----------|----------|--------|
| 1 | OK | 3 crons configures (morning 9h, evening 18h, reactivation 10h) | Bien |
| 2 | OK | Emails via Resend avec headers anti-spam | Bien |
| 3 | OK | Stripe webhook avec signature verification | Bien |
| 4 | LOW | Pas de monitoring d'erreurs (Sentry ou equivalent) | Ajouter plus tard quand le trafic augmente |

---

## AUDIT MARKETING (Early-Stage Launch)

### LANDING PAGE

| # | Element | Etat | Commentaire |
|---|---------|------|-------------|
| 1 | **Titre hero** | "Le programme de fidelite qui fait revenir vos clientes." | Bon - clair, niche beaute, promesse forte |
| 2 | **Sous-titre** | "Concu pour instituts de beaute, ongleries et salons" | Bon - niche immediatement identifiable |
| 3 | **CTA primaire** | "Lancer mon programme gratuit" → signup | Bon - action claire, gratuit |
| 4 | **CTA secondaire** | "Voir une demo" → demo onglerie | Bon - reduit la friction |
| 5 | **Social proof** | "150+ instituts, 4.9/5, 12,000+ clientes" | ATTENTION - chiffres a adapter au lancement. Si tu n'as pas encore 150 instituts, mets des chiffres reels ou retire |
| 6 | **Badge** | "Pret en 3 minutes" | Bon - urgence et simplicite |
| 7 | **Mockup** | Screenshot carte client dans iPhone | OK mais image floue signalee - envisager un meilleur screenshot |

### SECTIONS LANDING

| Section | Contenu | Note |
|---------|---------|------|
| How It Works | 3 etapes (scanner, fideliser, analyser) | Bon - simple et clair |
| Comparison | Avant/Apres (cartes papier vs Qarte) | Bon - pain points identifies |
| Features | QR code, push, VIP, stats, anti-fraude | Bon - exhaustif |
| Testimonial | "Nail Salon by Elodie" | ATTENTION - temoignage reel ? Si fictif, le signaler ou le retirer |
| Case Study | Etude de cas institut | Idem - verifier si reel |
| Pricing | 19€/mois, 190€/an, essai 15 jours | Bon - prix clair, toggle annuel |
| FAQ | 7 questions | Bon - couvre les objections principales |
| Footer | Trust badges (RGPD, Hebergement vert, France, Paiement securise) | ATTENTION - "Hebergement vert" et "Serveurs en France" a verifier (Supabase est sur AWS, pas forcement France) |
| Footer | Integration logos (Stripe, Apple Wallet, Google Wallet) | ATTENTION - Apple Wallet et Google Wallet sont-ils vraiment integres ? Si non, retirer |

### FUNNEL DE CONVERSION

```
Landing → Signup Phase 1 (email + mdp)
  → Email verification (code 6 chiffres)
  → Signup Phase 2 (infos commerce)
  → WelcomeEmail
  → /dashboard/program (config programme)
    → Preview carte (?preview=true&onboarding=true)
    → /dashboard/qr-download
```

| Etape | Friction | Suggestion |
|-------|----------|------------|
| Phase 1 → Phase 2 | Verification email peut perdre des gens | Email relance 1h apres (deja en place, OK) |
| Phase 2 → Programme | Certains ne configurent pas | Email J+1 + J+2 (deja en place, OK) |
| Programme → QR | Redirect automatique post-premiere config | OK, bien fait |
| Trial → Paid | Countdown + emails J-5/J-3/J-1 | Bon - urgence progressive |
| Annulation → Win-back | Emails J+7/J+14/J+30 | Bon - sequence complete |

### EMAILS (10 templates)

| Email | Qualite | Commentaire |
|-------|---------|-------------|
| WelcomeEmail | Bon | Urgence + temoignage + WhatsApp |
| IncompleteSignupEmail | Bon | Relance 1h apres, pas trop agressif |
| ProgramReminderEmail | Bon | J+1, suggestion recompense par shop_type |
| ProgramReminderDay2Email | Bon | J+2, recommandation specifique + WhatsApp |
| TrialEndingEmail | Bon | J-5/J-3/J-1, urgence progressive |
| TrialExpiredEmail | Bon | J+1/3/5, rappel donnees |
| PendingPointsEmail | Bon | Rappel passages en attente |
| PaymentFailedEmail | Bon | Alerte echec paiement |
| SubscriptionCanceledEmail | Bon | Confirmation annulation |
| ReactivationEmail | Bon | Win-back J+7/14/30 |

### TRACKING & ANALYTICS

| Outil | Etat | Commentaire |
|-------|------|-------------|
| Google Tag Manager | Installe (GTM-T5Z84DPV) | OK |
| Google Analytics 4 | Installe (G-WM3XVQ38BD) | OK |
| Facebook Pixel | Installe (1438158154679532) | OK |
| Vercel Analytics | Active | OK |
| Evenements FB | PageView, Lead, CompleteRegistration, StartTrial, Subscribe, InitiateCheckout, ScrollDepth | Bon - funnel complet |
| CTA tracking | `trackCtaClick()` sur tous les CTAs | Bon |

### LEAD GENERATION

| Canal | Etat | Commentaire |
|-------|------|-------------|
| Ebook | Page `/ebook/` avec formulaire email | Bon - "Guide de Fidelisation 2026" |
| Offre speciale | Page `/offre-speciale/` retargeting | Bon - urgence + glassmorphism |
| Demo | Page `/demo/` avec 3 cartes fictives | Bon - reduit la friction |
| Contact | Page `/contact/` avec formulaire | OK |

### POINTS D'ATTENTION EARLY-STAGE

| # | Probleme | Impact | Action recommandee |
|---|----------|--------|-------------------|
| 1 | **Social proof gonfle** | Perte de credibilite si decouvert | Adapter les chiffres (ex: "Rejoint par X salons" ou retirer completement) |
| 2 | **Temoignages potentiellement fictifs** | Risque legal + credibilite | Utiliser de vrais temoignages ou retirer |
| 3 | **Apple/Google Wallet dans footer** | Feature pas implementee | Retirer ou ajouter "Bientot" |
| 4 | **"Serveurs en France"** | Supabase/AWS pas forcement France | Verifier ou retirer ce badge |
| 5 | **"Hebergement vert"** | Vercel/AWS pas specifiquement "vert" | Retirer ce badge |
| 6 | **Ebook footer date 2025** | Incoherence | Mettre a jour a 2026 |
| 7 | **Ebook social proof "+120 commercants"** | Nombre different du landing (150+) | Harmoniser |

### SEO

| Element | Etat |
|---------|------|
| Title | A verifier dans layout.tsx |
| Meta description | A verifier |
| OG tags | A verifier |
| Sitemap | Present (`src/app/sitemap.ts`) |
| Pages legales | Toutes presentes |
| Structured data | Non detecte - a ajouter (LocalBusiness, SoftwareApplication) |

---

## PRIORITES D'ACTION

### Immediat (avant launch)
1. Ajuster la social proof (chiffres reels)
2. Verifier/retirer les badges "Hebergement vert" et "Serveurs en France"
3. Verifier les temoignages (reels ou retirer)
4. Retirer Apple/Google Wallet du footer si pas implemente
5. Corriger la date footer ebook (2025 → 2026)

### Court terme (semaines 1-2)
1. Splitter `customer/card/[merchantId]/page.tsx` (2327 lignes)
2. Splitter `scan/[code]/page.tsx` (1406 lignes)
3. Remplacer `getSession()` par `getUser()` dans pages admin
4. Ajouter structured data SEO

### Moyen terme (mois 1-2)
1. Ajouter monitoring erreurs (Sentry)
2. Obtenir de vrais temoignages clients
3. Dynamic import Framer Motion pour composants below-fold
4. A/B test titres hero

---

*Genere le 8 fevrier 2026*
