-- Add banned_numbers table for blocking phone numbers per merchant
-- Run this migration in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS banned_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(phone_number, merchant_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_banned_numbers_merchant_phone
ON banned_numbers(merchant_id, phone_number);

-- Comment explaining the table
COMMENT ON TABLE banned_numbers IS 'Stores phone numbers banned by merchants from their loyalty program';
COMMENT ON COLUMN banned_numbers.phone_number IS 'The banned phone number';
COMMENT ON COLUMN banned_numbers.merchant_id IS 'The merchant who banned this number';
COMMENT ON COLUMN banned_numbers.reason IS 'Optional reason for the ban';
