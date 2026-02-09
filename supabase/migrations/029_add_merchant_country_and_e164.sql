-- Add country column to merchants (default FR for existing merchants)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS country VARCHAR(2) NOT NULL DEFAULT 'FR';
CREATE INDEX IF NOT EXISTS idx_merchants_country ON merchants(country);

-- Migrate French phone numbers from local format (0XXXXXXXXX) to E.164 (33XXXXXXXXX)
UPDATE merchants SET phone = '33' || SUBSTRING(phone FROM 2)
WHERE phone LIKE '0%' AND LENGTH(phone) = 10;

UPDATE customers SET phone_number = '33' || SUBSTRING(phone_number FROM 2)
WHERE phone_number LIKE '0%' AND LENGTH(phone_number) = 10;
