-- Push notification history table
CREATE TABLE IF NOT EXISTS push_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    filter_type TEXT DEFAULT 'all',
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups by merchant
CREATE INDEX IF NOT EXISTS idx_push_history_merchant ON push_history(merchant_id);
CREATE INDEX IF NOT EXISTS idx_push_history_created ON push_history(created_at DESC);

-- RLS policies
ALTER TABLE push_history ENABLE ROW LEVEL SECURITY;

-- Merchants can view their own push history
CREATE POLICY "Merchants can view own push history" ON push_history
    FOR SELECT USING (merchant_id = auth.uid()::uuid);

-- Service role can insert (used by API)
CREATE POLICY "Service role can insert push history" ON push_history
    FOR INSERT WITH CHECK (true);
