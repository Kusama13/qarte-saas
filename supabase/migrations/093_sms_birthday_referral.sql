-- Add birthday + referral SMS types and update global config
ALTER TABLE sms_logs DROP CONSTRAINT IF EXISTS sms_logs_sms_type_check;
ALTER TABLE sms_logs ADD CONSTRAINT sms_logs_sms_type_check
  CHECK (sms_type IN ('reminder_j1', 'confirmation_no_deposit', 'confirmation_deposit', 'birthday', 'referral_reward'));

-- Drop unique dedup index (slot_id is NULL for birthday/referral) and recreate as partial
DROP INDEX IF EXISTS idx_sms_logs_dedup;
CREATE UNIQUE INDEX idx_sms_logs_dedup ON sms_logs (merchant_id, sms_type, slot_id) WHERE slot_id IS NOT NULL;

-- Update global config to include new toggles
UPDATE app_config
SET value = value || '{"birthday_enabled": true, "referral_enabled": true}'::jsonb,
    updated_at = now()
WHERE key = 'sms_global';
