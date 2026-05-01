-- Trial marketing infra (plan v2 emails+SMS) — colonnes merchants
-- Voir docs/email-sms-trial-plan.md
--
-- Ajouts :
-- - celebration_sms_sent_at : dedup global SMS célébration (1 max sur la vie merchant)
-- - marketing_sms_opted_out : opt-out merchant (toggle settings, ON par défaut)
--
-- Note : activation_score (S0-S3) calculé on-the-fly dans cron TS, pas stocké
-- (évite trigger sur visits/slots/photos en hot path).

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS celebration_sms_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_sms_opted_out BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN merchants.celebration_sms_sent_at IS
  'Timestamp du SMS célébration trial envoyé. NULL = jamais envoyé. Dedup global (1 max sur toute la vie merchant, peu importe le pilier touché).';

COMMENT ON COLUMN merchants.marketing_sms_opted_out IS
  'Opt-out merchant pour SMS marketing trial (célébration, pre-loss, churn survey). FALSE par défaut. Togglable via /dashboard/settings.';

-- Index pour filtrer rapidement dans les crons SMS marketing
CREATE INDEX IF NOT EXISTS idx_merchants_sms_marketing_eligible
  ON merchants(subscription_status, marketing_sms_opted_out)
  WHERE marketing_sms_opted_out = FALSE;
