# Plan refonte emails + SMS trial — segmentation onboarding

> Dernière MAJ : 2026-04-19. Mode plan, pas d'implémentation.
> Skills appliqués : `onboarding-cro`, `email-sequence`, `copywriting`, `marketing-psychology`, `paywall-upgrade-cro`, `churn-prevention`.

---

## 1. Cadre stratégique

### Aha moments à activer

Qarte n'a pas 1 aha mais **3 indépendants**. Chacun valide un pilier ; tous mènent à la même conviction *"ça marche, je m'abonne"* :

| Pilier | Aha (signal DB) | Pain résolu |
|---|---|---|
| 🎁 Fidélité | `visits.count >= 1` | "Mes clientes ne reviennent pas" |
| 📅 Planning + résa | `slots WHERE booked_online = true` count >= 1 | "Je perds du temps avec les DMs Insta" |
| 🌐 Vitrine SEO | `bio + shop_address + photos.count >= 1` | "Je suis invisible sur Google" |

**Score d'activation = nombre de piliers atteints (0 à 3).** Variable centrale de toute la segmentation.

### Principes structurants

1. **One email, one job** (skill email-sequence) — un email = un segment = une CTA précise
2. **Value before ask** (skill paywall-upgrade-cro) — demander l'abo seulement après aha (≥1 pilier)
3. **Goal-gradient effect** (skill marketing-psychology) — toujours montrer "plus que X" pour activer
4. **Endowment effect** — rappeler ce qu'ils ont DÉJÀ (clientes, RDV, données)
5. **Loss aversion** — cadrer la fin de trial comme une perte concrète
6. **Relevance Over Volume** (skill email-sequence) — moins d'emails, mieux ciblés

---

## 2. Segmentation

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
| **P4 — Décision** | J7-J10 | Loss aversion, offre claire |

### Architecture finale

**4 emails core (calendaires)** + **5 emails événementiels (triggers)** = **9 emails**, vs ~13 actuels.
**2 SMS max** (loss aversion uniquement, ≥ S1).

---

## 3. Emails — Plan détaillé

### A. Core sequence calendaire

#### Email 1 — Welcome (J0, instant signup)
- **Trigger** : INSERT merchant
- **Variantes** : aucune
- **Subject** : *"Bienvenue {firstName}, voici par où commencer chez {shop}"* (60 chars)
- **Preview** : *"3 minutes pour ton 1er scan, 5 pour ta vitrine. Choisis ton point de départ."*
- **Body** :
  - Hook : *"Tu as 7 jours pour tester Qarte sur ton commerce. La bonne nouvelle : pas besoin de tout faire d'un coup."*
  - Value : 3 cartes "Fidélité / Planning / Vitrine"
  - CTA pre-selected : `Commencer par la fidélité (3 min)`
- **Psycho** : *Default effect* + *Paradox of choice* contré

#### Email 2 — TrialEnding (J5, 4 variantes par state)
- **Trigger** : `trialEndsAt - 2 days` ET `subscription_status = trial`

| State | Subject | Body angle |
|---|---|---|
| **S0** | *"Plus que 2 jours — tu peux tester en 10 min"* | *Inversion* : "Ce que tu pourrais regretter de ne pas avoir testé" + case study Farida |
| **S1** | *"Tu as ton 1er {pilier_atteint}. Plus que 2 jours pour tester {pilier_2}"* | *Goal-gradient* : "Tu es à 1/3" |
| **S2** | *"Tu as déjà {X clientes/résas}. Plus que 2 jours pour finaliser"* | *Endowment* : show stats + 1 dernière étape |
| **S3** | *"{X} clientes, {Y} résas, {Z} avis Google sur Qarte"* | *Loss aversion pure* : "Sans abo dans 48h, tout disparaît" |

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
- **Subject** : *"🎉 1ère cliente fidélisée chez {shop}"* (40 chars)
- **Body** : Stats. Push pilier 2 : "Active ton planning pour qu'elle réserve elle-même"
- **CTA** : `Activer mon planning` → `/dashboard/planning`
- **Psycho** : *Peak-end rule* + *IKEA effect*

#### Email 6 — FirstBookingCelebration (S0→S1 planning)
- **Trigger** : 1ère `slot WHERE booked_online = true`
- **Subject** : *"🎉 1ère résa en ligne chez {shop} le {date}"*
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

## 4. SMS — 2 max, loss aversion calibrée

### Principe directeur

**SMS ≠ duplicat email.** SMS = canal réservé aux moments où la perte est **tangible et imminente**. Pas de SMS de célébration (vécu en live dans l'app).

→ Les 2 SMS sont des **leviers loss aversion** purs.

### Règle de gating critique

**Aucun SMS si `activation_score = 0`**. Pas de loss aversion possible sans rien à perdre. Pour S0, email seul.

### Pas de lien dans les SMS

Décision : SMS sans URL (évite filtres anti-spam, force action consciente, pas de domaine court à gérer, économie chars).
Le merchant ouvre Qarte de lui-même (PWA si installée, sinon `getqarte.com`).

### Les 2 slots stratégiques

| # | Trigger | Phase | Pourquoi |
|---|---|---|---|
| **SMS A — Pre-loss** | J-1 fin trial **ET** `activation_score ≥ 1` | P3 | Dernière fenêtre d'action avant la perte |
| **SMS B — Loss imminent** | J+2 grace period **ET** `activation_score ≥ 1` | P4 | Données disparaissent dans 24h |

### Copy SMS A — Pre-loss (J-1, variantes par state)

| State | Copy (FR) | Chars |
|---|---|---|
| **S1** | *"{firstName}, +24h d'essai Qarte. Tu as déjà {X} clientes fidélisées. Sans abonnement demain, leur carte disparaît. Garde-les pour 24€/mois — connecte-toi à Qarte."* | ~158 |
| **S2** | *"{firstName}, +24h. Tu as {X} clientes et {Y} résas sur {shop}. Tout part demain sans abonnement à 24€/mois. Ouvre Qarte pour continuer."* | ~140 |
| **S3** | *"{firstName}, +24h. {X} clientes, {Y} résas, vitrine indexée Google chez {shop}. 24€/mois (0,80€/jour) pour tout garder. Sinon tout part demain. Ouvre Qarte."* | ~160 |

### Copy SMS B — Loss imminent (J+2 grace, variante unique)

*"{firstName}, ton compte {shop} sera supprimé demain. Connecte-toi à Qarte avant 23h pour réactiver et récupérer tes données."* (~125 chars)

### Ce qu'on n'envoie JAMAIS en SMS

- ❌ S0 à n'importe quel moment (rien à perdre)
- ❌ Avant J-1 (trop tôt = pression perçue)
- ❌ Après J+2 grace (compte mort, harcèlement)
- ❌ Aux merchants `marketing_sms_opted_out = true` ou `email_unsubscribed_at`
- ❌ Hors plage légale FR 10h-20h lun-sam

### Compliance & opt-out

- Mention "STOP" en fin de body (cosmétique avec sender alpha OVH)
- Nouvelle colonne `merchants.marketing_sms_opted_out BOOLEAN DEFAULT false`
- Toggle dans `/dashboard/settings` (ON par défaut)

### Coût Qarte

- ~500 trials/mois × ~70% éligibles (≥S1) × 2 SMS = **700 SMS/mois**
- × 0,075€ = **52,50€/mois**
- ROI attendu : +2 à +4 pts conversion. Sur 350 merchants × +3 pts = +10 abos × 24€ × 6 mois LTV = **+1440€/mois**. **ROI ~28x**

---

## 5. Suivi admin — Vue unifiée par merchant

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
📧 J+5  09:00  TrialEnding S1 variant         ✓ open
💬 J+6  14:30  SMS A - Pre-loss               ✓ sent
📧 J+7  09:00  TrialExpired S1                ⚠ no
💬 J+9  10:15  SMS B - Loss imminent          ✓ sent

Filtres : [Tout] [Email] [SMS] [Push]
```

### DB requise

**Pour les SMS marketing** (n'existe pas) :
```sql
CREATE TABLE merchant_marketing_sms_logs (
  id UUID PK,
  merchant_id UUID FK → merchants ON DELETE CASCADE,
  sms_type TEXT CHECK ('trial_pre_loss', 'trial_grace_loss'),
  state_snapshot INT, -- activation_score au moment d'envoi
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

## 6. Comparatif vs existant

| Email actuel | Décision | Raison |
|---|---|---|
| WelcomeEmail | **Garde + simplifie** | Bon timing, simplifier choix |
| ProgramReminder J+1 | **Supprime** | Remplacé par Email 8 contextuel |
| QRCode | **Garde, déclenche sur Email 5** | Mieux placé après aha |
| FirstClientScript J+2 | **Fusionne dans Email 8** | Duplique le pain |
| SocialProof J+3 | **Supprime** | Cas study dans Email 8 |
| VitrineReminder J+3 | **Supprime** | Push contextuel via Email 9 |
| PlanningReminder J+4 | **Supprime** | Idem Email 9 |
| TrialEnding J-2 | **Garde + 4 variantes** | Loss aversion segmentée |
| TrialExpired J+1 | **Garde + 2 variantes** | Distingue activés vs pas |
| GracePeriodSetup | **Devient Email 4** | Plus court, plus urgent |
| ChurnSurveyReminder J+3 | **Garde tel quel** | Bien placé |
| PostSurveyFollowUp | **Garde tel quel** | Déjà personnalisé |

**Bilan** : 13 emails actuels → 9 emails + 2 SMS.

---

## 7. Mesure du succès

### Métrique nord
**Trial → paid conversion rate**, segmenté par état d'arrivée :
- S0 → paid (baseline ~5-10%)
- S1 → paid (cible : 20-30%)
- S2 → paid (cible : 40-50%)
- S3 → paid (cible : 60-70%)

Si S3 conversion < 50%, pricing à revoir, pas le funnel.

### Métriques secondaires

- Open rate par email × state
- CTR par CTA
- Time to first aha
- % S0 → S1 dans les 3 jours
- Reconnexion post-SMS dans les 24h (proxy CTR sans lien, via `last_seen_at`)
- Taux opt-out SMS marchand

---

## 8. Récap principes psycho appliqués

| Touchpoint | Principe(s) |
|---|---|
| Email 1 Welcome | *Default effect* + *Paradox of choice* contré |
| Email 2 TrialEnding (4 variantes) | *Loss aversion* + *Endowment* + *Mental accounting* |
| Email 5/6/7 célébration | *Peak-end rule* + *IKEA effect* + *Commitment & consistency* |
| Email 8 ActivationStalled | *Availability heuristic* + *Activation energy* réduite |
| Email 9 PartialPush | *Goal-gradient* + *Zeigarnik* (open loop) |
| **SMS A** | *Loss aversion* + *Endowment* + *Hyperbolic discounting* (24h) |
| **SMS B** | *Loss aversion pure* + *Escape hatch* (paywall-upgrade-cro) |

---

## 9. Roadmap d'exécution

| Phase | Livrable | Effort | Dépendance |
|---|---|---|---|
| **1** | Colonne `merchants.activation_score` + trigger DB + backfill | 4h | — |
| **2** | Refonte cron `email-onboarding` (state × phase) | 1j | Phase 1 |
| **3** | 4 variantes TrialEnding (Email 2) | 1j | Phase 1 |
| **4** | Triggers événementiels Email 5/6/7 dans webhooks API | 1j | Phase 1 |
| **5** | Table `merchant_marketing_sms_logs` + cron `sms-trial-marketing` (horaire) + helper `sendMerchantMarketingSms()` | 1j | Phase 1 |
| **6** | Toggle settings `marketing_sms_opted_out` + page admin | 0,5j | Phase 5 |
| **7** | Vue unifiée admin `/admin/merchants/[id]` Communications | 1j | Phase 5 |
| **8** | Suppression emails redondants + cleanup tracking codes | 2h | Phases 2-4 |

**Total dev** : ~6 jours. Mesure A/B 4-6 semaines.
