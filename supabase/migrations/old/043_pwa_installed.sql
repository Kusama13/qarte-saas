-- Track when merchants install the PWA dashboard app
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS pwa_installed_at TIMESTAMPTZ DEFAULT NULL;
