-- Duo offer: merchant can offer a discount when a client comes with a friend
ALTER TABLE merchants
ADD COLUMN duo_offer_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN duo_offer_description TEXT;
