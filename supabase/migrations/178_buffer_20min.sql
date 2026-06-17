-- Migration 178 — Tampon (pause entre RDV) : ajout du 20 min, masquage du 30 min
--
-- Le réglage agenda propose désormais 0 / 10 / 15 / 20 min (le 20 remplace le 30
-- dans l'UI). On garde 30 valide en base pour ne pas casser les merchants déjà
-- réglés dessus (grandfathering) — il est juste masqué de la liste de sélection.

ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_buffer_minutes_check;

ALTER TABLE merchants ADD CONSTRAINT merchants_buffer_minutes_check
  CHECK (buffer_minutes IN (0, 10, 15, 20, 30));
