-- Allow clients to cancel/reschedule their own bookings
ALTER TABLE merchants
  ADD COLUMN allow_customer_cancel BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN allow_customer_reschedule BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN customer_edit_deadline_days INTEGER NOT NULL DEFAULT 1;
-- deadline_days: client can cancel/reschedule up to N days before the appointment
-- 0 = same day, 1 = day before, 2 = 2 days before, etc.
-- The 2 toggles are independent: merchant can allow cancel without reschedule, or both
