-- Auto booking: let clients book directly from the public page
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS auto_booking_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposit_link TEXT,
  ADD COLUMN IF NOT EXISTS deposit_percent INTEGER,
  ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS deposit_message TEXT;

-- Deposit confirmation tracking on planning slots
-- NULL = no deposit required, false = pending, true = confirmed
ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS deposit_confirmed BOOLEAN DEFAULT NULL;
