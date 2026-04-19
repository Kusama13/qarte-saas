-- Trial marketing SMS logs (plan v2 emails+SMS) — tracking + dedup
-- Voir docs/email-sms-trial-plan.md §6
--
-- Stocke les SMS marketing envoyés au merchant pendant son trial (≠ sms_logs qui
-- track les SMS envoyés aux clients du merchant).
--
-- 5 types possibles :
-- - celebration_fidelity / celebration_planning / celebration_vitrine (1er aha event)
-- - trial_pre_loss (J-1 fin trial, ≥S1)
-- - churn_survey (J+5 fully expired, push survey)

CREATE TABLE IF NOT EXISTS merchant_marketing_sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  sms_type TEXT NOT NULL CHECK (sms_type IN (
    'celebration_fidelity',
    'celebration_planning',
    'celebration_vitrine',
    'trial_pre_loss',
    'churn_survey'
  )),
  state_snapshot INT,                    -- activation_score au moment d'envoi (0-3)
  tier_recommended TEXT CHECK (tier_recommended IN ('fidelity', 'all_in')),
  body TEXT NOT NULL,
  ovh_job_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message TEXT,
  cost_euro NUMERIC(6,4),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_sms_merchant
  ON merchant_marketing_sms_logs(merchant_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_sms_type_dedup
  ON merchant_marketing_sms_logs(merchant_id, sms_type);

ALTER TABLE merchant_marketing_sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants read own marketing sms logs" ON merchant_marketing_sms_logs FOR SELECT
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access marketing sms logs" ON merchant_marketing_sms_logs FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE merchant_marketing_sms_logs IS
  'SMS marketing trial envoyés au merchant (Qarte → merchant). Distinct de sms_logs (merchant → clients).';
