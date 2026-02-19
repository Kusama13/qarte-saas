-- Add optional link_url column to admin_announcements
ALTER TABLE admin_announcements ADD COLUMN IF NOT EXISTS link_url TEXT;
