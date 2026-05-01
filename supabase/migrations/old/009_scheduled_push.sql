-- Table for scheduled push notifications
CREATE TABLE IF NOT EXISTS scheduled_push (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_time VARCHAR(5) NOT NULL CHECK (scheduled_time IN ('10:00', '18:00')),
  scheduled_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Only one scheduled push per merchant per time slot per day
  UNIQUE(merchant_id, scheduled_time, scheduled_date)
);

-- Index for efficient cron queries
CREATE INDEX idx_scheduled_push_pending ON scheduled_push(scheduled_date, scheduled_time, status)
  WHERE status = 'pending';

-- Enable RLS
ALTER TABLE scheduled_push ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Merchants can view their own scheduled push"
  ON scheduled_push FOR SELECT
  USING (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Merchants can insert their own scheduled push"
  ON scheduled_push FOR INSERT
  WITH CHECK (merchant_id IN (
    SELECT id FROM merchants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Merchants can delete their own pending scheduled push"
  ON scheduled_push FOR DELETE
  USING (
    merchant_id IN (SELECT id FROM merchants WHERE user_id = auth.uid())
    AND status = 'pending'
  );
