-- 111_booking_deposit_failures.sql
-- Archive table for expired deposit reservations. When a slot's deposit_deadline_at is
-- passed without confirmation, we snapshot the reservation into this table before wiping
-- the slot — so the merchant can view the failure, delete it, or "bring it back" (re-book
-- on the same or a new slot).

CREATE TABLE IF NOT EXISTS booking_deposit_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  service_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  original_slot_date DATE NOT NULL,
  original_start_time TIME NOT NULL,
  total_duration_minutes INTEGER,
  notes TEXT,
  deposit_amount NUMERIC(10,2),
  expired_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_deposit_failures_merchant_expired
  ON booking_deposit_failures (merchant_id, expired_at DESC);

-- RLS: merchants can read and delete their own; inserts go through service_role only (cron).
ALTER TABLE booking_deposit_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchant_select_own_failures" ON booking_deposit_failures;
CREATE POLICY "merchant_select_own_failures" ON booking_deposit_failures
  FOR SELECT
  USING (
    merchant_id IN (
      SELECT id FROM merchants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "merchant_delete_own_failures" ON booking_deposit_failures;
CREATE POLICY "merchant_delete_own_failures" ON booking_deposit_failures
  FOR DELETE
  USING (
    merchant_id IN (
      SELECT id FROM merchants WHERE user_id = auth.uid()
    )
  );
