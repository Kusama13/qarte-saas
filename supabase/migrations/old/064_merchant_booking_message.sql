-- Migration 064: Add booking_message (comment réserver) + planning_message_expires (expiration message public) to merchants
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS booking_message TEXT DEFAULT NULL;        -- ex: "DM Instagram", "Appelle au 06..."
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS planning_message_expires DATE DEFAULT NULL; -- date après laquelle le message public disparaît
