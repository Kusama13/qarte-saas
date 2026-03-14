-- Add opening hours JSON field to merchants
-- Format: {"1":{"open":"09:00","close":"18:00"},"2":null,...} (1=lundi, 7=dimanche, null=ferme)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT NULL;
