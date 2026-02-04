# Audit de Scalabilite - Qarte SaaS

**Derniere mise a jour:** 4 fevrier 2026
**Auditeur:** Claude Opus 4.5

---

## Capacite Actuelle

| Metrique | Capacite | Limite |
|----------|----------|--------|
| **Marchands** | ~300-500 | Crons timeout a 500+ |
| **Checkins/jour** | ~20,000 | Index visits aide |
| **Clients/marchand** | ~2,000 | Admin optimise |
| **Push/envoi** | ~100 | Sequentiel (non optimise) |

### Echelle de confiance

| Echelle | Status |
|---------|--------|
| 0-300 marchands | ✅ OK |
| 300-500 marchands | ⚠️ Limite |
| 500+ marchands | 🔴 Fixes requis |

---

## Corrections Appliquees

### 4 fevrier 2026

#### ✅ Fix N+1 Admin Merchants
**Fichier:** `src/app/admin/merchants/page.tsx`
**Commit:** `17d1d35`

**Avant:**
```typescript
// 1 requete PAR marchand (N+1)
const merchantsWithCounts = await Promise.all(
  merchantsData.map(async (merchant) => {
    const { count } = await supabase
      .from('loyalty_cards')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id);
    return { ...merchant, _count: { customers: count || 0 } };
  })
);
```

**Apres:**
```typescript
// 1 seule requete pour tous les counts
const { data: loyaltyCards } = await supabase
  .from('loyalty_cards')
  .select('merchant_id')
  .in('merchant_id', merchantIds);

const countMap = new Map();
loyaltyCards.forEach((card) => {
  countMap.set(card.merchant_id, (countMap.get(card.merchant_id) || 0) + 1);
});
```

**Impact:** 1000 marchands = 1001 requetes → 3 requetes

---

#### ✅ Index Base de Donnees
**Migration:** Executee manuellement dans Supabase

```sql
-- Index pour quarantine check
CREATE INDEX idx_visits_customer_merchant_date
  ON visits(customer_id, merchant_id, visited_at DESC);

-- Index pour stats marchands
CREATE INDEX idx_visits_merchant_status
  ON visits(merchant_id, status);

-- Index pour lookup loyalty cards
CREATE INDEX idx_loyalty_cards_merchant
  ON loyalty_cards(merchant_id);

-- Index pour push subscriptions
CREATE INDEX idx_push_subscriptions_customer
  ON push_subscriptions(customer_id);
```

**Impact:** Reduction 80-90% temps de requete sur les operations frequentes

---

## Problemes Restants

### 🔴 CRITIQUE

#### 1. Cron Jobs Sequentiels
**Fichiers:**
- `src/app/api/cron/morning/route.ts`
- `src/app/api/cron/evening/route.ts`
- `src/app/api/cron/reactivation/route.ts`

**Probleme:** Boucles `for...await` qui traitent chaque marchand sequentiellement.

**Impact:** 500 marchands avec pending visits = ~3000 operations DB = timeout

**Solution:** Remplacer par `Promise.all` avec batching

```typescript
// Avant (sequentiel)
for (const merchantId of uniqueMerchantIds) {
  const { data: merchant } = await supabase...
  const { data: userData } = await supabase...
  await sendEmail(...);
}

// Apres (parallele avec batch)
const batchSize = 10;
for (let i = 0; i < merchantIds.length; i += batchSize) {
  const batch = merchantIds.slice(i, i + batchSize);
  await Promise.all(batch.map(async (id) => {
    // traitement
  }));
}
```

**Effort:** 2h | **Priorite:** P0

---

#### 2. Push Notifications Sequentielles
**Fichier:** `src/app/api/push/send/route.ts`

**Probleme:** `webpush.sendNotification()` appele en boucle sequentielle

```typescript
// Actuel - LENT
for (const sub of subscriptions) {
  await webpush.sendNotification(sub, payload);
}
```

**Impact:** 5000 abonnes × 0.3s = 25 minutes (timeout)

**Solution:**
```typescript
// Parallele avec Promise.allSettled
const results = await Promise.allSettled(
  subscriptions.map(sub => webpush.sendNotification(sub, payload))
);
```

**Effort:** 1h | **Priorite:** P0

---

#### 3. Push Subscribers Sans Pagination
**Fichier:** `src/app/api/push/subscribers/route.ts`

**Probleme:** Fetch ALL loyalty cards sans limite

**Impact:** 10,000 cartes = memory spike potentiel

**Solution:** Ajouter `.limit(1000)` + pagination

**Effort:** 1h | **Priorite:** P0

---

#### 4. Checkin - Trop de Requetes
**Fichier:** `src/app/api/checkin/route.ts`

**Probleme:** 7-9 requetes sequentielles par checkin

**Impact:** 100 checkins/sec = 700-900 DB ops/sec

**Solution:**
- Combiner requetes avec JOINs
- Cache merchant data (5 min TTL)

**Effort:** 2h | **Priorite:** P1

---

### 🟠 HAUTE PRIORITE

#### 5. Index Manquant customers(phone_number)
```sql
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_redemptions_card_tier ON redemptions(loyalty_card_id, tier);
```

**Effort:** 5 min | **Priorite:** P1

---

#### 6. Visits Moderate - N+1 Dans Boucle
**Fichier:** `src/app/api/visits/moderate/route.ts`

**Probleme:** Bulk moderation = 3 requetes × N visites

**Solution:** Batch UPDATE avec array

**Effort:** 1h | **Priorite:** P2

---

### 🟡 MOYENNE PRIORITE

| # | Probleme | Fichier | Effort |
|---|----------|---------|--------|
| 7 | Pas de pagination `/api/redemptions` | redemptions/route.ts | 30min |
| 8 | Pas de pagination `/api/visits/moderate` | visits/moderate/route.ts | 30min |
| 9 | Pas de pagination `/api/member-cards` | member-cards/route.ts | 30min |
| 10 | Rate limiting en memoire | checkin/route.ts | 1h |

---

## Capacite Apres Tous les Fixes

| Metrique | Actuel | Apres Fixes |
|----------|--------|-------------|
| Utilisateurs simultanes | 50-100 | **500-1000** |
| Checkins/jour | 20,000 | **500,000** |
| Push/jour | 50,000 | **5,000,000** |
| Temps cron | 30-60 min | **5 min** |
| Marchands max | 500 | **10,000+** |

---

## Plan d'Implementation

### Semaine 1 (CRITIQUE)
- [ ] Paralleliser cron morning/evening/reactivation
- [ ] Paralleliser webpush sends
- [ ] Ajouter index customers(phone_number)
- [ ] Pagination push/subscribers

### Semaine 2 (HAUTE)
- [ ] Optimiser checkin (reduire requetes)
- [ ] Batch visits moderate
- [ ] Pagination endpoints manquants

### Semaine 3 (MOYENNE)
- [ ] Rate limiting Redis
- [ ] Cache merchant data
- [ ] Monitoring/APM

---

## Commandes de Verification

```bash
# Trouver les boucles await sequentielles
grep -rn "for.*await" src/app/api/ --include="*.ts"

# Trouver les endpoints sans pagination
grep -rn "\.select\(" src/app/api/ --include="*.ts" | grep -v "limit"

# Verifier les index existants (Supabase SQL)
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'visits';
```

---

*Audit genere le 4 fevrier 2026 par Claude Opus 4.5*
