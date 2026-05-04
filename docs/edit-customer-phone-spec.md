# Spec — Édition du téléphone client par le merchant

**Status** : 📋 spec validée, à implémenter sur un jour calme
**Auteur audit/plan** : Claude (via Plan agent)
**Date** : 2026-05-04
**Sensibilité** : 🔴 HAUTE — phone = identifiant principal client + auth + dedup + SMS history

---

## Pourquoi c'est sensible

- `customers.phone_number` est l'identifiant principal côté client (auth cookie `qarte_cust` HMAC-signé sur le **téléphone**, pas sur customer_id).
- Format E.164 sans `+` (ex `33612345678`), multi-pays FR/BE/CH.
- Lookup multi-format via `getAllPhoneFormats()` ([src/lib/utils.ts:670](src/lib/utils.ts#L670)) pour anti-doublon cross-border.
- 12+ tables stockent ou référencent un téléphone.
- Risque RGPD majeur si `sms_opt_outs` n'est pas migré : une cliente désabonnée recommencerait à recevoir des SMS marketing.

---

## AUDIT

### 1. Schéma DB — Toutes les colonnes contenant un téléphone

#### 1.1 Source de vérité
| Table.colonne | Type | Mig | Notes |
|---|---|---|---|
| `customers.phone_number` | TEXT NOT NULL | mig 001 + 042 (regex `^\d{9,15}$`) | UNIQUE(phone_number, merchant_id) depuis mig 078 — **scope per-merchant** |

#### 1.2 Snapshots à la résa (à conserver tel quel = historique)
| Table.colonne | Mig | Notes |
|---|---|---|
| `merchant_planning_slots.client_phone` | mig 063 | Snapshot saisi à la résa (NULL pour walk-ins) |
| `booking_deposit_failures.client_phone` | mig 111 | Snapshot acompte expiré, archive |

#### 1.3 Cibles d'envois SMS (le téléphone EST la clé d'envoi)
| Table.colonne | Mig | Notes |
|---|---|---|
| `sms_logs.phone_to` | mig 092 | Audit complet des envois. Clé de dédup anti-spam (`hasSentRecentSms`, idx `idx_sms_logs_dedup`) |
| `sms_opt_outs.phone_number` | mig 112 | **PK avec merchant_id** — désinscriptions marketing — **CRITIQUE RGPD** |
| `sms_campaigns.pending_phones` | mig 150 | JSONB liste des phones à re-tenter après échec crédit OVH 402 |
| `banned_numbers.phone_number` | mig 004 | UNIQUE(phone_number, merchant_id) |

#### 1.4 Gift cards (cycle de vie autonome)
| Table.colonne | Mig | Notes |
|---|---|---|
| `gift_cards.sender_phone` + `sender_phone_country` | mig 138 | Snapshot offreur |
| `gift_cards.recipient_phone` + `recipient_phone_country` | mig 138 | Snapshot destinataire |
| `gift_cards.recipient_customer_id` | mig 138 | FK customers ON DELETE SET NULL |

#### 1.5 Concours
| Table.colonne | Mig | Notes |
|---|---|---|
| `merchant_contests.winner_phone` | mig 105 | Snapshot du gagnant |

#### 1.6 Tables liées par `customer_id` UUID (PAS phone — non impactées) ✅
- `loyalty_cards`, `visits`, `redemptions`, `point_adjustments`, `vouchers`
- `referrals`, `member_cards`, `push_subscriptions`, `customer_notes`
- `merchant_planning_slots.customer_id`, `merchant_contests.winner_customer_id`
- `push_automation_logs.customer_id`, `booking_deposit_failures.customer_id`

#### 1.7 Tables NON impactées (autres entités)
- `merchants.phone` / `display_phone` — c'est le numéro DU MARCHAND
- `prospects.phone`, `ambassador_applications.phone` — pipeline admin
- `merchant_push_subscriptions` — PWA Pro, pas client
- `merchant_marketing_sms_logs` — Qarte → merchant

---

### 2. Auth client — Le cookie `qarte_cust`

**Le cookie EST signé sur le numéro de téléphone**, pas sur un session id ni un customer_id.

- [src/lib/customer-auth-shared.ts:5](src/lib/customer-auth-shared.ts#L5) — `COOKIE_NAME = 'qarte_cust'`
- [src/lib/customer-auth.ts:16](src/lib/customer-auth.ts#L16) — `signPhone(phone)` HMAC-SHA256, valeur cookie = `"<phone>.<sig>"`
- [src/lib/customer-auth.ts:41](src/lib/customer-auth.ts#L41) — `getAuthenticatedPhone()` lit + vérifie la signature
- [src/lib/customer-auth.ts:55](src/lib/customer-auth.ts#L55) — `setPhoneCookie()` écrit (Max-Age 30j, HttpOnly, SameSite=Strict)

**Conséquence directe** : si on change `customers.phone_number` sans rien faire d'autre :
- Tous les `me`/`card`/`email`/`birthday` lookups → 404 (le cookie pointe vers l'ancien numéro qui n'existe plus en DB).
- La cliente est **silencieusement déconnectée** de toutes ses cartes.
- Sa PWA installée perd l'accès à sa carte sans message clair.

**Routes consommatrices critiques** : `/api/customers/me`, `/api/customers/card`, `/api/customers/email`, `/api/customers/birthday`, `/api/customers/cards`, `/api/customers/social`, `/api/customers/pending-deposits`.

---

### 3. API d'édition customer existantes

- `PUT /api/customers/update-name` — pattern de référence (auth merchant + ownership check)
- `PUT /api/customers/birthday-admin` — pareil
- `PUT/DELETE /api/customers/email` — côté CLIENT (cookie phone) — pas merchant-side
- **❌ Pas d'endpoint `update-phone` aujourd'hui**

#### UI dashboard — `CustomerManagementModal`
[src/components/dashboard/CustomerManagementModal.tsx](src/components/dashboard/CustomerManagementModal.tsx) :
- Header (lignes 227-376) : nom éditable inline + birthday éditable
- Phone rendu en **lecture seule lignes 311-317** — `<a href="tel:+...">` avec `formatPhoneLabel(phoneNumber)`
- Kebab menu (lignes 274-307) : Delete + Ban
- **C'est l'endroit naturel pour ajouter l'édition phone.**

---

### 4. Lookups multi-format — Sites impactés par un changement

`getAllPhoneFormats()` génère les variantes FR/BE/CH (cross-border).

**Routes utilisant `getAllPhoneFormats()` ou `.in('phone_number', ...)`** :
- `/api/customers/login`, `/api/customers/create`, `/api/customers/register`, `/api/customers/search`
- `/api/customers/email`, `/api/customers/pending-deposits`
- `/api/checkin`, `/api/cagnotte/checkin`, `/api/welcome`, `/api/referrals`
- `/api/planning/book`, `/api/planning/route.ts`
- `/api/member-cards/lookup`, `/api/merchant-offers/claim`
- `/api/gift-cards/request`, `/api/gift-cards/[id]/confirm-payment`

**Fenêtres de course critiques pendant le change** :
- Scan QR de la cliente avec son ancienne PWA → `/api/checkin` ne trouve plus le customer.
- Booking en cours vitrine avec ancien phone → `/api/planning/book` crée doublon ou échoue.

---

### 5. Risques data integrity (synthèse)

| # | Risque | Détail |
|---|---|---|
| 5.1 | Collision intra-merchant | Le nouveau phone existe déjà → violation `unique_customer_per_merchant` (mig 078) → 23505 |
| 5.2 | Collision cross-merchant | Le nouveau phone existe chez un AUTRE merchant → OK contrainte (compound), mais cookie session se mettra à matcher des cartes de l'autre merchant |
| 5.3 | Cross-format collision | Variantes FR/BE/CH peuvent coexister sans détection par UNIQUE strict |
| 5.4 | SMS in-flight | `sms_campaigns.pending_phones` peut contenir l'ancien numéro déjà queued |
| 5.5 | Dédup SMS contournée | Si update rétroactif `sms_logs.phone_to` → re-envoi possible. Si pas d'update → cliente avec NEW phone reçoit en double |
| 5.6 | **Opt-outs perdus (RGPD)** | `sms_opt_outs(phone_number, merchant_id)` PK. Si ligne pas migrée, cliente désabonnée recommence à recevoir → **risque légal majeur** |
| 5.7 | Ban contourné | `banned_numbers` à migrer aussi |
| 5.8 | Push subscriptions | Lié par `customer_id` UUID → ✅ non impacté |
| 5.9 | PWA standalone client | Cookie HMAC sur OLD phone, déconnexion silencieuse |
| 5.10 | SMS history tracé | `sms_logs.phone_to = OLD` reste cohérent (audit fidèle) |
| 5.11 | Vouchers / member_cards / loyalty_cards | Liés par customer_id UUID → ✅ non impactés |
| 5.12 | Gift cards actives | `recipient_phone` snapshot, garde l'ancien numéro |
| 5.13 | Snapshot planning_slots | Reste sur OLD (bon comportement, historique) |
| 5.14 | Cookie merchant | Aucun impact (Supabase Auth user_id) |

---

### 6. Surfaces front impactées

| Surface | Fichier | Comportement |
|---|---|---|
| Customer modal header | `src/components/dashboard/CustomerManagementModal.tsx:311` | Re-render après édition |
| Customer list | `src/app/[locale]/dashboard/customers/page.tsx` | Re-fetch nécessaire |
| ClientSelectModal | `src/app/[locale]/dashboard/planning/ClientSelectModal.tsx` | Recherche client |
| BookingDetailsModal | `src/app/[locale]/dashboard/planning/BookingDetailsModal.tsx` | Affiche `client_phone` du slot (snapshot, donc reste vieux — ✅ attendu) |
| Reservations section | `src/app/[locale]/dashboard/planning/ReservationsSection.tsx` | Idem snapshot |
| Marketing campagnes | `src/app/[locale]/dashboard/marketing/...` | Re-fetch audience |
| Members page | `src/app/[locale]/dashboard/members/...` | Re-fetch |
| Admin SMS history | `src/app/[locale]/admin/sms/page.tsx` | Affiche `phone_to` du log (vieux numéro tracé) |
| Gift cards page | `src/app/[locale]/dashboard/gift-cards/page.tsx` | Snapshot, OK |

---

## PLAN D'IMPLÉMENTATION

### A. Stratégie de dédoublonnage — REJECT HARD en v1

**Pourquoi pas merge auto** : combiner stamps/cagnotte/notes/journal/vouchers/résas de 2 cartes = complexe, beaucoup de cas. Le rejet hard envoie un message clair : "ces 2 numéros existent, gérez-les manuellement". Cas réel attendu très rare (faute de frappe, changement opérateur).

**Cas cross-format à checker** via `getAllPhoneFormats(newPhone)`, pas seulement strict eq.

**Cross-merchant** : autoriser sans warning (multi-tenant standard).

---

### B. Nouvelle API — `PUT /api/customers/update-phone`

Fichier : `src/app/api/customers/update-phone/route.ts`

```ts
Auth : merchant (createRouteHandlerSupabaseClient + getUser)
Body Zod :
  customer_id: z.string().uuid()
  phone_number: z.string().min(4).max(20)
  phone_country: z.enum(['FR','BE','CH']).optional()
  reason: z.string().max(200).optional()
  confirm: z.literal(true)   // double-opt pour éviter mauvaise manip front
Réponse :
  200 { success, old_phone, new_phone, customer_id }
  409 { error: 'phone_collision', conflicting_customer_id }
  400 / 401 / 403 / 422
```

**Étapes serveur** :
1. Auth + ownership (`customers.merchant_id === merchant.id`)
2. Format `formatPhoneNumber(input, country || merchant.country)`
3. Reject si new === old (no-op, 422)
4. Reject si banned (via `getAllPhoneFormats` chez le merchant)
5. Collision check : `customers.in('phone_number', getAllPhoneFormats(newPhone)).eq('merchant_id', merchant.id).neq('id', customer_id).maybeSingle()` → si trouvé : 409
6. Lecture old phone pour audit
7. **Séquence** (pas RPC, tolérante aux échecs partiels avec audit en premier) :
   - INSERT `customer_phone_changes` (audit log)
   - UPDATE `customers.phone_number = newPhone` WHERE id = customer_id
   - Migrate `sms_opt_outs SET phone_number = newPhone WHERE phone_number = oldPhone AND merchant_id = merchant.id` (si conflit PK : si NEW déjà opt-out, DELETE OLD ; sinon UPDATE OLD → NEW)
   - Migrate `banned_numbers` similaire
   - Patch `sms_campaigns.pending_phones` JSONB pour campagnes `status IN ('scheduled','sending')` du merchant : remplacer OLD par NEW
   - **Aucun update** sur `sms_logs.phone_to`, snapshots planning/gift_cards/contests
8. Logger `logger.info` avec phones masqués (RGPD logs)
9. Retour 200

---

### C. Audit log — Nouvelle migration 154

```sql
-- Mig 154 — customer_phone_changes audit log

CREATE TABLE customer_phone_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  old_phone TEXT NOT NULL,
  new_phone TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cust_phone_changes_customer ON customer_phone_changes (customer_id, changed_at DESC);
CREATE INDEX idx_cust_phone_changes_merchant ON customer_phone_changes (merchant_id, changed_at DESC);

ALTER TABLE customer_phone_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "merchant_read_own" ON customer_phone_changes FOR SELECT
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));
CREATE POLICY "service_role_full" ON customer_phone_changes FOR ALL
  USING (auth.role() = 'service_role');
```

**Pourquoi pas réutiliser `point_adjustments`** : sémantiquement c'est un trail loyalty (stamps), pas du PII tracking. Table dédiée permettra d'afficher un onglet "Historique fiche" plus tard.

---

### D. Cookie session client — Recommandation

**Recommandation : laisser le cookie tel quel et accepter la déconnexion silencieuse.**
- Le cookie est HMAC-signé du téléphone — on ne peut pas le rotater côté serveur (pas de canal merchant→client).
- Si la cliente est connectée avec OLD : son `/api/customers/me` retournera `existsForMerchant: false` au prochain refresh.

**Mitigation UI** : ajouter un message clair côté `/customer/*` (Layout customer) si `authenticated: true && existsGlobally: false` : "Votre numéro a été mis à jour par le commerçant. Reconnectez-vous avec votre nouveau numéro."

**Alternative ambitieuse v2 (NON retenue)** : refactorer le cookie pour signer un `customer_id` au lieu d'un phone. Casserait la rétro-compat avec tous les cookies existants.

---

### E. Snapshots — Stratégie

| Table | Update rétroactif ? | Recommandation | Rationale |
|---|---|---|---|
| `sms_logs.phone_to` | NON | Conserver OLD | Audit fidèle = qui a vraiment reçu le SMS |
| `merchant_planning_slots.client_phone` | NON | Conserver OLD | Snapshot historique. Le `customer_id` UUID lie la résa au customer mis à jour |
| `booking_deposit_failures.client_phone` | NON | Conserver OLD | Idem |
| `gift_cards.recipient_phone` | NON v1 | Conserver OLD | Le bon reste atteignable via OLD. v2 : prompter le merchant |
| `gift_cards.sender_phone` | NON | Conserver OLD | Audit |
| `merchant_contests.winner_phone` | NON | Conserver OLD | Snapshot |
| **`sms_opt_outs.phone_number`** | **OUI obligatoire** | Update + dédup | Sinon RGPD violé |
| **`banned_numbers.phone_number`** | **OUI** | Update | Sinon ban inopérant |
| **`sms_campaigns.pending_phones`** JSONB | **OUI** | Patch | Cohérence campagne en cours |

---

### F. Permissions / ownership

- Auth merchant via `createRouteHandlerSupabaseClient`
- Ownership : `customers.merchant_id === merchant.id` (table déjà scopée per-merchant)
- Pas besoin de checker `loyalty_cards` (un customer existe pour un seul merchant en DB, scoping mig 039 + 078)

---

### G. UI dashboard — Placement

Dans `src/components/dashboard/CustomerManagementModal.tsx` :
- Lignes 311-317 : remplacer le `<a tel:>` par un bouton edit (style identique à `editingName` ligne 121-125)
- Champ : `PhoneInput` avec sélecteur de pays (cf. pattern dans `BookingModal.tsx`)
- **Pattern de confirmation 2-step** : saisir → preview "OLD → NEW" + bouton "Confirmer le changement" (style `dangerAction` ligne 494)
- Phrase warning rouge : "Cette modification déconnectera la cliente de sa carte. Elle devra se reconnecter avec son nouveau numéro."
- Champ optionnel `reason` (textarea, max 200 chars) pour audit
- Erreur 409 collision : message "Un autre client chez vous utilise déjà ce numéro" + lien vers la fiche conflictuelle (via `conflicting_customer_id`)

**Pays modifiable** : OUI, via PhoneInput natif. Le pays est inféré du préfixe à la lecture donc pas de col à update.

---

### H. Edge cases — Stratégie

| Edge case | Stratégie |
|---|---|
| Numéro identique (no-op) | Reject 422 "Aucun changement" |
| Nouveau numéro invalide | Validation Zod + `validatePhone()` server |
| Nouveau = banned chez merchant | Reject 409 "Ce numéro est dans la liste des bloqués" |
| Collision intra-merchant | Reject 409 + `conflicting_customer_id` |
| Collision cross-format | Reject 409 (via `getAllPhoneFormats`) |
| Customer a session active | Update OK, session invalidée silencieusement |
| Customer a un booking dans 1h | Update OK ; SMS reminder J0/J1 envoyé sur NEW (cron resolve via customer_id) ✅ |
| Customer dans campagne `pending_phones` | Patch JSONB |
| Customer désabonné SMS | Migrer ligne `sms_opt_outs` (CRITIQUE) |
| Customer destinataire gift card active non consommée | v1 : pas touché, mention dans doc admin |
| Race condition 2 admins du même merchant | UPDATE atomique → dernière écriture gagne. Audit log trace les 2 |
| Mauvais format saisi | `formatPhoneNumber()` normalise |
| PWA installée | Mitigation UI globale customer |
| Cliente avec plusieurs cartes chez plusieurs merchants même phone | Le merchant change UNIQUEMENT pour SA fiche. Les autres conservent OLD. → désynchro multi-tenant à documenter |

---

### I. Tests à écrire

#### Tests unitaires (Vitest)
1. `formatPhoneNumber` correctement appliqué FR/BE/CH dans la route
2. Zod schema rejette body malformé
3. Helper de patch `pending_phones` (à externaliser en util)

#### Tests d'intégration
4. Happy path : update simple FR → FR, vérifie `customers.phone_number` updated, audit row inserted, old phone untouched dans `sms_logs`
5. Collision intra-merchant strict eq → 409
6. Collision intra-merchant cross-format (32... vs 33...) → 409
7. Collision cross-merchant → 200 OK (autorisé)
8. Banned number → 409
9. No-op → 422
10. Ownership : customer d'un autre merchant → 403
11. Auth absente → 401
12. `sms_opt_outs` migré (cas update simple ET cas conflit PK)
13. `banned_numbers` migré
14. `sms_campaigns.pending_phones` JSONB patché
15. Audit log row contient old/new/changed_by/reason

#### Tests E2E (Playwright)
16. Merchant ouvre `CustomerManagementModal`, edit phone, saisit nouveau numéro, confirme → toast success, modal re-rendu avec NEW
17. Merchant tente collision → erreur visible + lien vers fiche conflictuelle
18. Cliente connectée avec OLD : refresh sa carte → message "votre numéro a été modifié"

---

### J. Effort estimé

| Tâche | Effort |
|---|---|
| Migration 154 + apply manuel Supabase | 0.5h |
| API `PUT /api/customers/update-phone` | 4h |
| UI inline edit dans CustomerManagementModal (PhoneInput + 2-step confirm) | 4h |
| i18n FR (labels, errors, confirm modal) | 1h |
| Mitigation UI client (banner "phone changé, reconnectez-vous") | 1.5h |
| Tests unitaires + intégration (16 cases) | 4h |
| Tests E2E (3 scénarios) | 2h |
| QA manuelle + edge cases (PWA, race, multi-fiches) | 2h |
| Doc admin + roadmap-tech-debt | 1h |
| **Total** | **~20h (≈3 jours dev)** |

---

### K. Risques RÉSIDUELS assumés après implémentation

1. **PWA cliente déconnectée silencieusement** — mitigation UI partielle ; pas de notif active à la cliente.
2. **Désynchro inter-merchants** — multi-tenant : si la cliente a des cartes chez plusieurs marchands sous le même phone, seul celui qui modifie voit le NEW.
3. **SMS history fidèle à l'OLD** — chercher "tous les SMS reçus par NEW phone" rate ceux envoyés sur OLD. (Compense via JOIN customer_id côté admin si besoin — `sms_logs` n'a pas de customer_id aujourd'hui, autre tech-debt.)
4. **Gift cards actives non consommées sur OLD** — la cliente devra utiliser OLD ou contacter le merchant. Acceptable v1.
5. **Risque double-envoi marketing dans 24h après change** — dedup window. Probabilité très faible.
6. **Audit log non-immuable** — pas de trigger BLOCK UPDATE/DELETE. Super_admin avec service_role peut tampered. Acceptable maturité actuelle.
7. **Pas de notification cross-merchants** — pas faisable proprement sans casser l'isolation cross-merchant.

---

## ❓ DÉCISIONS À VALIDER AVANT DE CODER

À faire au début du jour calme dédié à cette feature :

1. **Stratégie collision** : Option A (reject hard) — confirmer ou choisir B (merge auto v2)
2. **Cookie session** : accepter déconnexion silencieuse + banner mitigation, pas de refacto cookie→customer_id
3. **Snapshots historiques** : conserver OLD partout (slots, gift cards, sms_logs)
4. **`sms_opt_outs` + `banned_numbers`** : migrer obligatoirement
5. **Pays modifiable** : oui, via PhoneInput natif
6. **Champ `reason`** dans audit : optionnel ou requis ?
7. **Afficher l'historique des changements** dans CustomerManagementModal (futur onglet "Historique fiche") en v1 ou plus tard ?

---

## Fichiers critiques pour l'implémentation

- [src/app/api/customers/update-name/route.ts](src/app/api/customers/update-name/route.ts) — pattern de référence pour la nouvelle route
- [src/components/dashboard/CustomerManagementModal.tsx](src/components/dashboard/CustomerManagementModal.tsx) — UI hôte de l'édition phone
- [src/lib/utils.ts](src/lib/utils.ts) — `formatPhoneNumber`, `getAllPhoneFormats`, `validatePhone`
- [src/lib/customer-auth.ts](src/lib/customer-auth.ts) — comprendre le cookie keyé par phone
- `supabase/migrations/old/078_customer_compound_unique.sql` — contrainte UNIQUE compound
