-- Fix #2: Atomic counter increment for push automation stats
CREATE OR REPLACE FUNCTION increment_push_automation_stat(
  p_merchant_id UUID,
  p_stat_column TEXT
) RETURNS VOID AS $$
BEGIN
  IF p_stat_column = 'inactive_reminder_sent' THEN
    UPDATE push_automations SET inactive_reminder_sent = COALESCE(inactive_reminder_sent, 0) + 1 WHERE merchant_id = p_merchant_id;
  ELSIF p_stat_column = 'reward_reminder_sent' THEN
    UPDATE push_automations SET reward_reminder_sent = COALESCE(reward_reminder_sent, 0) + 1 WHERE merchant_id = p_merchant_id;
  ELSIF p_stat_column = 'events_sent' THEN
    UPDATE push_automations SET events_sent = COALESCE(events_sent, 0) + 1 WHERE merchant_id = p_merchant_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix #7: Missing indexes on visits.customer_id and referrals foreign keys
CREATE INDEX IF NOT EXISTS idx_visits_customer_id ON visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_customer ON referrals(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_customer ON referrals(referred_customer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_card ON referrals(referrer_card_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_card ON referrals(referred_card_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_voucher ON referrals(referrer_voucher_id);

-- Fix #8: Drop broken RLS policies referencing non-existent merchants.is_admin column
-- These were created in migrations 021/022 but is_admin column was never added.
-- Migration 023 added proper "Service role access" policies that actually work.
DROP POLICY IF EXISTS "Admins can read expenses" ON admin_expenses;
DROP POLICY IF EXISTS "Admins can insert expenses" ON admin_expenses;
DROP POLICY IF EXISTS "Admins can delete expenses" ON admin_expenses;
DROP POLICY IF EXISTS "Admins can read fixed costs" ON admin_fixed_costs;
DROP POLICY IF EXISTS "Admins can insert fixed costs" ON admin_fixed_costs;
DROP POLICY IF EXISTS "Admins can update fixed costs" ON admin_fixed_costs;
DROP POLICY IF EXISTS "Admins can delete fixed costs" ON admin_fixed_costs;
