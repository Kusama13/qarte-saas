-- Migration 109: Add structured benefits to member_programs
-- discount_percent: structured discount (5/10/15/20%)
-- skip_deposit: exempt from deposit during booking

ALTER TABLE member_programs ADD COLUMN discount_percent INTEGER NULL
  CHECK (discount_percent IN (5, 10, 15, 20));

ALTER TABLE member_programs ADD COLUMN skip_deposit BOOLEAN DEFAULT false NOT NULL;
