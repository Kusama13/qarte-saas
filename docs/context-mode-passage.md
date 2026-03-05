# Mode Passage (Tampons / Visites)

> `loyalty_mode = 'visit'` (valeur par defaut)

## Principe

Le client accumule des **tampons** (1 par visite, 2 les jours doubles). Au bout de N visites, il debloque une recompense configurable par le commercant.

---

## Champs merchant

| Champ | Type | Description |
|---|---|---|
| `loyalty_mode` | `'visit'` | Active le mode passage |
| `stamps_required` | INT (1-50) | Tampons pour palier 1 |
| `reward_description` | TEXT | Description recompense palier 1 |
| `tier2_enabled` | BOOL | Active le palier 2 |
| `tier2_stamps_required` | INT | Tampons pour palier 2 (> stamps_required) |
| `tier2_reward_description` | TEXT | Description recompense palier 2 |
| `double_days_enabled` | BOOL | Active les jours x2 |
| `double_days_of_week` | JSON | Jours x2 `[0-6]` (timezone Paris) |
| `shield_enabled` | BOOL (def true) | Qarte Shield anti-fraude |

**Champs NON utilises** : `cagnotte_percent`, `cagnotte_tier2_percent`, `current_amount`.

---

## Champs loyalty_cards

| Champ | Comportement mode passage |
|---|---|
| `current_stamps` | Incremente a chaque visite confirmee (+1 ou +2 jours doubles) |
| `current_amount` | **NON UTILISE** (toujours 0.00) |
| `last_visit_date` | Date derniere visite (timezone Paris) |
| `rewards_earned` | Compteur historique (incremente au redeem, jamais decremente) |
| `referral_code` | Code parrainage client (genere a la creation) |

---

## Flux scan → checkin

1. Client scanne QR → `/scan/{scan_code}`
2. Saisie telephone (ou auto-login cookie HttpOnly)
3. Appel `POST /api/checkin` avec `scan_code`, `phone_number`, `first_name`
4. Serveur : fetch merchant → fetch/create customer → fetch/create loyalty_card
5. **Idempotence** : si visite < 3 min avec meme customer → retour early, pas de doublon
6. **Qarte Shield** : si 1+ visite confirmed/pending le meme jour → `status = 'pending'` (quarantaine)
7. Sinon → `status = 'confirmed'`, stamps incrementes

### Increment des tampons

```
points_earned = (double_days_enabled && jour double) ? 2 : 1
current_stamps += points_earned
last_visit_date = today (Paris TZ)
```

### Champs visit crees

| Champ | Valeur |
|---|---|
| `points_earned` | 1 ou 2 |
| `status` | `'confirmed'` ou `'pending'` |
| `amount_spent` | **NULL** (pas utilise en passage) |
| `flagged_reason` | Auto-set par Shield si quarantaine |
| `ip_hash` | SHA256(IP + salt) pour audit RGPD |

---

## Detection recompense

```typescript
isRewardReady = currentStamps >= stamps_required
isTier2Ready  = tier2_enabled && currentStamps >= tier2_stamps_required
```

**Cycle palier** : un cycle = la periode entre deux redemptions palier 2.
- Palier 1 ne peut etre reclame qu'**une fois par cycle**
- Detection : redemptions palier 1 existantes APRES le dernier palier 2

```typescript
effectiveTier1Redeemed = tier1RedeemedInCycle && currentStamps >= stamps_required
```

---

## Logique de reset au redeem

### Palier unique (tier2 desactive)

| Action | `current_stamps` | `current_amount` |
|---|---|---|
| Redeem palier 1 | **Reset 0** | N/A |

→ Nouveau cycle, le client recommence de 0.

### Double palier (tier2 active)

| Action | `current_stamps` | `current_amount` |
|---|---|---|
| Redeem palier 1 | **Pas de reset** (continue vers palier 2) | N/A |
| Redeem palier 2 | **Reset 0** | N/A |

→ Apres palier 1, les tampons continuent. Apres palier 2, tout repart de 0.

### Code source (redeem + redeem-public)

```typescript
const shouldResetStamps = tier === 2 || !merchant.tier2_enabled;

if (shouldResetStamps) {
  // UPDATE loyalty_cards SET current_stamps = 0
  // WHERE id = X AND current_stamps >= required (race protection)
}
```

### Protection atomique

L'update utilise `.gte('current_stamps', stampsRequired)` comme condition. Si 0 rows affected → 409 "Deja recuperee" (protection race condition).

---

## Annulation (`/api/rewards/cancel`)

| Scenario | Restauration stamps |
|---|---|
| Annuler palier 1 (tier2 off) | OUI → `stamps_used` restaure |
| Annuler palier 1 (tier2 on) | NON → stamps n'avaient pas ete reset |
| Annuler palier 2 | OUI → `stamps_used` restaure |

`current_amount` n'est **jamais** restaure en mode passage (pas utilise).

---

## Redemption record

| Champ | Valeur passage |
|---|---|
| `stamps_used` | Nombre de tampons au moment du redeem |
| `tier` | 1 ou 2 |
| `amount_accumulated` | NULL |
| `reward_percent` | NULL |
| `reward_value` | NULL |

---

## Composant UI : StampsSection.tsx

- Grille de tampons (5 colonnes)
- Dual tier : deux blocs (palier 1 + palier 2) avec badges "Pret !", "Reclame", "Debloque !"
- Single tier : un bloc avec badge "Pret !" ou "Plus que X !"
- Jours doubles : icone Zap sur le tampon si gagne un jour double
- Texte sous les tampons : `reward_description` en italic Playfair

---

## Routes API

| Route | Methode | Fonction |
|---|---|---|
| `/api/checkin` | POST | Scan + creation visite + increment tampons |
| `/api/redeem` | POST | Redeem par le merchant (auth Supabase) |
| `/api/redeem-public` | POST | Redeem par le client (auth cookie phone) |
| `/api/rewards/cancel` | POST | Annulation du dernier redeem |
| `/api/visits/moderate` | POST | Valider/rejeter visites en quarantaine |

---

## Migrations SQL

- `016_tier2_rewards.sql` — Schema palier 2
- `021_double_stamp_days.sql` — Jours x2
- `035_qarte_shield.sql` — Shield anti-fraude
