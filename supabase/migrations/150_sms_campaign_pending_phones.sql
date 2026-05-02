-- Migration 150 — sms_campaigns.pending_phones JSONB
--
-- Quand le solde OVH est epuise en cours de dispatch (HTTP 402), on stocke
-- les numeros qui n'ont pas pu etre envoyes pour reprendre l'envoi des que le
-- solde est recharge (re-schedule auto a +1h ou trigger manuel).
--
-- Format : ["33612345678", "33687654321", ...] — phones E.164 sans le `+`.
-- Vide ou null = aucun envoi pendant.

ALTER TABLE sms_campaigns
  ADD COLUMN IF NOT EXISTS pending_phones JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN sms_campaigns.pending_phones IS
  'Phones non envoyes apres echec du dispatch (typiquement credit OVH epuise). '
  'Le prochain dispatch utilise cette liste au lieu de re-resoudre l audience '
  'pour eviter de re-envoyer aux destinataires deja servis. Vide une fois '
  'l envoi termine.';
