-- Add primary_slot_id to link filler slots to their primary booking slot
-- NULL = primary slot or available slot
-- UUID = filler slot belonging to a multi-slot booking
ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS primary_slot_id UUID REFERENCES merchant_planning_slots(id) ON DELETE SET NULL;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_planning_slots_primary_slot_id
  ON merchant_planning_slots(primary_slot_id)
  WHERE primary_slot_id IS NOT NULL;

-- Backfill: set primary_slot_id on existing filler slots
-- Filler = has client_name but no entry in planning_slot_services,
-- AND another slot same merchant/date/client has services (= the primary)
UPDATE merchant_planning_slots AS filler
SET primary_slot_id = (
  SELECT p.id
  FROM merchant_planning_slots p
  JOIN planning_slot_services pss ON pss.slot_id = p.id
  WHERE p.merchant_id = filler.merchant_id
    AND p.slot_date = filler.slot_date
    AND p.client_name = filler.client_name
    AND p.id != filler.id
  ORDER BY p.start_time ASC
  LIMIT 1
)
WHERE filler.client_name IS NOT NULL
  AND filler.primary_slot_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM planning_slot_services pss WHERE pss.slot_id = filler.id
  )
  AND EXISTS (
    SELECT 1
    FROM merchant_planning_slots p
    JOIN planning_slot_services pss ON pss.slot_id = p.id
    WHERE p.merchant_id = filler.merchant_id
      AND p.slot_date = filler.slot_date
      AND p.client_name = filler.client_name
      AND p.id != filler.id
  );
