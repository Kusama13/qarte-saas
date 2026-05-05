-- 154 — SMS type "deposit_request" + cleanup gift_card_expiry_reminder
--
-- Source de vérité du union type : src/lib/sms.ts (export type SmsType)
--
-- Ajoute un type SMS transactionnel envoyé quand le merchant ramène une
-- réservation depuis l'archive d'acomptes échoués via "Relancer l'acompte"
-- (BringBackBookingModal). Le SMS inclut le lien de paiement merchant.deposit_link
-- pour que la cliente puisse régler en un clic — corrige un bug où on envoyait
-- juste un confirmation_no_deposit sans lien (cf. promesse UI vs implémentation).
--
-- Au passage, ajoute gift_card_expiry_reminder qui était utilisé dans le code
-- (cron gift-cards-expire, mig 146) sans être présent dans le CHECK — tout SMS
-- de ce type aurait planté à l'INSERT.
--
-- Pattern lock-friendly : DROP + ADD NOT VALID (métadonnées seules, pas de scan)
-- puis VALIDATE séparé (SHARE UPDATE EXCLUSIVE, autorise les writes pendant le scan).
-- Évite ACCESS EXCLUSIVE prolongé sur sms_logs (table à fort débit d'écriture).

ALTER TABLE sms_logs DROP CONSTRAINT IF EXISTS sms_logs_sms_type_check;

ALTER TABLE sms_logs ADD CONSTRAINT sms_logs_sms_type_check
  CHECK (sms_type IN (
    'reminder_j1',
    'reminder_j0',
    'confirmation_no_deposit',
    'confirmation_deposit',
    'deposit_request',
    'birthday',
    'referral_reward',
    'booking_moved',
    'booking_cancelled',
    'gift_card_received',
    'gift_card_used',
    'gift_card_expiry_reminder',
    -- Marketing types existants conservés
    'campaign',
    'welcome',
    'review_request',
    'voucher_expiry',
    'referral_invite',
    'inactive_reminder',
    'near_reward'
  )) NOT VALID;

ALTER TABLE sms_logs VALIDATE CONSTRAINT sms_logs_sms_type_check;
