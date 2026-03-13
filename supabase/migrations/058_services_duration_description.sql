-- Add duration (minutes), description, and price_from toggle to merchant_services
ALTER TABLE merchant_services
  ADD COLUMN duration integer DEFAULT NULL,
  ADD COLUMN description text DEFAULT NULL,
  ADD COLUMN price_from boolean NOT NULL DEFAULT false;
