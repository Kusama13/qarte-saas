-- Migration 135 — Masquer l'adresse sur la vitrine publique
--
-- Contexte : pour les marchandes en service à domicile, leur shop_address
-- est leur domicile personnel. On ne veut pas l'afficher sur la page publique
-- (vitrine /p/[slug]). L'adresse reste stockée pour le calcul du trajet, mais
-- masquée côté client. Toggle indépendant pour laisser le contrôle au merchant.
--
-- Par défaut FALSE (rétro-compat : les comptes existants continuent d'afficher
-- leur adresse). À l'activation du mode service à domicile, la UI proposera
-- d'activer ce flag par défaut.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS hide_address_on_public_page BOOLEAN NOT NULL DEFAULT FALSE;
