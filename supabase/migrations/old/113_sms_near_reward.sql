-- 113_sms_near_reward.sql
-- Auto SMS "Plus qu'un tampon" : relance les clients à 1 tampon de leur récompense
-- (palier 1 ou palier 2) après un délai d'au moins 15 jours depuis leur dernière visite.

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS near_reward_sms_enabled BOOLEAN NOT NULL DEFAULT false;

-- Étend la CHECK sur sms_logs.sms_type avec le nouveau type 'near_reward'.
ALTER TABLE sms_logs DROP CONSTRAINT IF EXISTS sms_logs_sms_type_check;
ALTER TABLE sms_logs ADD CONSTRAINT sms_logs_sms_type_check CHECK (
  sms_type IN (
    'reminder_j1',
    'reminder_j0',
    'confirmation_no_deposit',
    'confirmation_deposit',
    'birthday',
    'referral_reward',
    'booking_moved',
    'booking_cancelled',
    'campaign',
    'welcome',
    'review_request',
    'voucher_expiry',
    'referral_invite',
    'inactive_reminder',
    'near_reward'
  )
);
