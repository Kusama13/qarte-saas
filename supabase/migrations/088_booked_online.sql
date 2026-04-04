-- Add booked_online flag to distinguish online vs manual bookings
ALTER TABLE merchant_planning_slots ADD COLUMN IF NOT EXISTS booked_online BOOLEAN DEFAULT false;
