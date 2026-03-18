-- Social links on customers for easy contact via planning
ALTER TABLE customers
  ADD COLUMN instagram_handle TEXT NULL,
  ADD COLUMN tiktok_handle TEXT NULL,
  ADD COLUMN facebook_url TEXT NULL;
