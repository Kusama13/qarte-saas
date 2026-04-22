# SMS System — Context

Dernière MAJ : 19 avril 2026.

## Vue d'ensemble

3 cas d'usage puisant dans **un seul pot** (quota gratuit 100/cycle → pack SMS prépayé) :

| Usage | Exemple | Consomme |
|-------|---------|----------|
| **Transactionnel** | Rappel RDV J-1, J-0, confirmations, modifs, annulations, parrainage | Quota + pack |
| **Marketing auto** | Welcome, avis Google, voucher expire, parrainage invite, inactif, événements, plus qu'un tampon | Quota + pack |
| **Marketing manuel** | Campagnes composées par le merchant + audience multi-filtres, modérées admin | Quota + pack |

**Règle centrale** : pas d'overage facturé. Alerte push+email à 80% et 100%. Blocage dur à 0.

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
  - Compteur live 1/2/3 SMS (vert/orange/rouge)
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
1. Quota gratuit 100 SMS/cycle
2. Solde pack (`merchants.sms_pack_balance`)
3. **Blocage** — `{ success: false, blocked: true }`

### Fonctions d'envoi
- `sendBookingSms()` — transactionnel (rappels, confirmations, parrainage, birthday). Check `PAID_STATUSES` + quota/pack + dedup par slot/phone/type/jour.
- `sendMarketingSms()` — marketing (campaign, welcome, review_request, voucher_expiry, referral_invite, inactive_reminder, near_reward). Check `PAID_STATUSES` + quota/pack. Refund pack si OVH fail ou si insert log fail.

### Helpers
- `fetchOptedOutPhones(supabase, merchantId)` — Set des téléphones opt-out, utilisé par crons + audience resolver
- `hasSmsLog(supabase, merchantId, smsType, phone, since?)` — check dedup unifié
- `resolveAudienceUnion(supabase, merchantId, filters[])` — union multi-filtres ('all' exclusif)
- Type partagé `CustomerEmbed` + `getEmbeddedCustomer()` — évite les casts répétés

### Alertes conso
`notifyMerchantQuotaAlert()` dans [`src/lib/sms-alerts.ts`](../src/lib/sms-alerts.ts) — push PWA merchant + email `SmsQuotaEmail` FR/EN, dédupliqué par cycle via `sms_alert_{80,100}_sent_cycle`.

### Campagnes manuelles
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
  → re-check subscription, compliance, audience (opt-outs récents)
  → sendMarketingSms en boucle, stop si blocked quota
  → status → done | failed | scheduled (re-try +1h si bloqué en cours)
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
| `post_visit_review_enabled` | Avis Google | hourly cron H+2 après récompense (palier 1 ou 2), dedup 60j | `review_link` défini |
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
