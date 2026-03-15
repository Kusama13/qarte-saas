-- Track where merchants signed up from (demo, landing section, direct, etc.)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS signup_source text;
