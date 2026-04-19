-- Drop dead column : first_feature_choice never written by any code path
-- (mig 070 added it but the onboarding "loyalty vs vitrine" choice was never implemented).

ALTER TABLE merchants DROP COLUMN IF EXISTS first_feature_choice;
