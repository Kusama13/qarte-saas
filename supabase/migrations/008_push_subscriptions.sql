-- Push subscriptions table for web push notifications
-- Stores browser push subscription data per customer

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each endpoint is unique (one subscription per browser)
  UNIQUE(endpoint)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_customer ON push_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public can create subscriptions (from customer PWA)
CREATE POLICY "Anyone can create push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (true);

-- Public can view their own subscriptions
CREATE POLICY "Anyone can view push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (true);

-- Public can update subscriptions (refresh tokens)
CREATE POLICY "Anyone can update push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (true);

-- Public can delete subscriptions (unsubscribe)
CREATE POLICY "Anyone can delete push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (true);

-- Comments
COMMENT ON TABLE push_subscriptions IS 'Web push notification subscriptions linked to customers';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Public key for push encryption';
COMMENT ON COLUMN push_subscriptions.auth IS 'Auth secret for push encryption';
