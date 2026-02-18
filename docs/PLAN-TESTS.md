# Plan : Suite de tests automatisés complète

## Contexte

Le projet a 5 tests API (checkin, redeem, adjust-points, customers, stripe-webhook) mais 64 endpoints au total. Après l'audit qui a touché 68 fichiers, on a besoin de tests qui détectent les régressions automatiquement à chaque changement majeur.

**Objectif :** Couvrir toutes les fonctionnalités critiques avec des tests rapides (<30s) qui tournent en CI.

---

## Phase 1 — Étendre le mock Supabase + helpers

**Fichier :** `src/__tests__/mocks/supabase.ts`

Ajouter au `testDb` les tables manquantes :
```
vouchers, referrals, member_programs, member_cards,
push_subscriptions, scheduled_push, offers,
pending_email_tracking, push_history, contact_messages
```

Ajouter les filtres manquants au query builder :
- `is(field, value)` — pour `is('is_used', false)`
- `lte(field, value)` — pour `lte('expires_at', date)`
- `not(field, op, value)` — pour les negations

Ajouter les factories :
- `createTestVoucher(overrides)`
- `createTestReferral(overrides)`
- `createTestMemberProgram(overrides)`
- `createTestMemberCard(overrides)`
- `createTestPushSubscription(overrides)`
- `createTestOffer(overrides)`

Ajouter au mock auth :
- `mockSupabaseAdmin.auth.getUser(token)` — pour tester Bearer token auth
- `mockSupabaseAdmin.auth.admin.updateUserById()` — pour merchant create

---

## Phase 2 — Tests unitaires fonctions pures

### `src/__tests__/lib/utils.test.ts` (~200 lignes)

```
describe('getTrialStatus')
  it('trial actif — 5 jours restants')
  it('trial actif — dernier jour')
  it('période de grâce — 1 jour après expiration')
  it('complètement expiré — après grâce')
  it('abonnement actif — ignore trial')
  it('abonnement canceled')
  it('abonnement past_due')
  it('trial_ends_at null — traité comme actif')

describe('formatPhoneNumber')
  it('FR: 06 → +33')
  it('FR: +33 → inchangé')
  it('FR: avec espaces')
  it('BE: 04 → +32')
  it('CH: 07 → +41')
  it('MA: 06 → +212')

describe('validatePhone')
  it('FR valide: +336...')
  it('FR invalide: trop court')
  it('FR invalide: mauvais préfixe')
  it('BE valide: +324...')
  it('MA valide: +2126...')

describe('displayPhoneNumber')
  it('FR: +33612345678 → 06 12 34 56 78')
  it('BE: +32412345678 → 04 12 34 56 78')

describe('generateSlug')
  it('minuscules + tirets')
  it('accents supprimés')
  it('caractères spéciaux nettoyés')
  it('espaces multiples → 1 tiret')

describe('generateScanCode')
  it('8 caractères')
  it('pas de caractères ambigus (0OIL)')
  it('deux appels → codes différents')

describe('generateReferralCode')
  it('6 caractères')
  it('deux appels → codes différents')

describe('ensureTextContrast')
  it('blanc sur fond clair → assombri')
  it('noir sur fond foncé → éclairci')
  it('bon contraste → inchangé')

describe('validateEmail')
  it('valide: user@domain.com')
  it('invalide: pas de @')
  it('invalide: vide')

describe('getDaysRemaining')
  it('date future → positif')
  it('date passée → négatif')
  it('aujourd\'hui → 0')

describe('truncate')
  it('court → inchangé')
  it('long → tronqué avec ...')
```

### `src/__tests__/lib/rate-limit.test.ts` (~80 lignes)

```
describe('checkRateLimit')
  it('première requête → success')
  it('sous la limite → success')
  it('au-dessus de la limite → blocked')
  it('après expiration window → reset')
  it('identifiants différents → indépendants')

describe('getClientIP')
  it('x-forwarded-for → première IP')
  it('x-real-ip fallback')
  it('aucun header → unknown')
```

---

## Phase 3 — Tests API routes (par priorité business)

### 3A. `src/__tests__/api/merchants-create.test.ts` (~150 lignes)

```
describe('POST /api/merchants/create')
  it('crée un merchant avec Bearer token valide')
  it('rejette sans token → 401')
  it('rejette si user_id ≠ token user → 403')
  it('rejette si champs requis manquants → 400')
  it('génère scan_code et referral_code uniques')
  it('stamps par défaut selon shop_type')
```

### 3B. `src/__tests__/api/vouchers-use.test.ts` (~200 lignes)

```
describe('POST /api/vouchers/use')
  it('utilise un voucher valide → is_used = true')
  it('rejette voucher déjà utilisé')
  it('rejette voucher expiré')
  it('bonus +1 stamp pour voucher referral')
  it('pas de bonus stamp pour voucher birthday')
  it('complète le referral (pending → completed)')
  it('crée voucher referrer quand referred utilise')
  it('rejette sans cookie auth')
```

### 3C. `src/__tests__/api/referrals.test.ts` (~180 lignes)

```
describe('GET /api/referrals')
  it('retourne les infos du code referral')
  it('retourne 404 si code invalide')
  it('retourne erreur si programme désactivé')

describe('POST /api/referrals')
  it('crée customer + card + voucher + referral')
  it('rejette si code invalide')
  it('rejette si trial expiré')
  it('rejette si téléphone invalide')
  it('rejette si client existe déjà chez ce merchant')
```

### 3D. `src/__tests__/api/visits-moderate.test.ts` (~180 lignes)

```
describe('POST /api/visits/moderate')
  it('confirme une visite → ajoute stamps')
  it('rejette une visite → status rejected')
  it('rejette sans auth merchant')
  it('rejette si visite pas du merchant')

describe('PUT /api/visits/moderate — bulk')
  it('confirme plusieurs visites → stamps ajoutés')
  it('rejette plusieurs visites')
  it('mix confirm/reject dans le même batch')
```

### 3E. `src/__tests__/api/offers.test.ts` (~120 lignes)

```
describe('POST /api/offers')
  it('crée une offre avec expiration')
  it('rejette si durée > 30 jours')
  it('rejette sans auth')

describe('DELETE /api/offers')
  it('désactive une offre')

describe('GET /api/offers')
  it('retourne offre active')
  it('retourne null si expirée')
```

### 3F. `src/__tests__/api/push-send.test.ts` (~120 lignes)

```
describe('POST /api/push/send')
  it('envoie push à tous les abonnés')
  it('rejette contenu avec mots interdits → 400')
  it('rejette sans auth merchant')

describe('POST /api/push/schedule')
  it('programme un push')
  it('rejette mots interdits')
  it('rejette date dans le passé')
```

### 3G. `src/__tests__/api/member-programs.test.ts` (~150 lignes)

```
describe('POST /api/member-programs')
  it('crée un programme')
  it('rejette sans auth')

describe('POST /api/member-cards')
  it('assigne un client au programme')
  it('calcule valid_until correctement')
  it('rejette doublon actif')

describe('PATCH /api/member-cards/[id]')
  it('étend la durée')

describe('DELETE /api/member-cards/[id]')
  it('supprime le membre')
```

### 3H. `src/__tests__/api/customers-card.test.ts` (~100 lignes)

```
describe('POST /api/customers/card')
  it('retourne la carte complète avec visites/vouchers')
  it('rejette sans cookie auth')
  it('retourne null si merchant inexistant')

describe('PUT /api/customers/birthday')
  it('set birthday une fois')
  it('rejette 2ème tentative')
  it('rejette date invalide')
```

### 3I. `src/__tests__/api/contact.test.ts` (~60 lignes)

```
describe('POST /api/contact')
  it('soumet le formulaire → insère en base')
  it('rejette email invalide')
  it('rejette champs manquants')
```

---

## Phase 4 — GitHub Actions CI

**Fichier :** `.github/workflows/test.yml`

```yaml
name: Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test:run
      - run: npm run build
```

---

## Résumé

| # | Fichier | Tests | Lignes ~ |
|---|---------|-------|----------|
| 1 | `mocks/supabase.ts` (extension) | — | +120 |
| 2 | `lib/utils.test.ts` | ~35 | 200 |
| 3 | `lib/rate-limit.test.ts` | ~8 | 80 |
| 4 | `api/merchants-create.test.ts` | ~6 | 150 |
| 5 | `api/vouchers-use.test.ts` | ~8 | 200 |
| 6 | `api/referrals.test.ts` | ~8 | 180 |
| 7 | `api/visits-moderate.test.ts` | ~7 | 180 |
| 8 | `api/offers.test.ts` | ~6 | 120 |
| 9 | `api/push-send.test.ts` | ~6 | 120 |
| 10 | `api/member-programs.test.ts` | ~6 | 150 |
| 11 | `api/customers-card.test.ts` | ~6 | 100 |
| 12 | `api/contact.test.ts` | ~3 | 60 |
| 13 | `.github/workflows/test.yml` | — | 20 |
| **Total** | **13 fichiers** | **~99 tests** | **~1,680** |

Existants : 5 fichiers, ~35 tests → **Total final : 18 fichiers, ~134 tests**

## Ordre d'implémentation

1. Mock infra (supabase.ts) — tout le reste en dépend
2. `utils.test.ts` — le plus de valeur, zéro dépendance
3. `rate-limit.test.ts` — rapide, protège l'API
4. `merchants-create.test.ts` — parcours critique signup
5. `vouchers-use.test.ts` — parcours critique fidélité
6. `referrals.test.ts` — parcours critique parrainage
7. `visits-moderate.test.ts` — Qarte Shield
8. `offers.test.ts` + `push-send.test.ts` — marketing
9. `member-programs.test.ts` — programmes membres
10. `customers-card.test.ts` + `contact.test.ts` — compléments
11. `.github/workflows/test.yml` — CI

## Vérification

```bash
npm run test:run          # Tous les tests passent
npm run test:coverage     # Couverture API routes affichée
npm run build             # Build OK
```
