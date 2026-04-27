# Roadmap tech debt — Qarte SaaS

Consolidé depuis les 4 audits du 2026-04-24 (perf, scalability, security, stability).
Seuls les findings encore TODO ou partiellement corrigés sont listés.

---

## P0 — Critique

### 1. Stripe webhook : pas de dedup sur `event.id` `[sec][stab]`
`src/app/api/stripe/webhook/route.ts:33-481`
Le handler ne vérifie nulle part `event.id` avant exécution. Le pattern actuel repose sur `update().eq('status', 'pending')` (idempotent pour les packs SMS) mais les autres branches (`subscription.updated`, `subscription.deleted`, `invoice.payment_failed/succeeded`) ne sont pas dédupées et envoient des emails à chaque retry Stripe.
**Fix** : table `processed_stripe_events(event_id PK, processed_at)`, INSERT en début de handler, return 200 si déjà traité.

### 2. Cron `sms-hourly` : N+1 queries `loyalty_cards`/`vouchers`/`visits` par merchant `[scal][stab]`
`src/app/api/cron/sms-hourly/route.ts:139,209,260,325,380,467,545,623`
8 boucles `for (const m of activeMerchants)` lancent 1 à 4 queries par merchant et par section. Toujours présent (vérifié ligne par ligne). À 5K merchants actifs = saturation pool Supabase. Le timeout silencieux (`Date.now() - startedAt > XXX`) coupe les sections suivantes sans alerte ni champ `skipped_sections` dans la réponse.
**Fix** : batch fetch `.in('merchant_id', merchantIds)` + groupement en mémoire, ou splitter en 2-3 crons distincts (transactionnel/marketing/fidélité). Logger `skipped_sections` dans la réponse JSON.

### 3. `/api/admin/merchants-data` charge tout `auth.users` `[scal]`
`src/app/api/admin/merchants-data/route.ts:14-22`
Boucle `while (hasMoreUsers) listUsers({ perPage: 1000 })` sur l'intégralité d'`auth.users` à chaque load du dashboard admin. Toujours présent.
**Fix** : ne récupérer que les `user_id` des merchants déjà fetchés via `Promise.all(ids.map(id => supabaseAdmin.auth.admin.getUserById(id)))` chunké.

---

## P1 — Élevé

### 4. OVH SMS sans timeout, retry ni circuit breaker `[stab]`
`src/lib/ovh-sms.ts:43-57,64-111`
`fetch` sans `AbortController` — un hang OVH bloque jusqu'au timeout Vercel (30s). Aucun retry exponentiel. Aucun circuit breaker. Une maintenance OVH 10 min = SMS perdus définitivement.
**Fix** : `AbortController` 5s + retry exponentiel (3 essais, 500ms→2s) + circuit breaker simple (5 errors/10s → fail-fast 30s).

### 5. SMS campaigns : partial failure non trackée si timeout `[stab]`
`src/app/api/cron/sms-campaigns-dispatch/route.ts:122-175`
Le check `Date.now() - startedAt > 280_000` casse la boucle, puis le code marque `status='done', recipient_count=sentCount`. Pas de champ `early_exit_at` ni distinction "fini" vs "coupé en cours". Merchant voit "X envoyés" comme succès alors que la moitié des destinataires n'a rien reçu.
**Fix** : ajouter colonne `early_exit_at` + `status='partial'` quand le break est déclenché par timeout, distinct de `done`.

### 6. Cron `morning-push` : prefetch ALL merchants sans pagination `[scal]`
`src/app/api/cron/morning-push/route.ts:49-52`
`.select('id, shop_name, ...')` sans `.limit()` — 25+ colonnes × N merchants en RAM à chaque run. À 20K merchants = OOM.
**Fix** : pagination par batch (2K à la fois) ou chunker via `id` range.

### 7. Cron `deposit-expiration` : limit 200 fixe `[scal]`
`src/app/api/cron/deposit-expiration/route.ts:28`
`releaseExpiredDeposits(supabase, { limit: 200 })`. À 10K merchants planning actifs, 1-2K deposits/run potentiels = backlog.
**Fix** : limit dynamique selon temps restant ou pagination automatique.

### 8. 26 liens `target="_blank"` sans `rel="noopener noreferrer"` `[sec]`
28 occurrences confirmées via grep, dont `src/app/[locale]/admin/merchants/[id]/page.tsx:884,903`, `src/app/[locale]/admin/announcements/page.tsx:403`, `src/components/loyalty/CardHeader.tsx:108,123,136`, `src/components/landing/*`, `src/components/dashboard/AdminAnnouncementBanner.tsx:74,141`, etc. Reverse tabnabbing possible, surtout côté admin.
**Fix** : recherche/remplacement global ajoutant `rel="noopener noreferrer"` sur chaque `target="_blank"`.

### 9. `/api/cagnotte/redeem-public` fuit le schema Zod `[sec]`
`src/app/api/cagnotte/redeem-public/route.ts:34-39`
`return NextResponse.json({ error: 'Données invalides', details: parsed.error.issues }, { status: 400 })` — expose noms de champs et règles de validation.
**Fix** : logger `parsed.error.issues` côté serveur, renvoyer `{ error: 'Invalid request' }` au client.

### 10. `.single()` sur queries Stripe webhook là où l'absence est nominale `[stab]`
`src/app/api/stripe/webhook/route.ts:87,167,225,248,278,331,345,367`
8 `.single()` toujours présents, dont les checks `if (!merchant)` qui suivent ne sont jamais atteints en cas de 0 row (l'exception remonte d'abord). Crash silencieux + retry Stripe sur des cas légitimes (ex. merchant supprimé entre webhook et update).
**Fix** : remplacer par `.maybeSingle()` partout où l'absence est un cas nominal — garder `.single()` seulement si l'absence est vraiment une corruption de données.

### 11. Cron SMS hourly : pas de métrique d'anomalie / alerting `[stab]`
`src/app/api/cron/sms-hourly/route.ts:664`
Toujours `return NextResponse.json({ ok: true, ...results })` même si `errors > 0` ou `sent === 0`. Aucune alerte possible.
**Fix** : HTTP 206 si `errors > seuil`, ou POST vers webhook Slack/monitoring si `sent < 10% expected`.

### 12. `/p/[slug]` revalidate = 3600s `[scal]`
`src/app/[locale]/p/[slug]/page.tsx:1`
ISR 1h — un merchant qui modifie son offre voit le vieux contenu jusqu'à 60 min côté clients.
**Fix** : réduire à 600s, ou on-demand revalidation via `revalidatePath` dans les routes de mutation merchant.

---

## P2 — Moyen

### 13. Refactor `MerchantContext` en server-fetched `[perf]`
`src/contexts/MerchantContext.tsx:47-104` + `src/app/[locale]/dashboard/layout.tsx`
Toujours fetché côté client via `useEffect` → `getUser()` + `select('*')`. Coût TTI dashboard 300-800 ms. Le cache localStorage atténue mais n'élimine pas (premier login + cache miss).
**Fix** : helper server `getMerchantFromSession()`, layout dashboard async, prop `initialMerchant` dans le provider qui skip le fetch initial. Tester PWA standalone.

### 14. Vercel Speed Insights non installé `[perf]`
`src/app/layout.tsx:5,220`
Seul `@vercel/analytics` est installé. Aucune télémétrie LCP/INP/CLS réelle utilisateur.
**Fix** : `npm i @vercel/speed-insights` puis `<SpeedInsights />` dans le `<body>`.

### 15. Page blog en `'use client'` avec framer-motion `[perf]`
`src/app/[locale]/blog/page.tsx:1-6`
`'use client'` + `motion.div`/`motion.article` pour du contenu statique → SEO dégradé (meta non SSR), framer-motion chargé inutilement.
**Fix** : passer en RSC, remplacer `motion.*` par classes Tailwind `transition-*`.

### 16. Token unsubscribe utilise `SUPABASE_SERVICE_ROLE_KEY` en fallback `[sec]`
`src/app/api/email/unsubscribe/route.ts:12`
`const secret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!`. Si `CRON_SECRET` manque, la service_role key (clé superadmin) sert de matériel HMAC pour un token de désabonnement.
**Fix** : créer `UNSUBSCRIBE_TOKEN_SECRET` dédié, throw au boot si absent.

### 17. Rate limit in-memory map sans cleanup `[stab]`
`src/app/api/checkin/route.ts:22-42`, `src/app/api/cagnotte/checkin/route.ts:22-42`
`rateLimitMap.set(ip, ...)` sans `.delete()` après expiration. Grandit linéairement avec les IPs uniques.
**Fix** : cleanup LRU (cap 10k) ou cleanup périodique au-delà de la fenêtre.

### 18. `console.error` au lieu de `logger.error` dans le SMS stack `[stab]`
`src/lib/ovh-sms.ts:66,99,108`, `src/lib/sms.ts:444,546`
5 occurrences confirmées. Logs non parsables/alertables.
**Fix** : remplacer par `logger.error()` avec contexte structuré (merchantId, errorCode).

### 19. OVH SMS send séquentiel `[scal]`
`src/app/api/cron/sms-hourly/route.ts:177,245,305,...`
`await sendBookingSms(...)` / `await sendMarketingSms(...)` séquentiel dans toutes les sections. 500 SMS = ~50s blocking.
**Fix** : `Promise.allSettled(chunk.map(...))` par batch de 10 avec rate-limit OVH respecté (10 req/s).

### 20. Resend : pas de queue concurrente ni idempotency-key `[scal]`
`src/app/api/cron/morning-jobs/route.ts:272`
`await rateLimitDelay()` séquentiel = 50s pour 100 emails. Si 2 crons parallèles = duplications possibles.
**Fix** : `p-limit(5)` + header `idempotency-key` (hash `merchantId:type:date`) côté Resend.

### 21. Pas d'archivage `sms_logs` / `visits` / `redemptions` `[scal]`
Pas de cron de purge. `sms_logs` croît de 10-50K/jour.
**Fix** : cron mensuel d'archivage des logs > 12 mois vers table `_archive`, `VACUUM ANALYZE` trimestriel.

### 22. Realtime subscriptions non monitorées `[scal]`
Aucun logger périodique du nombre de connexions Supabase Realtime concurrentes.
**Fix** : log périodique + circuit-breaker si > 80% du plafond du plan.

### 23. `/api/merchants/preview` : whitelist sans test de garde-fou `[sec]`
`src/app/api/merchants/preview/route.ts:21-25`
SELECT explicite OK aujourd'hui mais pas de test qui empêche un futur ajout accidentel de PII.
**Fix** : test automatique vérifiant la shape retournée + commentaire explicite "ne jamais ajouter PII ici".

---

## À investiguer (statut incertain)

### Cron `sms-hourly` : timeout `maxDuration = 300s` vs sections `[stab]`
La logique des breaks `if (Date.now() - startedAt > 250_000) break` existe et limite par section, mais aucun champ `skipped_sections` ne remonte dans la réponse JSON. **Question** : les sections coupées sont-elles reprises au prochain run (toutes les heures) ou perdues définitivement pour la journée ? Si perdues, c'est P0 ; si reprises au tick suivant, c'est P1 cosmétique.

### Index `sms_logs(merchant_id, sms_type, created_at DESC)` — créé en migration mais appliqué ? `[scal]`
La migration `123_sms_logs_dedup_index.sql` crée bien l'index `CONCURRENTLY`. **Question** : a-t-elle été exécutée en prod ? Le CLAUDE.md précise que les migrations sont appliquées manuellement dans Supabase SQL Editor.
