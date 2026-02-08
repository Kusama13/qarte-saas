# Audit Securite Qarte — 8 fevrier 2025

49 routes API auditees, 6 fichiers cles analyses.

---

## CRITIQUES (a corriger en priorite)

### 1. Routes customers publiques sans auth ni rate limit

**Fichiers :**
- `src/app/api/customers/card/route.ts` — GET
- `src/app/api/customers/cards/route.ts` — GET

**Probleme :** N'importe qui peut lire les donnees d'un client (prenom, nom, tel, historique visites, points) avec juste un numero de telephone + merchant_id. Aucune auth, aucun rate limit.

**Impact :** Fuite de donnees personnelles. Un attaquant peut enumerer les numeros de telephone et recuperer les infos clients.

**Fix recommande :**
1. Ajouter un rate limit par IP (5 req/min max)
2. Ajouter un mecanisme de verification : le client doit d'abord "s'authentifier" via son tel (OTP SMS ou verification du tel stocke en localStorage + un token ephemere cote serveur)
3. En attendant l'OTP : au minimum, ne pas exposer `last_name`, `phone_number` dans la reponse, et ajouter un rate limit strict

**Effort :** Moyen (rate limit = rapide, OTP = plus long)

---

### 2. Route emails sans auth — spam possible

**Fichiers :**
- `src/app/api/emails/ebook/route.ts` — POST
- `src/app/api/emails/schedule-incomplete/route.ts` — POST

**Probleme :** Routes publiques sans auth ni rate limit. N'importe qui peut :
- Envoyer des emails ebook a n'importe quelle adresse (spam)
- Declencher des emails "inscription incomplete" pour n'importe quel userId

**Impact :** Abuse pour du spam, reputation email (Resend) degradee, couts.

**Fix recommande :**
1. `emails/ebook` : ajouter rate limit par IP (3 req/heure)
2. `emails/schedule-incomplete` : ajouter auth (CRON_SECRET ou admin) — cette route ne devrait jamais etre appelee par le public

**Effort :** Faible (15 min)

---

### 3. GET /api/offers sans verification ownership

**Fichier :** `src/app/api/offers/route.ts` — GET

**Probleme :** Le GET ne verifie pas que l'utilisateur connecte possede le merchant. N'importe quel utilisateur authentifie peut lire les offres de n'importe quel merchant en passant un `merchantId` different.

**Fix recommande :** Ajouter `verifyMerchantOwnership(merchantId)` au GET, comme c'est deja fait pour POST/PATCH/DELETE.

**Effort :** Faible (5 min)

---

## MODERES (a planifier)

### 4. PATCH admin — injection de champs arbitraires

**Fichiers :**
- `src/app/api/admin/prospects/route.ts` — PATCH
- `src/app/api/admin/tasks/route.ts` — PATCH
- `src/app/api/member-programs/[id]/route.ts` — PATCH

**Probleme :** Le body du PATCH est passe directement a `.update(updates)` sans validation Zod. Un attaquant avec acces admin pourrait injecter des champs arbitraires dans la table (ex: `id`, `created_at`, champs custom).

**Fix recommande :** Pour chaque PATCH, creer un schema Zod partiel qui whitelist les champs autorisés :
```typescript
const updateProspectSchema = prospectSchema.partial().omit({ id: true });
const validatedUpdates = updateProspectSchema.parse(body.updates);
```

**Effort :** Faible (10 min par route)

---

### 5. GET /api/redemptions — client deprece + pas d'auth

**Fichier :** `src/app/api/redemptions/route.ts`

**Probleme :**
- Utilise `createServerClient()` qui est deprece (affiche un warning)
- Pas d'authentification — n'importe qui peut lire l'historique de redemptions d'une carte

**Fix recommande :**
1. Remplacer `createServerClient()` par `getSupabaseAdmin()`
2. Ajouter un rate limit ou exiger un `customer_id` (comme fait pour redeem-public)

**Effort :** Faible (10 min)

---

### 6. N+1 queries dans today-signups

**Fichier :** `src/app/api/admin/today-signups/route.ts`

**Probleme :** Boucle sequentielle `for (const userId of userIds)` appelle `getUserById` un par un. Si 50 users s'inscrivent, ca fait 50 requetes sequentielles.

**Fix recommande :** Utiliser `batchGetUserEmails` comme dans les crons, ou `supabase.auth.admin.listUsers()` avec filtre.

**Effort :** Faible (10 min)

---

## AMELIORATIONS (backlog)

### 7. Rate limit en memoire (checkin)

**Fichier :** `src/app/api/checkin/route.ts`

La `rateLimitMap` est un `Map` en memoire. Sur Vercel (serverless), chaque instance a sa propre Map — un attaquant qui tombe sur differentes instances contourne le rate limit.

**Options :**
- Utiliser Vercel KV / Upstash Redis pour un rate limit centralise
- Ou accepter le risque (la Map offre une protection partielle)

---

### 8. Math.random() pour scanCode

**Fichier :** `src/lib/utils.ts` — `generateScanCode()`

`Math.random()` n'est pas cryptographiquement sur. Un attaquant pourrait predire les codes de scan.

**Fix :** Remplacer par `crypto.getRandomValues()` :
```typescript
import { randomBytes } from 'crypto';
const code = randomBytes(4).toString('hex').toUpperCase();
```

---

### 9. Validation Zod manquante sur plusieurs routes

Routes sans Zod (validation manuelle seulement) :
- `POST /api/customers/create`
- `POST /api/customers/delete`
- `POST /api/push/send`
- `POST /api/push/schedule`
- `POST /api/merchants/create`
- `POST /api/offers`
- `PATCH /api/offers`

Pas critique (les checks manuels fonctionnent) mais Zod offre une meilleure garantie de type et des messages d'erreur structures.

---

### 10. Divers

| Item | Fichier | Detail |
|------|---------|--------|
| `navigator.platform` deprece | `src/lib/push.ts` | Utiliser `navigator.userAgentData` quand dispo |
| Pas de support DOM-TOM | `src/lib/utils.ts` | `validateFrenchPhone` rejette +262, +596, etc. |
| `shieldEnabled`/`onShieldToggle` inutilises | `PendingPointsWidget.tsx` | Props recues mais jamais utilisees — code mort |
| `listUsers({perPage:500})` | `admin/incomplete-signups` | Ne pagine pas, rate des users si >500 |
| `webpush.setVapidDetails` a chaque req | `api/push/send` | Initialiser une seule fois au module level |
| `limit` non borne | `api/push/history` | Un user peut passer `limit=999999` |
| `visit_ids` non borne | `api/visits/moderate` PUT | Pas de limite sur la taille du tableau |
| `GET /api/test-emails` public | `api/test-emails` | Ne devrait pas etre en production |

---

## Ordre de priorite recommande

1. **Rate limit sur customers/card et customers/cards** (critique, 30 min)
2. **Auth sur emails/schedule-incomplete** (critique, 15 min)
3. **Rate limit sur emails/ebook** (critique, 15 min)
4. **Ownership check sur GET /api/offers** (modere, 5 min)
5. **Zod sur PATCH admin (prospects, tasks, member-programs)** (modere, 30 min)
6. **Fix redemptions route** (modere, 10 min)
7. **Batch today-signups** (perf, 10 min)
8. Reste du backlog selon les priorites produit
