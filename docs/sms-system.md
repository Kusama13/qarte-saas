# SMS System — Context

Dernière MAJ : 27 avril 2026.

## Vue d'ensemble

3 cas d'usage avec **deux pots distincts** (quota gratuit 100/cycle + pack SMS prépayé) :

| Usage | Exemple | Consomme |
|-------|---------|----------|
| **Transactionnel** | Rappel RDV J-1, J-0, confirmations, modifs, annulations, parrainage | Quota d'abord, puis pack |
| **Marketing auto** | Welcome, avis Google, voucher expire, parrainage invite, inactif, événements, plus qu'un tampon | Quota d'abord, puis pack |
| **Marketing manuel** | Campagnes composées par le merchant + audience multi-filtres, modérées admin | **Pack uniquement** |

**Pourquoi cloisonner les campagnes manuelles sur le pack** : une campagne sur 100 destinataires consommait tout le quota mensuel en un envoi, asséchant le canal qui rapporte le plus (rappels RDV anti-no-show). Depuis cette refonte, les campagnes sortent uniquement du pack acheté — le quota gratuit reste réservé aux automatisations et au transactionnel. Liste centralisée : `PACK_ONLY_SMS_TYPES` dans [`src/lib/sms.ts`](../src/lib/sms.ts) (= `['campaign']` aujourd'hui).

**Règle centrale** : pas d'overage facturé. Alerte push+email à 80% et 100% du quota gratuit (campagnes exclues du compteur). Blocage dur à 0.

---

## Structure UI — `/dashboard/marketing`

Header = titre "Campagnes" + sous-titre "Remplis ton agenda et booste ton chiffre d'affaires". `SmsBalancePanel` toujours visible (progression cycle + solde pack + bouton "Acheter un pack"). **3 onglets** :

### Onglet Push
- `SubscriberRing` (compteur abonnés PWA)
- Composer push (titre + message + offre dépliante + image + planning 10h/18h)
- Historique + scheduled pushes
- `PushAutomations` : relance inactifs, rappel récompense, événements push (template "Dernières dispos" remplace l'ancien "Créneau calme")

### Onglet SMS
- Composer "Rédiger mon SMS" :
  - Dropdown **Inspirations** (3 suggestions : Offre spéciale, Nouveau produit ou service, Événement dans le salon — dans [`src/lib/sms-templates.ts`](../src/lib/sms-templates.ts))
  - Textarea + boutons insertion `{prenom}` `{shop_name}`
  - Compteur live 1/2/3 SMS (vert/orange/rouge) — bascule auto entre limites GSM-7 (160/306) et UCS-2 (70/134) selon contenu
  - **Alerte UCS-2** : si emoji ou char hors GSM-7 détecté (apostrophe typo `’`, tirets long `—`, etc.), bandeau ambre + bouton "Retirer les emojis" qui appelle `normalizeToGsm7()`. Filet de sécurité au dispatch : la normalisation est aussi appliquée systématiquement avant envoi pour éviter de payer 2 SMS au lieu d'1 ([src/lib/sms-validator.ts](../src/lib/sms-validator.ts) `isGsm7` + `normalizeToGsm7`)
  - Preview mockup iPhone avec variables remplacées (Sophie + vrai shop_name)
  - **Audience multi-select** (chips) : toutes / inactives 14/30/60/90j / nouvelles 30j / VIP 5+ tampons / anniversaires du mois / voucher non utilisé 7j+. "Toutes" est exclusif.
  - Schedule (immédiat / planifié)
  - Récap coût + "Soumettre pour validation"
- Historique 10 dernières campagnes
- **Toutes les campagnes passent par modération admin** (pas de bypass)

### Onglet Automatisations SMS
Cartes groupées par but, chaque carte affichant un aperçu du template avec le vrai `shop_name` / récompense du merchant :

| Groupe | Carte | Badge | Déclencheur | Default | Condition UI |
|--------|-------|-------|-------------|---------|--------------|
| **Rappels de RDV** | Rappel J-1 | Tx | 19h veille | **ON** | `planning_enabled` |
|  | Rappel J-0 | Tx | H-3 (≥7h local) | OFF | `planning_enabled` |
| **Parrainage** | Récompense parrain | Tx | Filleul utilise voucher | **ON** | `referral_program_enabled` |
|  | Invitation parrainage | Mkt | 5+ visites, 10h local | OFF | `referral_program_enabled` |
| **Fidélisation & avis** | Merci + avis Google | Mkt | H+2 après visite | OFF | `review_link` non vide |
|  | Cadeau bientôt expiré | Mkt | J-7 expiration, 10h local | OFF | — |
|  | Plus qu'un tampon | Mkt | `stamps = required - 1` (palier 1 ou 2), 10h local, dernière visite ≥ 15j | OFF | `reward_description` non vide |
| **Relance & événements** | Relance client inactif | Mkt | Dernière visite 30-45j, 10h local | OFF | — |
|  | Rappel avant les fêtes | Mkt | 10h local J-7 avant Saint-Valentin/Noël/etc. | OFF | — |

Si la condition n'est pas remplie, le toggle est grisé + hint ("Active le planning en ligne", "Ajoute ton lien Google Review", etc.) et le cron double-check en backend.

---

## Pricing packs SMS

Flat **0,075€ HT/SMS + 1€ HT "frais de traitement" par pack, TVA 20% auto via Stripe Tax**.

| Pack | HT | Frais HT | TVA | **TTC** |
|------|----|----------|-----|---------|
| 50 | 3,75€ | 1€ | 0,95€ | **5,70€** |
| 100 | 7,50€ | 1€ | 1,70€ | **10,20€** |
| 150 (populaire) | 11,25€ | 1€ | 2,45€ | **14,70€** |
| 200 | 15€ | 1€ | 3,20€ | **19,20€** |
| 250 | 18,75€ | 1€ | 3,95€ | **23,70€** |

Validité : valable pendant l'abonnement actif. Perdus à la résiliation. Stripe `price_data` inline (pas de Price ID), 2 line_items (SMS + frais), `automatic_tax: true`. Crédit du pack via RPC atomique `credit_sms_pack`.

---

## Architecture technique

### Constantes partagées
`src/lib/sms-constants.ts` — client-safe. Exporte `SMS_FREE_QUOTA`, `SMS_UNIT_COST`, `SMS_UNIT_COST_CENTS`, `SMS_OVERAGE_COST`. `sms.ts` les re-exporte pour compat server.

### Priorité conso ([`src/lib/sms.ts`](../src/lib/sms.ts))

**Transactionnel + automatisations marketing** (rappels, welcome, review, voucher_expiry, near_reward, referral_invite, inactive_reminder, events) :
1. Quota gratuit 100 SMS/cycle
2. Solde pack (`merchants.sms_pack_balance`) en backup
3. **Blocage** — `{ success: false, blocked: true, error: 'quota_exhausted' }`

**Campagnes manuelles** (`sms_type = 'campaign'`, liste `PACK_ONLY_SMS_TYPES`) :
1. Solde pack uniquement (quota gratuit jamais touché, exclu du compteur `getSmsUsageThisMonth`)
2. **Blocage** — `{ success: false, blocked: true, error: 'pack_empty' }` → cron dispatch re-schedule +1h avec note "Pack SMS épuisé".

### Fonctions d'envoi
- `sendBookingSms()` — transactionnel (rappels, confirmations, parrainage, birthday). Check `PAID_STATUSES` + **`isPastDueBlocked` (mig 164, blocage past_due >72h)** + quota/pack + dedup par slot/phone/type/jour. **Routage provider** : pays détecté FR/BE → SMS Partner (si `SMS_PARTNER_ENABLED=true`), sinon OVH. **Fallback automatique vers OVH si SMS Partner échoue** (timeout/panne) — `sms_logs.provider` reflète le provider qui a vraiment envoyé. SMS Partner : timeout 10s + 3 attempts avec backoff 400ms→1500ms (cf. [sms-partner.ts](../src/lib/sms-partner.ts)).
- `sendMarketingSms()` — marketing (campaign, welcome, review_request, voucher_expiry, referral_invite, inactive_reminder, near_reward). Check `PAID_STATUSES` + **`isPastDueBlocked` (mig 164)** + quota/pack. **Toujours via OVH** (tous pays). Refund pack si envoi fail ou si insert log fail.

### Providers SMS — dispatch et rollback

**Deux fournisseurs cohabitent**. Le choix se fait à l'envoi selon le type de SMS + le pays détecté du destinataire (préfixe E.164).

#### Tableau de routage complet

| Type SMS | Catégorie | FR | BE | CH |
|---|---|---|---|---|
| `reminder_j0` (rappel H-3) | Transactionnel | SMS Partner | SMS Partner | OVH |
| `reminder_j1` (rappel J-1 19h) | Transactionnel | SMS Partner | SMS Partner | OVH |
| `confirmation_no_deposit` | Transactionnel | SMS Partner | SMS Partner | OVH |
| `confirmation_deposit` | Transactionnel | SMS Partner | SMS Partner | OVH |
| `deposit_reminder` (rappel acompte J-7 d'un RDV de suivi, mig 177 ; cron `morning-jobs`, wording = `deposit_request`) | Transactionnel | SMS Partner | SMS Partner | OVH |
| `booking_moved` | Transactionnel | SMS Partner | SMS Partner | OVH |
| `booking_cancelled` | Transactionnel | SMS Partner | SMS Partner | OVH |
| `birthday` | Transactionnel (free Qarte) | SMS Partner | SMS Partner | OVH |
| `referral_reward` | Transactionnel (hors quota ; **pack pour Fidélité** depuis juin 2026, voir `isFidelityFreeSms`) | SMS Partner | SMS Partner | OVH |
| `gift_card_received` | Transactionnel | SMS Partner | SMS Partner | OVH |
| `gift_card_used` | Transactionnel | SMS Partner | SMS Partner | OVH |
| `gift_card_expiry_reminder` (J-7 destinataire) | Transactionnel | SMS Partner | SMS Partner | OVH |
| `past_due_initial` (dunning J0) | Transactionnel critique (Qarte→merchant) | SMS Partner | SMS Partner | OVH |
| `past_due_reminder` (dunning J+2) | Transactionnel critique (Qarte→merchant) | SMS Partner | SMS Partner | OVH |
| `review_request` | Marketing | **GELÉ** (voir ci-dessous) | **GELÉ** | **GELÉ** |
| `voucher_expiry` | Marketing | OVH | OVH | OVH |
| `campaign` | Marketing | OVH | OVH | OVH |
| `referral_invite` | Marketing | OVH | OVH | OVH |
| `inactive_reminder` | Marketing | OVH | OVH | OVH |
| `near_reward` | Marketing | OVH | OVH | OVH |

**Règle simple** : SMS Partner = transactionnel FR/BE uniquement. OVH = tout le reste (marketing global + transactionnel CH + tout transactionnel si feature flag à `false`).

#### Gel du SMS de demande d'avis (2026-07-22)

`review_request` est **coupé** via `REVIEW_SMS_ENABLED` (défaut `false`), voir [`src/lib/sms-freeze.ts`](../src/lib/sms-freeze.ts).

**Cause** : 15 merchants sur 74 avaient collé une **URL Google brute** comme `review_link` (jusqu'à **669 caractères**). Le corps du SMS étant un template avec le lien interpolé, le message partait en **2 à 6 segments facturés** au lieu d'1 — prélevés sur le **quota inclus du merchant** (100/mois). Aucun compteur de caractères ne pouvait les alerter puisque le texte n'est pas saisi par elles.

**Gel à 3 niveaux** (un flag remis à `true` en base ne suffit pas à rouvrir) :
1. cron `sms-hourly` — section entière court-circuitée ;
2. `/api/sms/automations` — refuse la réactivation du toggle (409) ;
3. dashboard — toggle verrouillé + motif affiché (`reviewSmsFrozenHint`).

Les 8 merchants qui avaient `post_visit_review_enabled=true` ont été basculés à `false` en base.

**Avant de réactiver** (`REVIEW_SMS_ENABLED="true"` sur Vercel, sans redéploiement) : mettre en place un redirecteur court `getqarte.com/r/<slug>` garantissant 1 seul segment quelle que soit l'URL collée. Sans ça, le problème revient à l'identique.

#### Canal séparé : SMS marketing aux merchants en essai (Qarte → prospects)

Catégorie distincte des SMS client-facing ci-dessus, **non concernée par le routage SMS Partner** :

- **Cible** : le merchant prospect Qarte pendant son essai (pas son client final)
- **Pipeline** : [`src/lib/sms-trial-marketing.ts`](../src/lib/sms-trial-marketing.ts) → import direct de `sendSms` depuis `./ovh-sms` → **toujours OVH**, tous pays
- **Table de log** : `merchant_marketing_sms_logs` (séparée de `sms_logs`, pas de colonne `provider`)
- **Quota** : **n'impacte pas le quota merchant** — coût absorbé par Qarte (logué dans `cost_euro` pour billing interne uniquement)
- **Cron** : [`/api/cron/sms-trial-marketing/route.ts`](../src/app/api/cron/sms-trial-marketing/route.ts) — cron horaire, 2 sections
- **Pourquoi OVH et pas SMS Partner** : c'est du marketing par nature (Qarte → prospects), donc cohérent avec la règle générale "tout marketing → OVH". Pas de raison d'étendre le scope SMS Partner ici.

**2 SMS max par merchant pendant l'essai** :

| # | Quand | Type | Dedup flag | Copy (résumé) |
|---|---|---|---|---|
| 1 | T+15min après signup | `example_vitrine` | `example_vitrine_sms_sent_at` | Lien exemple de vitrine + WhatsApp support |
| 2 | J+1 (24h) | `checkin_*` (5 variantes, 1 max) | `celebration_sms_sent_at` | Variante selon activation : nudge S0 / célébration fidélité / vitrine / planning / combo |

Variantes du check-in J+1 mutuellement exclusives, choisies par `checkInSmsSelection()` dans [`trial-sms-copy.ts`](../src/lib/trial-sms-copy.ts) : `checkin_nudge` (S0, rien fait) | `celebration_fidelity` (1 cliente) | `celebration_vitrine` (vitrine OK) | `celebration_planning` (planning OK, fallback rare) | `checkin_combo` (2+ piliers).

**Historique (supprimés mai 2026)** : `trial_pre_loss` (J-1 trial) et `churn_survey` (J+8 fully expired) — fenêtre de récupération max 2-3j post-expiration, ces SMS arrivaient trop tard pour servir. Check-in initialement à J+2, décalé à J+1 pour intervenir tant que le merchant teste encore activement. Colonnes DB `pre_loss_sms_sent_at` et `churn_sms_sent_at` conservées (pas de migration drop) pour préserver l'historique des logs envoyés avant le retrait.

#### Mécanique d'implémentation

- **Détection pays** : `detectPhoneCountry()` dans [`utils.ts`](../src/lib/utils.ts) lit le préfixe E.164 du `client_phone` stocké (`33` → FR, `32` → BE, `41` → CH). Default `FR` si préfixe inconnu.
- **Routage transactionnel** : fonction privée `selectTransactionalProvider(phone)` dans [`sms.ts`](../src/lib/sms.ts) — appelée juste avant l'insert du log. Retourne `'ovh'` ou `'sms_partner'`.
- **Routage marketing** : aucun routage. `sendMarketingSms()` appelle directement le wrapper OVH et logge `provider: 'ovh'` en dur.
- **Wrappers** : [`ovh-sms.ts`](../src/lib/ovh-sms.ts) (signature inchangée) et [`sms-partner.ts`](../src/lib/sms-partner.ts) (signature analogue : `(phone, message) → { success, jobId?, error? }`, fire-and-forget, jamais d'exception).
- **Tracé** : colonne `sms_logs.provider` (`'ovh' | 'sms_partner'`, default `'ovh'`). `sms_logs.ovh_job_id` stocke aussi le `message_id` SMS Partner — sémantique élargie : ID externe du provider quel qu'il soit. Pas de renommage pour préserver l'historique.
- **Sanitize GSM-7** : [`sms-sanitize.ts`](../src/lib/sms-sanitize.ts) — helper `sanitizeSmsForGsm7()` remplace €/£/$ par EUR/GBP/USD avant l'envoi. Appliqué dans les **2 providers bas niveau** (ovh-sms + sms-partner) plutôt qu'au wrapper, pour catch-all TOUS les call sites (sendBookingSms, sendMarketingSms, sms-trial-marketing, /api/admin/test-sms, futurs callers). `sms_logs.message_body` conserve l'original (utile debug : voit ce que le système a tenté vs ce qui est parti). Les accents latins ne sont pas touchés (passent via GSM-7 extension table ou bascule UCS-2 = 2 SMS au lieu d'1, gérée par les carriers).

#### Variables d'environnement

| Variable | Valeur typique | Effet |
|---|---|---|
| `SMS_PARTNER_API_KEY` | clé fournie par SMS Partner | Auth API. Sans ça → tous les envois SMS Partner échouent en `failed` |
| `SMS_PARTNER_SENDER` | `Qarte` (3-11 chars, sans spéciaux) | Sender ID affiché chez le destinataire |
| `SMS_PARTNER_ENABLED` | `true` ou `false` | **Feature flag principal**. `≠ "true"` → tout repart sur OVH instantanément |
| `SMS_PARTNER_SANDBOX` | `true` (dev) ou `false` (prod) | Mode test SMS Partner : pas de débit, pas d'envoi réel |

#### Rollback rapide vers OVH

Si SMS Partner pose problème en prod (down, dégradation, facturation, etc.) :

1. **Vercel Dashboard** → projet `qarte-saas` → **Settings → Environment Variables**
2. Trouver `SMS_PARTNER_ENABLED` (Production) → Edit → `true` → `false` → Save
3. **Deployments** → dernier deploy → menu `...` → **Redeploy**
4. Délai effectif : ~1 min (durée du redeploy Vercel)

⚠️ **Le redeploy est obligatoire** : Vercel ne hot-reload pas les env vars sur les fonctions serverless. Sans redeploy, la valeur reste cachée en mémoire.

Variante CLI plus rapide :
```bash
echo "false" | vercel env add SMS_PARTNER_ENABLED production --force
vercel --prod  # déclenche redeploy
```

Variante "kill switch" via commit vide (si flag déjà à `false` côté Vercel mais pas redéployé) :
```bash
git commit --allow-empty -m "ops: rollback SMS Partner"
git push  # auto-deploy Vercel
```

#### Sécurité du rollback

- Aucune perte de données : SMS déjà envoyés via SMS Partner restent loggés (`provider='sms_partner'`).
- Aucune migration à reverse : la colonne `provider` reste, default `'ovh'`.
- Pas de coupure : entre le changement de var et la fin du redeploy, les fonctions actives continuent leur trafic normalement.
- Le code SMS Partner reste en place mais n'est plus appelé — réactivable instantanément.

#### Robustesse transactionnelle (mig 162, mai 2026)

Refonte profonde post-incident "this operation was aborted" + audit ([`src/lib/sms.ts`](../src/lib/sms.ts) `sendWithIntelligentFallback`).

**Classification d'erreur** ([`sms-error-classifier.ts`](../src/lib/sms-error-classifier.ts)) — 8 classes : `success`, `invalid_phone`, `no_credit`, `rate_limit`, `timeout`, `server_error`, `config_error`, `unknown`. Dépend du provider :
- OVH : `errorCode` extrait du body `(INVALID_RECEIVER)` → `invalid_phone`, HTTP 402 → `no_credit`, etc.
- SMS Partner : code per-numéro `errors[0].code` prime sur `code` top-level (incident 2026-05-08 : code 55 top-level vague vs code 9 per-numéro précis). Codes 1/10 → `config_error`, 2/9/55 → `invalid_phone`, 11 → `no_credit`.

**Décision fallback** :
| Erreur | Action |
|---|---|
| `invalid_phone` | Pas de fallback. Après 2 confirmations sur 2 providers → ajout `sms_phone_blacklist`. Pre-check `isPhoneBlacklisted()` skip à la source. |
| `config_error` | Pas de fallback. Alerte admin email `sales@getqarte.com` (dedup 30min). |
| `no_credit` | Fallback autre provider + alerte admin. |
| `rate_limit` / `server_error` / `unknown` | Fallback safe sur l'autre provider (timeout 8s × 3 retries via [`fetch-with-retry.ts`](../src/lib/fetch-with-retry.ts)). |
| `timeout` SMS Partner | **PAS de fallback immédiat** (ambigu, peut être déjà parti). Status `pending_verify` + `verify_after = NOW + 10min`. Attend DLR webhook. |
| `timeout` OVH | Fallback impossible (OVH = fallback ultime du flow FR/BE quand SMS Partner échoue). |

**Webhook DLR SMS Partner** ([`/api/sms-partner/dlr`](../src/app/api/sms-partner/dlr/route.ts)) : auth via secret query string `SMS_PARTNER_DLR_SECRET`. SMS Partner POSTe `{status: 'delivered'|'not delivered'|'waiting', msgId, phone, ...}`. On match `sms_logs.provider_msg_id` (index `idx_sms_logs_provider_msg_id`) :
- `delivered` → `status='sent'` final, `delivery_status='delivered'`
- `not delivered` → trigger fallback OVH inline + log
- `waiting` → patience, re-tick

**Cron `sms-verify`** ([`/api/cron/sms-verify`](../src/app/api/cron/sms-verify/route.ts), `*/10 * * * *`) — backstop pour les `pending_verify` dont le DLR n'arrive jamais (perdu, urlDlr non passé, etc.). Promise.allSettled chunked par 5 + early exit time budget 50s/60s. Latence end-to-end max : 10min après envoi.

**Cron `sms-batch-audit`** ([`/api/cron/sms-batch-audit`](../src/app/api/cron/sms-batch-audit/route.ts), `30 19 * * *` UTC) — filet de sécurité quotidien. Vérifie chaque slot demain a un `sms_logs reminder_j1` valide (sent/delivered/pending_verify), re-envoie défensivement les manquants via `sendBookingSms`. Si > 5% manquants → alerte admin. **Garde-fou anti-prématurité** : check `app_config.sms_evening_last_run_at` < 6h, sinon skip (sinon trigger manuel à 8h UTC re-envoie tous les rappels du jour, cf incident 2026-05-08).

**Hors scope** : marketing campagnes (`sms_campaigns`) + trial marketing (`merchant_marketing_sms_logs`) restent **OVH only**, pas de fallback ni retry.

#### Limites connues

- ⚠️ **Suisse non couverte** par SMS Partner (compte non habilité). Détection automatique via préfixe `41` → fallback OVH. Si le compte est étendu un jour, modifier `selectTransactionalProvider()` dans [`sms.ts`](../src/lib/sms.ts) pour inclure `CH`.
- ⚠️ **Restriction horaire SMS commerciaux** : SMS Partner applique par défaut la restriction légale française (pas d'envoi 20h-8h, dimanches/jours fériés). Pour les transactionnels (rappels J-0), demander au support SMS Partner de désactiver cette contrainte sur la clé API utilisée. Compte Qarte actuel : restriction levée (avril 2026).
- ⚠️ **Pas de signature HMAC** côté webhook DLR SMS Partner (non documenté chez eux). Auth uniquement via secret query string `SMS_PARTNER_DLR_SECRET`. Si compromis → regénérer + redéployer + l'env Vercel se met à jour.

#### Tarification merchant — inchangée par le routage

- 0,075€/SMS quota/pack peu importe le provider.
- 1 SMS = 1 unité décrémentée du quota gratuit (100/cycle) ou du `sms_pack_balance`.
- Le calcul agrège les deux providers : `getSmsUsageThisMonth()` dans [`sms.ts`](../src/lib/sms.ts) ne filtre **jamais** par provider. Voir aussi `getSmsQuotaStatus()`, `consumePackOne()`, `refundPackOne()`, RPC `credit_sms_pack` — tous indépendants du provider.

#### Dunning past_due — SMS J0 + J+2 (mig 163, mai 2026)

2 SMS transactionnels critiques envoyés au **merchant** (pas à sa cliente) en complément des 4 emails dunning existants (`paymentFailed` step 1/2/3/4 à J0/J+3/J+7/J+10). Helper unique [`src/lib/sms-past-due.ts`](../src/lib/sms-past-due.ts) `sendPastDueSms({ supabase, merchant, step })` :

| Step | Type | Trigger | Quand |
|---|---|---|---|
| 1 | `past_due_initial` | Stripe webhook `invoice.payment_failed` | Immédiat (fire-and-forget après l'email step 1) |
| 2 | `past_due_reminder` | Cron `morning` section "DUNNING — SMS J+2" | `daysSince(updated_at) >= 2 AND past_due_sms2_sent_at IS NULL` |

**Logging** : table séparée `merchant_marketing_sms_logs` (canal Qarte→merchant, comme trial marketing), pas `sms_logs`. **N'impacte pas le quota merchant** — coût absorbé par Qarte (logué dans `cost_euro` pour billing interne).

**Routage provider** : SMS Partner pour FR/BE, OVH pour CH (réutilise `selectProvider(phone)` interne au helper, identique à la règle générale transactionnelle).

**Anti-doublon (atomic claim)** : 2 colonnes dedup sur `merchants` — `past_due_sms1_sent_at` / `past_due_sms2_sent_at` (mig 163). Le helper fait un `UPDATE WHERE flag IS NULL AND subscription_status='past_due'` puis vérifie `claimed?.id` — le 2ème worker concurrent (race webhook/cron) voit 0 row updated et skip avec `{skipped: 'already_sent'}`. Si l'envoi échoue après le claim, **rollback automatique** du flag (`UPDATE flag = NULL`) pour qu'une prochaine tentative puisse retenter.

**Reset cycle** : sur `invoice.payment_succeeded`, `resetPastDueSmsFlags(supabase, merchantId)` remet les 2 flags à NULL — si le merchant retombe en past_due plus tard, le cycle SMS repart proprement avec step 1.

**Garde-fou narrative** : step 2 ne part jamais sans step 1 (`if (step === 2 && !past_due_sms1_sent_at) skip`). Côté cron : si `past_due_sms1_sent_at IS NULL` (webhook raté), on envoie step 1 plutôt que step 2 (cohérence narrative > rattrapage strict du timing).

**Guards en cascade** (early-return ordré) :
1. `deleted_at` (soft-deleted) → skip
2. `no_contact` (full opt-out merchant) → skip
3. `subscription_status !== 'past_due'` (résolu entre temps) → skip
4. Phone invalide (`< 8 chars`) → skip
5. `isPhoneBlacklisted()` (mig 162) → skip
6. Step 2 sans step 1 → skip
7. Atomic claim échoué (race) → skip

**Pas d'opt-out marketing requis** : caractère transactionnel critique (info compte). Ne respecte PAS `marketing_sms_opted_out` ni `sms_opt_outs`. **Seul `merchants.no_contact = true` bloque** (full opt-out admin).

**Templates** ([`sms-past-due.ts`](../src/lib/sms-past-due.ts) `buildBody`) — < 160 chars GSM-7, tutoiement, pas de mention STOP :
- Step 1 (J0) : `Qarte: ton paiement vient d'echouer. Mets a jour ta carte pour ne pas perdre tes donnees: https://getqarte.com/dashboard/subscription`
- Step 2 (J+3 = 72h, mig 164) : `Qarte: ton acces est suspendu pour defaut de paiement. Mets a jour ta carte pour reactiver: https://getqarte.com/dashboard/subscription`

**Lien avec le blocage 72h (mig 164, mai 2026)** : a partir de J+3 en past_due, le merchant est bloque (dashboard redirect + 8 routes API client-facing en 403 + `<SuspendedBanner />` sur vitrine + scan). Le SMS J+3 (`past_due_reminder`) annonce la suspension active, sync avec l'email step 2. Source de verite temporelle : `merchants.past_due_since` (mig 164), pose par le webhook avec atomic claim (independant de `updated_at` qui peut etre reset par toggle settings). Le cron utilise desormais `past_due_since` au lieu de `updated_at` pour le calcul `daysSince`. Voir [docs/context.md](context.md) section "Blocage past_due > 72h".

**Coupure des SMS sortants quand merchant bloque (mig 164)** : `sendBookingSms` et `sendMarketingSms` integrent le check `isPastDueBlocked()`. Concretement : un merchant suspendu ne peut plus envoyer de rappels J-1/J-0, marketing campagnes, welcome, review, voucher_expiry, near_reward, birthday, gift_card_received/expiry, etc. — TOUTES les automations stoppent. Evite l'incoherence "cliente recoit rappel RDV demain alors que le merchant est suspendu et ne pourra pas la check-in". 7 cron callers passent maintenant `pastDueSince` (sms-hourly, evening, sms-batch-audit, morning-jobs, gift-cards-deliver, gift-cards-expire) et le dispatch campagnes (`sms-campaigns-dispatch`) marque la campagne `failed` au niveau merchant pour eviter N tentatives qui echoueraient. **Exception** : les 2 SMS dunning past_due eux-memes (`past_due_initial` + `past_due_reminder`, [`sms-past-due.ts`](../src/lib/sms-past-due.ts)) ne passent pas par ce gate — c'est de la communication Qarte→merchant, pas merchant→client.

### Helpers
- `fetchOptedOutPhones(supabase, merchantId)` — Set des téléphones opt-out, utilisé par crons + audience resolver
- `hasSmsLog(supabase, merchantId, smsType, phone, since?)` — check dedup unifié
- `resolveAudienceUnion(supabase, merchantId, filters[])` — union multi-filtres ('all' exclusif)
- Type partagé `CustomerEmbed` + `getEmbeddedCustomer()` — évite les casts répétés

### Alertes conso
`notifyMerchantQuotaAlert()` dans [`src/lib/sms-alerts.ts`](../src/lib/sms-alerts.ts) — push PWA merchant + email `SmsQuotaEmail` FR/EN, dédupliqué par cycle via `sms_alert_{80,100}_sent_cycle`.

### Monitoring crédits providers (OVH + SMS Partner)
Surveillance du **solde de crédits chez les providers eux-mêmes** (différent de la conso merchant — c'est le solde Qarte chez OVH / SMS Partner).

**Helpers** :
- `getOvhCredit()` dans [`src/lib/ovh-sms.ts`](../src/lib/ovh-sms.ts) — `GET /sms/{service}` réutilise `ovhRequest()` (HMAC-SHA1)
- `getSmsPartnerCredit()` dans [`src/lib/sms-partner.ts`](../src/lib/sms-partner.ts) — `GET /v1/me?apiKey=...` lit `data.credits.creditSms` (SMS standards)
- Les deux retournent `number | null` (null = config absente ou erreur réseau)

**Constantes** ([`src/lib/sms-constants.ts`](../src/lib/sms-constants.ts)) :
- `SMS_CREDIT_LOW_THRESHOLD = 50` — seuil alerte mail
- `SMS_CREDIT_WARN_THRESHOLD = 200` — seuil "à recharger bientôt" (UI uniquement)
- `SMS_CREDIT_RESET_THRESHOLD = 75` — seuil de re-armement (anti-spam alerte)

**Affichage admin** (`/admin/sms` Aperçu) :
- Route [`/api/admin/sms/credits`](../src/app/api/admin/sms/credits/route.ts) — fetch parallèle OVH + SMS Partner, **cache module-level 5min** (Next.js `revalidate` ne fonctionne pas sur route avec `authorizeAdmin` qui rend la route dynamique)
- Composant `ProviderCreditCard` : couleur emerald (≥200) / amber (50-199) / red (<50) / gray (null=Indisponible)

**Cron daily** ([`/api/cron/sms-credits-check`](../src/app/api/cron/sms-credits-check/route.ts)) :
- Schedule : **0 8 * * *** (8h UTC = 9-10h Paris) dans `vercel.json`
- Pour chaque provider : si crédit `<50` → `sendSmsCreditLowEmail` à `contact@getqarte.com` (template aligné sur `sendNewMerchantNotificationEmail`)
- Dédup : `app_config(key='sms_credit_alert_{ovh,partner}_last_sent_at', value={sent_at: ISO})` — pas de re-spam tant que pas de reset
- Reset auto : si crédit remonté ≥75 (= LOW × 1.5), efface le flag → prochain passage sous 50 ré-alerte
- Provider unavailable (null) : skip silencieux, pas d'alerte (probable config manquante / blip réseau, pas une vraie urgence)

### Campagnes manuelles

**Règle conso** : 1 SMS de campagne = 1 crédit décrémenté de `sms_pack_balance`. Quota gratuit jamais touché. Gate strict côté `/api/sms/campaign/submit` (HTTP 402 `pack_insufficient` si `totalSmsRequested > packBalance`) + côté `sendMarketingSms` (`error: 'pack_empty'`).

```
merchant rédige dans SmsTab (audience multi-select)
  → POST /api/sms/campaign/submit
  → sms_campaigns.status = 'pending_review'
  → audience_filter = { filters: AudienceFilter[] }
  → scheduled_at re-décalé auto si hors horaires légaux

Admin /admin/sms onglet "Modération"
  → approve → status='scheduled' + push merchant
  → reject → status='rejected' + review_note + push merchant

Cron /api/cron/sms-campaigns-dispatch (*/15min)
  → SELECT WHERE status='scheduled' AND scheduled_at <= NOW()
  → re-check subscription, compliance
  → Si pending_phones non-vide : envoi cible sur cette liste (reprise apres crédit OVH épuisé)
    Sinon : resolve audience (opt-outs récents)
  → normalizeToGsm7(body) — retire emojis/smart quotes (1 SMS au lieu de 2 UCS-2)
  → sendMarketingSms en boucle :
    - Stop si quota Qarte épuisé (blocked) → re-schedule +1h
    - Stop si crédit OVH épuisé (HTTP 402, creditExhausted) → save remaining phones dans pending_phones + re-schedule +1h, cumul recipient_count
  → status → done | failed | scheduled
  → Si done : sendSmsCampaignSentEmail(merchant) — récap destinataires/coût/message + note si normalisation
```

### Automatisations
[`/api/cron/sms-hourly`](../src/app/api/cron/sms-hourly/route.ts) — 9 sections, chacune avec compliance check (`isLegalSendTime`) pour le marketing :
1. **J-0 reminder** — H-3 avant RDV, plancher 7h local, gaté sur `planning_enabled`
2. **Welcome** — clients créés 60-120min avant
3. **Review Google** — visites 120-180min avant, inclut `review_link` dans le SMS
4. **Event** — J-7 avant fêtes, 10h local, dédup par `event_id:date`
5. **Voucher expiry** — J-7 avant `expires_at`, 10h local
6. **Referral invite** — ≥5 visites (batch GROUP BY, pas de N+1), 10h local
7. **Inactive reminder** — dernière visite [30, 45j], 10h local, dédup 60j
8. **Near reward** — `current_stamps = required - 1` (palier 1 ou 2), dernière visite ≥15j, dédup 90j, 10h local
9. **Birthday SMS** — fallback à 10h local pour les SMS anniversaire skippés par `morning-jobs` (7h UTC = hors plage légale FR). Voucher + push + email gérés par `morning-jobs`. Dédup via `sms_logs` same-day

Opt-outs batch-fetched une fois par merchant via `fetchOptedOutPhones()`. Dedup via `hasSmsLog()`.

### Compliance
[`src/lib/sms-compliance.ts`](../src/lib/sms-compliance.ts) — heures légales 10h-20h lun-sam, pas dim/jours fériés FR/BE/CH (hardcodés 2026-2027). Appliqué à toutes les sections marketing du cron + dispatch campaign.

**Logging skip detail (mai 2026)** : `sendTrialMarketingSms` enrichit le log `trial_sms_skipped` avec un champ `detail` quand le skip est `illegal_time` (sous-motif `holiday` / `sunday` / `before_legal_hour` / `after_legal_hour`). Évite le faux diagnostic "cron cassé" quand c'est juste un jour férié (cas observé 2026-05-08 Victoire 1945, 22h de silence apparent).

### Validator
[`src/lib/sms-validator.ts`](../src/lib/sms-validator.ts) — 160 (1 SMS) / 306 (2 SMS) / max 306, mots interdits, STOP auto, variables résolues.

### Opt-out
Mention "STOP SMS" en fin de corps (pas de mécanisme actif — pas de webhook inbound OVH). Table `sms_opt_outs(phone, merchant_id)` consultée partout (resolveAudienceUnion, sms-hourly, vouchers/use pour referral_reward). Plan URL courte `qrt.fr/s/{token}` non implémenté (domaine pas réservé).

**Note** : la colonne `no_contact` n'existe que sur `merchants` (pour blocker les SMS outbound admin). Elle n'existe PAS sur `customers` — l'opt-out client passe uniquement par `sms_opt_outs`.

---

## Admin — `/admin/sms`

Page unique avec 2 onglets (anciennes `/admin/sms` + `/admin/sms-review` fusionnées) :
- **Aperçu** : KPIs (total/mois/semaine/échecs) + breakdown par merchant (cycle de facturation)
- **Modération** : liste pending campaigns + approve/reject + badge count dans l'onglet

---

## Schéma DB — 2 migrations SMS

### Migration 112 — `112_sms_marketing.sql` (déjà appliquée)

Colonnes sur `merchants` :
```sql
sms_pack_balance INT DEFAULT 0
sms_alert_{80,100}_sent_cycle DATE
reminder_{j1,j0}_enabled BOOL (j1 default true)
referral_reward_sms_enabled BOOL DEFAULT true
referral_invite_sms_enabled BOOL DEFAULT false
welcome_sms_enabled / post_visit_review_enabled / voucher_expiry_sms_enabled / inactive_sms_enabled / events_sms_enabled BOOL DEFAULT false
review_sms_include_link BOOL DEFAULT false  -- legacy, non utilisé
google_review_url TEXT  -- legacy, non utilisé → on utilise review_link
events_sms_offer_text / events_sms_last_event_id TEXT
```

Tables créées :
- `sms_pack_purchases` (audit Stripe)
- `sms_campaigns` (moderation + dispatch)
- `sms_opt_outs` (PK composite phone+merchant)

CHECK `sms_logs.sms_type` étendu avec : `reminder_j0`, `campaign`, `welcome`, `review_request`, `voucher_expiry`, `referral_invite`, `inactive_reminder`.

RPC : `credit_sms_pack(merchant_id, amount)` pour crédit pack atomique (used by Stripe webhook + refund).

### Migration 113 — `113_sms_near_reward.sql` (à appliquer)

Ajout :
- Colonne `merchants.near_reward_sms_enabled BOOL DEFAULT false`
- CHECK `sms_logs.sms_type` étendu avec `near_reward`

---

## Mapping colonne merchants → toggle → use case

| DB column | UI | Déclencheur | Préreq UI |
|-----------|-----|-------------|-----------|
| `reminder_j1_enabled` | Rappel J-1 | evening cron | `planning_enabled` |
| `reminder_j0_enabled` | Rappel J-0 | hourly cron H-3 | `planning_enabled` |
| `referral_reward_sms_enabled` | Récompense parrain | `/api/vouchers/use` | `referral_program_enabled` |
| `referral_invite_sms_enabled` | Invitation parrain | hourly cron 10h-11h, dedup 60j | `referral_program_enabled` |
| `post_visit_review_enabled` | Avis Google — **GELÉ depuis 2026-07-22** (`REVIEW_SMS_ENABLED`) | hourly cron H+2 après récompense (palier 1 ou 2), dedup 60j | `review_link` défini |
| `voucher_expiry_sms_enabled` | Voucher expire | hourly cron 10h-11h, dedup daily | — |
| `near_reward_sms_enabled` | Plus qu'un tampon | hourly cron 10h-11h, dedup 60j | `reward_description` défini |
| `inactive_sms_enabled` | Relance inactif | hourly cron 10h-11h, dedup 60j | — |
| `events_sms_enabled` | Rappel avant fêtes | hourly cron 10h-11h, dedup daily per phone | — |
| ~~`welcome_sms_enabled`~~ | ~~Welcome~~ | Supprimé 22 avril 2026 (pas de toggle UI, code mort retiré). Colonne DB conservée en attendant un cleanup de migration. | — |

---

## Points non implémentés / à faire

1. **Opt-out actif** (`qrt.fr/s/{token}` + page `/stop/[token]`) — bloqué par absence de domaine court
2. **Email merchant** sur approve/reject campagne (push uniquement v1)
3. **Enrichissement `/admin/sms`** : KPIs temps réel, packs vendus, alertes 80/100 actives
4. **`docs/sms-matrix.md`** frère de email-matrix.md
5. **Tests d'intégration**
6. **Défauts pack** (promo lancement)
7. **Rotation merchants** dans sms-hourly (anti-starvation si timeout)
