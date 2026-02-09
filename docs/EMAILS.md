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
| 1 | **IncompleteSignupEmail** | Phase 1 signup (email + mdp) | J+0, **+1h** (programme via Resend scheduledAt) | Commercant | "Votre compte Qarte est presque pret — il ne reste que 30 secondes" |
| 2 | **IncompleteSignupReminder2Email** | Phase 1 signup (email + mdp) | J+0, **+3h** (programme via Resend scheduledAt) | Commercant | Relance #2 inscription incomplete |
| 3 | **WelcomeEmail** | Phase 2 signup (creation merchant) | J+0, **immediat** | Commercant | "Bienvenue sur Qarte, {shopName}" |
| 4 | **NewMerchantNotification** | Phase 2 signup (creation merchant) | J+0, **immediat** (+600ms apres welcome) | Admin (sales@getqarte.com) | "Nouveau commercant inscrit : {shopName}" |

> Les emails #1 et #2 sont automatiquement annules si le signup est complete avant l'envoi.

---

## Onboarding - Programme non configure (cron morning 09:00)

| # | Email | Condition | Quand | Sujet |
|---|-------|-----------|-------|-------|
| 5 | **ProgramReminderEmail** | `reward_description` est NULL | **J+1** (24-25h apres signup) | "{shopName}, vos clientes d'aujourd'hui repartent sans carte de fidelite" |
| 6 | **ProgramReminderDay2Email** | `reward_description` est NULL | **J+2** (48-49h apres signup) | "{shopName} - Quelle recompense choisir ? On a la reponse" |
| 7 | **ProgramReminderDay3Email** | `reward_description` est NULL | **J+3** (72-73h apres signup) | "{shopName} - Dernier rappel : vos jours d'essai passent vite" |

---

## Post-configuration programme (temps reel)

| # | Email | Declencheur | Quand | Sujet |
|---|-------|-------------|-------|-------|
| 8 | **QRCodeEmail** | Programme configure (reward_description set) | **Immediat** | QR code pret a utiliser |
| 9 | **SocialKitEmail** | API `/api/emails/social-kit` | **Immediat** | Kit reseaux sociaux pret |

---

## Trial (cron morning 09:00)

| # | Email | Condition | Quand | Sujet |
|---|-------|-----------|-------|-------|
| 10 | **TrialEndingEmail** | Trial actif, jours restants = 5, 3 ou 1 | **J-5, J-3, J-1** avant fin trial | "{shopName} - Votre essai se termine dans {N} jours" |
| 11 | **TrialExpiredEmail** | Trial expire (grace period) | **J+1, J+3, J+5** apres expiration | "{shopName} - Action requise : votre compte expire dans {N} jours" |

---

## Engagement & Milestones (cron morning 09:00)

| # | Email | Condition | Quand | Sujet |
|---|-------|-----------|-------|-------|
| 12 | **FirstScanEmail** | Premier check-in enregistre | **J+1** apres premier scan | Celebration premier scan |
| 13 | **Day5CheckinEmail** | 5 jours apres signup | **J+5** apres signup | Bilan premiere semaine |
| 14 | **FirstRewardEmail** | Premiere recompense debloquee par un client | **J+1** apres premiere recompense | Celebration premiere recompense |
| 15 | **Tier2UpsellEmail** | 10+ clients, palier 2 non active | **Cron morning** | Upsell palier VIP |
| 16 | **WeeklyDigestEmail** | Merchant actif avec scans | **Cron morning (hebdomadaire)** | Bilan hebdomadaire (scans, clients, recompenses) |

---

## Inactivite - Programme configure, 0 check-in (cron morning 09:00)

| # | Email | Condition | Quand | Sujet |
|---|-------|-----------|-------|-------|
| 17 | **InactiveMerchantDay7Email** | Programme configure, 0 visite depuis 7j | **D+7** apres signup ou derniere visite | "{shopName} - Aucun passage depuis 7 jours, tout va bien ?" |
| 18 | **InactiveMerchantDay14Email** | Programme configure, 0 visite depuis 14j | **D+14** apres signup ou derniere visite | "{shopName} - Comment vos concurrents fidelisent leurs clients" |
| 19 | **InactiveMerchantDay30Email** | Programme configure, 0 visite depuis 30j | **D+30** apres signup ou derniere visite | "{shopName} - Un mois sans utiliser Qarte : on peut vous aider ?" |

---

## Points en attente - Qarte Shield (cron morning 09:00)

| # | Email | Condition | Quand | Sujet |
|---|-------|-----------|-------|-------|
| 20 | **PendingPointsEmail** (alerte) | Visites `status=pending` existent | **D+0, D+1** apres le premier point en attente | "{shopName} - {N} point(s) a moderer" |
| 21 | **PendingPointsEmail** (rappel) | Visites `status=pending` toujours la | **D+2, D+3** apres le premier point en attente | "{shopName} - Rappel : {N} point(s) en attente" |

> Tracking via table `pending_email_tracking` pour eviter les doublons.

---

## Paiement Stripe (webhook temps reel)

| # | Email | Evenement Stripe | Quand | Sujet |
|---|-------|-----------------|-------|-------|
| 22 | **SubscriptionConfirmedEmail** | `checkout.session.completed` | **Immediat** (avec nextBillingDate si trial actif) | "{shopName} - Votre abonnement Qarte est actif" |
| 23 | **SubscriptionConfirmedEmail** | `invoice.payment_succeeded` (recovery past_due → active) | **Immediat** | "{shopName} - Votre abonnement Qarte est actif" |
| 24 | **PaymentFailedEmail** | `invoice.payment_failed` | **Immediat** | "{shopName} - Action requise : probleme de paiement" |
| 25 | **SubscriptionCanceledEmail** | `customer.subscription.updated` → canceling (cancel_at_period_end=true) | **Immediat** (date fin = subscription.cancel_at) | "{shopName} - Confirmation de resiliation" |

> Note : `customer.subscription.deleted` n'envoie PAS d'email (deja envoye au passage en canceling).

---

## Win-back apres annulation (cron reactivation 10:00)

| # | Email | Condition | Quand | Sujet |
|---|-------|-----------|-------|-------|
| 26 | **ReactivationEmail** (J+7) | `subscription_status=canceled` | **J+7** apres annulation | "{shopName} - Vos {N} clients n'ont plus acces a leur carte" |
| 27 | **ReactivationEmail** (J+14) | `subscription_status=canceled` | **J+14** apres annulation | "{shopName} - Revenez, vos donnees sont encore la" |
| 28 | **ReactivationEmail** (J+30) | `subscription_status=canceled` | **J+30** apres annulation | "{shopName} - Derniere chance avant suppression de vos donnees" |

> Tracking via table `reactivation_email_tracking` pour eviter les doublons.
> Codes promo : QARTE50 (J+7), QARTEBOOST (J+14), QARTELAST (J+30).

---

## Lead generation (on-demand)

| # | Email | Declencheur | Quand | Destinataire | Sujet |
|---|-------|-------------|-------|--------------|-------|
| 29 | **EbookEmail** | Formulaire `/ebook` | Immediat | Visiteur | Guide PDF "Fidelisation 2026" + CTA essai Qarte |

---

## Timeline complete d'un commercant type

```
SIGNUP
  +0       WelcomeEmail (si signup fini)
  +0       NewMerchantNotification → admin
  +1h      [IncompleteSignupEmail si signup pas fini]
  +3h      [IncompleteSignupReminder2Email si toujours pas fini]

ONBOARDING (si programme pas configure)
  +1 jour  ProgramReminderEmail
  +2 jours ProgramReminderDay2Email (avec suggestion par shop_type)
  +3 jours ProgramReminderDay3Email (urgence trial)

POST-CONFIG PROGRAMME
  +0       QRCodeEmail (immediat)
  +0       SocialKitEmail (via API)

ENGAGEMENT & MILESTONES
  +1j apres premier scan   FirstScanEmail
  +5 jours apres signup    Day5CheckinEmail
  +1j apres 1ere recomp.   FirstRewardEmail
  10+ clients              Tier2UpsellEmail
  Hebdomadaire             WeeklyDigestEmail

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
  [carte ajoutee]      SubscriptionConfirmedEmail (avec nextBillingDate)
  [echec paiement]     PaymentFailedEmail
  [recovery past_due]  SubscriptionConfirmedEmail

ANNULATION
  [canceling]   SubscriptionCanceledEmail (date fin = cancel_at Stripe)
  +7 jours      ReactivationEmail (code QARTE50)
  +14 jours     ReactivationEmail (code QARTEBOOST)
  +30 jours     ReactivationEmail (code QARTELAST)

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
| Templates React (24) | `src/emails/*.tsx` |
| Layout de base | `src/emails/BaseLayout.tsx` |
| Cron morning | `src/app/api/cron/morning/route.ts` |
| Cron evening | `src/app/api/cron/evening/route.ts` |
| Cron reactivation | `src/app/api/cron/reactivation/route.ts` |
| Signup | `src/app/api/merchants/create/route.ts` |
| Stripe webhook | `src/app/api/stripe/webhook/route.ts` |
| Schedule incomplete | `src/app/api/emails/schedule-incomplete/route.ts` |
| Social kit | `src/app/api/emails/social-kit/route.ts` |
| Ebook | `src/app/api/emails/ebook/route.ts` |
| Config crons | `vercel.json` |

## Notes techniques

- **Provider** : Resend (2 req/s max)
- **Rate limiting** : batch de 2 + 600ms de delai entre les batches
- **Anti-spam** : headers List-Unsubscribe sur tous les emails
- **Emails programmes** : via `scheduledAt` de Resend (IncompleteSignupEmail +1h, Reminder2 +3h)
- **Tracking doublons** : tables `pending_email_tracking` et `reactivation_email_tracking`
- **Templates** : 24 templates React Email + BaseLayout (header violet, footer)

---

*Mis a jour le 9 fevrier 2026*
