# Plan marketing Qarte — avril 2026

> Plan opérationnel structuré via les skills marketing (product-marketing-context, customer-research, competitor-alternatives, pricing-strategy, marketing-ideas, launch-strategy). Dernière MAJ : 2026-04-18.

---

## 1. Positionnement

**One-liner** : La façon la plus simple pour un salon de remplir son agenda et fidéliser ses clientes — **sans commission, SMS inclus**.

### ICP (priorisation)

- **P1** : Instituts / ongleries / salons 1-3 employés, FR, actuellement DMs Insta ou Booksy, CA 5-30k€/mois
- **P2** : Coiffeurs / barbiers 1-2 employés FR/BE, actuellement Planity ou sans outil
- **P3** : Spas / esthéticiennes CH, actuellement Book in Beautiful

### Jobs to be done

1. Arrêter de perdre du temps en DMs Insta pour fixer des RDV
2. Arrêter de payer 15-30% de commission à Booksy/Treatwell
3. Faire revenir les clientes régulièrement (fidélité)

### Différenciateurs (ordre d'importance)

1. **0% commission acompte** (lien Revolut/PayPal/Stripe propre)
2. **SMS inclus** (100/mois + packs, vs Booksy à la conso)
3. **Fidélité auto à chaque resa** (interconnexion 3 piliers)
4. **Vitrine SEO indexée**

### Anti-ICP

Gros salons 5+ employés avec caisse intégrée (Zenchef, Planity Pro), chains, multi-sites.

---

## 2. VOC — acquis vs gaps

**Acquis** : douleurs DMs Insta chaotiques, commissions cachées Booksy/Planity, suppléments Book in Beautiful, friction install PWA iOS, besoin intuitivité.

**Gaps — 3 actions customer-research** :

1. **5-10 entretiens churned merchants** — pourquoi ils ne s'abonnent pas après trial
2. **Review mining Booksy** sur Google Play/App Store (4★) — keywords à capter
3. **SparkToro** sur "coiffeur indépendant FR" — comptes Insta/podcasts où ils traînent

**Délivrable** : quote bank FR par thème (acquisition / retention / pricing).

---

## 3. Plan concurrents

**Déjà fait** : 3 pages `/compare/planity`, `/compare/booksy`, `/compare/book-in-beautiful`.

**À ajouter (P1)** :

- `/alternatives/planity` (singular — "switch from")
- `/alternatives/booksy`
- `/alternatives/planity-alternatives` (plural — TOFU research)
- **Battle card interne** (sales enablement)

Keyword research via GSC avant création.

---

## 4. Pricing — recommandations

**État** : 24€/mois ou 240€/an (17% discount annuel). Trial 7j. Passé de 19€→24€ en avril 2026.

**Actions (par prio)** :

1. **Van Westendorp** via typeform aux trial expirés — valider que 24€ est dans la zone optimale (100 réponses, 2j)
2. **Tier "Pro+"** ~39€/mois : 250 SMS inclus + multi-utilisateurs + support prioritaire. Anchoring decoy pour rendre 24€ attractif
3. **Pas de plan gratuit** — trial 7j + bonus churn survey suffisent

---

## 5. Leviers marketing — top 12 priorisés

### Acquisition P1 (quick wins, 0-3 mois)

1. **Programmatic SEO "salon [ville]"** (#4) — 200-500 pages générées depuis INSEE + annuaires. ROI 3-6 mois mais scalable.
2. **Référral merchant → merchant** (existe, `referral_code` 10€/10€) — promouvoir davantage : email J+30, landing `/parrain`, recruter 5-10 micro-ambassadeurs actifs
3. **TikTok/Insta ads ciblées** — angle "POV: encore 20 DMs ce matin". Test 500€/semaine × 2 semaines
4. **Cold email prospects Planity** — scrape annuaires publics, séquence 3 emails, 200/jour, ~1-3% reply

### Acquisition P2 (moat, 3-6 mois)

5. **Blog SEO élargi** (3 → 12 articles). TOFU ouverture institut / gains onglerie ; MOFU vs ; BOFU migration Planity→Qarte
6. **Free tool** : calc "combien te coûte Booksy" (commission × CA), capture email → nurture. Générateur bio Insta.
7. **YouTube/Insta Reels founder-led** : case study Elodie +45%, 1 short/semaine, repurpose cross-plateforme

### Retention P1

8. **Exploitation active churn survey** (`/admin/churn-surveys`) — review hebdo + itération produit sur top 3 blockers tous les 2 mois
9. **Weekly digest merchant** — email lundi avec stats perso (nouvelles clientes, revenue, avis, RDV semaine)

### Launch ongoing

10. **Changelog public `/changelog`** — chaque feature = blog + email. Signal produit vivant.
11. **Product Hunt relaunch** — angle "PWA Pro merchant" ou "Avis Google auto". Prep 4 semaines.
12. **Communauté FB privée "Qarte Pros"** — 50-200 merchants, entraide + feedback + social proof

---

## 6. Canaux (ORB)

**Owned** (à bâtir) :
- Email list merchants (existe, 30+ templates) — **segmenter par ICP**
- Blog (3 articles, viser 12 fin 2026)
- Communauté FB privée (à créer)
- In-product : OnboardingChecklist, MilestoneModal

**Rented** (prio) :
- TikTok (P1, audience présente)
- Instagram (founder + testimonials)
- YouTube (long + Shorts)

**Borrowed** :
- Micro-influenceurs niche coiffure/onglerie (programme ambassadeur 20%)
- Podcasts entrepreneuriat beauté FR (Listen Notes)
- Annuaires pro (Beauty Forum)

---

## 7. Roadmap 90 jours

| Semaine | Livrable |
|---------|----------|
| S1-2 | 5 entretiens churned + VOC Booksy reviews + SparkToro |
| S3-4 | 4 pages `/alternatives/*` + battle card interne |
| S5-6 | Van Westendorp survey + spec tier Pro+ |
| S7-8 | Programmatic SEO v1 (50 villes test) |
| S9-10 | Cold email Planity scrape + séquence 3 emails |
| S11-12 | TikTok ads test 2 semaines + landing variant |
| Ongoing | 1 short/semaine founder + 1 article blog/mois + communauté |

---

## 8. Métriques

- **Acquisition** : signups/semaine par source (`signup_source`), CAC par canal
- **Activation** : % onboarding complet (checklist 15 étapes), temps premier scan
- **Conversion** : trial → paid (`/admin/tracking`)
- **Retention** : MRR, churn mensuel, NPS (à setup)
- **Referral** : # parrainages effectifs / merchant abonné

---

## 9. Quick wins identifiés (< 1 jour chacun)

Voir section dédiée dans conversation 2026-04-18 — priorité à ceux qui réutilisent l'infra existante.
