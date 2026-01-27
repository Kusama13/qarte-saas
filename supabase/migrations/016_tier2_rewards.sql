-- Add 2nd tier reward fields to merchants table
-- Points are cumulative (don't reset after tier 1)

ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS tier2_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tier2_stamps_required INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tier2_reward_description TEXT DEFAULT NULL;

-- Add constraint: tier2_stamps_required must be greater than stamps_required if tier2 is enabled
ALTER TABLE merchants
ADD CONSTRAINT tier2_stamps_check
CHECK (
  tier2_enabled = FALSE
  OR (tier2_stamps_required IS NOT NULL AND tier2_stamps_required > stamps_required)
);

COMMENT ON COLUMN merchants.tier2_enabled IS 'Enable second tier reward (cumulative points)';
COMMENT ON COLUMN merchants.tier2_stamps_required IS 'Number of stamps required for tier 2 reward';
COMMENT ON COLUMN merchants.tier2_reward_description IS 'Description of tier 2 reward';
