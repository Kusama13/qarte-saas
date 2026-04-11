-- Churn retention survey — intercepts fully expired merchants before subscription page
-- Collects feedback + grants +2 days as reciprocity bonus
-- Conditional promo QARTEPRO10 if merchant answers "lower_price" to would_convince

CREATE TABLE IF NOT EXISTS merchant_churn_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  blocker TEXT NOT NULL CHECK (blocker IN ('price', 'not_enough_clients', 'missing_feature', 'too_complex', 'other')),
  missing_feature TEXT,
  features_tested TEXT[] NOT NULL DEFAULT '{}',
  would_convince TEXT NOT NULL CHECK (would_convince IN ('lower_price', 'longer_trial', 'team_demo', 'more_features', 'nothing')),
  free_comment TEXT,
  bonus_days_granted INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_churn_surveys_created ON merchant_churn_surveys(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_churn_surveys_blocker ON merchant_churn_surveys(blocker);

ALTER TABLE merchant_churn_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants insert own survey" ON merchant_churn_surveys FOR INSERT
  WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants read own survey" ON merchant_churn_surveys FOR SELECT
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access churn surveys" ON merchant_churn_surveys FOR ALL
  USING (auth.role() = 'service_role');

-- Flag on merchants : set only on completion (not skip)
-- Skip leaves this NULL so merchant sees survey again on next visit
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS churn_survey_seen_at TIMESTAMPTZ;

COMMENT ON TABLE merchant_churn_surveys IS 'Retention survey responses from merchants who trial-expired >3 days. One row per merchant.';
COMMENT ON COLUMN merchants.churn_survey_seen_at IS 'Set when merchant completes churn survey. NULL if never seen or skipped (skip is not persisted).';
