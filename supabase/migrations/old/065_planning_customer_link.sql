-- Migration 065: Link planning slots to customers table
-- customer_id is optional — merchant can still type a name manually for walk-ins
ALTER TABLE merchant_planning_slots ADD COLUMN IF NOT EXISTS customer_id UUID NULL REFERENCES customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_planning_slots_customer ON merchant_planning_slots(customer_id) WHERE customer_id IS NOT NULL;
