-- Add social image URLs to merchants table
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS social_image_square TEXT,
ADD COLUMN IF NOT EXISTS social_image_story TEXT;

-- Create marketing bucket for social images (run manually in Supabase dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('marketing', 'marketing', true);
