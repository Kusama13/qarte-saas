-- Fix subscription_status spelling inconsistency
-- TypeScript uses 'canceled' (American) but SQL had 'cancelled' (British)
-- Also add 'canceling' status for subscriptions that will cancel at period end

-- Step 1: Update existing data from 'cancelled' to 'canceled'
UPDATE merchants SET subscription_status = 'canceled' WHERE subscription_status = 'cancelled';

-- Step 2: Drop the old constraint and add the new one
ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_subscription_status_check;
ALTER TABLE merchants ADD CONSTRAINT merchants_subscription_status_check
  CHECK (subscription_status IN ('trial', 'active', 'canceled', 'canceling', 'past_due'));
