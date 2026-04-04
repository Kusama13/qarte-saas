-- Add booked_online flag + booked_at timestamp to track bookings
ALTER TABLE merchant_planning_slots ADD COLUMN IF NOT EXISTS booked_online BOOLEAN DEFAULT false;
ALTER TABLE merchant_planning_slots ADD COLUMN IF NOT EXISTS booked_at TIMESTAMPTZ;
