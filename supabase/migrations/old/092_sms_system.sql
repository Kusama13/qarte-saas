-- SMS logs table (audit trail + quota computation + dedup)
CREATE TABLE sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  slot_id uuid REFERENCES merchant_planning_slots(id) ON DELETE SET NULL,
  phone_to text NOT NULL,
  sms_type text NOT NULL CHECK (sms_type IN ('reminder_j1', 'confirmation_no_deposit', 'confirmation_deposit')),
  message_body text NOT NULL,
  ovh_job_id text,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  error_message text,
  cost_euro numeric(6,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sms_logs_merchant_month ON sms_logs (merchant_id, created_at);
CREATE UNIQUE INDEX idx_sms_logs_dedup ON sms_logs (merchant_id, sms_type, slot_id);

-- Global app config (SMS admin toggles)
CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_config (key, value) VALUES
  ('sms_global', '{"reminder_enabled": true, "confirmation_enabled": true}')
ON CONFLICT (key) DO NOTHING;
