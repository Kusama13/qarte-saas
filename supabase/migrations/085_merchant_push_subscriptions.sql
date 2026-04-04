-- 085_merchant_push_subscriptions.sql
-- Push notification subscriptions for merchant dashboard (PWA Pro)

-- Merchant push subscriptions (separate from customer push_subscriptions)
CREATE TABLE IF NOT EXISTS merchant_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endpoint)
);

CREATE INDEX IF NOT EXISTS idx_merchant_push_subs_merchant
  ON merchant_push_subscriptions(merchant_id);

ALTER TABLE merchant_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Merchants can manage their own subscriptions
CREATE POLICY "Merchants manage own push subs"
  ON merchant_push_subscriptions FOR ALL
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

-- Dedup log for merchant push notifications
CREATE TABLE IF NOT EXISTS merchant_push_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  reference_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchant_push_logs_lookup
  ON merchant_push_logs(merchant_id, notification_type, sent_at);

ALTER TABLE merchant_push_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can write logs (from API/cron)
CREATE POLICY "Service role merchant push logs"
  ON merchant_push_logs FOR ALL
  USING (true);
