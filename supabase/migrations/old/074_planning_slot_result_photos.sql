-- Result photos for planning slots (photos of finished work, max 3 per slot)
CREATE TABLE planning_slot_result_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES merchant_planning_slots(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position SMALLINT DEFAULT 1 CHECK (position BETWEEN 1 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slot_id, position)
);

CREATE INDEX idx_slot_result_photos_slot ON planning_slot_result_photos(slot_id);

ALTER TABLE planning_slot_result_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant can manage own slot result photos"
  ON planning_slot_result_photos FOR ALL
  USING (merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access on planning_slot_result_photos"
  ON planning_slot_result_photos FOR ALL
  TO service_role USING (true) WITH CHECK (true);
