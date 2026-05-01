-- 114_merchant_plan_tier.sql
-- Tier d'abonnement : Fidélité (19€) ou Tout-en-un (24€).
-- Tous les merchants existants → 'all_in' (zéro changement perçu).
-- Le gating ne s'applique qu'aux abonnés payants — les trials ont accès Tout-en-un complet
-- (logique côté src/lib/plan-tiers.ts).

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'all_in'
    CHECK (plan_tier IN ('fidelity', 'all_in'));

CREATE INDEX IF NOT EXISTS idx_merchants_plan_tier
  ON merchants(plan_tier)
  WHERE subscription_status IN ('active', 'canceling', 'past_due');

COMMENT ON COLUMN merchants.plan_tier IS
  'Tier produit : fidelity (19€/190€, fidélité seule) ou all_in (24€/240€, planning + résa + marketing). Trials = all_in via getPlanFeatures().';
