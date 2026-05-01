-- Add merchant offers fields
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS offer_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS offer_title text,
ADD COLUMN IF NOT EXISTS offer_description text,
ADD COLUMN IF NOT EXISTS offer_image_url text,
ADD COLUMN IF NOT EXISTS offer_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS offer_duration_days integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS offer_created_at timestamp with time zone;

-- Add constraint for duration (1-3 days)
ALTER TABLE merchants
ADD CONSTRAINT offer_duration_days_check CHECK (offer_duration_days IS NULL OR (offer_duration_days >= 1 AND offer_duration_days <= 3));

-- Comment on columns
COMMENT ON COLUMN merchants.offer_active IS 'Whether the current offer is active';
COMMENT ON COLUMN merchants.offer_title IS 'Short title for the offer notification';
COMMENT ON COLUMN merchants.offer_description IS 'Detailed description of the offer (shown to customers)';
COMMENT ON COLUMN merchants.offer_image_url IS 'Optional image URL for the offer';
COMMENT ON COLUMN merchants.offer_expires_at IS 'When the offer expires';
COMMENT ON COLUMN merchants.offer_duration_days IS 'Offer duration in days (1-3)';
COMMENT ON COLUMN merchants.offer_created_at IS 'When the offer was created';
