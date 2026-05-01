-- Email deliverability: bounce tracking + unsubscribe support
-- Applied via Supabase SQL Editor

-- Bounce tracking: set by Resend webhook when email hard-bounces
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email_bounced_at TIMESTAMPTZ;

-- Unsubscribe: set by one-click unsubscribe endpoint
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email_unsubscribed_at TIMESTAMPTZ;

-- Index for cron queries (filter out bounced/unsubscribed merchants)
CREATE INDEX IF NOT EXISTS idx_merchants_email_bounced ON merchants(email_bounced_at) WHERE email_bounced_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_merchants_email_unsubscribed ON merchants(email_unsubscribed_at) WHERE email_unsubscribed_at IS NOT NULL;

-- RPC function to look up user_id by email (used by Resend bounce webhook)
CREATE OR REPLACE FUNCTION get_user_id_by_email(target_email TEXT)
RETURNS TABLE(id UUID) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id FROM auth.users WHERE email = target_email LIMIT 1;
$$;

