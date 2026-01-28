-- Fix: Allow merchant deletion by setting prospect reference to NULL
ALTER TABLE prospects
DROP CONSTRAINT IF EXISTS prospects_converted_merchant_id_fkey;

ALTER TABLE prospects
ADD CONSTRAINT prospects_converted_merchant_id_fkey
FOREIGN KEY (converted_merchant_id)
REFERENCES merchants(id)
ON DELETE SET NULL;
