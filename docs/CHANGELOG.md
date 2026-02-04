# Changelog - Qarte SaaS

Historique des deploiements et modifications.

---

## [2026-02-04] - Mise a jour majeure

### Deploiement #2 - Performance
**Commit:** `17d1d35`
**Heure:** ~19:30

#### Changements
- **perf:** Fix N+1 query dans admin/merchants/page.tsx
  - Remplace boucle de requetes individuelles par batch query
  - 1000 marchands: 1001 requetes → 3 requetes

#### Impact
- Page admin merchants charge 10x plus vite
- Reduction charge DB significative

---

### Deploiement #1 - Emails & Anti-spam
**Commit:** `ff43d7d`
**Heure:** ~18:00

#### Nouveaux Fichiers
```
src/emails/
├── PaymentFailedEmail.tsx      # Email echec paiement
├── SubscriptionCanceledEmail.tsx # Email annulation
└── ReactivationEmail.tsx       # Email win-back J+7/14/30

src/app/api/cron/
└── reactivation/route.ts       # Cron emails reactivation

supabase/migrations/
├── 026_fix_trial_period.sql    # Trial 14→15 jours
├── 027_fix_subscription_status_spelling.sql # cancelled→canceled
└── 028_reactivation_email_tracking.sql # Table tracking
```

#### Fichiers Modifies
| Fichier | Modification |
|---------|--------------|
| `src/emails/index.ts` | +3 exports nouveaux emails |
| `src/lib/resend.ts` | +EMAIL_HEADERS anti-spam |
| `src/lib/email.ts` | +fonctions envoi + text versions |
| `src/lib/stripe.ts` | API version 2025-12-15.clover |
| `src/app/api/stripe/webhook/route.ts` | +envoi emails sur events |
| `vercel.json` | +cron reactivation 10:00 |

#### Anti-spam
```typescript
export const EMAIL_HEADERS = {
  'List-Unsubscribe': '<mailto:unsubscribe@getqarte.com?subject=unsubscribe>',
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
};
```

#### Autres
- Suppression `console.log` en production
- Remplacement `any` par types corrects
- Dashboard cache localStorage (2 min TTL)
- Admin: suppression bouton delete marchand
- Admin: affichage email dans details marchand

---

## [2026-02-04] - Migrations SQL

### Migration 026 - Trial Period
```sql
ALTER TABLE merchants
ALTER COLUMN trial_ends_at
SET DEFAULT (NOW() + INTERVAL '15 days');
```
**Note:** Affecte uniquement nouveaux marchands

### Migration 027 - Subscription Status Spelling
```sql
UPDATE merchants SET subscription_status = 'canceled'
WHERE subscription_status = 'cancelled';

ALTER TABLE merchants DROP CONSTRAINT merchants_subscription_status_check;
ALTER TABLE merchants ADD CONSTRAINT merchants_subscription_status_check
  CHECK (subscription_status IN ('trial', 'active', 'canceled', 'canceling', 'past_due'));
```

### Migration 028 - Reactivation Tracking
```sql
CREATE TABLE reactivation_emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'day_7', 'day_14', 'day_30'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id, email_type)
);
```

### Index Performance (manuel)
```sql
CREATE INDEX idx_visits_customer_merchant_date
  ON visits(customer_id, merchant_id, visited_at DESC);
CREATE INDEX idx_visits_merchant_status
  ON visits(merchant_id, status);
CREATE INDEX idx_loyalty_cards_merchant
  ON loyalty_cards(merchant_id);
CREATE INDEX idx_push_subscriptions_customer
  ON push_subscriptions(customer_id);
```

---

## [2026-02-04] - Corrections DB

### Fix member_programs.duration_months
**Probleme:** Colonne INTEGER, code envoie DECIMAL
**Solution:**
```sql
ALTER TABLE member_programs
ALTER COLUMN duration_months TYPE NUMERIC(6,2);
```

---

## Format des Entrees

```markdown
## [YYYY-MM-DD] - Titre

### Deploiement #N - Description
**Commit:** `hash`
**Heure:** HH:MM

#### Changements
- Description des changements

#### Impact
- Impact sur le projet
```

---

## Commandes Utiles

```bash
# Voir les derniers commits
git log --oneline -10

# Voir les changements d'un commit
git show <hash> --stat

# Deployer sur Vercel
git push origin main

# Verifier le deploiement
vercel logs
```

---

*Derniere mise a jour: 4 fevrier 2026*
