-- Migration 090: Deuxieme lien d'acompte + labels
-- Contexte : le merchant peut configurer 2 moyens de paiement (ex: Revolut + PayPal)
-- affiches en liste de choix au client sur la modal de reservation publique.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS deposit_link_label TEXT,
  ADD COLUMN IF NOT EXISTS deposit_link_2 TEXT,
  ADD COLUMN IF NOT EXISTS deposit_link_2_label TEXT;
