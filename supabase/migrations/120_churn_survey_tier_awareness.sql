-- Churn survey 2-tier awareness :
-- 1. plan_tier_at_churn : snapshot merchant.plan_tier au moment du survey.
--    NULL = legacy merchant (créé avant PRICING_SPLIT_DATE 2026-04-05, tarif historique)
-- 2. features_wanted_unavailable : array des features de Tout-en-un que le merchant Fidélité
--    aurait voulu pouvoir tester (planning, online_booking, sms_marketing, contest, member_programs)
-- 3. New convince value 'fidelity_tier_ok' : le merchant all_in aurait préféré le tier Fidélité 19€

ALTER TABLE merchant_churn_surveys
  ADD COLUMN IF NOT EXISTS plan_tier_at_churn TEXT,
  ADD COLUMN IF NOT EXISTS features_wanted_unavailable TEXT[] NOT NULL DEFAULT '{}';

-- Drop + recreate CHECK constraint on would_convince to include new value
ALTER TABLE merchant_churn_surveys
  DROP CONSTRAINT IF EXISTS merchant_churn_surveys_would_convince_check;

ALTER TABLE merchant_churn_surveys
  ADD CONSTRAINT merchant_churn_surveys_would_convince_check
  CHECK (would_convince IN ('lower_price', 'longer_trial', 'team_demo', 'more_features', 'fidelity_tier_ok', 'nothing'));

CREATE INDEX IF NOT EXISTS idx_churn_surveys_plan_tier ON merchant_churn_surveys(plan_tier_at_churn);

COMMENT ON COLUMN merchant_churn_surveys.plan_tier_at_churn IS
  'Snapshot de merchant.plan_tier (fidelity | all_in | NULL=legacy) au moment du survey, pour analyse churn par tier.';
COMMENT ON COLUMN merchant_churn_surveys.features_wanted_unavailable IS
  'Features Tout-en-un non dispo dans Fidélité que le merchant aurait voulu tester. Enum: planning, online_booking, sms_marketing, contest, member_programs.';
