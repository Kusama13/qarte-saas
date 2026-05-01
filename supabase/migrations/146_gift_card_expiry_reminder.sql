-- 146 — gift cards : rappel SMS J-7 avant expiration
--
-- Ajoute un timestamp pour tracer l'envoi du rappel d'expiration au destinataire.
-- Permet au cron de filtrer les bons qui n'ont pas encore reçu leur rappel.
-- On envoie 1 seul SMS par bon (pas de spam si le cron passe plusieurs fois).

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS expiry_reminder_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN gift_cards.expiry_reminder_sent_at IS
  'Date d''envoi du SMS de rappel J-7 au destinataire. NULL = pas encore envoyé. Posé une seule fois par le cron gift-cards-expire.';

-- Index partiel pour accélérer le scan du cron (uniquement les bons qui n'ont pas reçu leur rappel)
CREATE INDEX IF NOT EXISTS idx_gift_cards_active_no_reminder
  ON gift_cards (expires_at)
  WHERE status = 'active' AND expiry_reminder_sent_at IS NULL;
