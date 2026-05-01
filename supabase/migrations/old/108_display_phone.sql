-- Display phone number (landline or other) shown on public vitrine
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS display_phone TEXT;
