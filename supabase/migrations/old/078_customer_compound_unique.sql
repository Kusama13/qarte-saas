-- Replace global UNIQUE(phone_number) with compound UNIQUE(phone_number, merchant_id)
-- This allows the same phone number across different merchants (multi-tenant)

-- Drop old global unique constraint (from migration 001)
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_phone_number_key;

-- Drop old global unique index if it exists
DROP INDEX IF EXISTS customers_phone_number_key;

-- Add compound unique constraint (per-merchant uniqueness)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_customer_per_merchant'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT unique_customer_per_merchant
      UNIQUE(phone_number, merchant_id);
  END IF;
END $$;
