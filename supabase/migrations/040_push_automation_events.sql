-- Add events automation columns to push_automations
ALTER TABLE push_automations
  ADD COLUMN IF NOT EXISTS events_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS events_offer_text TEXT,
  ADD COLUMN IF NOT EXISTS events_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inactive_reminder_offer_text TEXT;
