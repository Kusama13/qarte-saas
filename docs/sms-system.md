# SMS System — Context

Dernière MAJ : 18 avril 2026. Phases A → E livrées sur la branche `main` (pas encore pushé).

## Vue d'ensemble

Le système SMS Qarte couvre **3 cas d'usage** :

| Usage | Exemple | Consomme |
|-------|---------|----------|
| **Transactionnel** | Rappel RDV J-1, J-0, confirmations, modifs, annulations | Quota 100 + pack |
| **Marketing auto** | Anniversaire, welcome, avis Google, rappel avant fête, relance inactif | Quota 100 + pack |
| **Marketing manuel** | Campagnes composées par le merchant, avec audience filtrée | Quota 100 + pack |

**Règle centrale** : un seul pot (quota gratuit 100/cycle → pack SMS) alimente tous les envois. **Pas d'overage facturé** — blocage dur à épuisement, alerte à 80% et 100%.

---

## Structure UI — `/dashboard/marketing`

Page avec **3 onglets** :

### Onglet Push
- `SubscriberRing` (compteur abonnés PWA) — déplacé ici depuis le header de page
- Composer push (titre + message + offre dépliante + image optionnelle + planning 10h/18h)
- Historique + scheduled pushes
- `PushAutomations` en bas : relance inactifs, rappel récompense, événements push (cadres existants avant refonte)

### Onglet SMS
- Composer unique "Rédiger mon SMS" :
  - Dropdown **Inspirations** (8 suggestions starter dans [`src/lib/sms-templates.ts`](../src/lib/sms-templates.ts), toutes **sans lien** — `qrt.fr` n'est pas réservé)
  - Textarea + boutons insertion `{prenom}` `{shop_name}`
  - Compteur live 1/2 SMS (vert/orange/rouge selon longueur)
  - Preview mockup iPhone avec variables remplacées (Sophie + vrai shop_name)
  - Audience picker (select) : all, inactive 14/30/60/90j, new 30j, vip 5+ tampons, birthday_month, unused_voucher 7j+
  - Schedule (immédiat / planifié date+heure)
  - Récap coût + bouton "Soumettre pour validation"
- Historique 10 dernières campagnes avec status badge
- **Toutes les campagnes passent par modération admin** (pas de bypass)

### Onglet Automatisations SMS
4 cartes compactes + 1 carte événement expansible :
| Carte | Badge | Déclencheur | Default |
|-------|-------|-------------|---------|
| Rappel J-1 | 🔷 Transactionnel | 19h veille | **ON** |
| Rappel J-0 matin | 🔷 Transactionnel | H-3 si ≥7h local | OFF |
| Welcome nouveau client | 🔶 Marketing | H+1 après 1er scan | OFF |
| Merci + avis Google | 🔶 Marketing | H+2 après visite | OFF |
| Rappel avant les fêtes | 🔶 Marketing | 10h local J-7 avant Saint-Valentin/Noël/etc. | OFF |

Chaque carte : toggle + description + badge Transactionnel (sky) ou Marketing (violet Qarte).
La carte événements est expansible : message perso + liste des 7 fêtes (via `getUpcomingEvent()` de [`src/lib/push-automation.ts`](../src/lib/push-automation.ts)).

### SmsBalancePanel (header de page, au-dessus des onglets)
Toujours visible. Affiche :
- Progression `X / 100 gratuits ce cycle` avec barre couleur (vert < 80, jaune ≥ 80, rouge à 100 sans pack)
- Solde pack additionnel
- Bouton "Acheter un pack" → ouvre `BuyPackModal`

### HowItWorksModal (bouton "Aide")
4 sections colorées détaillées : Push (audience, usage) · SMS (audience, compteur, modération 2h, compliance) · Automatisations (distinction Transactionnel vs Marketing) · Quota & packs (100 inclus, packs 50-250, blocage à 0). + warning fréquence en bas.

---

## Pricing packs SMS

**Flat 0,075€ HT/SMS + 1€ HT "frais de traitement" par pack, TVA 20% auto via Stripe Tax.**

| Pack | Prix HT | Frais HT | Total HT | TVA | **TTC** |
|------|---------|----------|----------|-----|---------|
| 50 | 3,75€ | 1€ | 4,75€ | 0,95€ | **5,70€** |
| 100 | 7,50€ | 1€ | 8,50€ | 1,70€ | **9,00€→10,20€** |
| 150 (populaire) | 11,25€ | 1€ | 12,25€ | 2,45€ | **13,50€→14,70€** |
| 200 | 15€ | 1€ | 16€ | 3,20€ | **18€→19,20€** |
| 250 | 18,75€ | 1€ | 19,75€ | 3,95€ | **22,50€→23,70€** |

**Validité** : packs valables tout au long de l'abonnement, pas d'expiration. Perdus à la résiliation.

**Stripe** : `price_data` inline (pas de Price ID à créer dashboard), 2 line_items (SMS + frais), `automatic_tax: true`. Produits "éphémères" créés à chaque checkout — accepté tant que le volume est modeste.

---

## Architecture technique

### Priorité conso (dans [`src/lib/sms.ts`](../src/lib/sms.ts))
1. Quota gratuit mensuel 100 SMS
2. Solde pack (`merchants.sms_pack_balance`)
3. **Blocage** (`{ success: false, blocked: true, error: 'quota_exhausted' }`) — pas d'overage

**Deux fonctions d'envoi** :
- `sendBookingSms()` — transactionnel (existant, étendu). Gate quota+pack. Refund pack si OVH fail.
- `sendMarketingSms()` — nouveau, pour campagnes + auto marketing. Accepte `smsType` (`campaign` / `welcome` / `review_request`). Même gate.

**Alertes** : `notifyMerchantQuotaAlert()` dans [`src/lib/sms-alerts.ts`](../src/lib/sms-alerts.ts) — push PWA merchant + email via `sendSmsQuotaEmail`, dédupliqué par cycle via `merchants.sms_alert_{80,100}_sent_cycle`.

### Campagnes manuelles (avec modération admin)

Flow merchant :
```
merchant rédige dans SmsTab
  → POST /api/sms/campaign/submit
  → sms_campaigns.status = 'pending_review'
  → scheduled_at décalé auto si hors horaires légaux (10h-20h FR, pas dim/JF)
```

Flow admin :
```
/admin/sms-review (page liste les pending)
  → POST /api/admin/sms-campaigns/{id}/approve → status='scheduled' + push merchant
  → POST /api/admin/sms-campaigns/{id}/reject → status='rejected' + review_note + push merchant
```

Cron dispatch toutes les 15 min :
```
/api/cron/sms-campaigns-dispatch
  → SELECT WHERE status='scheduled' AND scheduled_at <= NOW()
  → re-check compliance + re-resolve audience (opt-outs récents)
  → boucle sendMarketingSms, stop si blocked (quota)
  → update status 'done' ou 'failed'
```

### Automatisations (cron hourly)

[`/api/cron/sms-hourly`](../src/app/api/cron/sms-hourly/route.ts) — une seule route, 4 sections :
1. **J-0 reminder** : H-3 avant chaque RDV aujourd'hui, plancher 7h local (courtoisie, pas légal), dédup par slot_id
2. **Welcome** : clients créés entre now-120min et now-60min, dédup par phone+type
3. **Review Google** : visites entre now-180min et now-120min, dédup phone+type+jour
4. **Events SMS** : fire à 10h local uniquement, utilise `getUpcomingEvent()` pour détecter J-7, dédup par `event_id:date` stocké dans `merchants.events_sms_last_event_id`

Tous envois marketing vérifient `sms_opt_outs` avant envoi.

### Compliance (marketing uniquement)

[`src/lib/sms-compliance.ts`](../src/lib/sms-compliance.ts) :
- Heures légales FR/BE/CH : 10h-20h lun-sam, pas dimanche, pas jours fériés (listes hardcodées 2026-2027)
- `isLegalSendTime(date, country)` — check
- `nextLegalSlot(from, country)` — décale au prochain slot autorisé

Le dispatch cron applique automatiquement le re-schedule.

### Validator ([`src/lib/sms-validator.ts`](../src/lib/sms-validator.ts))
- Longueur 160 (1 SMS) / 306 (2 SMS) / max 306
- Mots interdits (partagés via `@/lib/content-moderation` + liste marketing : "urgent", "cliquez ici", "gratuit sans condition")
- STOP auto-ajouté si absent
- Variables non résolues → rejet

### Opt-out
**Pas de numéro STOP réel** (OVH ne l'inclut pas, prestataire cible idem). Mention `STOP SMS` en fin de corps, mais **pas de mécanisme actif** (pas de webhook inbound v1). Le plan prévoit une URL `qrt.fr/s/{token}` mais **non implémenté** — `qrt.fr` pas réservé. V1 : opt-out manuel via support.

Table `sms_opt_outs (phone_number, merchant_id)` existe et est consultée partout (`resolveAudience`, dispatch, cron hourly).

---

## Schéma DB (migrations 112-115)

### Colonnes ajoutées sur `merchants`
```sql
sms_pack_balance INT DEFAULT 0
sms_alert_80_sent_cycle DATE
sms_alert_100_sent_cycle DATE
reminder_j1_enabled BOOL DEFAULT true   -- J-1 ON par défaut
reminder_j0_enabled BOOL DEFAULT false
welcome_sms_enabled BOOL DEFAULT false
post_visit_review_enabled BOOL DEFAULT false
review_sms_include_link BOOL DEFAULT false
google_review_url TEXT
events_sms_enabled BOOL DEFAULT false
events_sms_offer_text TEXT
events_sms_last_event_id TEXT  -- idempotence format "event_id:YYYY-MM-DD"
```

### Nouvelles tables
- `sms_pack_purchases` — audit achats (pack_size, amount_ht_cents, processing_fee_ht_cents, vat_rate, amount_ttc_cents, stripe_session_id, stripe_invoice_id, status pending/paid/failed/refunded)
- `sms_campaigns` — campagnes (kind template/custom, body, audience_filter JSONB, recipient_count, status draft/pending_review/approved/rejected/scheduled/sending/done/failed, review_note, reviewed_by, reviewed_at, scheduled_at, sent_at, cost_cents)
- `sms_opt_outs` — opt-outs (phone_number, merchant_id, opted_out_at, reason: link/stop_reply/manual/complaint) — PK composite

### CHECK étendu sur `sms_logs.sms_type` (migration 114)
Types autorisés : `reminder_j1`, `reminder_j0`, `confirmation_no_deposit`, `confirmation_deposit`, `birthday`, `referral_reward`, `booking_moved`, `booking_cancelled`, `campaign`, `welcome`, `review_request`.

### RLS
- `sms_pack_purchases` : merchants SELECT propre
- `sms_campaigns` : merchants SELECT + INSERT propre (modération côté admin)
- `sms_opt_outs` : merchants SELECT propre

---

## Fichiers touchés (récap)

### Créés
- `supabase/migrations/112_sms_marketing_phase_a.sql`
- `supabase/migrations/113_sms_type_campaign.sql`
- `supabase/migrations/114_sms_type_phase_e.sql`
- `supabase/migrations/115_sms_events_automation.sql`
- `src/lib/sms-compliance.ts` + `sms-validator.ts` + `sms-audience.ts` + `sms-templates.ts` + `sms-alerts.ts`
- `src/app/[locale]/dashboard/marketing/SmsTab.tsx` + `SmsBalancePanel.tsx` + `BuyPackModal.tsx` + `PushAutomations.tsx`
- `src/app/[locale]/admin/sms-review/page.tsx`
- `src/emails/SmsQuotaEmail.tsx` + subjects FR/EN + translations FR/EN
- 10 routes API : `/api/sms/automations`, `/api/sms/usage` (étendu), `/api/sms/campaign/{preview,submit,list}`, `/api/admin/sms-campaigns/pending`, `/api/admin/sms-campaigns/[id]/{approve,reject}`, `/api/stripe/sms-pack/checkout`, `/api/cron/sms-campaigns-dispatch`, `/api/cron/sms-hourly`

### Modifiés
- `src/lib/sms.ts` (priorité conso, sendMarketingSms, alertes)
- `src/app/api/cron/evening/route.ts` (respect `reminder_j1_enabled`)
- `src/app/api/stripe/webhook/route.ts` (handler `sms_pack`)
- `src/app/[locale]/dashboard/marketing/page.tsx` (3 onglets + SmsBalancePanel)
- `src/app/[locale]/dashboard/marketing/PushTab.tsx` (renommé depuis SendTab, dropdown templates, subscriber ring + push automations intégrés)
- `src/app/[locale]/dashboard/marketing/AutomationsTab.tsx` (SMS-only désormais)
- `src/app/[locale]/dashboard/marketing/Modals.tsx` (HowItWorksModal refait complet)
- `src/app/[locale]/dashboard/marketing/SubscriberRing.tsx` (simplifié, ring retiré — barre vide supprimée)
- `src/app/[locale]/dashboard/marketing/hooks.ts` (cleanup birthday code)
- `src/app/[locale]/dashboard/marketing/types.ts` (suppression `AUTOMATION_UNLOCK_THRESHOLD`)
- `src/app/[locale]/admin/layout.tsx` (entrée "Modération SMS")
- `vercel.json` (+2 crons : sms-campaigns-dispatch */15, sms-hourly 0 *)
- `messages/{fr,en}.json` (nouvelles clés marketing.smsBalance, smsTab, buyPack, modals, automations.{reminderJ0,welcomeSms,reviewSms,eventsSms*})

---

## Points non implémentés / à faire

1. **Opt-out actif** (page `/stop/[token]`, URL courte) — bloqué par absence de domaine court
2. **Email merchant** sur approve/reject campagne (seulement push pour l'instant)
3. **Page admin `/admin/sms`** enrichie (KPIs temps réel, alertes 80/100 en cours, packs vendus)
4. **Documentation `docs/sms-matrix.md`** frère de `email-matrix.md` (à faire)
5. **Tests d'intégration** — aucun pour l'instant
6. **Défauts pack** (promo lancement) — à discuter

## Migrations à appliquer manuellement

Dans l'ordre, via Supabase SQL Editor :
1. `112_sms_marketing_phase_a.sql`
2. `113_sms_type_campaign.sql`
3. `114_sms_type_phase_e.sql`
4. `115_sms_events_automation.sql`
