-- Split customer_edit_deadline_days into separate deadlines for cancel and reschedule
ALTER TABLE merchants
  ADD COLUMN cancel_deadline_days INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN reschedule_deadline_days INTEGER NOT NULL DEFAULT 1;

-- Migrate existing data
UPDATE merchants SET
  cancel_deadline_days = customer_edit_deadline_days,
  reschedule_deadline_days = customer_edit_deadline_days;

-- Drop the old column
ALTER TABLE merchants DROP COLUMN customer_edit_deadline_days;
