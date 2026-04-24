# Audit Scalabilité — Qarte SaaS — 2026-04-24

> Audit exploratoire réalisé le 24/04/2026. Contexte : quelques centaines de merchants aujourd'hui, objectif x10-x100.

---

## P0 — Casse avant 5K merchants

### 1. Cron `sms-hourly` : N+1 sur `loyalty_cards` par merchant (vérifié ✓)
**Fichier** : [api/cron/sms-hourly/route.ts](../src/app/api/cron/sms-hourly/route.ts)

**Problème** : **8 boucles `for (const m of activeMerchants)`** (lignes 139, 209, 260, 277, 325, 380, 467, 545, 565, 623) qui lancent 1 query Supabase par merchant. À 5K merchants actifs = 5K requêtes séquentielles pour UNE seule section.

**Seuil de casse** : ~2K merchants → 10K+ requêtes/heure → saturation pool de connexions Supabase.

**Fix** : Batch fetch avec `.in('merchant_id', merchantIds)` puis groupement en mémoire par merchant_id.

---

### 2. Admin API `/api/admin/merchants-data` : `listUsers()` charge TOUS les users auth (vérifié ✓)
**Fichier** : [api/admin/merchants-data/route.ts:13-22](../src/app/api/admin/merchants-data/route.ts#L13)

**Problème** : Boucle `while (hasMoreUsers) → listUsers({ page, perPage: 1000 })` charge l'intégralité de `auth.users` en mémoire. À chaque refresh du dashboard admin.

**Seuil de casse** : ~8K users → 50MB+ RAM/request, 5-8s latence.

**Fix** : Ne fetcher que les `user_id` des merchants présents dans la réponse : `supabaseAdmin.auth.admin.getUserById(id)` en parallèle (`Promise.all` sur N user_ids limité à ~50-100).

---

### 3. Cron `morning-push` : prefetch ALL merchants sans limit
**Fichier** : [api/cron/morning-push/route.ts:49-54](../src/app/api/cron/morning-push/route.ts#L49)

**Problème** : `.select()` sans `.limit()` sur table merchants. 25+ colonnes × N merchants en RAM.

**Seuil de casse** : ~20K merchants → OOM ou 10s+ load.

**Fix** : Pagination par batch (2K à la fois) ou colonnes réduites + limite.

---

### 4. Index manquant : `sms_logs(merchant_id, sms_type, created_at DESC)`
**Fichier SQL** : migrations à inspecter

**Problème** : Dedup SMS via `hasSmsLog(merchant_id, type, phone, since)` fait un filter multi-colonnes. L'index actuel `(merchant_id, created_at)` ne couvre pas `sms_type` → scan full sur la fenêtre.

**Seuil de casse** : 10M+ sms_logs → 5-10s par dedup check.

**Fix** : `CREATE INDEX idx_sms_logs_merchant_type_date ON sms_logs(merchant_id, sms_type, created_at DESC);`

---

## P1 — Casse à 50K merchants / 1M+ customers

### 5. Index `loyalty_cards(merchant_id, created_at DESC)` pour pagination
**Problème** : Dashboard "Clientes" pagine par `.order('created_at', { ascending: false })`. Si index en ASC seulement, pas utilisable pour pagination DESC.

**Fix** : Vérifier dans les migrations si l'index DESC existe. Créer si absent.

---

### 6. Dashboard home : queries multiples non-consolidées
**Fichier** : [dashboard/page.tsx](../src/app/[locale]/dashboard/page.tsx)

**Problème** : 19 queries au mount (déjà parallélisées via `Promise.all`), mais pas de cache partagé. À 10K concurrent merchants = 50-100K queries/min.

**Fix** : `GET /api/dashboard/summary` consolidant les stats en 1 endpoint SSR + cache.

---

### 7. `/p/[slug]` : `revalidate = 3600`
**Fichier** : [p/[slug]/page.tsx](../src/app/[locale]/p/[slug]/page.tsx)

**Problème** : ISR 1h → merchant modifie son offre, les clients voient le vieux contenu pendant 60 min.

**Fix** : Réduire à 600s (10 min) ou on-demand revalidation via webhook sur update merchant.

---

### 8. `releaseExpiredDeposits()` limit=200 insuffisant à l'échelle
**Fichier** : [api/cron/deposit-expiration/route.ts:28](../src/app/api/cron/deposit-expiration/route.ts#L28)

**Problème** : À 10K merchants actifs planning = 1-2K deposits/run potentiels. Limite 200 = 5 runs nécessaires → backlog.

**Fix** : Limit dynamique selon temps restant, ou pagination automatique dans le cron.

---

### 9. Realtime subscriptions non monitorées
**Problème** : Supabase Realtime ~500 connexions concurrentes max selon plan. Aucun monitoring/alerte côté app.

**Seuil** : ~100K PWA concurrent → dropped messages, push perdus.

**Fix** : Logger périodique du nombre de connexions. Circuit-breaker si >80% du plafond.

---

## P2 — Moyen (>1M customers ou >18 mois)

### 10. OVH SMS send séquentiel (pas de batch)
**Fichier** : [api/cron/sms-hourly/route.ts:245](../src/app/api/cron/sms-hourly/route.ts#L245)

**Problème** : `await sendMarketingSms()` sequential. 500 SMS = 50s blocking.

**Fix** : `Promise.allSettled(chunk.map(sms => sendSms(...)))` avec rate limit OVH (10 req/s).

---

### 11. Resend : pas de queue async + idempotency key
**Fichier** : [api/cron/morning-jobs/route.ts:264-272](../src/app/api/cron/morning-jobs/route.ts#L264)

**Problème** : `rateLimitDelay()` séquentiel 2/s = 50s pour 100 emails. Si 2 crons parallèles → rate limit Resend dépassé → emails dupliqués.

**Fix** : Queue concurrente avec `p-limit(5)` + header `idempotency-key` (hash `merchantId:type:date`).

---

### 12. Pas de stratégie d'archivage sur `sms_logs`, `visits`, `redemptions`
**Problème** : `sms_logs` grandit de ~10-50K/jour × 365 = 3-18M/an. Pas de purge → index bloat, vacuum ralenti.

**Seuil** : 50M+ rows → query plans dégradés.

**Fix** : Cron mensuel d'archivage des logs > 12 mois vers table `_archive`. `VACUUM ANALYZE` trimestriel.

---

### 13. `customers` table globale partagée (pas de merchant_id)
**Problème** : Customers dédupliqués par phone across tous merchants. Si bug RLS dans un futur endpoint, fuite multi-tenant possible.

**Fix** : Audit régulier — toute query `customers.select()` DOIT être scopée via un join sur `loyalty_cards.merchant_id` ou une contrainte explicite.

---

## Checklist quick wins (2 sprints, impact élevé)

1. **Batch fetch `loyalty_cards` dans `sms-hourly`** (P0 #1) — gain majeur ~5K requêtes/run économisées
2. **Remplacer `listUsers()` par `getUserById()` batch** dans admin/merchants-data (P0 #2)
3. **Ajouter index `sms_logs(merchant_id, sms_type, created_at DESC)`** (P0 #4) — 1 ligne SQL
4. **`.limit(5000)` sur `morning-push` prefetch** (P0 #3)
5. **Ajouter logs & circuit breaker OVH** (P2 #10)
6. **Réduire `/p/[slug]` revalidate à 600s** (P1 #7)
