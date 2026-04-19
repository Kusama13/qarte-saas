# Plan refonte emails + SMS trial — segmentation onboarding (v2)

> Dernière MAJ : 2026-04-19. Mode plan, pas d'implémentation.
> Skills appliqués : `onboarding-cro`, `email-sequence`, `copywriting`, `marketing-psychology`, `paywall-upgrade-cro`, `churn-prevention`, `customer-research`.
>
> **Changements v2** : intégration des 2 tiers (Fidélité 19€ vs Tout-en-un 24€), passage de 2 à 3 SMS (ajout célébration + survey, drop J+2 grace), copy SMS sans firstName (le merchant n'a que `shop_name`), copy SMS C en pratfall + reciprocity.

---

## 1. Cadre stratégique

### Le trial est mono-tier (full access), le tier se choisit au checkout

Pendant le **trial 7j + grace 3j**, le merchant a accès à toutes les features (équivalent Tout-en-un). Il choisit son tier au moment du **checkout** Stripe (Fidélité 19€/190€ ou Tout-en-un 24€/240€). Conséquence directe sur la segmentation :

| Phase | Variable centrale | Sert à |
|---|---|---|
| **Pre-checkout** (trial + grace) | `activation_score` (S0-S3) | Pousser au bon pilier, calibrer loss aversion |
| **Post-checkout** (active) | `plan_tier` (`fidelity` \| `all_in`) | Différencier le ton + features pushées + paywall upgrade |

Le `recommendTierForMerchant` ([trial-tier-reco.ts](../src/lib/trial-tier-reco.ts)) est déjà branché dans le `TrialEndingEmail` ([morning/route.ts:100](../src/app/api/cron/morning/route.ts#L100)) — on s'appuie dessus pour personnaliser les CTA et les SMS A.

### Aha moments à activer (pré-checkout)

Qarte n'a pas 1 aha mais **3 indépendants**. Chacun valide un pilier ; tous mènent à la même conviction *"ça marche, je m'abonne"* :

| Pilier | Aha (signal DB) | Pain résolu |
|---|---|---|
| Fidélité | `visits.count >= 1` | "Mes clientes ne reviennent pas" |
| Planning + résa | `slots WHERE booked_online = true` count >= 1 | "Je perds du temps avec les DMs Insta" |
| Vitrine SEO | `bio + shop_address + photos.count >= 1` | "Je suis invisible sur Google" |

**Score d'activation = nombre de piliers atteints (0 à 3).** Variable centrale pré-checkout.

### Principes structurants

1. **One email, one job** (skill email-sequence) — un email = un segment = une CTA précise
2. **Value before ask** (skill paywall-upgrade-cro) — demander l'abo seulement après aha (≥1 pilier)
3. **Goal-gradient effect** (skill marketing-psychology) — toujours montrer "plus que X" pour activer
4. **Endowment effect** — rappeler ce qu'ils ont DÉJÀ (clientes, RDV, données)
5. **Loss aversion** — cadrer la fin de trial comme une perte concrète
6. **Pratfall effect** (skill marketing-psychology) — admettre une faille augmente la confiance, clé pour le win-back
7. **Reciprocity** — donner d'abord (compte rouvert, promo réelle) déclenche l'envie de répondre

---

## 2. Segmentation pré-checkout

### Axe 1 — État d'activation

| Code | Définition | Pain dominant |
|---|---|---|
| **INC** | Signup phase 1 sans merchant créé | Hésitation engagement |
| **S0** | Merchant créé, 0/3 piliers | Procrastination, doute |
| **S1** | 1/3 piliers (premier aha) | Confiance fragile, capitaliser |
| **S2** | 2/3 piliers | Investi, finition |
| **S3** | 3/3 piliers (fully activated) | Prêt à payer, poussée finale |

### Axe 2 — Phase calendaire trial (7j + grace 3j)

| Phase | Période | Ton |
|---|---|---|
| **P1 — Découverte** | J0-J2 | Encourageant, low friction |
| **P2 — Mi-trial** | J3-J4 | Pédagogique, push pilier suivant |
| **P3 — Alerte** | J5-J6 | Urgence douce, recap valeur |
| **P4 — Décision** | J7-J10 | Loss aversion, offre claire (avec reco tier) |

### Architecture finale

**4 emails core (calendaires)** + **5 emails événementiels (triggers)** = **9 emails**, vs ~13 actuels.
**3 SMS max** (célébration + loss aversion + win-back).

---

## 3. Emails — Plan détaillé pré-checkout

### A. Core sequence calendaire

#### Email 1 — Welcome (J0, instant signup)
- **Trigger** : INSERT merchant
- **Variantes** : aucune
- **Subject** : *"Bienvenue {shop}, voici par où commencer"* (50 chars)
- **Preview** : *"3 minutes pour ton 1er scan, 5 pour ta vitrine. Choisis ton point de départ."*
- **Body** :
  - Hook : *"Tu as 7 jours pour tester Qarte sur ton commerce. La bonne nouvelle : pas besoin de tout faire d'un coup."*
  - Value : 3 cartes "Fidélité / Planning / Vitrine"
  - CTA pre-selected : `Commencer par la fidélité (3 min)`
- **Psycho** : *Default effect* + *Paradox of choice* contré

#### Email 2 — TrialEnding (J5, 4 variantes par state, **avec reco tier**)
- **Trigger** : `trialEndsAt - 2 days` ET `subscription_status = trial`
- **Reco tier** : `recommendTierForMerchant(merchant)` → bloc 2-cartes (Fidélité / Tout-en-un) si reco existe, sinon bloc legacy unique

| State | Subject | Body angle | Tier recommandé visuel |
|---|---|---|---|
| **S0** | *"Plus que 2 jours — tu peux tester en 10 min"* | *Inversion* : "Ce que tu pourrais regretter de ne pas avoir testé" + case study | Pas de reco (pas de signal) |
| **S1 fidélité only** | *"Tu as ton 1er client fidélisé chez {shop}. Plus que 2j pour tester la résa en ligne"* | *Goal-gradient* : "Tu es à 1/3" | Reco **Fidélité 19€** mise en avant |
| **S1 résa** | *"{X} résas en ligne déjà chez {shop}. Plus que 2j pour activer la fidélité"* | Idem | Reco **Tout-en-un 24€** mise en avant |
| **S2** | *"Tu as déjà {X clientes/résas}. Plus que 2 jours pour finaliser"* | *Endowment* : show stats + 1 dernière étape | Reco selon score (résa active → Tout-en-un) |
| **S3** | *"{X} clientes, {Y} résas, {Z} avis Google sur Qarte"* | *Loss aversion pure* : "Sans abo dans 48h, tout disparaît" | Reco **Tout-en-un 24€** systématique |

#### Email 3 — TrialExpired (J8, 2 variantes)
- **Trigger** : `trial_ends_at < now` ET `subscription_status = trial` ET J+1 après

| State | Angle |
|---|---|
| **S0/S1** | "T'as pas eu le temps ? On rallonge si tu nous dis pourquoi" → push churn survey |
| **S2/S3** | *Loss aversion forte* : "Tes données sont en pause 3 jours" + CTA `Réactiver` |

#### Email 4 — GraceEnding (J10, dernière chance)
- **Trigger** : 12h avant suppression
- **Subject** : *"Demain on supprime ton compte {shop}"*
- **Body** : 3 lignes max, CTA unique
- **Psycho** : *Hyperbolic discounting* — bénéfice immédiat ("réactive en 1 clic")

### B. Triggers événementiels

#### Email 5 — FirstScanCelebration (S0→S1 fidélité)
- **Trigger** : 1ère `visit.confirmed` créée
- **Subject** : *"1ère cliente fidélisée chez {shop}"*
- **Body** : Stats. Push pilier 2 : "Active ton planning pour qu'elle réserve elle-même"
- **CTA** : `Activer mon planning` → `/dashboard/planning`
- **Psycho** : *Peak-end rule* + *IKEA effect*

#### Email 6 — FirstBookingCelebration (S0→S1 planning)
- **Trigger** : 1ère `slot WHERE booked_online = true`
- **Subject** : *"1ère résa en ligne chez {shop} le {date}"*
- **Body** : Stats résa. Push pilier 1 : "Affiche un QR à l'accueil pour qu'elle revienne"
- **CTA** : `Télécharger mon QR code`
- **Psycho** : *Peak-end* + *Commitment & consistency*

#### Email 7 — VitrineLive (S→S+1 vitrine)
- **Trigger** : `bio + shop_address + photos.count >= 1` passe à true
- **Subject** : *"Ta vitrine {shop} est en ligne. Voici comment la diffuser"*
- **Body** : Lien vitrine + 3 endroits (bio Insta, GMB, signature email)
- **CTA** : `Voir ma vitrine` puis `Copier mon lien`
- **Psycho** : *IKEA effect* maximisé

#### Email 8 — ActivationStalled (S0 à J+3)
- **Trigger** : J+3 ET state = S0
- **Subject** : *"Bloqué quelque part ? On te montre par où commencer"*
- **Body** : 3 mini case studies en 1 ligne. CTA = path le plus rapide selon `shop_type`
- **CTA** : `Commencer maintenant (3 min)`
- **Psycho** : *Availability heuristic* + *Activation energy* réduite

#### Email 9 — PartialActivationPush (S1 à J+4-5)
- **Trigger** : J+4 ET state = S1
- **Subject** : *"{shop}, tu as {pilier_actif}. Manque {pilier_suivant} pour tout connecter"*
- **Body** : Argumentation interconnexion 3 piliers
- **CTA** : `Activer {pilier suivant}`
- **Psycho** : *Goal-gradient* + *Zeigarnik effect* (open loop)

---

## 4. Emails post-checkout — segmentation par tier

### Principe
Une fois le merchant abonné (`subscription_status = 'active'`), `plan_tier` devient la dimension principale. Les emails existants doivent être audités pour différencier ton et CTA.

### Audit des emails post-checkout vs tier

| Email | Tier Fidélité | Tier Tout-en-un | Action |
|---|---|---|---|
| **SubscriptionConfirmedEmail** | Welcome focus retention | Welcome focus 3 piliers | Brancher variante par tier |
| **WeeklyDigestEmail** | Stats fidélité + cagnotte | Stats fidélité + résa + vitrine | Conditionner sections |
| **Tier2UpsellEmail** (existe) | N/A (pas de tier 2 fidélité) | Tier 2 cagnotte (existant, garder) | Inchangé |
| **AnnouncementMaPageEmail** | Activable (vitrine dispo en Fidélité ?) | Standard | À clarifier (voir Q en suspens) |
| **PlanningReminderEmail** | **Skip** (Planning gated) | Garde | Conditionner par tier |
| **VitrineReminderEmail** | À clarifier | Garde | Idem |
| **InactiveMerchantDay7/14/30** | Ton fidélité only | Ton 3 piliers | Variantes par tier |
| **ProductUpdateEmail** | Filtre features Fidélité | Tout | Filtrer par tier |

### Nouveau : `UpgradeAllInEmail` (paywall upgrade Fidélité → Tout-en-un)

- **Trigger** : Merchant Fidélité avec signal de besoin Tout-en-un
  - Ex 1 : merchant ouvre `/dashboard/planning` ≥3 fois en 7j (signal résa-curieux)
  - Ex 2 : tentative d'envoi campagne SMS marketing → bloquée (gated tier) → email trigger
  - Ex 3 : 3+ clientes ont demandé "vous prenez les RDV en ligne ?" via formulaire (signal manuel à créer)
- **Subject** : *"{shop}, tu touches aux limites de Fidélité — passe à Tout-en-un"*
- **Body** : Diff features (résa + marketing SMS), prorata Stripe explicité ("change-tier flow déjà en place")
- **CTA** : `Passer à Tout-en-un (24€/mois, prorata appliqué)`
- **Psycho** : *Endowment effect* (tu as déjà investi) + *Loss aversion soft* (sans upgrade tu rates les RDVs)

---

## 5. SMS — 3 SMS, segmentation forte

### Principe directeur

**SMS ≠ duplicat email.** SMS = canal réservé aux moments à fort signal émotionnel ou perte tangible.

→ 3 moments :
- **Célébration** d'un aha (peak-end rule, ancrage positif)
- **Pre-loss** J-1 trial (loss aversion calibrée)
- **Win-back honnête** post-trial (pratfall + reciprocity)

### Règles de gating

| Règle | Application |
|---|---|
| Pas d'opt-out (`marketing_sms_opted_out = false`) | Tous |
| Pas de `email_unsubscribed_at` | Tous (proxy bonne conduite) |
| Plage légale FR 10h-20h lun-sam, hors fériés | Tous |
| Pas de SMS si `no_contact = true` | Tous |
| `phone_number` valide (E.164) | Tous |

### Pas de lien dans les SMS

Décision : SMS sans URL (filtres anti-spam, économie chars, pas de domaine court à gérer).
Le merchant ouvre Qarte de lui-même (PWA si installée, sinon `getqarte.com`).

### Les 3 slots stratégiques

| # | Trigger | Audience | Phase | Pourquoi |
|---|---|---|---|---|
| **SMS 1 — Célébration** | 1er aha event (visit OU booking_online OU vitrine pub) | Toute, premier event seulement | P1-P2 | Peak-end rule, push fierté du moment |
| **SMS 2 — Pre-loss** | J-1 fin trial **ET** `activation_score ≥ 1` | Activé, ≥S1 | P3 | Dernière fenêtre conversion |
| **SMS 3 — Churn / survey** | J+5 fully expired **ET** `churn_survey_seen_at IS NULL` | Tous churners (S0-S3) | P4+ | Win-back + insight, carrot honnête |

**Drop SMS J+2 grace** (présent en v1) : redondant avec SMS 2 J-1 + Email 3 J+1, perçu comme harcèlement.

---

### Copy SMS 1 — Célébration (variante par pilier touché en 1er)

| Pilier | Trigger | Copy (FR, ~120 chars) |
|---|---|---|
| Fidélité (1re visite) | INSERT visit | *"Bravo, 1re cliente fidélisée chez {shop}. Qarte fait le taf. Ouvre l'app pour voir."* |
| Planning (1re résa en ligne) | INSERT slot WHERE booked_online | *"Bravo, 1re résa en ligne chez {shop}. Le planning bosse pour toi. Ouvre Qarte."* |
| Vitrine (publication) | UPDATE merchant si bio+address+photo passent à OK | *"Ta vitrine {shop} est en ligne sur Google. Ouvre Qarte pour ton lien."* |

**Trigger logic** : envoyer **1 seul SMS de célébration** (le premier des 3 atteint). Marker `merchant.celebration_sms_sent_at` pour éviter les doublons.

---

### Copy SMS 2 — Pre-loss J-1 (tier-aware via `recommendTierForMerchant`, ≥S1, ~150 chars)

| Reco tier | Copy |
|---|---|
| **Fidélité** | *"Plus que 24h chez Qarte. {shop} a déjà {X} clientes fidélisées. Garde ta carte fidélité pour 19€/mois — ouvre Qarte."* |
| **Tout-en-un** | *"Plus que 24h chez Qarte. {shop} a {X} clientes et {Y} résas. Garde tout (résa + fidélité) pour 24€/mois — ouvre Qarte."* |
| **Aucune reco** (S1 fragile, signal mixte) | *"Plus que 24h chez Qarte. {shop} a {X} clientes fidélisées. Garde ton compte pour 19€/mois — ouvre Qarte."* |

---

### Copy SMS 3 — Churn / survey (variant A retenu — pratfall + reciprocity, ~156 chars)

*"Qarte: on a raté quelque chose avec {shop}. 2 min pour nous dire quoi? On rouvre ton compte 7j, et -25% x3 mois si c'est le prix. Lien dans l'email envoyé."*

**Pourquoi ce variant** (validé via skills `churn-prevention` + `copywriting` + `marketing-psychology`) :
1. *Pratfall effect* : "on a raté quelque chose" — admettre une faille augmente la confiance, clé pour un merchant qui a déjà dit non
2. *Reciprocity* : on donne d'abord (7j rouverts + -25%×3) avant de demander
3. *Specificity* : "2 min", "7j", "-25% x3 mois" — pas de flou
4. *Honest reward* : "compte rouvert" et "code promo si prix" sont **réellement** ce qu'offre le système ([churn-survey-config.ts:80-90](../src/lib/churn-survey-config.ts#L80))
5. *No guilt-trip* : pas de "tu nous quittes ?" — focus sur la compréhension
6. *Sender alpha "Qarte"* en début pour ancrer la marque (pas de URL = pas de filtre spam)

---

### Subject email survey associé (`ChurnSurveyReminderEmail`)

À updater dans `src/emails/translations/{fr,en}.ts` (namespace `churnSurveyReminder`) :

1. **"On rouvre ton compte {shop} contre 2 min de feedback"** ← reco principale (honnête + reward concret)
2. *"Pourquoi {shop} n'a pas continué ? On t'écoute (compte rouvert)"*
3. *"2 min de ton temps = ton compte {shop} rouvert"*

---

### Ce qu'on n'envoie JAMAIS en SMS

- ❌ S0 pour SMS 2 pre-loss (rien à perdre, contre-productif)
- ❌ Avant J-1 pour pre-loss (trop tôt = pression perçue)
- ❌ Après J+5 pour SMS 3 si déjà rempli survey
- ❌ Aux merchants `marketing_sms_opted_out = true` ou `email_unsubscribed_at`
- ❌ Hors plage légale FR 10h-20h lun-sam
- ❌ Doublon célébration : 1 seul SMS 1, jamais plus

### Compliance & opt-out

- Sender alpha "Qarte" via OVH (pas de mention STOP requise pour transactionnel ; pour marketing on s'appuie sur opt-out par toggle)
- Nouvelle colonne `merchants.marketing_sms_opted_out BOOLEAN DEFAULT false`
- Toggle dans `/dashboard/settings` (ON par défaut)
- Nouvelle colonne `merchants.celebration_sms_sent_at TIMESTAMPTZ` (dedup SMS 1)

### Coût Qarte (estimation 500 trials/mois)

- SMS 1 célébration : ~60% trials atteignent 1 aha → **300 SMS/mois**
- SMS 2 pre-loss : ~70% trials ≥S1 → **350 SMS/mois**
- SMS 3 churn : ~80% trials non convertis → **400 SMS/mois**
- **Total : ~1050 SMS/mois × 0,075€ = 79€/mois**
- ROI attendu : célébration → +2 pts retention activation, pre-loss → +2-4 pts conversion, churn → +5 win-backs/mois × 720€ LTV = **+3600€/mois**. **ROI ~45x**

---

## 6. Suivi admin — Vue unifiée par merchant

### Problème actuel

- `/admin/sms` : SMS clients seulement
- `/admin/merchants/[id]` : section "Emails envoyés"
- ❌ Aucune vue unifiée "qu'est-ce que Qarte a envoyé à CE merchant pendant son trial"

### Nouvelle section admin

**Dans `/admin/merchants/[id]` : "Communications Qarte → Merchant"**

Timeline chronologique unifiée : email + SMS + push merchant.

```
COMMUNICATIONS QARTE → MERCHANT

📧 J+0  09:12  Welcome email                  ✓ open
📱 J+1  10:45  Push "Configure ton programme" ✓ click
📧 J+2  09:00  ActivationStalled (S0)         ✓ open
💬 J+2  14:30  SMS 1 - Célébration fidélité   ✓ sent
📧 J+5  09:00  TrialEnding S1 + reco Fidélité ✓ open
💬 J+6  14:30  SMS 2 - Pre-loss (Fidélité)    ✓ sent
📧 J+7  09:00  TrialExpired S1                ⚠ no
📧 J+8  09:00  ChurnSurveyReminder            ✓ open
💬 J+9  10:15  SMS 3 - Churn survey           ✓ sent

Filtres : [Tout] [Email] [SMS] [Push]
```

### DB requise

**Pour les SMS marketing** (n'existe pas) :
```sql
CREATE TABLE merchant_marketing_sms_logs (
  id UUID PK,
  merchant_id UUID FK → merchants ON DELETE CASCADE,
  sms_type TEXT CHECK ('celebration_fidelity', 'celebration_planning', 'celebration_vitrine', 'trial_pre_loss', 'churn_survey'),
  state_snapshot INT,                    -- activation_score au moment d'envoi
  tier_recommended TEXT,                 -- 'fidelity' | 'all_in' | NULL (SMS 2 only)
  body TEXT,
  ovh_job_id TEXT,
  status TEXT DEFAULT 'sent',
  cost_euro NUMERIC(6,4),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_marketing_sms_merchant ON merchant_marketing_sms_logs(merchant_id, sent_at DESC);
```

**Vue unifiée** : pas de nouvelle table, agréger 3 sources dans l'API admin :
- `pending_email_tracking` (emails)
- `merchant_marketing_sms_logs` (SMS marketing — nouveau)
- `merchant_push_logs` (push merchant, mig 085+104)

### Nouvelle route API

`GET /api/admin/merchants/[id]/communications` :
- Auth super_admin
- Timeline mergée chronologique
- Limit 50, pagination si besoin
- Format : `{ ts, channel: 'email'|'sms'|'push', type, status, content_summary }`

---

## 7. Comparatif vs existant

| Email actuel | Décision | Raison |
|---|---|---|
| WelcomeEmail | **Garde + simplifie** | Bon timing, simplifier choix |
| ProgramReminder J+1 | **Supprime** | Remplacé par Email 8 contextuel |
| QRCode | **Garde, déclenche sur Email 5** | Mieux placé après aha |
| FirstClientScript J+2 | **Fusionne dans Email 8** | Duplique le pain |
| SocialProof J+3 | **Supprime** | Cas study dans Email 8 |
| VitrineReminder J+3 | **Supprime** (replace par Email 7 trigger) | Push contextuel |
| PlanningReminder J+4 | **Supprime** (replace par Email 9) | Idem |
| TrialEnding J-2 | **Garde + 4 variantes + reco tier** | Loss aversion segmentée |
| TrialExpired J+1 | **Garde + 2 variantes** | Distingue activés vs pas |
| GracePeriodSetup | **Devient Email 4** | Plus court, plus urgent |
| ChurnSurveyReminder J+3 | **Garde + nouveau subject** | Subject pratfall, copy v2 |
| PostSurveyFollowUp | **Garde tel quel** | Déjà personnalisé |
| Tier2UpsellEmail | **Garde tel quel** | Cagnotte tier 2, indep du plan_tier |

**Bilan** : 13 emails actuels → 9 emails core + 1 nouveau `UpgradeAllInEmail` + 3 SMS.

---

## 8. Mesure du succès

### Métrique nord
**Trial → paid conversion rate**, segmenté par état d'arrivée ET tier choisi :
- S0 → paid (baseline ~5-10%)
- S1 → paid (cible : 20-30%)
- S2 → paid (cible : 40-50%)
- S3 → paid (cible : 60-70%)

Si S3 conversion < 50%, pricing à revoir, pas le funnel.

### Métriques tier-aware (post-checkout)
- % Fidélité → upgrade Tout-en-un (cible : 15-25% à 6 mois)
- % Tout-en-un → downgrade Fidélité (cible : <10% à 12 mois — signal mauvais fit)
- LTV moyen par tier
- Churn rate par tier

### Métriques secondaires
- Open rate par email × state
- CTR par CTA
- Time to first aha
- % S0 → S1 dans les 3 jours
- Reconnexion post-SMS dans les 24h (proxy CTR sans lien, via `last_seen_at`)
- Taux opt-out SMS marchand
- **% survey complété post-SMS 3** (cible : +30% vs baseline email seul)

---

## 9. Récap principes psycho appliqués

| Touchpoint | Principe(s) |
|---|---|
| Email 1 Welcome | *Default effect* + *Paradox of choice* contré |
| Email 2 TrialEnding (4 variantes + reco tier) | *Loss aversion* + *Endowment* + *Mental accounting* + *Default effect* (tier reco par défaut) |
| Email 5/6/7 célébration | *Peak-end rule* + *IKEA effect* + *Commitment & consistency* |
| Email 8 ActivationStalled | *Availability heuristic* + *Activation energy* réduite |
| Email 9 PartialPush | *Goal-gradient* + *Zeigarnik* (open loop) |
| Email UpgradeAllIn | *Endowment* + *Loss aversion soft* |
| **SMS 1 Célébration** | *Peak-end rule* + *IKEA effect* (push fierté hors-app) |
| **SMS 2 Pre-loss** | *Loss aversion* + *Endowment* + *Hyperbolic discounting* (24h) + *Default effect* (tier reco) |
| **SMS 3 Churn / survey** | *Pratfall effect* + *Reciprocity* + *Specificity* (vs flou) |

---

## 10. Roadmap d'exécution (v2)

| Phase | Livrable | Effort | Dépendance |
|---|---|---|---|
| **1** | Colonne `merchants.activation_score` + trigger DB + backfill + colonne `celebration_sms_sent_at` + colonne `marketing_sms_opted_out` | 4h | — |
| **2** | Refonte cron `email-onboarding` (state × phase) | 1j | Phase 1 |
| **3** | 4 variantes TrialEnding (Email 2) + branchement `recommendTierForMerchant` (déjà existant, adapter UI 2-cards) | 1j | Phase 1 |
| **4** | Triggers événementiels Email 5/6/7 dans webhooks API | 1j | Phase 1 |
| **5** | Table `merchant_marketing_sms_logs` + helper `sendMerchantMarketingSms()` + cron `sms-trial-marketing` (horaire) avec 3 sections (célébration / pre-loss / churn) | 1,5j | Phase 1 |
| **6** | Toggle settings `marketing_sms_opted_out` + page admin | 0,5j | Phase 5 |
| **7** | Vue unifiée admin `/admin/merchants/[id]` Communications | 1j | Phase 5 |
| **8** | Suppression emails redondants + cleanup tracking codes | 2h | Phases 2-4 |
| **9** | Audit emails post-checkout pour tier (variantes Fidélité vs Tout-en-un) | 1j | — (indépendant) |
| **10** | Nouveau email `UpgradeAllInEmail` + triggers signaux (3 cas listés §4) | 1j | Phase 9 |

**Total dev** : ~8 jours. Mesure A/B 4-6 semaines.

---

## 11. Décisions tranchées (validées 2026-04-19)

1. **Vitrine en plan Fidélité** : `/p/[slug]` accessible aux 2 tiers (vitrine SEO = bio + photos + adresse + services). Seul le **bouton "Réserver en ligne"** est gated par `bookingOnline` (Tout-en-un only). → Email 7 VitrineLive **garde 2 micro-variantes texte** : Fidélité = *"tes infos + photos sont indexables Google"*, Tout-en-un = *"tes clientes peuvent réserver en ligne 24/7"*.

2. **Dedup célébration SMS** : **dedup global** (1 SMS max sur toute la vie merchant). Marker `celebration_sms_sent_at` posé au 1er aha event atteint (peu importe le pilier). Évite le spam au merchant qui active 3 piliers en 2 jours. Un SMS rare = un SMS impactant.

3. **Signaux upgrade Fidélité → Tout-en-un (Email UpgradeAllIn)** : v1 démarre **sans Signal 1** (page views dashboard). On implémente seulement :
   - Signal 2 — tentative envoi campagne SMS marketing bloquée (gated tier)
   - Signal 3 — demande client manuelle / form input
   → Signal 1 (3 ouvertures `/dashboard/planning` en 7j) à ajouter en v2 si conversion upgrade < 15% à 6 mois.

4. **Frequency cap global** : **cap soft 1+1+1 / 24h** (max 1 email + 1 SMS + 1 push / 24h). Priorité en cas de conflit : **SMS > email > push**. Implémentation : helper `canSendCommunication(merchantId, channel)` qui check les 3 sources (`pending_email_tracking`, `merchant_marketing_sms_logs`, `merchant_push_logs`) sur fenêtre 24h glissante.

## 12. Questions reportées post-launch

1. **A/B test SMS 3 variant A vs C** — Tester pratfall (A retenu) vs humble simple (C) sur 200 churners chacun pour valider la reco. À planifier après 4 semaines de data v1.
