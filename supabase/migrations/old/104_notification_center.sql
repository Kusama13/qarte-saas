-- Mig 104: Notification center — enrich merchant_push_logs for display
-- Adds title, body, url, read columns to enable a notification dropdown in the dashboard.

ALTER TABLE merchant_push_logs
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS url TEXT,
  ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;

-- Index for fetching unread count + recent notifications per merchant
CREATE INDEX IF NOT EXISTS idx_merchant_push_logs_unread
  ON merchant_push_logs(merchant_id, read, sent_at DESC);

-- RLS: let merchants SELECT and UPDATE their own logs
CREATE POLICY "Merchants read own push logs"
  ON merchant_push_logs FOR SELECT
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants update own push logs"
  ON merchant_push_logs FOR UPDATE
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));
