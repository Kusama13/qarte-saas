-- 115_sms_events_automation.sql
-- Auto SMS "Événements" (Saint-Valentin, Noël, etc.) — envoi J-7 avant l'évènement.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS events_sms_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS events_sms_offer_text TEXT,
  ADD COLUMN IF NOT EXISTS events_sms_last_event_id TEXT;

-- Idempotency trail: we record the last event_id for which we sent SMS to this merchant.
-- Combined with the date, prevents re-sending for the same event in a year.
