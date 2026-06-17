-- Migration 177 — RDV de suivi récurrents (+3/+6 sem.) avec acompte différé
--
-- À la fin d'une réservation en ligne, la vitrine propose jusqu'à 2 RDV de suivi
-- (calendrier ouvert sur +3 sem., la cliente ajuste). Ces RDV sont réservés SANS
-- acompte immédiat : un rappel email + SMS part 7 jours avant pour régler l'acompte,
-- reporter ou annuler. Si l'acompte n'est pas réglé, le créneau est libéré par le cron
-- existant (deposit-expiration) une fois la deadline posée au J-7 (= RDV − délai
-- d'annulation merchant).
--
-- On distingue ces slots "acompte différé" d'un acompte normal sans deadline via
-- un flag dédié, pour que :
--   - le cron de libération 15 min ne touche pas le slot tant que la deadline est NULL,
--   - le cron de rappel J-7 cible précisément ces slots.

-- 1. Toggle merchant (réglage agenda)
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS recurring_followup_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN merchants.recurring_followup_enabled IS
  'mig 177. Si true, la vitrine propose jusqu''à 2 RDV de suivi (+3/+6 sem.) à la fin d''une réservation en ligne, sans acompte immédiat (rappel acompte 7 jours avant).';

-- 2. Slots : acompte différé + dédup du rappel J-7
ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS deposit_deferred BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS deposit_reminder_sent_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN merchant_planning_slots.deposit_deferred IS
  'mig 177. true = RDV de suivi dont l''acompte est différé (rappel J-7). Mis à true seulement si un acompte s''applique. deposit_deadline_at reste NULL jusqu''au rappel J-7, puis = RDV − cancel_deadline_days (le cron deposit-expiration libère ensuite). Distingue d''un acompte normal sans deadline.';

COMMENT ON COLUMN merchant_planning_slots.deposit_reminder_sent_at IS
  'mig 177. Horodatage du rappel acompte J-7 (email + SMS posés ensemble). NULL = pas encore envoyé. Remis à NULL si le RDV différé est déplacé (le rappel se re-déclenche sur la nouvelle date).';

-- Index partiel pour le scan du cron J-7 (rappel acompte différé)
CREATE INDEX IF NOT EXISTS idx_planning_slots_deferred_reminder
  ON merchant_planning_slots (slot_date)
  WHERE deposit_deferred = true
    AND deposit_confirmed = false
    AND deposit_reminder_sent_at IS NULL
    AND primary_slot_id IS NULL;

-- 3. CHECK sms_logs.sms_type : ajout du type 'deposit_reminder'
-- Pattern lock-friendly : DROP + ADD NOT VALID puis VALIDATE séparé (cf. mig 154).
ALTER TABLE sms_logs DROP CONSTRAINT IF EXISTS sms_logs_sms_type_check;

ALTER TABLE sms_logs ADD CONSTRAINT sms_logs_sms_type_check
  CHECK (sms_type IN (
    'reminder_j1',
    'reminder_j0',
    'confirmation_no_deposit',
    'confirmation_deposit',
    'deposit_request',
    'deposit_reminder',
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
