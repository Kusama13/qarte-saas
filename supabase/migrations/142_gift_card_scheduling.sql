-- 142 — gift cards : envoi planifié au destinataire
--
-- L'offreur peut choisir une date d'envoi future (ex : Noël, anniversaire).
-- Si scheduled_send_at est NULL → SMS+email destinataire envoyés dès la
-- validation du paiement par le merchant. Sinon → on attend que la date
-- arrive (cron horaire /api/cron/gift-cards-deliver).
--
-- notified_at : timestamp d'envoi effectif (anti-double-envoi par le cron).
--
-- L'email + PDF de l'offreur eux sont toujours envoyés immédiatement à la
-- validation : c'est lui qui paie, il a besoin du retour. Seule la
-- notification destinataire est différée.

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

COMMENT ON COLUMN gift_cards.scheduled_send_at IS
  'Date à laquelle envoyer SMS+email au destinataire. NULL = envoi immédiat à validation.';
COMMENT ON COLUMN gift_cards.notified_at IS
  'Quand le SMS+email destinataire a été effectivement envoyé. Anti-double-envoi par le cron.';

-- Cron lookup : bons actifs à envoyer (scheduled échue + non encore notifiés)
CREATE INDEX IF NOT EXISTS idx_gift_cards_pending_delivery
  ON gift_cards(scheduled_send_at)
  WHERE status = 'active' AND notified_at IS NULL AND scheduled_send_at IS NOT NULL;
