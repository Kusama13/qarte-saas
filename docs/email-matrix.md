# Matrice des emails Qarte

> Derniere mise a jour : 14 avril 2026
> Source : `src/lib/email.ts`, `src/app/api/cron/morning/route.ts`, `src/emails/translations/fr.ts`

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

Envoyes uniquement via le **cron morning** aux merchants actifs (trial/active).

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
