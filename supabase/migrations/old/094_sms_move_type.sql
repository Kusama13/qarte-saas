-- Add move SMS type
ALTER TABLE sms_logs DROP CONSTRAINT IF EXISTS sms_logs_sms_type_check;
ALTER TABLE sms_logs ADD CONSTRAINT sms_logs_sms_type_check
  CHECK (sms_type IN ('reminder_j1', 'confirmation_no_deposit', 'confirmation_deposit', 'birthday', 'referral_reward', 'booking_moved'));
