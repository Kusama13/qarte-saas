-- ============================================
-- MIGRATION 039: Fix schema drift — add columns missing from migrations
--
-- These columns exist in production (added manually or via dashboard)
-- but are not tracked in any migration file.
-- This prevents `supabase db reset` from working correctly.
-- ============================================

-- 1. customers.merchant_id — used in admin pages and types
-- Customers are linked to merchants via loyalty_cards, but a direct
-- merchant_id on customers is used for admin filtering and RLS policies.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_customers_merchant ON customers(merchant_id);

-- 2. loyalty_cards.rewards_earned — used in morning cron for first-reward and digest emails
-- Tracks how many times a customer has redeemed rewards on this card.
ALTER TABLE loyalty_cards ADD COLUMN IF NOT EXISTS rewards_earned INTEGER DEFAULT 0;
