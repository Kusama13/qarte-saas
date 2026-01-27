-- Add tier field to redemptions table for multi-tier rewards
-- tier 1 = first reward, tier 2 = second reward (cumulative)

ALTER TABLE redemptions
ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1;

-- Add constraint to ensure tier is 1 or 2
ALTER TABLE redemptions
ADD CONSTRAINT redemption_tier_check CHECK (tier IN (1, 2));

COMMENT ON COLUMN redemptions.tier IS 'Reward tier: 1 for first reward, 2 for second reward';
