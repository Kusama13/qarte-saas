-- Add last_seen_at column to track merchant activity
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_merchants_last_seen_at ON merchants(last_seen_at);
