-- Track which "superpower" merchants choose first on the welcome page
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS first_feature_choice text;
-- Values: 'loyalty' | 'vitrine' | NULL (not yet chosen / skipped)
