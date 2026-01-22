-- Add loyalty mode columns to merchants table
-- Run this migration in your Supabase SQL Editor

-- Add loyalty_mode column (visit or article)
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS loyalty_mode TEXT DEFAULT 'visit'
CHECK (loyalty_mode IN ('visit', 'article'));

-- Add product_name for article mode (e.g., "Pizza", "Café")
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- Add max_quantity_per_scan for article mode
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS max_quantity_per_scan INTEGER DEFAULT 1
CHECK (max_quantity_per_scan >= 1 AND max_quantity_per_scan <= 10);

-- Add review_link for Google/TripAdvisor reviews
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS review_link TEXT;

-- Add points_earned to visits table to track how many points were earned per visit
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 1;

-- Add stamps_target to loyalty_cards for grandfathering (when merchant increases stamps_required)
ALTER TABLE loyalty_cards
ADD COLUMN IF NOT EXISTS stamps_target INTEGER;

-- Comment explaining the columns
COMMENT ON COLUMN merchants.loyalty_mode IS 'Type of loyalty program: visit (1 visit = 1 point) or article (X items = X points)';
COMMENT ON COLUMN merchants.product_name IS 'Name of the product for article mode (e.g., Pizza, Café)';
COMMENT ON COLUMN merchants.max_quantity_per_scan IS 'Maximum items that can be added per scan in article mode';
COMMENT ON COLUMN merchants.review_link IS 'Link to Google/TripAdvisor review page';
COMMENT ON COLUMN visits.points_earned IS 'Number of points earned for this visit (1 for visit mode, X for article mode)';
COMMENT ON COLUMN loyalty_cards.stamps_target IS 'Individual target for this card (for grandfathering when merchant increases stamps_required)';
