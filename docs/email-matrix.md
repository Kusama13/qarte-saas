# Matrice des emails Qarte

> Derniere mise a jour : 19 avril 2026
> Source : `src/lib/email.ts`, `src/app/api/cron/{morning,email-onboarding,email-engagement}/route.ts`, `src/emails/translations/fr.ts`

---

## Plan v2 trial emails+SMS — STATUT 2026-04-19

> **Implémentation livrée** — détails ci-dessous.

### ✅ Livré

**Nouveaux emails** :
- `ActivationStalledEmail` ([src/emails/ActivationStalledEmail.tsx](../src/emails/ActivationStalledEmail.tsx)) — S0 J+3 case studies + path tier-aware (tracking code -320)
- `UpgradeAllInEmail` ([src/emails/UpgradeAllInEmail.tsx](../src/emails/UpgradeAllInEmail.tsx)) — paywall Fidélité→Tout-en-un, subject-by-signal (codes -330/-331)

**Emails refactorés** :
- `TrialEndingEmail` — 4 variantes state-aware (S0/S1/S2/S3) + stats box (endowment) + reco tier intégrée
- `ChurnSurveyReminderEmail` — subject pratfall "On rouvre ton compte {shop} contre 2 min de feedback" + offre honnête (compte rouvert 7j + promo -25% x3 mois si prix)
- `InactiveMerchantDay14Email` — subject factuel sans blame
- `InactiveMerchantDay30Email` — 3 options concrètes tier-aware (pause 2 mois / switch tier / call founder 30 min)
- `SubscriptionConfirmedEmail` — variantes titre par tier
- `IncompleteSignupReminder2Email` — vouvoiement → tutoiement
- `FirstScanEmail` / `FirstBookingEmail` / `FirstRewardEmail` — retirées exclamations

**Nouveau canal SMS — 3 SMS marketing trial** via [/api/cron/sms-trial-marketing](../src/app/api/cron/sms-trial-marketing/route.ts) (1×/jour 11h UTC) :
1. `celebration_{fidelity|planning|vitrine}` — 1er aha event, dedup global via `merchants.celebration_sms_sent_at`
2. `trial_pre_loss` — J-1 trial, ≥S1, copy tier-aware via `recommendTierForMerchant()`
3. `churn_survey` — J+5 fully expired, copy variant A pratfall + reciprocity

**Infrastructure** :
- Mig 115 : `merchants.celebration_sms_sent_at` + `merchants.marketing_sms_opted_out`
- Mig 116 : table `merchant_marketing_sms_logs` (5 sms_type CHECK, RLS, index dedup)
- Helper `src/lib/activation-score.ts` — computeActivationScore() (S0-S3 on-the-fly)
- Helper `src/lib/sms-trial-marketing.ts` — sendTrialMarketingSms() + gating + log
- Helper `src/lib/trial-sms-copy.ts` — copy centralisée (sans emoji, sans firstName)
- Helper `src/lib/upgrade-triggers.ts` — triggerUpgradeAllInEmail() dedup 14j
- Toggle UI `/dashboard/settings` — `marketing_sms_opted_out`
- API admin `/api/admin/merchants/[id]/communications` — timeline unifiée 3 canaux

### ⏸ Reporté v3 (low impact)

- `GraceEnding` split 2 emails (copy actuel déjà OK pause vs deletion)
- `WeeklyDigest` sections par tier (cosmétique)
- UI admin communications timeline (l'API suffit pour debug)
- Trigger `booking_request_manual` (nécessite form client-side, v2)

### Bilan chiffré final

- **Avant** : 48 emails, 0 SMS marketing trial
- **Après** : 50 emails (+2 nouveaux : ActivationStalled, UpgradeAllIn) + 3 SMS marketing
- **9 emails refactorés** avec variantes state-aware ou tier-aware

**Emails redondants NON supprimés** (ProgramReminderDay2/3, SocialProof, VitrineReminder, PlanningReminder, Day5Checkin) — ActivationStalled les remplace fonctionnellement pour S0 J+3, mais les triggers redondants tournent encore. À cleanup en Phase finale v3.

---

## Repartition par cron (split avril 2026)

Les emails automatiques sont repartis sur **3 crons horaires** pour eviter la rafale (~20 emails simultanes a 10h FR) :

| Cron | Horaire UTC | Contenu |
|------|-------------|---------|
| `morning` | 08:00 | Billing-critical : trial (J-2/J+1/churn), post-survey, reactivation, dunning, incomplete signup T+24h, grace period setup |
| `email-onboarding` | 10:00 | Setup progressif : program reminder J+1, social proof J+3, vitrine J+3, planning J+4, QR code, first client script |
| `email-engagement` | 13:00 | Engagement : first scan/booking/reward, tier 2 upsell, inactifs J+7/14/30, referral promo/reminders, pending points |

Chaque cron prefetche merchants/emails/tracking independamment. Idempotence preservee via `pending_email_tracking` (codes uniques).

---

## Vue d'ensemble

Qarte envoie **~40 emails distincts** repartis en 10 categories. Tous les emails marketing sont **idempotents** via la table `pending_email_tracking` (tracking code negatif unique par merchant).

**Conditions globales** — un email n'est JAMAIS envoie si :
- `no_contact = true`
- `email_bounced_at` est set
- `email_unsubscribed_at` est set
- Le merchant est un `super_admin`

---

## 1. Inscription & Onboarding

```
T+0         ┌─────────────────────────────────────┐
(immediat)  │  WELCOME                            │
            │  Objet: "Bienvenue {shopName} !"    │
            │  Code: -200                         │
            │  Contenu: 3 piliers (vitrine,       │
            │  reservation, fidelite), CTA config  │
            │  Declencheur: POST /merchants/create │
            └─────────────────────────────────────┘

T+0         ┌─────────────────────────────────────┐
(immediat)  │  NOTIF INTERNE                      │
            │  Objet: "Nouveau commercant inscrit: │
            │         {shopName}"                  │
            │  Destinataire: sales@getqarte.com   │
            │  Declencheur: POST /merchants/create │
            └─────────────────────────────────────┘
```

### Abandon d'inscription (auth.signUp sans creation merchant)

```
T+15min     ┌─────────────────────────────────────┐
            │  ABANDON SIGNUP STEP 1              │
            │  Objet: "Il ne reste qu'une etape"  │
            │  Template: IncompleteSignupEmail     │
            │  Declencheur: schedule-incomplete    │
            │  (Resend scheduled, pas de tracking) │
            └─────────────────────────────────────┘

T+2h        ┌─────────────────────────────────────┐
            │  ABANDON SIGNUP STEP 2              │
            │  Objet: "Votre espace Qarte vous    │
            │         attend toujours"             │
            │  Template: IncompleteSignupReminder2 │
            │  (Resend scheduled, pas de tracking) │
            └─────────────────────────────────────┘
```

### Inscription incomplete (auth OK, merchant cree, programme non configure)

```
T+15-25h    ┌─────────────────────────────────────┐
(~J+1)      │  GUIDED SIGNUP                      │
            │  Objet: "30 secondes, on te guide"  │
            │  Code: -150                         │
            │  Condition: signup 23-25h ago,       │
            │  pas de reward_description           │
            └─────────────────────────────────────┘
```

---

## 2. Onboarding actif (J+1 a J+4)

Envoyes via le **cron `email-onboarding`** (10:00 UTC) aux merchants actifs (trial/active).

```
J+1         ┌─────────────────────────────────────┐
            │  PROGRAM REMINDER                   │
            │  Objet: "{shopName}, ta 1ere cliente│
            │         attend sa carte"             │
            │  Code: -301                         │
            │  Condition: reward_description=null  │
            │  (programme pas encore configure)    │
            └─────────────────────────────────────┘

J+3         ┌─────────────────────────────────────┐
            │  SOCIAL PROOF                       │
            │  Objet: "{shopName}, comment Elodie │
            │         a double ses clientes"       │
            │  Code: -310                         │
            │  Condition: tous les trial merchants │
            └─────────────────────────────────────┘

J+3         ┌─────────────────────────────────────┐
            │  VITRINE REMINDER                   │
            │  Objet: "{shopName}, tes futures    │
            │         clientes te cherchent sur    │
            │         Google"                      │
            │  Code: -304                         │
            │  Condition: configure + PAS de bio  │
            │  ni adresse                          │
            └─────────────────────────────────────┘

J+4         ┌─────────────────────────────────────┐
            │  PLANNING REMINDER                  │
            │  Objet: "{shopName}, tes clientes   │
            │         veulent reserver en ligne"   │
            │  Code: -308                         │
            │  Condition: configure + planning    │
            │  PAS active                          │
            └─────────────────────────────────────┘
```

---

## 3. Milestones (declenchement unique, par evenement)

```
            ┌─────────────────────────────────────┐
            │  QR CODE READY                      │
            │  Objet: "{shopName}, tout est pret  │
            │         — lance ton programme !"     │
            │  Code: -103                         │
            │  Condition: reward_description set, │
            │  trial/active                        │
            └─────────────────────────────────────┘

            ┌─────────────────────────────────────┐
            │  FIRST CLIENT SCRIPT                │
            │  Objet: "La phrase exacte a dire a  │
            │         tes clientes"                │
            │  Code: -106                         │
            │  Condition: QR envoye 2-3j avant,   │
            │  0 visites, programme configure      │
            └─────────────────────────────────────┘

            ┌─────────────────────────────────────┐
            │  FIRST SCAN                         │
            │  Objet: "{shopName}, ton 1er client!"│
            │  Code: -100                         │
            │  Condition: exactement 2 visites    │
            │  confirmees (1ere = test merchant)   │
            └─────────────────────────────────────┘

            ┌─────────────────────────────────────┐
            │  FIRST BOOKING                      │
            │  Objet: "{shopName}, ta 1ere resa   │
            │         en ligne !"                  │
            │  Code: -105                         │
            │  Condition: auto_booking_enabled +  │
            │  exactement 1 booking                │
            └─────────────────────────────────────┘

            ┌─────────────────────────────────────┐
            │  FIRST REWARD                       │
            │  Objet: "1ere recompense debloquee!"│
            │  Code: -101                         │
            │  Condition: 1er rewards_earned > 0  │
            └─────────────────────────────────────┘

            ┌─────────────────────────────────────┐
            │  TIER 2 UPSELL                      │
            │  Objet: "Tes meilleurs clients      │
            │         meritent plus"               │
            │  Code: -102                         │
            │  Condition: 50+ clients uniques,    │
            │  tier2 pas actif                     │
            └─────────────────────────────────────┘
```

---

## 4. Trial — Flow standard (sans survey)

```
        INSCRIPTION
            │
            ▼
    ┌───────────────┐
    │  ESSAI 7 JOURS │
    │  (trial)       │
    └───────┬───────┘
            │
     J-2    ▼
    ┌─────────────────────────────────────┐
    │  TRIAL ENDING                       │
    │  Objet (J-2): "{shopName}, plus que │
    │         {daysRemaining} jours"       │
    │  Objet (J-1): "{shopName}, dernier  │
    │         jour d'essai"                │
    │  Code: -201                         │
    │  Un seul email a J-2                │
    └─────────────────────────────────────┘
            │
     J+0    │  ← trial_ends_at (expiration)
            │
     J+1    ▼
    ┌─────────────────────────────────────┐
    │  TRIAL EXPIRED                      │
    │  Objet: "{shopName}, ton essai est  │
    │         termine"                     │
    │  Code: -211                         │
    │  Condition: grace period (3 jours)  │
    └─────────────────────────────────────┘
            │
     J+3    │  ← fin grace period
            │
     J+3+   ▼
    ┌─────────────────────────────────────┐
    │  CHURN SURVEY REMINDER              │
    │  Objet: "{shopName}, 2 jours offerts"│
    │  Code: -213                         │
    │  Condition: fully expired +         │
    │  PAS de churn_survey_seen_at        │
    │  Contenu: incite a remplir le survey│
    │  pour obtenir des jours bonus       │
    └─────────────────────────────────────┘
```

---

## 5. Trial — Flow post-survey (avec bonus)

Quand le merchant complete le churn survey, il recoit des **jours bonus** selon sa reponse Q4 (`would_convince`). Les emails generiques (Section 1) sont **bloques** — il recoit des emails cibles a la place.

### Jours bonus par reponse Q4

| Reponse Q4 (`would_convince`) | Jours bonus | midDay (email milieu) |
|-------------------------------|-------------|----------------------|
| `lower_price` (prix plus bas) | +2 jours | J-1 |
| `longer_trial` (essai plus long) | +7 jours | J-4 |
| `team_demo` (demo equipe) | +5 jours | J-3 |
| `more_features` (plus de features) | +2 jours | J-1 |
| `nothing` (rien) | +2 jours | J-1 |

### Timeline post-survey

```
    SURVEY COMPLETE
    (churn_survey_seen_at set)
    trial_ends_at prolonge de +bonus jours
            │
            │
   midDay   ▼
    ┌─────────────────────────────────────┐
    │  POST-SURVEY FOLLOW-UP (MID)        │
    │  Code: -221                         │
    │  Objet selon variant :              │
    │  ┌─────────────────────────────────┐│
    │  │ lower_price:                    ││
    │  │ "{shopName}, ton code -25%      ││
    │  │  t'attend"                      ││
    │  │ Contenu: code promo             ││
    │  │ 3MOISQARTEPRO25 (-25% 3 mois)  ││
    │  │ CTA → /dashboard/subscription  ││
    │  ├─────────────────────────────────┤│
    │  │ longer_trial:                   ││
    │  │ "{shopName}, as-tu essaye le    ││
    │  │  planning ?"                    ││
    │  │ Contenu: checklist features non ││
    │  │ testees, CTA → /dashboard      ││
    │  ├─────────────────────────────────┤│
    │  │ team_demo:                      ││
    │  │ "{shopName}, ta demo est        ││
    │  │  passee ?"                      ││
    │  │ Contenu: suivi demo, aide       ││
    │  │ CTA → /dashboard               ││
    │  ├─────────────────────────────────┤│
    │  │ more_features:                  ││
    │  │ "{shopName}, voici ce qu'on a   ││
    │  │  ajoute"                        ││
    │  │ Contenu: liste nouveautes       ││
    │  │ CTA → /dashboard               ││
    │  ├─────────────────────────────────┤│
    │  │ nothing:                        ││
    │  │ "{shopName}, un dernier mot"    ││
    │  │ Contenu: social proof, ton      ││
    │  │ leger, CTA → /dashboard        ││
    │  └─────────────────────────────────┘│
    └─────────────────────────────────────┘
            │
   J-1      ▼  (sauf si midDay === 1, pour eviter doublon)
    ┌─────────────────────────────────────┐
    │  POST-SURVEY FOLLOW-UP (LAST DAY)   │
    │  Code: -222                         │
    │  Objet: "{shopName}, dernier jour   │
    │         de ton essai"                │
    │  Meme template, ton plus urgent     │
    └─────────────────────────────────────┘
            │
   J+0      │  ← trial_ends_at (expiration bonus)
            │
   J+1      ▼
    ┌─────────────────────────────────────┐
    │  POST-SURVEY LAST CHANCE            │
    │  Code: -223                         │
    │  Objet selon variant :              │
    │  - lower_price: "{shopName}, ton    │
    │    code expire demain"              │
    │  - autres: "{shopName}, tes donnees │
    │    seront supprimees"               │
    │  Contenu: urgence, CTA abo         │
    └─────────────────────────────────────┘
```

---

## 6. Merchants inactifs (programme configure, abonne actif)

```
J+7 sans    ┌─────────────────────────────────────┐
activite    │  INACTIVE DAY 7                     │
            │  Objet: "{shopName}, tout va bien ?"│
            │  Code: -110                         │
            │  Condition: configure + active +    │
            │  7j depuis derniere visite ou        │
            │  creation, PAS en grace period       │
            └─────────────────────────────────────┘

J+14 sans   ┌─────────────────────────────────────┐
activite    │  INACTIVE DAY 14                    │
            │  Objet: "{shopName}, tes clientes   │
            │         oublient de revenir ?"       │
            │  Code: -111                         │
            └─────────────────────────────────────┘

J+30 sans   ┌─────────────────────────────────────┐
activite    │  INACTIVE DAY 30                    │
            │  Objet: "{shopName}, on peut        │
            │         t'aider ?"                   │
            │  Code: -112                         │
            └─────────────────────────────────────┘
```

---

## 7. Paiement & Dunning (subscription active → past_due)

```
    ECHEC PAIEMENT (Stripe webhook)
            │
    J+0     ▼
    ┌─────────────────────────────────────┐
    │  PAYMENT FAILED STEP 1              │
    │  Objet: "Un souci avec ta carte"    │
    │  Pas de tracking code (webhook)     │
    │  Declencheur: invoice.payment_failed│
    └─────────────────────────────────────┘
            │
    J+3     ▼
    ┌─────────────────────────────────────┐
    │  PAYMENT FAILED STEP 2              │
    │  Objet: "{shopName}, paiement       │
    │         toujours en attente"         │
    │  Code: -401                         │
    │  Condition: past_due + 3 jours      │
    └─────────────────────────────────────┘
            │
    J+7     ▼
    ┌─────────────────────────────────────┐
    │  PAYMENT FAILED STEP 3              │
    │  Objet: "{shopName}, ton compte sera│
    │         suspendu dans 3 jours"       │
    │  Code: -402                         │
    │  Condition: past_due + 7 jours      │
    └─────────────────────────────────────┘
            │
    J+10    ▼
    ┌─────────────────────────────────────┐
    │  PAYMENT FAILED STEP 4              │
    │  Objet: "{shopName}, dernier jour   │
    │         avant suspension"            │
    │  Code: -403                         │
    │  Condition: past_due + 10 jours     │
    └─────────────────────────────────────┘
            │
    Si paiement OK → SUBSCRIPTION CONFIRMED
    (invoice.payment_succeeded webhook)
```

---

## 8. Subscription lifecycle (Stripe webhooks, immediats)

```
    ┌─────────────────────────────────────┐
    │  SUBSCRIPTION CONFIRMED             │
    │  Objet: "{shopName} - Ton abonnement│
    │         Qarte est actif"             │
    │  Declencheur: checkout.session.      │
    │  completed OU invoice.payment_       │
    │  succeeded (recovery)                │
    └─────────────────────────────────────┘

    ┌─────────────────────────────────────┐
    │  SUBSCRIPTION CANCELED              │
    │  Objet: "{shopName} - Confirmation  │
    │         de resiliation"              │
    │  Declencheur: customer.subscription │
    │  .updated (→ canceling)              │
    └─────────────────────────────────────┘

    ┌─────────────────────────────────────┐
    │  SUBSCRIPTION REACTIVATED           │
    │  Objet: "{shopName} - Ton abonnement│
    │         est maintenu"                │
    │  Declencheur: customer.subscription │
    │  .updated (canceling → active)       │
    └─────────────────────────────────────┘
```

---

## 9. Reactivation (apres resiliation)

```
    RESILIATION EFFECTIVE
    (subscription_status = 'canceled')
            │
    J+7     ▼
    ┌─────────────────────────────────────┐
    │  REACTIVATION J+7                   │
    │  Objet: "{shopName} - Tes           │
    │  {totalCustomers} clients n'ont plus│
    │  acces a leur carte"                 │
    │  (ou generique si 0 clients)        │
    └─────────────────────────────────────┘
            │
    J+14    ▼
    ┌─────────────────────────────────────┐
    │  REACTIVATION J+14                  │
    │  Objet: "{shopName} - Reviens, tes  │
    │         donnees sont encore la"       │
    └─────────────────────────────────────┘
            │
    J+30    ▼
    ┌─────────────────────────────────────┐
    │  REACTIVATION J+30                  │
    │  Objet: "{shopName} - Derniere      │
    │         chance avant suppression de  │
    │         tes donnees"                 │
    └─────────────────────────────────────┘

    ┌─────────────────────────────────────┐
    │  WIN-BACK (admin, on-demand)        │
    │  Objet: "{shopName} — on a tout     │
    │         change, reviens voir"        │
    │  Declencheur: admin bulk send       │
    │  Condition: canceled + 3j+ post-    │
    │  annulation                          │
    └─────────────────────────────────────┘
```

---

## 10. Referral (post-abonnement)

```
    ABONNEMENT ACTIF
            │
    J+2     ▼
    ┌─────────────────────────────────────┐
    │  REFERRAL PROMO                     │
    │  Objet: "Gagne 10 EUR pour chaque  │
    │         pro que tu recommandes"       │
    │  Code: -315                         │
    │  Condition: billing_period_start    │
    │  48-49h ago                           │
    └─────────────────────────────────────┘
            │
    J+14    ▼
    ┌─────────────────────────────────────┐
    │  REFERRAL REMINDER J+14             │
    │  Objet: "{shopName}, 10 EUR         │
    │         t'attendent"                 │
    │  Code: -316                         │
    │  Condition: 0 referrals             │
    └─────────────────────────────────────┘
            │
    J+30    ▼
    ┌─────────────────────────────────────┐
    │  REFERRAL REMINDER J+30             │
    │  Objet: "{shopName}, 10 EUR         │
    │         t'attendent"                 │
    │  Code: -317                         │
    │  Condition: 0 referrals             │
    └─────────────────────────────────────┘
```

---

## 11. Emails operationnels (declenchement immediat)

| Email | Objet | Declencheur |
|-------|-------|-------------|
| Booking notification | "Nouvelle reservation — {clientName}" | Client reserve en ligne |
| Slot released | "Creneau libere — {clientName}" | Merchant annule un booking |
| Birthday notification | "Anniversaire client(s) aujourd'hui" | Cron + birthday_gift_enabled |
| Pending points (alerte) | "{shopName} - {n} point(s) a moderer" | Points en attente J+0/J+1 |
| Pending points (rappel) | "{shopName} - Rappel : {n} point(s) en attente" | Points en attente J+2/J+3 |
| Grace period setup | "{shopName}, on garde tes donnees encore {n} jours" | Programme non config + trial expire |

---

## 12. Emails ponctuels / annonces

| Email | Objet | Declencheur |
|-------|-------|-------------|
| Announcement Ma Page | "{shopName}, decouvre ce qu'on a prepare pour toi" | Feature launch (one-shot) |
| Product Update | "{shopName}, decouvre les nouveautes Qarte de la semaine" | Digest hebdo (on-demand) |

---

## Timeline complete — Parcours type (inscription → resiliation)

```
JOUR    EMAIL                           CONDITION
─────   ─────────────────────────       ──────────────────────
T+0     Welcome                         Toujours
T+0     Notif interne                   Toujours (→ sales@)
T+15m   Abandon signup step 1           Si pas de merchant cree
T+2h    Abandon signup step 2           Si pas de merchant cree
~J+1    Guided signup                   Si programme non configure
J+1     Program reminder                Si programme non configure
J+2     QR Code ready                   Si programme configure (milestone)
J+3     Social proof                    Tous les trial
J+3     Vitrine reminder                Si pas de bio/adresse
J+4     Planning reminder               Si planning non active
J+4     First client script             Si QR envoye + 0 visites
J+5     Trial ending (J-2)              Standard (sans survey)

═══════ EXPIRATION TRIAL (J+7) ═══════

J+8     Trial expired (J+1)             Standard (sans survey)
J+10    Grace period expire             → fully expired
J+10+   Churn survey reminder           Si pas de survey complete

═══════ SI SURVEY COMPLETE → BONUS ═══════

        Post-survey mid-bonus (-221)    Milieu periode bonus
        Post-survey last day (-222)     J-1 avant expiration
        Post-survey last chance (-223)  J+1 apres expiration

═══════ SI ABONNEMENT SOUSCRIT ═══════

J+0     Subscription confirmed          Stripe webhook
J+2     Referral promo                  Apres billing start
J+14    Referral reminder               Si 0 referrals
J+30    Referral reminder               Si 0 referrals
...     First scan                      Quand 2e visite
...     First booking                   Quand 1ere resa
...     First reward                    Quand 1ere recompense
...     Tier 2 upsell                   Quand 50+ clients
+7j     Inactive day 7                  Si aucune activite
+14j    Inactive day 14                 Si aucune activite
+30j    Inactive day 30                 Si aucune activite

═══════ SI ECHEC PAIEMENT ═══════

J+0     Payment failed step 1           Webhook immediat
J+3     Payment failed step 2           Cron
J+7     Payment failed step 3           Cron
J+10    Payment failed step 4           Cron

═══════ SI RESILIATION ═══════

J+0     Subscription canceled           Webhook
J+7     Reactivation early              Cron
J+14    Reactivation mid                Cron
J+30    Reactivation late               Cron
```

---

## Tracking codes reference

| Plage | Categorie |
|-------|-----------|
| -100 a -199 | Milestones (first scan, QR, tier2...) |
| -200 a -299 | Signup / trial / welcome |
| -300 a -399 | Onboarding / engagement |
| -400 a -499 | Payment / dunning |
| 0 a 3 | Pending points (positifs) |

### Codes specifiques

| Code | Email |
|------|-------|
| -100 | First scan |
| -101 | First reward |
| -102 | Tier 2 upsell |
| -103 | QR code ready |
| -105 | First booking |
| -106 | First client script |
| -110 | Inactive J+7 |
| -111 | Inactive J+14 |
| -112 | Inactive J+30 |
| -113 | Grace period setup |
| -150 | Guided signup |
| -200 | Welcome |
| -201 | Trial ending (J-2) |
| -211 | Trial expired (J+1) |
| -213 | Churn survey reminder |
| -221 | Post-survey follow-up (mid) |
| -222 | Post-survey follow-up (last day) |
| -223 | Post-survey last chance |
| -301 | Program reminder |
| -304 | Vitrine reminder |
| -308 | Planning reminder |
| -310 | Social proof |
| -315 | Referral promo |
| -316 | Referral reminder J+14 |
| -317 | Referral reminder J+30 |
| -401 | Payment failed step 2 |
| -402 | Payment failed step 3 |
| -403 | Payment failed step 4 |

---

## Annexe — Corps complet des emails (FR)

Source : `src/emails/translations/fr.ts`. Les `<strong>...</strong>` ont été convertis en `**...**`. Les placeholders `{variable}` sont conservés tels quels. Les sous-objets imbriqués (ex : `paymentFailed.step1`) sont rendus en sections imbriquées.

### Table des matières
- [A. Pre-trial / abandon d'inscription](#a-pre-trial--abandon-dinscription)
- [B. Onboarding pré-checkout](#b-onboarding-pre-checkout)
- [C. Triggers aha (milestones)](#c-triggers-aha-milestones)
- [D. Fin de trial + churn](#d-fin-de-trial--churn)
- [E. Subscription management](#e-subscription-management)
- [F. Post-checkout re-engagement](#f-post-checkout-re-engagement)
- [G. Périodiques](#g-periodiques)
- [H. Upgrade & gamification](#h-upgrade--gamification)
- [I. Transactionnels merchant](#i-transactionnels-merchant)
- [J. Référence (data tables)](#j-reference-data-tables)
- [K. Réactivation post-résiliation](#k-reactivation-post-resiliation)
- [L. Référral](#l-referral)
- [M. Social proof / templates](#m-social-proof--templates)

---

### A. Pre-trial / abandon d'inscription

#### lastChanceSignup
- **Subject** : *(absent dans `subjects`)*
- **Preview** : `Votre compte Qarte sera supprimé bientôt — finalisez votre inscription`
- **Heading** : `Votre compte n'est pas encore finalisé`
- **Body** :
  - Greeting: `Bonjour,`
  - body1: `Vous avez créé un compte Qarte ({email}) il y a une semaine, mais votre commerce n'est toujours pas enregistré.`
  - warningBox: `Votre espace sera **supprimé automatiquement** dans quelques jours si l'inscription n'est pas finalisée.`
  - body2: `L'inscription prend **3 minutes** et l'essai est 100% gratuit pendant 7 jours, sans carte bancaire.`
  - promoTitle: `Essai gratuit 7 jours`
  - promoText: `Testez Qarte gratuitement pendant 7 jours : vitrine en ligne, programme fidélité, réservation en ligne, parrainage et cadeaux anniversaire. Sans carte bancaire.`
  - helpLine: `Une question avant de vous lancer ? Répondez à cet email.`
- **CTA** : `Finaliser mon inscription`
- **Signature** : `L'équipe Qarte`

#### incompleteSignup
- **Subject** : `Il ne reste qu'une étape`
- **Preview** : `Il ne reste qu'une étape`
- **Heading** : `Il ne reste qu'une étape`
- **Body** :
  - intro: `Tu as commencé ton inscription sur Qarte mais tu n'as pas terminé.`
  - helpText: `Besoin d'aide ? Réponds à cet email.`
- **CTA** : `Lancer ma vitrine — 2 minutes`
- **Signature** : `L'équipe Qarte`

#### incompleteSignup2
- **Subject** : `Ton espace Qarte est prêt — 2 min pour finir`
- **Preview** : `Votre espace Qarte vous attend toujours`
- **Heading** : `On ne vous a pas oublié !`
- **Body** :
  - Greeting: `Bonjour,`
  - body1: `Vous avez commencé à créer votre compte Qarte il y a quelques heures, mais la configuration de votre commerce n'est pas terminée.`
  - highlightBox: `Votre espace est **déjà prêt**. Il ne manque que les infos de votre commerce pour lancer votre programme de fidélité.`
  - testimonialQuote: `« J'ai configuré mon programme en 3 minutes, et dès la première semaine j'avais des clients qui revenaient avec leur carte. »`
  - testimonialAuthor: `— Un coiffeur sur Qarte`
  - helpLine: `Si vous avez des questions ou besoin d'aide, répondez à cet email.`
  - signaturePrefix: `À très vite,`
- **CTA** : `Reprendre mon inscription`
- **Signature** : `L'équipe Qarte`

#### setupForYou
- **Subject** : *(absent dans `subjects`)*
- **Preview** : `Répondez OUI et on configure tout pour vous — gratuitement`
- **Heading** : `On peut le faire pour vous`
- **Body** :
  - Greeting: `Bonjour,`
  - body1: `Vous avez créé votre compte Qarte il y a 3 jours ({email}), mais la configuration n'est pas terminée.`
  - body2: `On comprend — entre les clients, les rendez-vous et le quotidien, c'est pas toujours facile de trouver 3 minutes.`
  - offerTitle: `On s'en occupe pour vous`
  - offerIntro: `Répondez à cet email avec :`
  - offerList1: `Le nom de votre commerce`
  - offerList2: `Votre activité (coiffeur, onglerie, spa...)`
  - offerList3: `Votre adresse`
  - offerResult: `Et on configure **tout** pour vous en moins de 10 minutes. Gratuit, inclus dans votre essai.`
  - selfSetup: `Ou si vous préférez le faire vous-même, c'est toujours possible :`
  - signaturePrefix: `À très vite,`
- **CTA** : `Finaliser mon inscription`
- **Signature** : `L'équipe Qarte`

#### guidedSignup
- **Subject** : `30 secondes, on te guide`
- **Preview** : `30 secondes, on te guide`
- **Heading** : `On te guide pas à pas`
- **Body** :
  - intro: `Tu as commencé ton inscription hier. Voici les 3 étapes pour lancer ta vitrine en ligne et ton programme de fidélité :`
  - step1: `Termine ton inscription (30 secondes)`
  - step2: `Personnalise ta page (couleurs, logo, bio)`
  - step3: `Configure ta récompense fidélité`
- **CTA** : `Reprendre mon inscription`
- **Signature** : `L'équipe Qarte`

---

### B. Onboarding pré-checkout

#### welcome
- **Subject** : `Bienvenue {shopName} !`
- **Preview** : `{shopName}, bienvenue sur Qarte`
- **Heading** : `Bienvenue sur Qarte.`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ton compte est créé. Voici ce que Qarte va faire pour toi :`
  - replyPrompt: `Réponds **OK** à cet email pour activer tes 7 jours d'essai gratuit.`
  - benefitsTitle: `Tout est interconnecté :`
  - benefit1: `Ta **vitrine en ligne** attire de nouvelles clientes via Google`
  - benefit2: `Elles **réservent en ligne** depuis ta page, même à 23h`
  - benefit3: `Elles reçoivent **automatiquement leur carte de fidélité** — elles reviennent toutes seules`
  - smsTitle: `Avec l'abonnement, tu débloques aussi :`
  - sms1: `SMS de rappel la veille du RDV — zéro no-show`
  - sms2: `SMS de confirmation instantané à la réservation`
  - sms3: `100 SMS/mois inclus`
  - pwaTitle: `Astuce : installe Qarte sur ton téléphone`
  - pwaText: `Ouvre ton dashboard depuis Safari (iPhone) ou Chrome (Android), clique sur **Partager → Ajouter à l'écran d'accueil**. Tu recevras les notifs de réservation en temps réel.`
  - trialNote: `{trialDays} jours d'essai gratuit, sans carte bancaire.`
  - helpText: `Une question ? Réponds à cet email, on te répond dans l'heure.`
- **CTA** : `Lancer mon programme — 3 minutes`
- **Signature** : `L'équipe Qarte`

#### programReminder
- **Subject** : `{shopName}, ta 1ere cliente attend sa carte`
- **Preview** : `Les salons sur Qarte voient 47% de clientes en plus revenir`
- **Heading** : `Ta 1ere cliente attend sa carte`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `47% de clientes en plus reviennent chez les pros qui utilisent Qarte. Il te reste une seule étape pour que ça marche chez toi aussi.`
  - timeText: `3 minutes. Tu choisis ta récompense (ex: un soin offert après 10 passages) et c'est parti.`
  - bonusText: `Et si tu actives la réservation en ligne, chaque cliente qui réserve reçoit **automatiquement sa carte de fidélité**.`
  - testimonial: `"L'offre nouveaux clients convertit direct et le parrainage fait le reste. J'aurais dû prendre avant." — Nour Beauté, salon de coiffure`
- **CTA** : `Configurer ma récompense`
- **Signature** : `L'équipe Qarte`

#### programReminderDay2
- **Subject** : `Quelle récompense choisir ?`
- **Preview** : `Quelle récompense choisir ?`
- **Heading** : `Quelle récompense choisir ?`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Tu n'as pas encore configuré ton programme de fidélité. On te donne un coup de pouce :`
  - suggestionTitle: `Notre suggestion pour toi`
  - afterVisits: `après`
  - helpText: `Besoin d'aide ? Réponds à cet email, on te guide.`
- **CTA principal** : `Configurer mon programme`
- **CTA secondaire** : `Voir un exemple de page`
- **Signature** : `L'équipe Qarte`

#### programReminderDay3
- **Subject** : `Dernier rappel : configure ton programme`
- **Preview** : `On peut le faire pour toi`
- **Heading** : `On s'en occupe ?`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Pas eu le temps de configurer ta récompense fidélité ? On comprend, le quotidien passe vite.`
  - trialNote: `Il te reste **{daysRemaining} jour{daysPlural}** d'essai.`
  - offerTitle: `Réponds juste avec ta récompense`
  - offerText: `Ex : "1 brushing offert après 10 visites" — et on configure tout pour toi.`
- **CTA** : `Ou fais-le toi-même`
- **Signature** : `L'équipe Qarte`

#### autoSuggestReward
- **Subject** : `{shopName}, on a choisi la meilleure récompense pour toi`
- **Preview** : `{shopName}, on a choisi la meilleure récompense pour toi`
- **Heading** : `On a trouvé ta récompense idéale`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Tu n'as pas encore configuré ta récompense fidélité. On a analysé ce qui marche le mieux pour ton type d'activité :`
  - recommendationLabel: `Récompense recommandée pour ton activité :`
  - afterVisits: `après`
  - recommendationNote: `Clique ci-dessous pour la configurer. Tu pourras la modifier à tout moment.`
  - trialNote: `Il te reste **{daysRemaining} jour{daysPlural}** d'essai.`
  - helpLine: `Tu préfères qu'on le fasse pour toi ? Réponds à cet email.`
- **CTA** : `Appliquer cette suggestion`
- **Signature** : `L'équipe Qarte`

#### qrCode
- **Subject** : `{shopName}, tout est prêt — lance ton programme !`
- **Preview** : `{shopName}, tout est prêt — lance ton programme !`
- **Heading** : `Tout est prêt !`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ton programme de fidélité est configuré. Il ne reste plus qu'à afficher ton QR code.`
  - programTitle: `Ton programme`
  - rewardLabel: `Récompense : {rewardDescription}`
  - stampsLabel: `Après {stampsRequired} passages`
  - tier2Label: `Palier VIP : {tier2RewardDescription} après {tier2StampsRequired} passages`
  - cagnotteLabel: `{cagnottePercent}% de cashback sur chaque passage`
  - sectionQrTitle: `Ton QR code`
  - sectionQrDesc: `Affiche-le à la caisse ou sur ton téléphone. Propose le scan après chaque soin.`
  - step1: `Télécharge le QR code depuis ton tableau de bord`
  - step2: `Montre-le à chaque client(e) au passage en caisse`
  - step3: `Un simple « Vous voulez cumuler vos points ? » suffit !`
  - tipsTitle: `Où placer ton QR code ?`
  - tip1: `→ À la caisse, à hauteur des yeux`
  - tip2: `→ Sur ta vitrine`
  - tip3: `→ Sur tes cartes de visite`
  - socialKitTitle: `Ton kit réseaux sociaux`
  - socialKitDesc: `Un visuel prêt à poster sur Instagram, Facebook ou WhatsApp pour annoncer ton programme.`
  - rewardBoxLabel: `Votre récompense`
  - rewardBoxLabelCagnotte: `Votre cagnotte`
  - tier2BoxLabel: `Palier 2`
  - afterVisits: `Après {count} passage{plural}`
  - captionsTitle: `Légendes prêtes à copier`
  - captionLabel1: `Option 1 — Simple et efficace`
  - captionLabel2: `Option 2 — Engageante`
  - captionVisitSimple: `Votre fidélité mérite d'être récompensée ! Après {stampsRequired} passages chez {shopName}, recevez {rewardDescription}.{tier2Text} Demandez à scanner le QR code ! #fidélité #{hashtag}`
  - captionCagnotteSimple: `Votre fidélité mérite d'être récompensée ! {stampsRequired} passages chez {shopName} = {rewardDescription} sur vos dépenses. Demandez à scanner le QR code ! #fidélité #{hashtag}`
  - captionVisitEngaging: `NOUVEAU chez {shopName} ! On lance notre carte de fidélité digitale. Pas d'appli, pas de carte à perdre — juste un scan rapide. Votre récompense ? {rewardDescription} !{tier2Text} À bientôt`
  - captionCagnotteEngaging: `NOUVEAU chez {shopName} ! On lance notre programme de fidélité digitale. Pas d'appli, pas de carte à perdre — juste un scan rapide. {stampsRequired} passages = {rewardDescription} sur vos dépenses ! À bientôt`
  - captionTier2Suffix: ` Et après {tier2StampsRequired} passages : {tier2RewardDescription} !`
  - tipBoxText: `**Astuce :** garde le QR code sur ton téléphone et propose le scan dès le passage en caisse. Poste le visuel en story Instagram pour un maximum de visibilité !`
  - referralTitle: `Gagne 10€ de réduction`
  - referralText: `Tu connais un(e) commerçant(e) dans la beauté ? Recommande-lui Qarte : **10€ de réduction** chacun sur le prochain mois.`
  - referralCodeLabel: `Ton code : **{referralCode}**`
  - referralHint: `Ton filleul nous communique ton code après son inscription et la réduction est appliquée à chacun.`
  - helpLine: `Besoin d'aide ? Réponds à cet email, on te répond rapidement.`
- **CTA** : `Télécharger mon QR code`
- **Signature** : `L'équipe Qarte`

---

### C. Triggers aha (milestones)

#### firstScan
- **Subject** : `{shopName}, ton 1er client`
- **Preview** : `{shopName}, ton 1er client a scanné !`
- **Heading** : `Ton programme est lancé !`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ton premier client vient de scanner ton QR code. C'est le début de ton programme de fidélité !`
  - celebrationTitle: `Premier scan validé`
  - celebrationText: `Chaque scan, c'est un client qui s'engage avec ton commerce.`
  - tipsTitle: `Pour accélérer :`
  - tip1: `→ Propose le scan à chaque client aujourd'hui`
  - tip2: `→ Place le QR code à hauteur des yeux près de la caisse`
  - tip3: `→ Dis simplement : « On a une carte de fidélité digitale, scannez ce QR code ! »`
  - shareTitle: `Partage ta vitrine en ligne`
  - shareText: `Ajoute ta vitrine dans ta bio Instagram. Tes clientes y retrouvent ton salon, tes prestations et ta carte fidélité — tout en un lien.`
- **CTA principal** : `Voir mes statistiques`
- **CTA secondaire** : `Voir ma vitrine`
- **Signature** : `L'équipe Qarte`

#### firstBooking
- **Subject** : `{shopName}, ta 1ere resa en ligne`
- **Preview** : `{shopName}, ta première réservation en ligne !`
- **Heading** : `Ta première résa est arrivée !`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Une cliente vient de réserver en ligne depuis ta page. Et bonne nouvelle : elle a automatiquement reçu sa carte de fidélité.`
  - celebrationTitle: `Première réservation en ligne`
  - celebrationText: `Ton agenda se remplit tout seul, et tes clientes sont fidélisées dès la première visite.`
  - tipsTitle: `Pour en recevoir plus :`
  - tip1: `→ Partage le lien de ta page sur Instagram et WhatsApp`
  - tip2: `→ Ajoute le lien dans ta bio et tes stories`
  - tip3: `→ Dis à tes clientes : « Tu peux aussi réserver en ligne la prochaine fois »`
  - shareTitle: `Partage ta page`
  - shareText: `Plus ta page est visible, plus tu reçois de résas. Partage-la sur tes réseaux sociaux.`
- **CTA principal** : `Voir mes réservations`
- **CTA secondaire** : `Voir ma page`
- **Signature** : `L'équipe Qarte`

#### firstReward
- **Subject** : `{shopName}, 1ère récompense débloquée`
- **Preview** : `1ère récompense débloquée !`
- **Heading** : `Première récompense débloquée !`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Un de tes clients vient de débloquer sa première récompense. Ton programme de fidélité fonctionne !`
  - rewardTitle: `Récompense débloquée`
  - rewardLabel: `Récompense :`
  - impactTitle: `L'impact fidélité`
  - impactText: `Un client récompensé revient en moyenne 3x plus souvent. Tu viens de transformer un client occasionnel en client régulier.`
  - nextStepTitle: `Prochaine étape`
  - nextStepText: `Continue de proposer le scan à chaque passage. Plus tu as de clients fidélisés, plus ton chiffre d'affaires augmente.`
- **CTA** : `Voir mes statistiques`
- **Signature** : `L'équipe Qarte`

#### firstClientScript
- **Subject** : `La phrase exacte à dire à tes clientes`
- **Preview** : `La phrase exacte à dire à tes clientes`
- **Heading** : `La phrase exacte à dire`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ton programme est configuré mais aucun client n'a encore scanné. Voici comment lancer la machine :`
  - scriptTitle: `Le script qui marche`
  - scripts (par shop_type) :
    - scriptCoiffeur: `C'est tout bon ! Au fait, on a lancé une carte de fidélité digitale. Scannez ce QR code là, ça prend 5 secondes`
    - scriptBarbier: `C'est tout bon ! Au fait, on a lancé une carte de fidélité digitale. Scannez ce QR code là, ça prend 5 secondes`
    - scriptOnglerie: `Pendant que le vernis sèche, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes`
    - scriptInstitutBeaute: `Pendant qu'on pose le masque, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes`
    - scriptSpa: `Avant de repartir, scannez le QR code pour votre carte de fidélité — ça prend 5 secondes`
    - scriptEstheticienne: `Pendant la pause, vous voulez scanner le QR code pour la carte de fidélité ? Ça prend 5 secondes`
    - scriptTatouage: `Pendant la consultation, proposez à vos clients de scanner le QR code pour la carte de fidélité — ça prend 5 secondes`
    - scriptDefault: `Avant de partir, scannez le QR code pour la carte de fidélité — 5 secondes et c'est fait`
  - scriptSuffix: ` — après **{stampsRequired} passages** c'est **{rewardDescription}**{cagnotteSuffix}.`
  - scriptCagnotteSuffix: ` sur leurs dépenses`
  - tipsTitle: `Astuces bonus`
  - tip1: `→ Place le QR code à hauteur des yeux, près de la caisse`
  - tip2: `→ Propose le scan au moment du paiement (le client est déjà engagé)`
  - tip3: `→ Les 5 premiers clients sont les plus durs — après, ça roule tout seul`
- **CTA** : `Accéder à mon tableau de bord`
- **Signature** : `L'équipe Qarte`

#### day5Checkin
- **Subject** : `{shopName}, ta 1ère semaine`
- **Preview** : `{shopName}, ta 1ère semaine`
- **Heading** : `Ta première semaine`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - introWithScans: `Ça fait 5 jours que ton programme tourne et tu as déjà **{totalScans} scan{scansPlural}**. Beau début !`
  - introNoScans: `Ça fait 5 jours et aucun client n'a encore scanné. Pas de panique, voici comment débloquer tes premiers scans :`
  - tipsTitle: `Pour accélérer cette semaine :`
  - tip1: `→ Propose le scan à CHAQUE client (même les habituées)`
  - tip2: `→ Montre le QR code en disant "C'est gratuit et ça prend 5 secondes"`
  - tip3: `→ Objectif : 5 scans avant vendredi`
- **CTA** : `Voir mes statistiques`
- **Signature** : `L'équipe Qarte`

#### quickCheck
- **Subject** : `{shopName}, une question rapide`
- **Preview** : `{shopName}, une question rapide`
- **Heading** : `Une question rapide`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ton programme est configuré depuis quelques jours mais aucun client n'a encore scanné.`
  - question: `Qu'est-ce qui te bloque ?`
  - option1: `1. Je ne sais pas quoi dire à mes clients`
  - option2: `2. Le QR code n'est pas bien placé`
  - option3: `3. Je n'ai pas eu le temps`
  - option4: `4. Autre chose`
  - helpText: `Réponds simplement le numéro (ou raconte-nous), et on t'aide dans la journée.`
  - trialNote: `Il te reste **{daysRemaining} jour{daysPlural}** d'essai.`
- **CTA** : *(aucun explicite)*
- **Signature** : `L'équipe Qarte`

#### activationStalled
- **Subject** : `{shopName}, par quoi commencer en 3 min ?`
- **Preview** : `On te montre par où commencer — 3 min suffisent pour voir Qarte en action`
- **Heading** : `Par où commencer chez {shopName} ?`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ça fait quelques jours que ton essai a démarré. Si tu n'as pas encore eu le temps de tester, on comprend — on reçoit tous des semaines chargées. Voilà 3 merchants qui ont testé en moins d'une semaine :`
  - caseStudyTitle: `Ce qu'on voit chez les pros qui démarrent`
  - caseStudy1: `Configurer ton programme fidélité prend 3 minutes`
  - caseStudy2: `Activer la résa en ligne se fait en 5 minutes`
  - caseStudy3: `Publier ta vitrine Google prend 10 minutes avec photos`
  - pathIntro: `Le chemin le plus rapide pour toi, selon ton commerce :`
  - **path.fidelity** :
    - title: `Le chemin le plus rapide : la fidélité`
    - step1: `Choisis ta récompense (tampons ou cashback) — 30 sec`
    - step2: `Scanne ton QR code avec une cliente réelle — 1 min`
    - step3: `Offre sa 1re carte fidélité — fierté garantie`
  - **path.planning** :
    - title: `Le chemin le plus rapide : le planning`
    - step1: `Active le planning et configure tes horaires — 1 min`
    - step2: `Partage ton lien de résa sur Instagram — 30 sec`
    - step3: `Reçois ta 1re résa en ligne pendant que tu bosses`
  - **path.vitrine** :
    - title: `Le chemin le plus rapide : la vitrine`
    - step1: `Ajoute ton adresse + ta bio + 3 photos — 2 min`
    - step2: `Partage ton lien Qarte dans ta bio Instagram`
    - step3: `Google t'indexe en 24-48h`
  - help: `Bloqué quelque part ? Réponds à cet email, on te débloque en direct.`
- **CTA** : `Je commence maintenant`
- **Signature** : `L'équipe Qarte`

---

### D. Fin de trial + churn

#### trialEnding
- **Subjects** :
  - `trialEndingLastDayPromo` : `{shopName}, dernier jour pour garder tes clients`
  - `trialEndingLastDay` : `{shopName}, dernier jour d'essai`
  - `trialEndingDays` : `{shopName}, plus que {daysRemaining} jours`
  - `trialEndingS0` : `{shopName}, tester Qarte prend 10 min`
  - `trialEndingS1Fidelity` : `{shopName}, {customerCount} cliente fidélisée — plus que 2j`
  - `trialEndingS1Planning` : `{shopName}, {bookingCount} résas en ligne — plus que 2j`
  - `trialEndingS2` : `{shopName}, {customerCount} clientes — plus que 2j pour garder`
  - `trialEndingS3` : `{shopName} : {customerCount} clientes, {bookingCount} RDV — plus que 2j`
- **Preview** : `Tes clientes vont perdre leur carte de fidélité`
- **Heading** : `Tes clientes vont perdre leur carte`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ton essai gratuit se termine dans `
  - daysLabel: `{daysRemaining} jour{daysPlural}`
  - urgentMessage: `Le programme que tu as configuré, ta vitrine, tes données clients — tout sera désactivé. Tes clientes ne pourront plus scanner leur carte ni réserver.`
  - normalMessage: `Sans abonnement, le programme que tu as pris le temps de configurer sera désactivé. Tes clientes perdent leur carte, leurs points et leurs récompenses.`
  - lossWarning: `Ce que tes clientes perdent : leur carte de fidélité, leurs points cumulés, la réservation en ligne, les rappels SMS et leurs récompenses en cours.`
  - subscriptionLabel: `Abonnement Qarte`
  - priceOld: `24€/mois`
  - pricePromo: `24€` + suffix `/mois le 1er mois`
  - priceFull: `24€` + suffix `/mois`
  - promoLabel: `CODE PROMO`
  - promoNote: `-10€ sur ton premier mois`
  - priceNote: `Sans engagement • Annulable à tout moment`
  - tierIntro: `Choisis ton plan en fonction de ton usage. Tu peux changer à tout moment.`
  - tierRecommendedBadge: `Recommandé pour toi`
  - tierAllInName: `Tout-en-un` — `24€/mois ou 240€/an` — `Programme de fidélité + planning + résa en ligne + 100 SMS marketing/mois + campagnes SMS + programmes Membres VIP + jeu concours.`
  - tierFidelityName: `Fidélité seule` — `19€/mois ou 190€/an` — `Programme tampons/cagnotte + SMS anniversaire et parrainage envoyés automatiquement (inclus, sans quota) + vitrine SEO. Sans planning ni résa en ligne.`
  - statsLabel: `Tes résultats chez {shopName}`
  - statsCustomers: `cliente{plural}`
  - statsBookings: `résa{plural} en ligne`
  - socialProof: `400+ pros de la beauté fidélisent déjà avec Qarte.`
  - socialProofLink: `Voir leurs programmes →`
  - thankYou: `Merci de faire confiance à Qarte pour fidéliser tes clients.`
- **CTA promo** : `S'abonner — 24€/mois`
- **CTA no promo** : `Ajouter ma carte bancaire`
- **CTA tier** : `Choisir mon plan`
- **Signature** : `L'équipe Qarte`

#### trialExpired
- **Subjects** :
  - `trialExpiredPromo` : `{shopName}, -10€ pour réactiver ton compte`
  - `trialExpired` : `{shopName}, ton essai est terminé`
- **Preview** : `{shopName}, ton essai est terminé — tes clientes ne peuvent plus réserver`
- **Heading** : `Réactive en 30 secondes — tout est encore là`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ton compte Qarte est en pause. **Tes données sont en sécurité**, mais tes clientes ne peuvent plus réserver ni valider leurs passages.`
  - whatHappensTitle: `Ce que tu perds maintenant`
  - whatHappensText: `Réservations en ligne, programme fidélité, SMS de rappel, parrainage, cadeaux anniversaire et vitrine publique — tout est désactivé.`
  - dataRetention: `Tes données restent intactes pendant encore **{daysUntilDeletion} jour{daysPlural}**. Réactive quand tu veux, tout sera là.`
  - specialOfferTitle: `Offre spéciale pour toi`
  - specialOfferPrice: `24€/mois — sans engagement`
  - promoLabel: `CODE PROMO`
  - promoNote: `Utilise ce code lors du paiement`
  - helpTitle: `Réactive en 30 secondes`
  - helpText: `Ajoute ta carte, tout se rallume instantanément : réservations, SMS de rappel, fidélité.`
  - noCommitment: `Sans engagement, annulable à tout moment.`
  - questionText: `Des questions ? Réponds à cet email, on te répond rapidement.`
  - signaturePrefix: `À très vite,`
- **CTA** : `Réactiver mon compte — 24€/mois`
- **Signature** : `L'équipe Qarte`

#### gracePeriodSetup
- **Subject** : `{shopName}, on garde tes données encore {daysUntilDeletion} jours`
- **Preview** : `{shopName}, tes données seront supprimées dans {daysUntilDeletion} jours`
- **Heading** : `Réactive maintenant — tes données restent {daysUntilDeletion} jours`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ton essai est terminé et ton programme n'a jamais été configuré. **Tes données clients seront définitivement supprimées** si tu ne réactives pas.`
  - dataRetention: `Il te reste **{daysUntilDeletion} jour{daysPlural}** avant suppression.`
  - togetherTitle: `Réponds à cet email, on s'en occupe`
  - togetherText: `Dis-nous juste quelle récompense tu veux offrir (ex: "1 soin offert après 10 visites"). **On configure tout pour toi**.`
  - selfSetup: `Ou fais-le toi-même en 2 minutes :`
  - reassurance: `24€/mois, sans engagement. Réservations en ligne, SMS de rappel, fidélité, parrainage — tout est inclus.`
  - socialProof: `400+ pros ont déjà configuré leur programme en quelques minutes.`
  - socialProofLink: `Voir leurs programmes →`
  - signaturePrefix: `On est là pour toi,`
- **CTA** : `Configurer et réactiver`
- **Signature** : `L'équipe Qarte`

#### churnSurveyReminder
- **Subject** : `On rouvre ton compte {shopName} contre 2 min de feedback`
- **Preview** : `On rouvre ton compte {shopName} pour 2 min de feedback — et code promo si le prix t'a bloqué`
- **Heading** : `On a raté quelque chose avec {shopName}`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ton essai Qarte est terminé sans abonnement. On aimerait comprendre pourquoi — honnêtement. Ça nous aide à améliorer l'outil pour tous les salons.`
  - offerBadge: `En échange de ton temps`
  - offerTitle: `On rouvre ton compte jusqu'à 7 jours`
  - offerText: `Réponds à 4 questions (moins de 2 min) et on te rallume ton compte avec tes données intactes. Si le prix était le blocage, on ajoute un code promo -25% sur 3 mois.`
  - duration: `4 questions, moins de 2 minutes.`
  - questionText: `Une question ? Réponds directement à cet email, on te lit.`
  - signaturePrefix: `À très vite,`
- **CTA** : `Répondre et rouvrir mon compte`
- **Signature** : `L'équipe Qarte`

#### postSurveyFollowUp
- **Subjects** :
  - `postSurveyFollowUpLowerPrice` : `{shopName}, ton code -25% t'attend`
  - `postSurveyFollowUpLongerTrial` : `{shopName}, as-tu essayé le planning ?`
  - `postSurveyFollowUpTeamDemo` : `{shopName}, ta démo est passée ?`
  - `postSurveyFollowUpMoreFeatures` : `{shopName}, voici ce qu'on a ajouté`
  - `postSurveyFollowUpNothing` : `{shopName}, un dernier mot`
  - `postSurveyFollowUpLastDay` : `{shopName}, dernier jour de ton essai`
- **Greeting commun** : `Bonjour **{shopName}**,`
- **lastDayWarning** : `C'est ton dernier jour d'essai. Après ça, tes clientes perdent l'accès à leur carte et tes réservations en ligne sont désactivées.`
- **signaturePrefix** : `À très vite,`
- **Signature** : `L'équipe Qarte`

##### postSurveyFollowUp.lowerPrice
- Preview: `{shopName}, ton code promo -25% t'attend`
- Heading: `Ton code promo t'attend`
- Intro: `Tu nous as dit que le prix était un frein. On t'offre -25% sur tes 3 premiers mois.`
- promoLabel: `-25% pendant 3 mois` — promoCode: `3MOISQARTEPRO25`
- body: `Plus de 400 pros utilisent Qarte au quotidien pour 24€/mois — soit moins qu'une décoloration.`
- socialProof: `« J'hésitais aussi sur le prix, maintenant mes clientes réservent toutes seules et reviennent sans que je les relance. » — Salon Lucie, Paris`
- CTA: `Activer mon code promo`

##### postSurveyFollowUp.longerTrial
- Preview: `{shopName}, profite de tes jours bonus`
- Heading: `Profite de tes jours bonus`
- Intro: `Tu voulais plus de temps — c'est fait. As-tu essayé la réservation en ligne ? Le planning ? Les SMS de rappel ?`
- body: `Chaque fonctionnalité est pensée pour te faire gagner du temps et remplir ton agenda. Teste celles que tu n'as pas encore essayées — il te reste quelques jours.`
- CTA: `Explorer maintenant`

##### postSurveyFollowUp.teamDemo
- Preview: `{shopName}, ta démo est passée ?`
- Heading: `Ta démo, c'était comment ?`
- Intro: `Notre équipe t'a contacté pour une démo personnalisée. Si tu as des questions, réponds à cet email.`
- body: `En attendant, ton essai est toujours actif — tes clientes peuvent réserver et cumuler leurs points.`
- helpLine: `Pas eu la démo ? Réponds "démo" à cet email, on te rappelle.`
- CTA: `Accéder à mon dashboard`

##### postSurveyFollowUp.moreFeatures
- Preview: `{shopName}, voici ce qu'on a ajouté récemment`
- Heading: `Ce qu'on a ajouté récemment`
- Intro: `Tu attendais plus de fonctionnalités. Voici ce qui est nouveau sur Qarte :`
- body: `**Planning mode libre** — tes clientes réservent selon tes horaires d'ouverture. **SMS anniversaire** — un cadeau automatique le jour J. **Acomptes en ligne** — fini les no-show. **Parrainage** — tes clientes recrutent pour toi.`
- CTA: `Voir les nouveautés`

##### postSurveyFollowUp.nothing
- Preview: `{shopName}, un dernier mot`
- Heading: `Merci pour ton retour`
- Intro: `On comprend que Qarte ne soit pas pour tout le monde. Mais tes données clients sont encore là si tu changes d'avis.`
- body: `Ton programme de fidélité, tes réservations, ta vitrine — tout est intact pendant encore quelques jours.`
- socialProof: `« J'ai hésité aussi, maintenant mes clientes réservent toutes seules. » — Salon Lucie, Paris`
- CTA: `Revoir mon dashboard`

#### postSurveyLastChance
- **Subjects** :
  - `postSurveyLastChanceLowerPrice` : `{shopName}, ton code expire demain`
  - `postSurveyLastChance` : `{shopName}, tes données seront supprimées`
- **Greeting commun** : `**{shopName}**,`
- **urgentText** : `Tes clientes perdent l'accès à leur carte, tes réservations en ligne sont désactivées, ta vitrine disparaît de Google.`
- **reassurance** : `Sans engagement — annulable à tout moment.`
- **Signature** : `L'équipe Qarte`

##### postSurveyLastChance.lowerPrice
- Preview: `{shopName}, ton code -25% expire demain`
- Heading: `Dernier jour pour ton code -25%`
- Intro: `Ton essai bonus se termine aujourd'hui. Ton code promo **3MOISQARTEPRO25** ne sera plus valable demain.`
- promoLabel: `Dernière chance` — promoCode: `3MOISQARTEPRO25`
- CTA: `Activer mon code promo`

##### postSurveyLastChance.longerTrial
- Preview: `{shopName}, tes données seront supprimées`
- Heading: `C'est la fin de ton essai`
- Intro: `Tu avais demandé plus de temps. Le voilà écoulé. Si Qarte t'a convaincu, c'est maintenant.`
- CTA: `Réactiver mon compte`

##### postSurveyLastChance.teamDemo
- Preview: `{shopName}, tes données seront supprimées`
- Heading: `C'est la fin de ton essai`
- Intro: `Après la démo, tu as vu ce que Qarte peut faire pour ton salon. Si tu veux garder tout ça, c'est le moment.`
- CTA: `Réactiver mon compte`

##### postSurveyLastChance.moreFeatures
- Preview: `{shopName}, tes données seront supprimées`
- Heading: `C'est la fin de ton essai`
- Intro: `On a ajouté les fonctionnalités que tu attendais. Si tu veux en profiter, c'est maintenant.`
- CTA: `Réactiver mon compte`

##### postSurveyLastChance.nothing
- Preview: `{shopName}, tes données seront supprimées`
- Heading: `On se quitte ici ?`
- Intro: `Tes données clients sont encore là. Après demain, elles seront supprimées définitivement.`
- CTA: `Réactiver mon compte`

---

### E. Subscription management

#### subscriptionConfirmed
- **Subject** : `{shopName} - Ton abonnement Qarte est actif`
- **Preview** : `Ton abonnement Qarte est activé — SMS et réservations au max !`
- **Heading** : `Ton abonnement est actif !`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Merci pour ta confiance ! Ton abonnement est actif, tes **100 SMS/mois sont débloqués** — rappels, confirmations et anniversaires partent automatiquement.`
  - confirmTitle: `✓ Abonnement confirmé`
  - tierAllInName: `✓ Qarte Tout-en-un activé`
  - tierFidelityName: `✓ Qarte Fidélité activé`
  - planLabel: `Plan {planLabel}` — planAnnual: `Annuel` — planMonthly: `Mensuel`
  - nextBillingDate: `Prochain prélèvement le {date}`
  - nextBillingAnnual: `Prochain prélèvement dans 1 an`
  - nextBillingMonthly: `Prochain prélèvement dans 30 jours`
  - nfcTitle (mensuel): `La carte NFC Qarte — en option (20 €)`
  - nfcText (mensuel): `Passe commande via le bouton ci-dessous, ou en répondant à cet email. Livraison sous 7 jours.`
  - nfcCta: `Commander ma carte NFC — 20 €`
  - nfcTitleAnnual: `Ta carte NFC Qarte est offerte !`
  - nfcTextAnnual: `Avec ton abonnement annuel, ta carte NFC est incluse. On te l'envoie sous 7 jours. Rien à faire de ton côté !`
  - questionText: `Une question sur ton abonnement ? Réponds à cet email, on est là pour toi.`
  - referralTitle: `Gagne 10€ de réduction`
  - referralText: `Recommande Qarte à un(e) collègue pro : tu reçois **10 € de crédit**, ton filleul aussi.`
  - referralCodeLabel: `Ton code : **{referralCode}**`
  - referralHint: `Ton filleul communique ton code après inscription, le crédit s'applique à chacun.`
  - signaturePrefix: `Merci de ta confiance !`
- **CTA** : `Accéder à mon tableau de bord`
- **Signature** : `L'équipe Qarte`

#### subscriptionCanceled
- **Subject** : `{shopName} - Confirmation de résiliation`
- **Preview** : `{shopName} - Confirmation de résiliation`
- **Heading** : `Ton abonnement a été résilié`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `On confirme la résiliation de ton abonnement Qarte.`
  - summaryTitle: `Récapitulatif`
  - accessEndDate: `Ton accès prendra fin le **{endDate}**.`
  - accessEndCurrent: `Ton accès prendra fin à la fin de ta période en cours.`
  - afterEndDate: `Après cette date, ton compte sera suspendu et tes clients ne pourront plus valider leurs passages.`
  - dataTitle: `Tes données`
  - dataRetention: `Conformément au RGPD, tes données seront conservées pendant 30 jours après la fin de ton abonnement. Passé ce délai, elles seront définitivement supprimées.`
  - dataContact: `Si tu souhaites récupérer tes données ou demander leur suppression anticipée, contacte-nous à support@getqarte.com.`
  - comeBackTitle: `Envie de revenir ?`
  - comeBackText: `Si tu changes d'avis, tu peux réactiver ton compte à tout moment. Tes données et tes clients seront toujours là.`
  - feedbackText: `Une minute pour nous aider ? Dis-nous juste ce qui t'a bloquée. Réponds à cet email, ça nous aide à améliorer Qarte.`
  - signaturePrefix: `Merci d'avoir utilisé Qarte,`
- **CTA** : `Réactiver mon abonnement`
- **Signature** : `L'équipe Qarte`

#### subscriptionReactivated
- **Subject** : `{shopName} - Ton abonnement est maintenu`
- **Preview** : `{shopName} - Ton abonnement est maintenu !`
- **Heading** : `Ton abonnement est maintenu`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Bonne nouvelle ! Ta demande de résiliation a bien été annulée. Ton abonnement Qarte reste actif sans interruption.`
  - confirmTitle: `✓ Abonnement actif`
  - confirmDetail: `Résiliation annulée`
  - confirmNote: `Ton accès continue normalement, aucune action requise`
  - featuresTitle: `Tes clientes retrouvent tout :`
  - feature1: `✓ Elles réservent en ligne depuis ta page`
  - feature2: `✓ Elles cumulent leurs points fidélité`
  - feature3: `✓ Elles reçoivent les rappels SMS et cadeaux anniversaire`
  - feature4: `✓ Le parrainage et les offres tournent en automatique`
  - feature5: `✓ Ta vitrine est visible sur Google`
  - thankYou: `Merci de ta confiance ! Si tu as des questions, réponds simplement à cet email.`
  - referralTitle: `Gagne 10€ de réduction`
  - referralText: `Recommande Qarte à un(e) collègue pro : tu reçois **10 € de crédit**, ton filleul aussi.`
  - referralCodeLabel: `Ton code : **{referralCode}**`
  - referralHint: `Ton filleul communique ton code après inscription, le crédit s'applique à chacun.`
- **CTA** : `Voir mon tableau de bord`
- **Signature** : `L'équipe Qarte`

#### paymentFailed (4 steps)

##### paymentFailed.step1
- **Subject** : `Un souci avec ta carte`
- **Preview** : `{shopName} — petit souci de paiement`
- **Heading** : `Petit souci avec ton paiement`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `On n'a pas pu traiter ton dernier paiement pour ton abonnement Qarte. Pas de panique — on réessaie automatiquement dans quelques jours.`
  - whyTitle: `Pourquoi ?`
  - whyText: `Carte expirée, fonds insuffisants ou blocage bancaire. Une simple mise à jour de ta carte règle le problème.`
  - helpText: `Si tout est OK côté banque, tu peux ignorer cet email — on réessaie bientôt.`
- **CTA** : `Ajouter ma nouvelle carte — 30 secondes`
- **Signature** : `L'équipe Qarte`

##### paymentFailed.step2
- **Subject** : `{shopName}, paiement toujours en attente`
- **Preview** : `{shopName} — rappel : paiement en attente`
- **Heading** : `Ton paiement est toujours en attente`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ton paiement a échoué à nouveau. Tes clientes attendent leur carte — mets à jour ta carte maintenant.`
  - helpText: `Un problème avec ta banque ? Réponds à cet email, on t'aide.`
- **CTA** : `Ajouter ma nouvelle carte`

##### paymentFailed.step3
- **Subject** : `{shopName}, ton compte sera suspendu dans 3 jours`
- **Preview** : `{shopName} — ton compte sera suspendu dans 3 jours`
- **Heading** : `Ton compte sera suspendu dans 3 jours`
- **Body** :
  - Greeting: `**{shopName}**,`
  - intro: `Ton paiement a échoué plusieurs fois. Sans mise à jour, ton compte sera suspendu et tes clients ne pourront plus scanner leur carte de fidélité.`
  - urgentText: `Tes clients ne pourront plus accéder à leur carte, valider leurs passages, ni utiliser leurs récompenses.`
  - helpText: `Besoin d'aide ? Réponds directement à cet email.`
- **CTA** : `Régler maintenant`

##### paymentFailed.step4
- **Subject** : `{shopName}, dernier jour avant suspension`
- **Preview** : `{shopName} — dernier jour avant suspension`
- **Heading** : `Dernier jour avant suspension`
- **Body** :
  - Greeting: `**{shopName}**,`
  - intro: `C'est le dernier jour. Sans mise à jour de ta carte, ton compte Qarte sera suspendu demain matin.`
  - urgentText: `Programme de fidélité, réservations, vitrine en ligne — tout sera désactivé dès demain. Tes clients perdent l'accès.`
  - helpText: `Si tu as changé de banque ou de carte, ça prend 30 secondes.`
- **CTA** : `Régler maintenant — 30 secondes`

---

### F. Post-checkout re-engagement

#### inactiveDay7
- **Subject** : `{shopName}, tout va bien ?`
- **Preview** : `{shopName}, tout va bien ?`
- **Heading** : `Tout va bien ?`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `On a remarqué que tes clients n'utilisent pas encore ton programme de fidélité.`
  - question: `Qu'est-ce qui te bloque ?`
  - optionBusy: `Je suis débordé(e) → active la réservation en ligne, tes clientes prennent rendez-vous toutes seules`
  - optionDontKnow: `Je ne sais pas comment présenter ça → on a préparé un script prêt à l'emploi pour chaque type de salon`
  - optionLater: `Je veux le faire plus tard → pense au parrainage et aux cadeaux anniversaire, ça fidélise sans effort`
  - helpText: `Réponds simplement à cet email, on est là pour t'aider.`
- **CTA** : `Accéder à mon tableau de bord`
- **Signature** : `L'équipe Qarte`

#### inactiveDay14
- **Subject** : `{shopName}, tu n'as plus scanné depuis 14j`
- **Preview** : `Comment fidéliser tes clients`
- **Heading** : `Fidélise tes clients en 3 minutes`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Ça fait deux semaines que tu as Qarte. Voici comment tes concurrents fidélisent déjà leurs clients :`
  - competitorTitle: `Ce que font les pros autour de toi`
  - competitorText: `Les pros autour de toi reçoivent des résas 24/7 via leur vitrine, fidélisent avec un scan et envoient les cadeaux anniversaire en automatique. Résultat : +47% de clientes qui reviennent.`
  - yourProgram: `Ton programme actuel`
  - rewardLabel: `Récompense : {rewardDescription}`
  - stampsLabel: `Après {stampsRequired} passages`
- **CTA** : `Lancer mon programme`
- **Signature** : `L'équipe Qarte`

#### inactiveDay30
- **Subject** : `{shopName}, on rouvre la conversation`
- **Preview** : `On a pas réussi à te montrer la valeur ce mois-ci — 2 options concrètes pour toi`
- **Heading** : `On rouvre la conversation, {shopName}`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Honnêtement : on a pas réussi à te montrer la valeur de Qarte ce mois-ci. On aimerait savoir pourquoi, et te proposer 2 options concrètes.`
  - optionsTitle: `2 options, tu choisis`
  - option1TitleFidelity: `1. Passer à Tout-en-un pour tester plus`
  - option1DescFidelity: `Si tu veux activer résa en ligne + SMS marketing + planning, tu peux upgrader (+5€/mois, prorata auto).`
  - option1TitleAllIn: `1. Downgrade en Fidélité (24 → 19€)`
  - option1DescAllIn: `Si tu n'utilises pas le planning ni les SMS marketing, le plan Fidélité te suffit et te coûte 5€ de moins par mois.`
  - option2Title: `2. 30 min avec moi pour débloquer`
  - option2Desc: `Gratuit. On débloque ensemble ce qui te gêne — config, cas concret sur ton commerce, questions.`
  - helpText: `Ou réponds simplement à cet email. On te lit dans la journée.`
- **CTA** : `Gérer mon abonnement`
- **Signature** : `L'équipe Qarte`

#### vitrineReminder
- **Subject** : `{shopName}, tes futures clientes te cherchent sur Google`
- **Preview** : `Les salons visibles sur Google reçoivent 3x plus de réservations`
- **Heading** : `73% des clientes cherchent un salon sur Google`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Tu as configuré ton programme de fidélité — bravo ! Mais tes futures clientes ne le savent pas encore. Les salons qui complètent leur vitrine Qarte apparaissent sur Google et reçoivent en moyenne 3 fois plus de demandes.`
  - featureTitle: `Ce que voient tes futures clientes`
  - featureDesc: `Tes prestations, tes tarifs, tes photos, tes horaires et tes avis — tout sur une seule page. Elles te trouvent, elles réservent. 2 minutes pour tout compléter.`
  - trialNote: `Il te reste **{daysRemaining} jour{daysPlural}** d'essai.`
- **CTA** : `Rendre mon salon visible`
- **Signature** : `L'équipe Qarte`

#### planningReminder
- **Subject** : `{shopName}, tes clientes veulent réserver en ligne`
- **Preview** : `Marie de L'Atelier a reçu 12 résas en 1 semaine`
- **Heading** : `Tes clientes veulent réserver à 23h`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `60% des réservations en ligne sont faites en dehors des heures d'ouverture. Tes clientes veulent réserver le soir depuis leur canapé — pas t'appeler pendant que tu as les mains dans le shampoing.`
  - featureTitle: `Comment ça marche`
  - featureDesc: `Tu définis tes horaires ou tes créneaux. Tes clientes réservent depuis ta page. Tu reçois une notif. L'acompte est sécurisé automatiquement.`
  - bonusTitle: `Bonus`
  - bonusDesc: `Chaque cliente qui réserve reçoit **automatiquement sa carte de fidélité**. Tu remplis ton agenda et tu fidélises en même temps.`
  - trialNote: `Il te reste **{daysRemaining} jour{daysPlural}** d'essai.`
- **CTA** : `Recevoir mes premières résas`
- **Signature** : `L'équipe Qarte`

#### winBack
- **Subject** : `{shopName} — on a tout changé, reviens voir`
- **Preview** : `On a tout changé depuis ton départ — reviens voir`
- **Heading** : `On a bien changé depuis ton départ`
- **Body** :
  - Greeting: `Salut **{shopName}**,`
  - intro: `Ça fait un moment qu'on ne s'est pas vus. On n'a pas chômé depuis — voici ce qui est nouveau sur Qarte.`
  - feature1Title: `Ta vitrine en ligne` — Desc: `Ton salon a maintenant sa propre page pro : prestations, photos, horaires, avis Google. Un seul lien pour ta bio Instagram.`
  - feature2Title: `Réservation + SMS automatiques` — Desc: `Tes clientes réservent en ligne, reçoivent un SMS de confirmation instantané et un rappel la veille. Zéro no-show.`
  - feature3Title: `Anniversaires et parrainage` — Desc: `Cadeaux anniversaire envoyés tout seuls. Parrainage en un clic — chaque cliente t'en ramène une autre.`
  - socialProof: `Plus d'un millier de pros de la beauté utilisent Qarte au quotidien.`
  - reassurance: `Tes données clients sont toujours là. Rien n'a été supprimé. Sans engagement — annulable à tout moment.`
- **CTA** : `Réactiver mon compte`
- **Signature** : `L'équipe Qarte`

#### announcementMaPage
- **Subject** : `{shopName}, découvre ce qu'on a préparé pour toi`
- **Preview** : `{shopName}, découvre ce qu'on a préparé pour toi`
- **Heading** : `On a quelque chose pour toi`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Qarte, ce n'est plus seulement un programme de fidélité. C'est maintenant un vrai outil pour **attirer de nouveaux clients** et développer ton activité. Voici ce qui est nouveau :`
  - feature1Title (badge Nouveau): `Ta vitrine en ligne est prête`
  - feature1Desc: `Chaque commerce sur Qarte a désormais sa propre page publique : tes prestations, tes tarifs, tes photos, tes réseaux sociaux et un lien de réservation. Le tout optimisé pour Google. Un seul lien à partager, et tes futurs clients te trouvent en un clic.`
  - feature1Cta: `Voir ma vitrine`
  - feature2Title (badge Acquisition): `Offre nouveaux clients : attire de nouveaux clients`
  - feature2Desc: `Propose une offre spéciale aux nouveaux clients qui découvrent ta page — par exemple « -20 % sur la 1ère visite ». Ils s'inscrivent, reçoivent leur bon, et viennent chez toi. Tout est automatique.`
  - feature2Cta: `Activer l'offre nouveaux clients`
  - summaryTitle: `Fidéliser + attirer = un seul outil`
  - summaryText: `Programme de fidélité, parrainage, offre nouveaux clients, vitrine en ligne… Qarte te donne tout ce qu'il faut pour garder tes clients et en attirer de nouveaux. Tout ça dans un seul abonnement.`
  - resubscribeTitle: `Tu n'es plus abonné(e) ?`
  - resubscribeText: `On a ajouté beaucoup de nouveautés depuis ton départ. C'est le moment idéal pour revenir et profiter de tout ce que Qarte peut apporter à ton commerce.`
  - resubscribeCta: `Se réabonner maintenant`
- **Signature** : `L'équipe Qarte`

---

### G. Périodiques

#### weeklyDigest
- **Subject** : `{shopName} — ta semaine`
- **Preview** : `{shopName} — ta semaine`
- **Heading** : `Ton bilan de la semaine`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - scansLabel: `Scans cette semaine`
  - newCustomersLabel: `Nouveaux clients`
  - rewardsLabel: `Récompenses débloquées`
  - totalCustomersLabel: `Total clients fidélisés`
  - goodWeek: `Belle semaine ! Continue sur cette lancée.`
  - noScans: `Pas de scans cette semaine. Pense à proposer le scan à chaque client !`
- **CTA** : `Voir mon tableau de bord`
- **Signature** : `L'équipe Qarte`

#### productUpdate
- **Subject** : `{shopName}, découvre les nouveautés Qarte de la semaine`
- **Preview** : `{shopName}, découvre les nouveautés Qarte`
- **Heading** : `Les nouveautés de la semaine`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - introBody: `On a travaillé dur ces derniers jours pour te donner encore plus d'outils. Voici ce qui est nouveau :`
  - feature1Title (Nouveau): `Planning et disponibilités` — Desc: `Tes clientes voient tes créneaux libres directement sur ta page. Plus besoin de gérer les messages pour les rendez-vous.` — CTA: `Activer le planning`
  - feature2Title: `Mode cagnotte` — Desc: `Tes clientes dépensent des montants différents ? Le mode cagnotte calcule un cashback proportionnel. Plus juste, plus motivant.` — CTA: `Découvrir la cagnotte`
  - feature3Title: `Offre nouveaux clients` — Desc: `Propose une réduction aux nouvelles clientes qui découvrent ta page. Elles s'inscrivent, reçoivent leur bon, et viennent chez toi.` — CTA: `Activer l'offre`
  - blogLabel: `Sur le blog`
  - blogTitle: `Quel logiciel de réservation en ligne choisir pour ton salon en 2026 ?`
  - blogDesc: `Planity, Treatwell, Booksy, Qarte : le comparatif honnête des 4 logiciels qui dominent le marché.`
  - blogLink: `Lire l'article →`
  - referralTitle: `Recommande Qarte, gagne 10€`
  - referralText: `Tu connais un(e) commerçant(e) dans la beauté ? Recommande-lui Qarte et recevez chacun **10€ de réduction** sur ton prochain mois.`
  - referralCodeLabel: `Ton code : **{referralCode}**`
  - referralHint: `Ton filleul nous communique ton code après son inscription et la réduction est appliquée à chacun.`
- **Signature** : `L'équipe Qarte`

#### socialProof
- **Subject** : `{shopName}, comment Elodie a doublé ses clientes régulières`
- **Preview** : `Comment Elodie a doublé ses clientes régulières avec Qarte`
- **Heading** : `Elles ont lancé Qarte. Voici ce qui s'est passé.`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Tu es en plein essai. Voici comment des pros comme toi utilisent Qarte — vitrine, réservation et fidélité — et les résultats qu'elles obtiennent.`
  - caseStudyBadge: `Étude de cas`
  - caseStudyTitle: `Comment **Nail Salon by Elodie** a doublé ses clientes régulières`
  - caseStudyQuote: `Mes clientes me trouvent sur Google, réservent en ligne depuis ma page, et reçoivent leur carte de fidélité automatiquement. Je ne fais plus rien à la main.`
  - caseStudyAuthor: `Elodie — Onglerie professionnelle`
  - resultsTitle: `Résultats après 6 mois :`
  - result1: `→ x2 clientes régulières grâce à la fidélité automatique`
  - result2: `→ 12 résas/semaine via sa vitrine en ligne`
  - result3: `→ 4.9/5 sur Google — les avis tombent tout seuls après chaque passage`
  - testimonial1: `J'utilise Qarte pour gérer les cartes de fidélité de mes clients et c'est vraiment top. Avant, ils perdaient souvent leurs cartes papier, maintenant tout est simple et digital. J'ai aussi pu créer une petite vitrine pour présenter mon salon de coiffure, ce qui m'aide beaucoup car je n'ai pas encore de site internet.`
  - testimonial1Author: `Farida T. — Salon de coiffure`
  - testimonial2: `Je suis très contente de Qarte pour gérer les rendez-vous de mon institut. Très pratique et facile d'utilisation, c'est un réel plus pour moi pour fidéliser mes clientes.`
  - testimonial2Author: `Elodie H. — Institut de beauté`
  - closing: `Vitrine, réservation, fidélité — tout est déjà prêt pour toi. Il ne manque plus que tes clientes.`
- **CTA** : `Continuer ma configuration`
- **Signature** : `L'équipe Qarte`

---

### H. Upgrade & gamification

#### upgradeAllIn (templated par trigger)
- **Subjects** :
  - `upgradeAllInSmsBlocked` : `{shopName}, ta campagne SMS est prête — débloque-la`
  - `upgradeAllInBookingRequest` : `{shopName}, {context} clientes ont demandé la résa en ligne`
- **Greeting commun** : `Bonjour **{shopName}**,`
- **Body commun** :
  - pivot: `Passe au plan Tout-en-un pour débloquer toutes les features.`
  - diffTitle: `Ce que tu débloques en passant Tout-en-un`
  - diffBooking: `Réservation en ligne 24/7 (planning intégré)`
  - diffMarketingSms: `Campagnes SMS marketing (100 SMS/mois inclus)`
  - diffPlanning: `Planning pro avec gestion des créneaux`
  - diffVipPrograms: `Programmes Membres VIP + jeu concours`
  - priceText: `Tout-en-un : 24€/mois (au lieu de 19€)`
  - prorataNote: `Prorata appliqué sur ton mois en cours — tu paies seulement la différence aujourd'hui.`
  - escape: `Rester sur Fidélité pour le moment`
- **CTA** : `Passer à Tout-en-un`
- **Signature** : `L'équipe Qarte`

##### triggers.sms_campaign_blocked
- Preview: `Ta campagne SMS marketing est prête à partir — 1 clic pour l'activer`
- Heading: `Ta campagne SMS est prête à partir`
- Hook: `Tu as tenté d'envoyer une campagne SMS marketing chez {shopName}. Cette feature fait partie du plan Tout-en-un.`

##### triggers.booking_request_manual
- Preview: `{context} clientes veulent réserver en ligne chez toi`
- Heading: `{context} clientes ont demandé la résa en ligne`
- Hook: `Plusieurs clientes ont voulu prendre RDV en ligne chez {shopName} mais la feature résa n'est pas active dans ton plan actuel.`

#### tier2Upsell
- **Subject** : `Tes meilleurs clients méritent plus`
- **Preview** : `Tes meilleurs clients méritent plus`
- **Heading** : `Récompense tes meilleurs clients`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Tu as **{totalCustomers} clients** fidélisés. Il est temps de chouchouter tes meilleurs clients avec un palier VIP.`
  - whatIsTitle: `Le palier VIP, c'est quoi ?`
  - whatIsText: `Un deuxième niveau de récompense pour tes clients les plus fidèles. Ils débloquent un cadeau encore plus généreux.`
  - currentReward: `Ta récompense actuelle : {rewardDescription}`
- **CTA** : `Activer le palier VIP`
- **Signature** : `L'équipe Qarte`

#### challengeCompleted
- **Subject** : `{shopName}, défi réussi — tes codes promo sont prêts`
- **Preview** : `{shopName}, défi réussi !`
- **Heading** : `Défi réussi !`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Tu as relevé le défi des 5 clients en 3 jours. Bravo !`
  - promoTitle: `Ton cadeau`
  - promoText: `Utilise le code ci-dessous pour bénéficier de ta réduction :`
  - promoLabel: `CODE PROMO`
  - monthlyPromoValue: `**24€/mois** sans engagement`
  - promoExpiry: `Valable **24 heures seulement**`
  - annualOfferLabel: `Offre annuelle`
  - annualPromoValue: `**20€ de réduction** sur l'abonnement annuel`
  - annualDetail: `240€/an — soit **20€/mois**`
  - recapTitle: `Ce que tu as déjà accompli :`
  - recapItem1: `Ton programme de fidélité est en ligne`
  - recapItem2: `5 clients fidélisés en 3 jours`
  - recapItem3: `Tes clients reviendront d'eux-mêmes`
  - keepMomentum: `Ne laisse pas retomber cette dynamique — active ton abonnement maintenant et continue à fidéliser tes clients sans interruption.`
  - urgencyText: `Ces codes expirent dans **24h**. Après ça, l'abonnement sera au tarif normal.`
  - helpLine: `Une question ? Réponds à cet email.`
- **CTA** : `Accéder à mon tableau de bord`
- **Signature** : `L'équipe Qarte`

---

### I. Transactionnels merchant

#### birthdayNotification
- **Subject** : `Anniversaire client{plural} aujourd'hui`
- **Preview** : `Anniversaire client{plural} aujourd'hui`
- **Heading** : `Anniversaire{plural} du jour`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - introSingle: `Un de tes clients fête son anniversaire aujourd'hui :`
  - introPlural: `{count} de tes clients fêtent leur anniversaire aujourd'hui :`
  - giftLabel: `Cadeau à offrir`
  - reminderText: `N'oublie pas de leur souhaiter un bon anniversaire lors de leur prochaine visite !`
  - smsConfirmTitle: `Un SMS a été envoyé à ton/ta client(e) :`
  - smsPreview: `{clientName}, joyeux anniversaire ! {shopName} vous offre : {giftDescription}. Rendez-vous vite pour en profiter !`
  - smsConfirmNote: `Ton/ta client(e) n'oubliera pas ce geste. C'est un(e) client(e) fidélisé(e) pour longtemps.`
  - smsUpsell: `Abonne-toi et tes clients recevront un SMS d'anniversaire automatiquement le jour J — 0 effort, 100% fidélisation.`
- **CTA** : `Voir mes clients`
- **Signature** : `L'équipe Qarte`

#### pendingPoints
- **Subjects** :
  - `pendingPoints` : `{shopName} - {pendingCount} point{plural} à modérer`
  - `pendingPointsReminder` : `{shopName} - Rappel : {pendingCount} point{plural} en attente`
- **Preview** : `{shopName} - {pendingCount} point{plural} à modérer`
- **Heading** : `{pendingCount} point{plural} en attente`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - introNew: `Qarte Shield a détecté {pendingCount} passage{plural} suspect{plural} qui nécessite{verbPlural} ta validation.`
  - introReminder: `Rappel : tu as toujours {pendingCount} point{plural} en attente de modération depuis {daysSinceFirst} jour{daysPlural}.`
  - helpText: `Ces points seront automatiquement refusés après 7 jours sans action.`
- **CTA** : `Modérer les passages`
- **Signature** : `L'équipe Qarte`

#### smsQuotaWarning
- **Subject** : `{shopName}, tu approches de ta limite SMS ce mois`
- **Preview** : `{shopName}, tu approches de ta limite SMS ce mois`
- **Heading** : `Tu approches de ta limite SMS`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Tu as déjà envoyé 80 SMS sur les 100 inclus dans ton abonnement ce mois.`
  - statusTitle: `Ce qui peut arriver`
  - statusBody: `Si tu atteins 100 SMS sans pack, tous tes envois seront suspendus (rappels RDV, confirmations, marketing). Anticipe avec un pack — crédits valables tout au long de ton abonnement.`
  - footer: `Packs dès 5,70€ TTC (50 SMS). Pas d'engagement.`
- **CTA** : `Acheter un pack SMS`
- **Signature** : `L'équipe Qarte`

#### smsQuotaReached
- **Subject** : `{shopName}, quota SMS atteint — envois suspendus`
- **Preview** : `{shopName}, quota SMS atteint — envois suspendus`
- **Heading** : `Quota SMS atteint — envois suspendus`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Tu as atteint la limite des 100 SMS inclus ce mois. Tous tes envois (rappels, confirmations, marketing) sont temporairement suspendus.`
  - statusTitle: `Comment débloquer ?`
  - statusBody: `Achète un pack SMS : les crédits sont valables tout au long de ton abonnement et débloquent immédiatement tes envois.`
  - footer: `Packs dès 5,70€ TTC (50 SMS). Activation immédiate.`
- **CTA** : `Débloquer mes envois`
- **Signature** : `L'équipe Qarte`

---

### J. Référence (data tables)

#### rewardIdeas (suggestions par shop_type — utilisé par programReminderDay2 / autoSuggestReward)
| shop_type | reward | visits |
|---|---|---|
| coiffeur | `1 brushing offert` | `8 visites` |
| barbier | `1 coupe offerte` | `8 visites` |
| onglerie | `1 pose semi-permanent offerte` | `10 passages` |
| institutBeaute | `1 soin visage offert` | `10 séances` |
| spa | `1 soin visage offert` | `10 séances` |
| estheticienne | `1 séance offerte` | `10 rendez-vous` |
| tatouage | `1 retouche offerte` | `8 séances` |
| restaurant | `1 dessert offert` | `5 repas` |
| boulangerie | `1 viennoiserie offerte` | `8 passages` |
| cafe | `1 boisson offerte` | `8 passages` |
| default | `1 prestation offerte` | `10 passages` |

#### baseLayout (footer commun à tous les emails)
- allRightsReserved: `© {year} Qarte. Tous droits réservés.`
- address: `Qarte — 58 rue de Monceau, 75380 Paris, France`
- website: `Site web` — contact: `Contact` — privacy: `Confidentialité` — unsubscribe: `Se désinscrire des emails`

---

### K. Réactivation post-résiliation

#### reactivation
- **Subjects** (4 variantes selon le stade) :
  - `reactivationPromoLong` : `{shopName} - Dernière chance de revenir sur Qarte`
  - `reactivationPromo` : `{shopName} - Reviens sur Qarte`
  - `reactivationEarly` : `{shopName} - Tes {totalCustomers} clients n'ont plus accès à leur carte`
  - `reactivationEarlyGeneric` : `{shopName} - Tes clients n'ont plus accès à leur carte`
  - `reactivationMid` : `{shopName} - Reviens, tes données sont encore là`
  - `reactivationLate` : `{shopName} - Dernière chance avant suppression de tes données`
- **Preview** : `{shopName}, tes clients t'attendent`
- **Heading** : `Tes clients t'attendent`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - clientsNoAccess: `Tes {totalCustomers} clients n'ont plus accès à leur carte de fidélité.`
  - clientsNoAccessGeneric: `Tes clients n'ont plus accès à leur carte de fidélité.`
  - dataStillHere: `Tes données sont encore là. Réactive ton compte pour reprendre où tu en étais — réservations en ligne, SMS de rappel, fidélité, parrainage et cadeaux anniversaire.`
  - lastChance: `Dernière chance : tes données seront supprimées prochainement.`
  - noCommitment: `Sans engagement, annulable à tout moment.`
- **CTA** : `Réactiver mon compte`
- **Signature** : `L'équipe Qarte`

---

### L. Référral

#### referralPromo
- **Subject** : `Gagne 10 € pour chaque pro que tu recommandes`
- **Preview** : `{shopName}, gagne 10 € pour chaque pro que tu recommandes`
- **Heading** : `Recommande Qarte, gagne 10 €`
- **Body** :
  - Greeting: `Bravo **{shopName}**,`
  - intro: `Ton abonnement est actif et ton salon tourne sur Qarte. Tu connais surement d'autres pros autour de toi qui galèrent avec leur fidélisation ou leur visibilité. Partage Qarte avec eux — tu y gagnes aussi.`
  - rewardTitle: `Pour chaque pro inscrit`
  - rewardDetail: `crédités sur ton prochain mois`
  - howItWorks: `Comment ça marche :`
  - step1: `Partage ton lien perso avec un(e) collègue, un(e) ami(e) pro, ou dans un groupe WhatsApp.`
  - step2: `Il/elle s'inscrit sur Qarte via ton lien.`
  - step3: `Tu reçois 10 € de crédit sur ton abonnement.`
  - linkLabel: `Ton lien de parrainage`
  - closing: `Pas de limite : plus tu recommandes, plus tu économises. Merci de faire grandir Qarte avec nous.`
- **CTA** : `Copier mon lien`
- **Signature** : *(non spécifiée — fallback baseLayout)*

#### referralReminder
- **Subject** : `{shopName}, 10 € t'attendent`
- **Preview** : `{shopName}, 10 € t'attendent`
- **Heading** : `10 € t'attendent`
- **Body** :
  - Greeting: `Bonjour **{shopName}**,`
  - intro: `Tu connais sûrement une collègue ou amie pro qui cherche à fidéliser ses clientes ou être plus visible en ligne. Partage ton lien — tu gagnes 10 € pour chaque pro qui s'inscrit.`
  - rewardDetail: `par pro inscrit via ton lien`
  - linkLabel: `Ton lien de parrainage`
- **CTA** : `Partager mon lien`
- **Signature** : `L'équipe Qarte`

---

### M. Anomalies & notes

- **Subjects sans namespace correspondant** :
  - `firstClientScript`, `quickCheck`, `weeklyDigest`, `tier2Upsell`, `incompleteSignup`, `guidedSignup`, `referralPromo`, `socialProof`, `programReminderDay2`, `programReminderDay3`, `inactiveDay7`, `inactiveDay14`, `inactiveDay30`, `qrCode`, `firstScan`, `firstBooking`, `firstReward`, `day5Checkin`, `productUpdate`, `autoSuggestReward`, `vitrineReminder`, `planningReminder`, `gracePeriodSetup`, `birthdayNotification`, `announcementMaPage`, `winBack`, `churnSurveyReminder`, `subscriptionConfirmed`, `subscriptionCanceled`, `subscriptionReactivated` → tous ont leur namespace ✓
- **Namespaces sans subject direct dans `subjects`** :
  - `lastChanceSignup` (template d'email mais pas de clé dédiée dans `subjects`)
  - `setupForYou` (idem)
  - `programReminder` (a `programReminder` dans `subjects` ✓)
  - `paymentFailed` n'a pas de subject "step1" — utilise le subject racine `paymentFailed` (`Un souci avec ta carte`)
  - `rewardIdeas`, `baseLayout` : data structures, pas d'email (normal)
  - `upgradeAllIn` : pas de subject dédié (utilise `upgradeAllInSmsBlocked` / `upgradeAllInBookingRequest` selon trigger)
  - `postSurveyFollowUp` / `postSurveyLastChance` : subjects mappés par variante (`postSurveyFollowUpLowerPrice` etc.)
- **Parité FR/EN** : le fichier EN (`en.ts`) a strictement les mêmes namespaces (vérifié, même nombre de lignes 1046).

