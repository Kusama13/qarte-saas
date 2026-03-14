-- Add bio field to merchants
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;
