# Audit emails Qarte v2 — appliquant 7 skills marketing

> Date : 2026-04-19
> Skills appliquées : `email-sequence` v1.1, `churn-prevention` v1.1, `paywall-upgrade-cro` v1.1, `copywriting` v1.1, `marketing-psychology` v1.1, `customer-research` v1.0, `onboarding-cro` v1.1
> Source : audit de [docs/email-sms-trial-plan.md](./email-sms-trial-plan.md) + 49 templates `src/emails/*.tsx` + `src/emails/translations/fr.ts`

## Lecture transverse skills → 4 grilles d'évaluation

- **email-sequence §"Core Principles"** — *One email, one job · Value before ask · Relevance over volume · Clear path forward*. Subject 40-60 chars idéal. Body 50-125 mots transactionnel, 150-300 éducatif, 300-500 story.
- **onboarding-cro §"Time-to-value is everything" + §"Stalled users"** — réactivation = rappel valeur + déblocage spécifique, pas duplication in-app.
- **churn-prevention §"Dunning email best practices"** — *don't blame, plain text > designed pour dunning, link direct sans login si possible*.
- **paywall-upgrade-cro §"Core Principles"** — *Value before ask · Show don't tell · Friction-free path · Respect the no*. Trigger après aha, jamais avant.
- **copywriting §"Writing Style Rules"** — pas d'exclamations, pas de buzzwords, spécifique > vague, actif > passif. *Honest over sensational*.
- **marketing-psychology** — *Loss aversion* (×2 force gain), *Pratfall* (faille admise = trust+), *Reciprocity* (donner d'abord), *Goal-gradient* (X/3 visible), *IKEA effect*, *Default effect*, *Hyperbolic discounting*.

---

## A. Pre-trial / signup incomplet (4 emails)

### Verdict skill
Garde plan v2 — **valide**. Cadence T+15min / T+2h / J+1 / J+3 / J+7 cohérente avec `email-sequence §"Re-Engagement Sequence"` + *Hyperbolic discounting*.

### Subject lines reco
| Email | Actuel | Reco |
|---|---|---|
| GuidedSignupEmail | "30 secondes, on te guide" | **OK** garde |
| IncompleteSignupEmail | "Il ne reste qu'une étape" | **OK** — *goal-gradient* + *Zeigarnik* |
| IncompleteSignupReminder2Email | "Votre espace Qarte vous attend toujours" | **À reécrire** — passive + vouvoie. Reco : *"Ton espace Qarte est prêt — 2 min pour finir"* |
| LastChanceSignupEmail | non vu | Reco : *"On supprime ton inscription dans 24h"* — *Loss aversion* concrète |

### Body angle
Un seul CTA = `Reprendre mon inscription` deep-link étape 2 pré-remplie. Skill `onboarding-cro §"Activation Energy"`.

### Risques
- IncompleteSignupReminder2 vouvoie ("Votre espace") alors que dashboard tutoie → incohérence de voix dès J+1.

---

## B. Onboarding pré-checkout (10 → 5 emails)

### Verdict skill
Plan v2 **largement validé** — 2 amendements.

**Validé** : suppression ProgramReminderDay2/3, SocialProof, VitrineReminder, PlanningReminder, Day5Checkin. Skill `email-sequence §"Relevance Over Volume"` explicite.

**Amendement 1 — Cap soft pré-checkout** : ajouter *"max 1 email pré-checkout par 36h hors triggers d'aha"*. Le frequency cap 1+1+1/24h v2 §11.4 ne couvre pas la séquence (multiple emails sur même jour possibles si trigger).

**Amendement 2 — Email 9 PartialActivationPush** : risque collision avec Email 2 TrialEnding S1 (J+4-5 + J+5). Reco : faire d'Email 9 un *trigger* "S1 stable depuis 48h" et caper J+4 max, OU le fusionner dans Email 2 variante S1.

### Subject lines reco
| Email | Reco | Pourquoi |
|---|---|---|
| Email 1 Welcome | *"Bienvenue {shop}, voici par où commencer"* (40) | OK plan v2 |
| Email 5 FirstScanCelebration | *"1ère cliente fidélisée chez {shop}"* (37) | OK plan v2 |
| Email 6 FirstBookingCelebration | *"1ère résa en ligne chez {shop} le {date}"* (~45) | OK plan v2 |
| Email 7 VitrineLive | *"Ta vitrine {shop} est en ligne. Voici comment la diffuser"* (~58) | OK |
| Email 8 ActivationStalled | Reco : *"{shop}, par quoi commencer en 3 min ?"* (40) | Question rhétorique + effort 3min |
| Email 9 PartialActivationPush | Reco : *"{shop}, plus qu'une étape pour tout connecter"* (~48) | Goal-gradient + Zeigarnik préservés |

### Body angle
- Email 1 : **default effect maxi** — pré-sélectionne *"Commencer par la fidélité (3 min)"* visuellement comme CTA primaire
- Email 8 : skill `onboarding-cro §"Stalled users"` — diagnostic + déblocage, 3 mini case-studies en 1 ligne, CTA path le plus rapide selon `shop_type`

### Risques
- Email 8 : ne pas envoyer si Welcome non ouvert (signal email_bounced / no engagement) — préfère push si app installée
- Email 9 fusion : si on stack PartialPush + TrialEnding S1 J+4-J+5 → choisir une seule voie

---

## C. Triggers événementiels aha (4 emails)

### Verdict skill
Plan v2 **validé**, cœur de la valeur ajoutée. `onboarding-cro §"Defining Activation"` + `marketing-psychology §"Peak-end rule"`.

**Subtilité** : `Peak-end rule` puissant seulement si trigger arrive *immédiatement* après l'event. Vérifier que trigger n'est pas batché en cron horaire J+24h — idéal = webhook synchrone < 30 min après l'event.

### Subject lines reco
| Email | Reco amendée |
|---|---|
| FirstReward (existant) | *"{shop}, 1ère récompense débloquée"* (35) — supprimer le `!` (skill `copywriting`) |
| QRCodeEmail | *"{shop}, ton QR est prêt à imprimer"* (~38) — recentré sur l'asset livré |

### Body angle
- Email 5/6/7 : pousser le pilier suivant (validé plan v2). C'est `marketing-psychology §"Commitment & Consistency"` (foot-in-the-door)
- FirstReward : `marketing-psychology §"IKEA effect"`. Body court : stats (X tampons, Y€) + CTA "Voir mes clientes fidèles"

### Risques
- **Volume** : merchant qui active 3 piliers en J+2 reçoit Email 5+6+7 en 48h + SMS célébration + cron `email-onboarding`. Frequency cap 1+1+1/24h doit prévaloir — prioriser FirstBooking > FirstScan > VitrineLive (impact $ décroissant), espacer min 24h
- **Trigger précision FirstScan** : aujourd'hui "exactement 2 visites" (1ère = test merchant). Fragile si merchant teste 2 fois. Reco : trigger sur "1ère visite avec phone_number ≠ phone merchant"

---

## D. Fin de trial + churn (6 emails) — cœur conversion

### Verdict skill
**Verdict mixte** — bon plan global, 2 zones à serrer.

**Validé** : 4 variantes TrialEnding par activation_score, reco tier intégrée (`recommendTierForMerchant`), subject ChurnSurveyReminder pratfall.

**À amender** :
- **GraceEnding J+10** : confondre "compte paused" et "données vont être supprimées" brouille la gravité. Reco : 2 emails. J+10 12h = "Compte mis en pause demain", J+13 24h = "Suppression définitive demain"
- **TrialExpired S0/S1** : *"T'as pas eu le temps ? On rallonge si tu nous dis pourquoi"* mélange 2 jobs (apologie + survey). Trancher A/B : soit *"Pourquoi {shop} n'a pas continué ?"* (push survey direct), soit *"On rallonge ton trial de 7j"* (rétention sans condition)

### Subject lines reco — TrialEndingEmail (4 variantes)
| State | Plan v2 | Reco amendée |
|---|---|---|
| **S0** | *"Plus que 2 jours — tu peux tester en 10 min"* | OK. Alt : *"{shop}, tester Qarte prend 10 min"* (40) sans urgence |
| **S1 fidélité** | trop long (>85 chars) | *"{shop}, 1 cliente fidélisée — plus que 2j"* (45) |
| **S1 résa** | trop long | *"{shop}, {X} résas en ligne — plus que 2j"* (40-45) |
| **S2** | trop long | *"{shop}, {X} clientes — plus que 2j pour garder"* (~50) |
| **S3** | OK angle stats stack | *"{shop}: {X} clientes, {Y} RDV, {Z} avis"* (~50) — ajouter "plus que 2j" en preview text |

### Body angle TrialEnding
Stats spécifiques merchant + bloc 2-cards Fidélité/Tout-en-un avec reco visuelle pré-sélectionnée = `paywall-upgrade-cro §"Friction-free path"` + `marketing-psychology §"Default effect"`.

### Diff conceptuel TrialEnding
```
AVANT (générique, 1 variante):
Subject: "{shopName}, plus que {daysRemaining} jours"
Body: "Ton essai se termine. Tes clientes vont perdre leur carte..."
CTA: "S'abonner"

APRÈS (4 variantes state-aware + reco tier):
Subject S2: "{shop}, 12 clientes — plus que 2j pour garder"
Body:
  - Hook: "12 clientes ont déjà reçu leur carte chez {shop}." (endowment)
  - Stats: 12 clientes / 8 RDV / 0 avis Google (visualisation pilier manquant)
  - Bloc 2-cards:
    [Fidélité 19€]  [Tout-en-un 24€ ← recommandé pour toi]
  - CTA primaire: "Garder mon compte (plan recommandé)"
  - CTA secondaire (lien): "Voir l'autre offre"
```

### Risques
- **Reco tier mal calibrée** = défiance. Si signal mixte (1 résa + 1 visite, peu d'historique), montrer les 2 cartes sans pré-selection (`paywall-upgrade-cro §"Respect the no"`)
- **Loss aversion S3** : "Sans abo dans 48h, tout disparaît" est faux (grace 3j) → `copywriting §"Honest over sensational"`. Reco : *"Sans abo dans 48h, ton compte est mis en pause"*

---

## E. Subscription mgmt (4 emails)

### Verdict skill
Plan v2 **validé sur SubscriptionConfirmedEmail tier-aware** — 3 autres restent inchangés (transactionnels Stripe-driven).

### Subject lines reco
- **SubscriptionConfirmed Fidélité** : *"{shop}, Qarte Fidélité activé — premiers pas"* (~50)
- **SubscriptionConfirmed Tout-en-un** : *"{shop}, Qarte Tout-en-un activé — premiers pas"* (~52)
- Tournure identique pour cohérence (mere exposure effect)

### Body angle
- **Fidélité** : checklist 3 items *retention only* (suggérer rewards, scanner, tier 2 cagnotte). Skip mentions résa/marketing SMS — sinon paywall hidden cost
- **Tout-en-un** : checklist 3 items *3 piliers*

### Risques
Si on push "passe à Tout-en-un" dès SubscriptionConfirmed Fidélité, on contredit le choix fait au checkout (`paywall-upgrade-cro §"Respect the no"`). **Réserver l'upsell pour UpgradeAllInEmail trigger-based**.

---

## F. Post-checkout actif — re-engagement (5 emails)

### Verdict skill
Plan v2 valide tier-aware — **bon** mais séquence J+7/14/30 mérite revue.

**Skill `churn-prevention §"Risk Signals"`** distingue *"Login frequency drops 50%+"* de *"Key feature usage stops"*. Qarte conflate les deux. **Reco** :
- **Inactive7** = login signal (ton léger, "tout va bien ?")
- **Inactive14** = usage signal (ton orienté blocage produit, "as-tu un souci avec X ?")
- **Inactive30** = pre-cancel signal (push survey honnête + offre pause/discount)

### Subject lines reco
| Email | Actuel | Reco Fidélité | Reco Tout-en-un |
|---|---|---|---|
| InactiveDay7 | *"{shop}, tout va bien ?"* | OK garde | OK garde |
| InactiveDay14 | *"{shop}, tes clientes oublient de revenir ?"* | *"{shop}, tu n'as plus scanné depuis 14j"* (factuel) | *"{shop}, ton planning et ta carte dorment depuis 14j"* |
| InactiveDay30 | *"{shop}, on peut t'aider ?"* | *"{shop}, on rouvre la conversation"* (pratfall) | Idem |

Subject actuel "tes clientes oublient de revenir" viole `copywriting §"Honest over sensational"` (sous-entend faute du merchant) et `churn-prevention §"don't blame"`.

### Body angle
- **Inactive7 Fidélité** : *"Pas de scan depuis 7j. C'est juste un creux ou un blocage ? Ouvre Qarte en 1 clic."*
- **Inactive7 Tout-en-un** : ajouter *"Tu peux aussi laisser ton planning bosser pour toi ce mois-ci"*
- **Inactive14** : skill `churn-prevention §"Re-engagement"` "address blockers, offer help" → CTA *"Réserver 15 min avec Judicaël"* (`liking/similarity bias` + `unity principle`)
- **Inactive30** : skill `churn-prevention §"Save Offer Types"` → **proposer pause d'abonnement 1-2 mois** (60-80% des pausers réactivent)

### Diff conceptuel Inactive30 (Tout-en-un)
```
AVANT:
Subject: "{shop}, on peut t'aider ?"
Body: générique, "on est là si tu as une question"
CTA: "Voir mon dashboard"

APRÈS (tier Tout-en-un):
Subject: "{shop}, on rouvre la conversation"
Body:
  - Pratfall: "On a pas réussi à te montrer la valeur ce mois-ci."
  - Reciprocity: "Voici 3 options pour toi:"
    [1. Pause 2 mois — 0€/mois]
    [2. Switch Fidélité — 24→19€]
    [3. 30 min avec moi pour débloquer — gratuit]
  - CTA primaire: "Choisir mon option"
```

### Risques
- WinBack J+60 doit pas taper merchant qui vient juste de churn (cooldown vs ChurnSurveyReminder)
- ReactivationEmail : si non déclenché en prod 30j, **supprimer**

---

## G. Post-checkout actif — périodiques (3 emails)

### Verdict skill
Plan v2 tier-aware **validé** sur les 3.

### Subject lines reco
- **WeeklyDigest Fidélité** : *"{shop} — ta semaine fidélité"* (~32)
- **WeeklyDigest Tout-en-un** : *"{shop} — ta semaine"* (~22) (3 piliers couverts dans body)

### Body angle
- WeeklyDigest scannable mobile. Tier Fidélité = [Cagnotte/Tampons/Top clientes]. Tier Tout-en-un = [Cagnotte/Tampons/Résas/Trafic vitrine]
- ProductUpdate Fidélité : 2-3 features tier-Fidélité + 1 teaser Tout-en-un en bas (soft upsell 1× mois OK)

### Risques
- WeeklyDigest fatigue : si 8 semaines sans clic, basculer bi-mensuel auto

---

## H. Upgrade & cross-sell — focus UpgradeAllInEmail (NEW)

### Audit complet selon `paywall-upgrade-cro`

**Trigger** : plan v2 §11.3 ✅ — Signal 2 (campagne SMS bloquée) + Signal 3 (demande client manuelle). Validé skill `paywall-upgrade-cro §"Feature Gates"`.

**Structure email selon `paywall-upgrade-cro §"Paywall Screen Components"`** (7 composants) :

| # | Composant | Application Qarte |
|---|---|---|
| 1 | Headline | *"Active la résa en ligne pour {shop}"* (focus benefit, pas "Tout-en-un") |
| 2 | Value demo | Mockup booking modal + témoignage 1 ligne |
| 3 | Feature comparison | Tableau 2 colonnes Fidélité/Tout-en-un — souligner uniquement les 3-4 features pertinentes au signal trigger |
| 4 | Pricing | "+5€/mois — prorata appliqué automatiquement" (mental accounting) |
| 5 | Social proof | "67% des merchants Qarte ont choisi Tout-en-un" (si vrai) |
| 6 | CTA | *"Passer à Tout-en-un (24€/mois)"* |
| 7 | Escape hatch | *"Rester sur Fidélité"* visible (pas hidden) |

### Subject reco — par signal
- Plan v2 : *"{shop}, tu touches aux limites de Fidélité — passe à Tout-en-un"* (~62) — trop "limites" (négatif/punitif)
- **Reco amendée** :
  - Variante 1 (signal SMS bloqué) : *"{shop}, ta campagne SMS est prête — débloque-la"* (~50)
  - Variante 2 (demande client résa) : *"{shop}, 3 clientes ont demandé la résa en ligne"* (~52)

### Body angle — pyramide inversée
1. **Hook contextuel** : *"Tu as tenté d'envoyer une campagne SMS marketing hier."*
2. **Pivot** : *"Cette feature est dans Tout-en-un (24€/mois)."*
3. **Value preview** : screenshot/mockup composer SMS Qarte
4. **Diff features** : 4 lignes max, pas 12
5. **Friction killer** : *"Prorata calculé sur ton mois en cours."*
6. **CTA + escape**

CTA = lien direct `/dashboard/subscription/upgrade?from=email_blocked_sms` qui pré-sélectionne Tout-en-un et montre prorata.

### Risques
- **Volume** : si Signal 2 trigger 3× en 7j, 3 emails identiques = spam. Reco : 1 UpgradeAllIn par 14j max
- **Mauvais timing** : minimum 30j depuis checkout avant 1er UpgradeAllIn. `paywall-upgrade-cro §"When NOT to show"` : *"During onboarding (too early)"*
- **Tier2UpsellEmail** (existant, cagnotte tier 2) : renommer `LoyaltyTier2UpsellEmail` pour éviter confusion `tier 2 cagnotte` vs `tier plan all_in`

---

## I. Notifications transactionnelles merchant (7 emails)

### Verdict skill
Plan v2 **validé** — gardés tels quels.

### Notes ponctuelles
- BookingNotificationEmail + SlotReleasedEmail : guard defensive `if (merchant.plan_tier === 'all_in' || trial)`
- BirthdayNotificationEmail : déjà refondu mig récente. OK
- PendingPointsEmail + reminder : vérifier différenciation au-delà du subject. Sinon fusion possible
- SmsQuotaEmail : critique avec packs SMS no-overage post-mig 112-115. Body doit pousser **upgrade pack** (≠ upgrade tier)

---

## J. Référence / parrainage (2 emails)

### Verdict skill
Plan v2 garde tel quel — **OK**. Opportunité hors plan v2 :

`marketing-psychology §"Reciprocity"` : trigger ReferralPromo sur "1ère récompense débloquée + cron J+1" (peak emotionnel) plutôt que calendaire J+2.

### Subject lines reco
- *"Gagne 10 € pour chaque pro que tu recommandes"* — OK garde
- ReferralReminder : remplace euros symbol bizarre `\u20AC` par `€` propre

### Risques
- 10€ flat peut attirer faux référrals — monitorer (referral qui churn <30j ne devrait pas trigger payout)

---

## K-L. Customer-facing + Setup admin

`AmbassadorWelcomeEmail` + `SetupForYouEmail` — out of audit scope. OK garde.

---

## Synthèse — top 5 actions prioritaires

1. **Refondre subjects TrialEnding 4 variantes** (E2 plan v2) en respectant cap 60 chars + ajouter preview text. Impact attendu : open rate +15-25%
2. **Construire UpgradeAllInEmail avec subject-by-signal** (variante par trigger réel). Impact : conversion upgrade Fidélité→Tout-en-un cible 15-25%
3. **Refondre Inactive14 + Inactive30 tier-aware AVEC offre concrète** (pause / switch / call). Impact : save rate +10-15 pts
4. **Trancher Email 8 vs Email 9** (PartialActivationPush risque doublon avec Email 2 S1)
5. **Cleanup linguistique** : retirer tous les `!`, vouvoiement parasité IncompleteSignupReminder2, "tes clientes oublient de revenir" (blame), "Sans abo dans 48h tout disparaît" (fausse urgence)

## Limites de l'audit

- Skill `customer-research` non actionnée faute de quote-bank churn survey. Avant de figer les angles pratfall, valider sur 5-10 verbatims réels — sinon hypothèse intuitive non testée
- Pas vu les bodies réels Email 8/9/UpgradeAllIn (n'existent pas encore en prod). Reco subject + angle structurels seulement
- Frequency cap 1+1+1/24h plan v2 §11.4 ne couvre pas multiple emails même canal/24h. Risque collision Email 2 + Email 9 + Email 7 sur S1 J+4-5 non géré au plan
- Aucune skill ne couvre directement *"tier-aware copy differenciation"* — voie *variantes* validée par défaut (évite duplication logique cron)
