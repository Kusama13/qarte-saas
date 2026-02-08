# Emails Qarte SaaS - Inventaire complet

## Crons (vercel.json)

| Cron | Horaire | Route |
|------|---------|-------|
| Morning | 09:00 UTC (tous les jours) | `/api/cron/morning` |
| Evening | 17:00 UTC (tous les jours) | `/api/cron/evening` |
| Reactivation | 10:00 UTC (tous les jours) | `/api/cron/reactivation` |

---

## Parcours Signup (temps reel)

| # | Email | Declencheur | Quand | Destinataire | Sujet |
|---|-------|-------------|-------|--------------|-------|
| 1 | **IncompleteSignupEmail** | Phase 1 signup (email + mdp) | J+0, **+15 min** (programme via Resend) | Commercant | "Votre compte Qarte est presque pret — il ne reste que 30 secondes" |
| 2 | **WelcomeEmail** | Phase 2 signup (creation merchant) | J+0, **immediat** | Commercant | "Bienvenue sur Qarte, {shopName}" |
| 3 | **NewMerchantNotification** | Phase 2 signup (creation merchant) | J+0, **immediat** (+600ms apres welcome) | Admin (sales@getqarte.com) | "Nouveau commercant inscrit : {shopName}" |

> L'email #1 est automatiquement annule si le signup est complete avant les 15 min.

---

## Onboarding - Programme non configure (cron morning 09:00)

| # | Email | Condition | Quand | Sujet |
|---|-------|-----------|-------|-------|
| 4 | **ProgramReminderEmail** | `reward_description` est NULL | **J+1** (24-25h apres signup) | "{shopName}, vos clientes d'aujourd'hui repartent sans carte de fidelite" |
| 5 | **ProgramReminderDay2Email** | `reward_description` est NULL | **J+2** (48-49h apres signup) | "{shopName} - Quelle recompense choisir ? On a la reponse" |
| 6 | **ProgramReminderDay3Email** | `reward_description` est NULL | **J+3** (72-73h apres signup) | "{shopName} - Dernier rappel : vos jours d'essai passent vite" |

---

## Trial (cron morning 09:00)

| # | Email | Condition | Quand | Sujet |
|---|-------|-----------|-------|-------|
| 7 | **TrialEndingEmail** | Trial actif, jours restants = 5, 3 ou 1 | **J-5, J-3, J-1** avant fin trial | "{shopName} - Votre essai se termine dans {N} jours" |
| 8 | **TrialExpiredEmail** | Trial expire (grace period) | **J+1, J+3, J+5** apres expiration | "{shopName} - Action requise : votre compte expire dans {N} jours" |

---

## Inactivite - Programme configure, 0 check-in (cron morning 09:00)

| # | Email | Condition | Quand | Sujet |
|---|-------|-----------|-------|-------|
| 9 | **InactiveMerchantDay7Email** | Programme configure, 0 visite depuis 7j | **D+7** apres signup ou derniere visite | "{shopName} - Aucun passage depuis 7 jours, tout va bien ?" |
| 10 | **InactiveMerchantDay14Email** | Programme configure, 0 visite depuis 14j | **D+14** apres signup ou derniere visite | "{shopName} - Comment vos concurrents fidelisent leurs clients" |
| 11 | **InactiveMerchantDay30Email** | Programme configure, 0 visite depuis 30j | **D+30** apres signup ou derniere visite | "{shopName} - Un mois sans utiliser Qarte : on peut vous aider ?" |

---

## Points en attente - Qarte Shield (cron morning 09:00)

| # | Email | Condition | Quand | Sujet |
|---|-------|-----------|-------|-------|
| 12 | **PendingPointsEmail** (alerte) | Visites `status=pending` existent | **D+0, D+1** apres le premier point en attente | "{shopName} - {N} point(s) a moderer" |
| 13 | **PendingPointsEmail** (rappel) | Visites `status=pending` toujours la | **D+2, D+3** apres le premier point en attente | "{shopName} - Rappel : {N} point(s) en attente" |

> Tracking via table `pending_email_tracking` pour eviter les doublons.

---

## Paiement Stripe (webhook temps reel)

| # | Email | Evenement Stripe | Quand | Sujet |
|---|-------|-----------------|-------|-------|
| 14 | **SubscriptionConfirmedEmail** | `checkout.session.completed` | **Immediat** | "{shopName} - Votre abonnement Qarte est actif" |
| 15 | **PaymentFailedEmail** | `invoice.payment_failed` | **Immediat** | "{shopName} - Action requise : probleme de paiement" |
| 16 | **SubscriptionCanceledEmail** | `customer.subscription.deleted` | **Immediat** | "{shopName} - Confirmation de resiliation" |

---

## Win-back apres annulation (cron reactivation 10:00)

| # | Email | Condition | Quand | Sujet |
|---|-------|-----------|-------|-------|
| 17 | **ReactivationEmail** (J+7) | `subscription_status=canceled` | **J+7** apres annulation | "{shopName} - Vos {N} clients n'ont plus acces a leur carte" |
| 18 | **ReactivationEmail** (J+14) | `subscription_status=canceled` | **J+14** apres annulation | "{shopName} - Revenez, vos donnees sont encore la" |
| 19 | **ReactivationEmail** (J+30) | `subscription_status=canceled` | **J+30** apres annulation | "{shopName} - Derniere chance avant suppression de vos donnees" |

> Tracking via table `reactivation_email_tracking` pour eviter les doublons.

---

## Lead generation (on-demand)

| # | Email | Declencheur | Quand | Destinataire | Sujet |
|---|-------|-------------|-------|--------------|-------|
| 20 | **EbookEmail** | Formulaire `/ebook` | Immediat | Visiteur | Guide PDF "Fidelisation 2026" + CTA essai Qarte |

---

## Timeline complete d'un commercant type

```
SIGNUP
  +0min    IncompleteSignupEmail (programme, annulable)
  +15min   [IncompleteSignupEmail envoye si signup pas fini]
  +0       WelcomeEmail (si signup fini)
  +0       NewMerchantNotification → admin

ONBOARDING (si programme pas configure)
  +1 jour  ProgramReminderEmail
  +2 jours ProgramReminderDay2Email (avec suggestion par shop_type)
  +3 jours ProgramReminderDay3Email (urgence trial)

INACTIVITE (si programme configure mais 0 check-in)
  +7 jours  InactiveMerchantDay7Email (diagnostic)
  +14 jours InactiveMerchantDay14Email (pression concurrence)
  +30 jours InactiveMerchantDay30Email (message perso fondateur)

TRIAL
  -5 jours  TrialEndingEmail
  -3 jours  TrialEndingEmail
  -1 jour   TrialEndingEmail
  +1 jour   TrialExpiredEmail (grace period)
  +3 jours  TrialExpiredEmail
  +5 jours  TrialExpiredEmail

PAIEMENT (Stripe webhook)
  [paiement OK]     SubscriptionConfirmedEmail
  [echec paiement]  PaymentFailedEmail

ANNULATION
  +0        SubscriptionCanceledEmail
  +7 jours  ReactivationEmail
  +14 jours ReactivationEmail
  +30 jours ReactivationEmail

EN CONTINU (si points en attente Qarte Shield)
  D+0  PendingPointsEmail (alerte)
  D+1  PendingPointsEmail (alerte)
  D+2  PendingPointsEmail (rappel)
  D+3  PendingPointsEmail (rappel)
```

---

## Fichiers

| Type | Chemin |
|------|--------|
| Fonctions d'envoi | `src/lib/email.ts` |
| Templates React | `src/emails/*.tsx` |
| Cron morning | `src/app/api/cron/morning/route.ts` |
| Cron evening | `src/app/api/cron/evening/route.ts` |
| Cron reactivation | `src/app/api/cron/reactivation/route.ts` |
| Signup | `src/app/api/merchants/create/route.ts` |
| Stripe webhook | `src/app/api/stripe/webhook/route.ts` |
| Schedule incomplete | `src/app/api/emails/schedule-incomplete/route.ts` |
| Ebook | `src/app/api/emails/ebook/route.ts` |
| Config crons | `vercel.json` |

## Notes techniques

- **Provider** : Resend (2 req/s max)
- **Rate limiting** : batch de 2 + 600ms de delai entre les batches
- **Anti-spam** : headers List-Unsubscribe sur tous les emails
- **Emails programmes** : via `scheduledAt` de Resend (IncompleteSignupEmail)
- **Tracking doublons** : tables `pending_email_tracking` et `reactivation_email_tracking`

---

*Genere le 8 fevrier 2026*
