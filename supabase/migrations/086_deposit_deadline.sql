-- 086_deposit_deadline.sql
-- Deposit deadline: auto-release slot if deposit not confirmed within deadline

-- Deadline per slot (computed at booking time)
ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS deposit_deadline_at TIMESTAMPTZ;

-- Merchant config: deadline in hours (default 48h)
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS deposit_deadline_hours INTEGER;
