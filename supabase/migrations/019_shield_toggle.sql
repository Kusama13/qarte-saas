-- Qarte Shield Toggle
-- Allows merchants to enable/disable the anti-fraud quarantine system

-- Add shield_enabled column to merchants table (enabled by default)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS shield_enabled BOOLEAN DEFAULT TRUE;

-- Comment
COMMENT ON COLUMN merchants.shield_enabled IS 'Enable/disable Qarte Shield anti-fraud system. When disabled, all visits are confirmed immediately without quarantine.';
