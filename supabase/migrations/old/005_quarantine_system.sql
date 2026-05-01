-- Qarte Shield: Anti-Fraud Quarantine System
-- Run this migration in your Supabase SQL Editor

-- ============================================
-- ADD QUARANTINE COLUMNS TO VISITS TABLE
-- ============================================

-- Status column for quarantine tracking
ALTER TABLE visits ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed'
  CHECK (status IN ('confirmed', 'pending', 'rejected'));

-- Reason for flagging (auto-detected)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS flagged_reason TEXT;

-- Hashed IP for GDPR compliance (SHA256)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS ip_hash TEXT;

-- Points earned (for article mode)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 1;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for merchant moderation queries (pending visits)
CREATE INDEX IF NOT EXISTS idx_visits_merchant_status
ON visits(merchant_id, status)
WHERE status = 'pending';

-- Index for daily scan counting
CREATE INDEX IF NOT EXISTS idx_visits_daily_count
ON visits(customer_id, merchant_id, visited_at);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_visits_status
ON visits(status);

-- ============================================
-- EMAIL TRACKING TABLE FOR REMINDERS
-- ============================================

CREATE TABLE IF NOT EXISTS pending_email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  reminder_day INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  pending_count INTEGER NOT NULL,
  UNIQUE(merchant_id, reminder_day)
);

-- Index for checking if reminder was already sent
CREATE INDEX IF NOT EXISTS idx_pending_email_merchant_day
ON pending_email_tracking(merchant_id, reminder_day);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN visits.status IS 'Quarantine status: confirmed (validated), pending (awaiting merchant review), rejected (fraud suspected)';
COMMENT ON COLUMN visits.flagged_reason IS 'Auto-detected reason for quarantine (e.g., "2ème passage ce jour")';
COMMENT ON COLUMN visits.ip_hash IS 'SHA256 hash of client IP for GDPR-compliant fraud detection';
COMMENT ON COLUMN visits.points_earned IS 'Number of points/stamps earned in this visit (for article mode)';
COMMENT ON TABLE pending_email_tracking IS 'Tracks reminder emails sent to merchants about pending visits';
COMMENT ON COLUMN pending_email_tracking.reminder_day IS 'Days since first pending visit when this email was sent (0, 1, 2, or 3)';
