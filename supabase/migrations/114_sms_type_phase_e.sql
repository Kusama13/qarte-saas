-- 114_sms_type_phase_e.sql
-- Phase E SMS automations: J-0 morning reminder (transactional) + welcome + review_request (marketing).

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
    'campaign',
    'welcome',
    'review_request'
  ));
