-- Junction table for multi-service bookings on planning slots
CREATE TABLE planning_slot_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES merchant_planning_slots(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES merchant_services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slot_id, service_id)
);

CREATE INDEX idx_planning_slot_services_slot ON planning_slot_services(slot_id);
CREATE INDEX idx_planning_slot_services_service ON planning_slot_services(service_id);

-- RLS
ALTER TABLE planning_slot_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchant can manage own slot services"
  ON planning_slot_services FOR ALL
  USING (
    slot_id IN (
      SELECT id FROM merchant_planning_slots
      WHERE merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Service role full access on planning_slot_services"
  ON planning_slot_services FOR ALL
  TO service_role USING (true) WITH CHECK (true);

-- Migrate existing service_id data into junction table
INSERT INTO planning_slot_services (slot_id, service_id)
SELECT id, service_id FROM merchant_planning_slots
WHERE service_id IS NOT NULL;
