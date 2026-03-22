-- Add soft-delete column to merchants
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for filtering active merchants efficiently
CREATE INDEX IF NOT EXISTS idx_merchants_active ON merchants(id) WHERE deleted_at IS NULL;
