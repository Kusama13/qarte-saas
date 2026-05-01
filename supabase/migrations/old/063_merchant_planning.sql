-- Planning module: merchant-managed time slots
-- One row per slot. client_name IS NULL = available, filled = taken.

-- Config columns on merchants
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS planning_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS planning_message TEXT DEFAULT NULL;

-- Slots table
CREATE TABLE IF NOT EXISTS merchant_planning_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  slot_date DATE NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  client_name TEXT NULL,
  client_phone TEXT NULL,
  service_id UUID NULL REFERENCES merchant_services(id) ON DELETE SET NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_planning_slots_merchant_date ON merchant_planning_slots(merchant_id, slot_date);
CREATE UNIQUE INDEX idx_planning_slots_unique ON merchant_planning_slots(merchant_id, slot_date, start_time);

-- RLS
ALTER TABLE merchant_planning_slots ENABLE ROW LEVEL SECURITY;

-- Public: view available future slots only
DROP POLICY IF EXISTS "Public can view available slots" ON merchant_planning_slots;
CREATE POLICY "Public can view available slots"
  ON merchant_planning_slots FOR SELECT
  USING (client_name IS NULL AND slot_date >= CURRENT_DATE);

-- Merchant: full CRUD on own slots
DROP POLICY IF EXISTS "Merchants manage own slots" ON merchant_planning_slots;
CREATE POLICY "Merchants manage own slots"
  ON merchant_planning_slots FOR ALL
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));
