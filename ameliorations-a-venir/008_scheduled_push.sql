-- Scheduled push notifications
CREATE TABLE IF NOT EXISTS scheduled_push (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

    -- Message content
    title TEXT NOT NULL,
    body TEXT NOT NULL,

    -- Targeting
    filter_type TEXT DEFAULT 'all',
    customer_ids UUID[] DEFAULT NULL,

    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'

    -- Results (filled after sending)
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Only one pending scheduled message per merchant
    CONSTRAINT one_pending_per_merchant UNIQUE (merchant_id, status)
        WHERE (status = 'pending')
);

-- Index for cron job to find messages to send
CREATE INDEX IF NOT EXISTS idx_scheduled_push_pending ON scheduled_push(scheduled_for, status)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_push_merchant ON scheduled_push(merchant_id);

-- RLS
ALTER TABLE scheduled_push ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own scheduled" ON scheduled_push
    FOR SELECT USING (merchant_id = auth.uid()::uuid);

CREATE POLICY "Merchants can insert own scheduled" ON scheduled_push
    FOR INSERT WITH CHECK (merchant_id = auth.uid()::uuid);

CREATE POLICY "Merchants can update own scheduled" ON scheduled_push
    FOR UPDATE USING (merchant_id = auth.uid()::uuid);

CREATE POLICY "Service role full access scheduled" ON scheduled_push
    FOR ALL USING (true);
