-- Student offer: permanent discount for students
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS student_offer_enabled BOOLEAN DEFAULT false;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS student_offer_description TEXT;
