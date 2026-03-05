# Mode Cagnotte

> `loyalty_mode = 'cagnotte'`

## Principe

Le client cumule un **montant depense** (en EUR) a chaque visite. Au bout de N visites, il recoit **X% sur sa cagnotte fidelite** du montant total cumule. Le pourcentage est configure par le commercant.

**Difference cle avec le mode passage** : le mode passage donne une recompense fixe (ex: "1 brushing offert"). Le mode cagnotte donne un pourcentage du total depense — plus le client depense, plus la cagnotte est grande.

---

## Champs merchant

| Champ | Type | Description |
|---|---|---|
| `loyalty_mode` | `'cagnotte'` | Active le mode cagnotte |
| `stamps_required` | INT (1-50) | Nombre de visites pour palier 1 |
| `reward_description` | TEXT | Description generique (ex: "5% sur votre cagnotte fidelite") |
| `cagnotte_percent` | NUMERIC | Pourcentage cagnotte palier 1 (ex: 5 = 5%) |
| `tier2_enabled` | BOOL | Active le palier 2 |
| `tier2_stamps_required` | INT | Visites pour palier 2 (> stamps_required) |
| `tier2_reward_description` | TEXT | Description palier 2 |
| `cagnotte_tier2_percent` | NUMERIC | Pourcentage cagnotte palier 2 (ex: 10 = 10%) |
| `shield_enabled` | BOOL (def true) | Qarte Shield anti-fraude |

**Champs NON utilises** : `double_days_enabled`, `double_days_of_week` (pas de jours doubles en cagnotte).

---

## Champs loyalty_cards

| Champ | Comportement mode cagnotte |
|---|---|
| `current_stamps` | Incremente de 1 a chaque visite confirmee (pas de x2) |
| `current_amount` | Montant EUR cumule (incremente du montant de chaque visite) |
| `last_visit_date` | Date derniere visite (timezone Paris) |
| `rewards_earned` | Compteur historique (incremente au redeem) |

---

## Flux scan → checkin cagnotte

1. Client scanne QR → `/scan/{scan_code}`
2. Saisie telephone (ou auto-login cookie)
3. **Saisie du montant depense** (champ numerique avec jauge de confirmation 5 secondes)
4. Appel `POST /api/cagnotte/checkin` avec `scan_code`, `phone_number`, `first_name`, **`amount`**
5. Serveur : fetch merchant → verif `loyalty_mode === 'cagnotte'` → fetch/create customer → fetch/create card
6. **Idempotence** : si visite < 3 min avec meme customer → retour early
7. **Qarte Shield** : meme logique que passage (quarantaine si 2e scan le meme jour)
8. Si confirme :

```
current_stamps += 1
current_amount += amount
last_visit_date = today (Paris TZ)
```

### Champs visit crees

| Champ | Valeur cagnotte |
|---|---|
| `points_earned` | 1 (toujours, pas de x2) |
| `status` | `'confirmed'` ou `'pending'` |
| `amount_spent` | Montant EUR saisi par le client |

---

## Calcul de la cagnotte

```typescript
cagnotte = Math.round(currentAmount * percent) / 100
```

Ou `percent` est un entier (ex: 5 pour 5%). Exemple :
- `currentAmount = 500€`, `percent = 5` → `cagnotte = 25,00€`
- `currentAmount = 500€`, `percent = 10` → `cagnotte = 50,00€`

**Validation** : si `cagnotte_percent` est null ou <= 0, le redeem retourne une erreur 400.

---

## Detection recompense

```typescript
isRewardReady = currentStamps >= stamps_required
isTier2Ready  = tier2_enabled && currentStamps >= tier2_stamps_required
```

Identique au mode passage — la detection est basee sur le **nombre de visites**, pas sur le montant.

---

## Logique de reset au redeem

### C'est la difference MAJEURE avec le mode passage.

### Palier unique (tier2 desactive)

| Action | `current_stamps` | `current_amount` |
|---|---|---|
| Redeem palier 1 | **Reset 0** | **Reset 0** |

→ Tout repart de 0.

### Double palier (tier2 active)

| Action | `current_stamps` | `current_amount` |
|---|---|---|
| Redeem palier 1 | **Pas de reset** | **Reset 0** |
| Redeem palier 2 | **Reset 0** | **Reset 0** |

### Explication du double palier

1. Client visite 10 fois, depense 500€ au total
2. **Palier 1** atteint (10 visites) → cagnotte = 500 x 5% = **25€**
3. Redeem palier 1 :
   - `current_amount` → **0** (reset)
   - `current_stamps` → **10** (garde, continue vers palier 2)
4. Client visite encore 10 fois (total 20), depense 400€ **depuis le reset**
5. **Palier 2** atteint (20 visites) → cagnotte = 400 x 10% = **40€**
6. Redeem palier 2 :
   - `current_amount` → **0**
   - `current_stamps` → **0**
7. Nouveau cycle

### Point cle

Le cagnotte du **palier 2 est calcule sur le nouveau montant** (accumule APRES le palier 1), pas sur le montant total depuis le debut. C'est pour ca que `current_amount` reset a 0 au palier 1.

### Code source (redeem + redeem-public)

```typescript
// Cagnotte: TOUJOURS reset current_amount a 0
// Stamps: reset a 0 seulement pour tier 2 (ou tier 1 si tier 2 desactive)
const shouldResetStamps = tier === 2 || !merchant.tier2_enabled;

const updateData: Record<string, number> = { current_amount: 0 };
if (shouldResetStamps) {
  updateData.current_stamps = 0;
}
```

### Protection atomique

Meme que passage : `.gte('current_stamps', stampsRequired)` comme condition d'update. Si 0 rows → 409.

---

## Annulation (`/api/rewards/cancel`)

| Scenario | Restauration stamps | Restauration amount |
|---|---|---|
| Annuler palier 1 (tier2 off) | OUI | OUI |
| Annuler palier 1 (tier2 on) | NON (pas ete reset) | OUI (avait ete reset) |
| Annuler palier 2 | OUI | OUI |

```typescript
const shouldRestoreStamps = lastRedemption.tier === 2 || !merchant.tier2_enabled;
const shouldRestoreAmount = merchant.loyalty_mode === 'cagnotte' && lastRedemption.amount_accumulated;
```

**Point critique** : en mode cagnotte, `current_amount` est TOUJOURS reset a 0 (meme au palier 1 avec tier2 active). Donc l'annulation doit TOUJOURS restaurer `current_amount`, meme quand les stamps ne sont pas restaures.

---

## Redemption record

| Champ | Valeur cagnotte |
|---|---|
| `stamps_used` | Nombre de tampons au moment du redeem |
| `tier` | 1 ou 2 |
| `amount_accumulated` | Montant EUR cumule au moment du redeem |
| `reward_percent` | Pourcentage applique (5, 10, etc.) |
| `reward_value` | Cashback en EUR (`amount * percent / 100`) |

---

## Affichage UI

### CagnotteSection.tsx (tampons)
- Grille tampons (5 colonnes, icones Heart) — identique au mode passage (StampsSection)
- Sous les tampons : texte italic Playfair avec `rewardDescription` (ex: "5% sur votre cagnotte fidelite")
- Props: `rewardDescription`, `tier2RewardDescription` (pas de montant ni pourcentage calcule)
- Double palier : meme structure que StampsSection (palier 1 grise apres reclamation, palier 2 violet)

### RewardCard.tsx (carte recompense)
- **Cagnotte ready** : gradient, shimmer, gros montant (2xl font-black), "Reclamez votre cagnotte"
- **Cagnotte not ready** : icone Coins, description bold, "Deja X€ cumules — plus que Y passages !" (si montant > 0) ou "Plus que Y passages pour debloquer votre cagnotte !"
- Props additionnelles cagnotte : `isCagnotte`, `cashbackAmount`, `cashbackPercent`

### StickyRedeemBar.tsx
- Cagnotte : gradient emerald, icone Coins, "Recuperer X€ sur ma cagnotte"
- Palier 2 : "Recuperer ma cagnotte palier 2"

### CustomerAdjustTab.tsx (Gerer client > onglet Points)
- Box cagnotte : gros chiffre = valeur cagnotte (pas le cumul depense), badge "Palier X atteint"
- Palier 2 affiche sous le palier 1 tant que non atteint, avec valeur et pourcentage
- Total depense en petit contexte
- Preview ajustement cumul : nouveau cumul + nouvelles valeurs cagnotte palier 1/2
- Label "Nombre de passages" (pas "points")

---

## Comparatif passage vs cagnotte

| Aspect | Passage | Cagnotte |
|---|---|---|
| Unite | Tampons (visites) | EUR depense |
| Tracking | `current_stamps` | `current_stamps` + `current_amount` |
| Increment | +1 (ou +2 jours doubles) | +1 tampon + montant EUR |
| Recompense | Fixe (ex: "1 brushing") | % du cumul (ex: "5% cagnotte") |
| Jours doubles | Oui | Non |
| Reset palier 1 (tier2 on) | Stamps gardes | Stamps gardes, **amount reset 0** |
| Reset palier 2 | Tout a 0 | Tout a 0 |
| Saisie client au scan | Rien | Montant depense (avec jauge 5s) |
| `amount_spent` (visit) | NULL | Montant EUR |
| `reward_value` (redemption) | NULL | Cashback EUR |

---

## Routes API

| Route | Methode | Fonction |
|---|---|---|
| `/api/cagnotte/checkin` | POST | Scan + creation visite + increment tampons + amount |
| `/api/cagnotte/redeem` | POST | Redeem par le merchant (auth Supabase) |
| `/api/cagnotte/redeem-public` | POST | Redeem par le client (auth cookie phone) |
| `/api/rewards/cancel` | POST | Annulation (partage avec passage, gere les deux modes) |
| `/api/visits/moderate` | POST | Valider/rejeter visites quarantaine (partage avec passage) |

---

## Migration SQL

- `050_cagnotte_mode.sql` — Ajout `loyalty_mode`, `cagnotte_percent`, `cagnotte_tier2_percent`, `current_amount`, `amount_spent`, champs redemption cagnotte
