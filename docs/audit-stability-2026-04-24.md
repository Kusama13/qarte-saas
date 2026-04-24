# Audit Stabilité — Qarte SaaS — 2026-04-24

> Audit exploratoire réalisé le 24/04/2026. **À vérifier avant fix** : les descriptions sont générales, le comportement réel peut différer.

---

## P0 — Critique

### 1. Cron `sms-hourly` : timeout silencieux coupant les sections suivantes
**Fichier** : [api/cron/sms-hourly/route.ts:59-61, 139-149](../src/app/api/cron/sms-hourly/route.ts#L59)

**Problème** : `maxDuration = 300s`. Le cron itère sur 8 sections (j0, review, event, voucher, referral, inactive, near_reward, birthday). Si une section consomme 200s, les suivantes break silencieusement via un check de temps restant. Aucune métrique `skipped_sections` dans la réponse, aucune alerte.

**Risque concret** : Un jour où review SMS prend 150s (OVH lent), birthday/referral/inactive ne partent jamais. Invisible dans les logs.

**Fix** :
- Splitter en 2-3 crons distincts (transactionnel vs marketing vs fidélité)
- OU augmenter `maxDuration` à 600s (Vercel Pro) et cap par section
- Logger `skipped_sections: [...]` dans la réponse cron

---

### 2. Stripe webhook race condition sur achat pack SMS
**Fichier** : [api/stripe/webhook/route.ts:75-104](../src/app/api/stripe/webhook/route.ts#L75)

**Problème** : L'update `status='pending'→'paid'` + `credit_sms_pack` RPC peut être re-exécuté sur retry Stripe. Si le RPC fail entre l'update et le crédit, le solde n'est jamais crédité mais le purchase est marqué paid → merchant paie sans recevoir ses SMS.

**Fix** : Dedup via `event.id` stocké avant toute action (voir audit sécurité #2).

---

## P1 — Élevé

### 3. OVH SMS sans retry ni circuit breaker
**Fichier** : [lib/ovh-sms.ts:61-108, 40-50](../src/lib/ovh-sms.ts#L61)

**Problème** : `sendSms()` fait 1 fetch, aucun retry. Pas de `AbortController` timeout — sur hang OVH, fetch attend jusqu'au timeout Vercel (30s).

**Risque** : Maintenance OVH 10 min → 200 SMS perdus, aucun retry automatique.

**Fix** :
- `AbortController` avec timeout 5s
- Retry exponentiel (3 essais, 500ms → 2s)
- Circuit breaker simple : 5 errors/10s → fail fast pendant 30s

---

### 4. Resend webhook : skip signature si `RESEND_WEBHOOK_SECRET` absent
**Fichier** : [api/resend/webhook/route.ts:26-61](../src/app/api/resend/webhook/route.ts#L26)

**Problème** : Fallback dev mode laisse passer tout le monde en prod si la var manque → n'importe qui peut POST `email.complained` pour faire unsubscribe des merchants.

**Fix** : En prod, throw si secret manquant (voir audit sécurité #3).

---

### 5. `.single()` qui throw au lieu de `.maybeSingle()`
**Fichiers** : [api/stripe/webhook/route.ts:111,125](../src/app/api/stripe/webhook/route.ts#L111), [api/cron/sms-campaigns-dispatch/route.ts:67](../src/app/api/cron/sms-campaigns-dispatch/route.ts#L67)

**Problème** : `.single()` throw si 0 ou 2+ rows. Le code check `if (!merchant)` après, mais c'est jamais atteint car l'exception remonte d'abord.

**Fix** : Remplacer par `.maybeSingle()` sur toutes les queries où l'absence de row est un cas nominal (pas une erreur).

---

### 6. Cron SMS campaigns : partial failure non trackée
**Fichier** : [api/cron/sms-campaigns-dispatch/route.ts:143-148](../src/app/api/cron/sms-campaigns-dispatch/route.ts#L143)

**Problème** : Si le cron timeout au milieu d'une campagne de 800 phones, elle est marquée `status=done, recipient_count=420` mais 380 clients n'ont rien reçu. Merchant voit "420 envoyés" = mensonge.

**Fix** : Check `Date.now() - startedAt` avant chaque envoi, break si < 15s restant. Marquer `early_exit_at` + `sent_count` réel.

---

## P2 — Moyen

### 7. Rate limit in-memory map sans cleanup
**Fichiers** : [api/checkin/route.ts:22-42](../src/app/api/checkin/route.ts#L22), [api/cagnotte/checkin/route.ts:22-42](../src/app/api/cagnotte/checkin/route.ts#L22)

**Problème** : `rateLimitMap.set(ip, ...)` mais jamais `.delete()` après expiration. Map grandit avec chaque nouvelle IP. OOM possible en instance long-lived.

**Fix** : Cleanup LRU (cap à 10k entries) ou migrer vers Vercel KV si disponible.

---

### 8. `console.error` au lieu de `logger.error` (6 occurrences)
**Fichiers** : [lib/ovh-sms.ts:63,96,105](../src/lib/ovh-sms.ts#L63), [lib/sms.ts:418](../src/lib/sms.ts#L418)

**Problème** : Logs bruts non parsables par Vercel → impossible de grep/alerter sur patterns.

**Fix** : Remplacer par `logger.error()` avec contexte structuré (merchantId, errorCode, stack).

---

### 9. Cron `results` sans métrique d'anomalie
**Fichier** : [api/cron/sms-hourly/route.ts:178](../src/app/api/cron/sms-hourly/route.ts#L178)

**Problème** : Return toujours `200 + {ok: true, ...counts}`. Même si 0 SMS envoyés sur 400 attendus. Aucune alerte possible.

**Fix** :
- HTTP 206 Partial Content si `errors > threshold`
- Alerting custom : POST vers webhook Slack/monitoring si `sent < 10% expected`

---

## ✅ Points positifs

- `logger` util structuré, large couverture (347 call sites)
- Stripe webhook signature bien vérifiée
- Unique constraints pour dedup SMS (pattern solide)
- RPC atomique `credit_sms_pack` pour éviter race read-then-write
- Soft-delete trigger sur `merchants` (migration 102)
- CRON_SECRET auth sur tous les endpoints `/api/cron/**` vérifiée
