-- 139 — SMS types pour bons cadeaux
--
-- Ajout de 2 types SMS transactionnels liés au système gift cards (mig 138) :
--
--   • gift_card_received — envoyé au destinataire à la confirmation du paiement
--     "🎁 [Offreur] vous offre un bon cadeau de 50€ chez [Salon]…"
--
--   • gift_card_used — envoyé à l'offreur quand le destinataire consomme le bon
--     "💜 [Destinataire] vient d'utiliser le bon que vous avez offert chez [Salon]…"
--
-- Les 2 sont systématiques (pas de toggle merchant), envoyés via le système
-- transactionnel existant (routage SMS Partner FR/BE / OVH CH, quota merchant).

ALTER TABLE sms_logs DROP CONSTRAINT IF EXISTS sms_logs_sms_type_check;

ALTER TABLE sms_logs ADD CONSTRAINT sms_logs_sms_type_check
  CHECK (sms_type IN (
    'reminder_j1',
    'reminder_j0',
    'confirmation_no_deposit',
    'confirmation_deposit',
    'birthday',
    'referral_reward',
    'booking_moved',
    'booking_cancelled',
    'gift_card_received',
    'gift_card_used',
    -- Marketing types existants conservés
    'campaign',
    'welcome',
    'review_request',
    'voucher_expiry',
    'referral_invite',
    'inactive_reminder',
    'near_reward'
  ));
