-- Push automations settings per merchant
CREATE TABLE IF NOT EXISTS push_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,

    -- Automation toggles
    welcome_enabled BOOLEAN DEFAULT false,
    close_to_reward_enabled BOOLEAN DEFAULT false,
    reward_ready_enabled BOOLEAN DEFAULT false,
    inactive_reminder_enabled BOOLEAN DEFAULT false,
    reward_reminder_enabled BOOLEAN DEFAULT false,

    -- Stats
    welcome_sent INTEGER DEFAULT 0,
    close_to_reward_sent INTEGER DEFAULT 0,
    reward_ready_sent INTEGER DEFAULT 0,
    inactive_reminder_sent INTEGER DEFAULT 0,
    reward_reminder_sent INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(merchant_id)
);

-- Logs to track what was sent to avoid duplicates
CREATE TABLE IF NOT EXISTS push_automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    automation_type TEXT NOT NULL, -- 'welcome', 'close_to_reward', 'reward_ready', 'inactive_reminder', 'reward_reminder'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint to prevent duplicate sends for same automation type
    -- For daily automations, we'll check the date in code
    UNIQUE(merchant_id, customer_id, automation_type, sent_at::date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_automations_merchant ON push_automations(merchant_id);
CREATE INDEX IF NOT EXISTS idx_push_automation_logs_lookup ON push_automation_logs(merchant_id, customer_id, automation_type);
CREATE INDEX IF NOT EXISTS idx_push_automation_logs_sent ON push_automation_logs(sent_at);

-- RLS
ALTER TABLE push_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_automation_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Merchants can view own automations" ON push_automations
    FOR SELECT USING (merchant_id = auth.uid()::uuid);

CREATE POLICY "Merchants can update own automations" ON push_automations
    FOR UPDATE USING (merchant_id = auth.uid()::uuid);

CREATE POLICY "Service role full access automations" ON push_automations
    FOR ALL USING (true);

CREATE POLICY "Service role full access logs" ON push_automation_logs
    FOR ALL USING (true);
