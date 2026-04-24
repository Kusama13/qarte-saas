# Audit Sécurité — Qarte SaaS — 2026-04-24

> Audit exploratoire réalisé le 24/04/2026. **Chaque finding doit être vérifié dans le code avant fix** — certaines descriptions peuvent être imprécises.

---

## P0 — Critique

### 1. Unsubscribe token signé avec `SUPABASE_SERVICE_ROLE_KEY` en fallback
**Fichier** : [api/email/unsubscribe/route.ts:12](../src/app/api/email/unsubscribe/route.ts#L12)

**Problème** : `verifyUnsubscribeToken()` utilise `CRON_SECRET || SUPABASE_SERVICE_ROLE_KEY` comme clé HMAC. Si `CRON_SECRET` n'est pas défini, on bascule sur la service_role key — une clé superadmin est utilisée comme matériel crypto pour un token non-critique.

**Fix** : Créer `UNSUBSCRIBE_TOKEN_SECRET` dédié, throw si non configuré.

---

### 2. Stripe webhook sans dedup sur `event.id`
**Fichier** : [api/stripe/webhook/route.ts:58-105](../src/app/api/stripe/webhook/route.ts#L58)

**Problème** : Pas de vérification `event.id` déjà traité. Stripe re-fire les webhooks après timeout (3s retry), le handler peut ré-exécuter le crédit SMS si le RPC `credit_sms_pack` n'est pas strictement idempotent côté DB (pas visible dans le handler).

**Risque** : Double-crédit de pack SMS sur retry Stripe. Merchant reçoit 1000 SMS au lieu de 500 ; ou inverse, merchant paie mais rien ne se crédite si le RPC fail entre `update status='paid'` et crédit.

**Fix** : Ajouter colonne `stripe_event_id` UNIQUE sur `sms_pack_purchases` ou table dédiée `processed_stripe_events(event_id PRIMARY KEY, processed_at)`. Check avant toute action.

---

### 3. Resend webhook accepte les requêtes sans signature si secret absent
**Fichier** : [api/resend/webhook/route.ts:26-61](../src/app/api/resend/webhook/route.ts#L26)

**Problème** : Si `RESEND_WEBHOOK_SECRET` non configuré, retourne `true` (skip verification) avec warning log. En prod, un oubli d'env var permet à n'importe qui de POST des events `email.complained` pour unsubscribe des merchants arbitrairement.

**Fix** : En production (`NODE_ENV === 'production'`), throw si secret absent au lieu d'accepter.

---

## P1 — Élevé

### 4. 26 liens `target="_blank"` sans `rel="noopener noreferrer"`
**Fichiers** : nombreux (principalement [admin/merchants/[id]/page.tsx](../src/app/[locale]/admin/merchants/[id]/page.tsx) + autres liens dashboard)

**Problème** : Vulnérabilité reverse tabnabbing — la page ouverte peut manipuler `window.opener` et rediriger vers une page phishing. Impact surtout admin (liens vers profils merchants externes).

**Fix** : Ajouter `rel="noopener noreferrer"` partout. Une recherche + remplacement global suffit.

---

### 5. `/api/cagnotte/redeem-public` fuit les détails du schema Zod en cas d'erreur
**Fichier** : [api/cagnotte/redeem-public/route.ts:32](../src/app/api/cagnotte/redeem-public/route.ts#L32)

**Problème** : Renvoie `parsed.error.issues` au client → expose les noms de champs internes, les validations, la structure. Info gratuite pour un attaquant.

**Fix** : Logger en interne, renvoyer `{ error: 'Invalid request' }` générique.

---

## P2 — Moyen

### 6. `/api/merchants/preview` : whitelist implicite
**Fichier** : [api/merchants/preview/route.ts:23](../src/app/api/merchants/preview/route.ts#L23)

**Problème** : Le SELECT liste des champs publics OK aujourd'hui, mais pas de garde-fou contre l'ajout accidentel futur de champs PII (email, stripe_customer_id, admin_notes).

**Fix** : Commentaire explicite + ajouter un test automatique qui vérifie la shape retournée.

---

## ✅ Points positifs constatés

- Stripe webhook signature **bien vérifiée** via `stripe.webhooks.constructEvent`
- Rate limiting présent sur endpoints critiques (signup, checkin)
- Zod validation largement utilisée (>75 routes)
- Admin auth via `super_admins` + `authorizeAdmin()` correctement implémenté
- RLS Supabase globalement bien configurée (migration `restrict_rls_policies`)
- Contact form échappe HTML pour emails Resend
- `getUser()` utilisé partout (pas `getSession()`)

## ❌ Faux positifs écartés

- **`dangerouslySetInnerHTML` sur JSON-LD dans `/p/[slug]/ProgrammeView.tsx:1231`** : c'est `JSON.stringify()` dans un `<script type="application/ld+json">`. Pattern recommandé par Next.js, aucun XSS possible (JSON.stringify échappe correctement + script non-exécutable).
