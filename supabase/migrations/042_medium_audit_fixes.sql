-- Fix #33: Phone number format validation (E.164 without +)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'customers_phone_format'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_phone_format
      CHECK (phone_number ~ '^\d{9,15}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'merchants_phone_format'
  ) THEN
    ALTER TABLE merchants ADD CONSTRAINT merchants_phone_format
      CHECK (phone ~ '^\d{9,15}$');
  END IF;
END;
$$;

-- Fix #35: Auto-update updated_at on push_automations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_push_automations_updated_at'
  ) THEN
    CREATE TRIGGER update_push_automations_updated_at
      BEFORE UPDATE ON push_automations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- Fix #36: Index on offer_expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_merchants_offer_expires_at
  ON merchants(offer_expires_at) WHERE offer_active = true;
