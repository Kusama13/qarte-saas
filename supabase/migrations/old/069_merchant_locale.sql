-- Add locale column to merchants for i18n support
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'fr';
