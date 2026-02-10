-- 033: Add referral code to merchants for merchant-to-merchant referral program
-- Each merchant gets a unique QARTE-XXXX code to share with other merchants

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10) UNIQUE;

-- Backfill existing merchants with unique codes
UPDATE merchants SET referral_code = 'QARTE-' || UPPER(SUBSTRING(md5(random()::text || id::text) FROM 1 FOR 4))
WHERE referral_code IS NULL;

ALTER TABLE merchants ALTER COLUMN referral_code SET NOT NULL;
