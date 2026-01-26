-- Add PWA-exclusive offer field
-- This is a permanent offer shown only to customers who install the PWA
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS pwa_offer_text text;

COMMENT ON COLUMN merchants.pwa_offer_text IS 'Permanent offer text shown only to PWA users (e.g., "Un café offert")';
