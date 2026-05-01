-- Migration 148 — Optional customer email for booking confirmations
--
-- Two columns:
--   - customers.email: last known email per (customer, merchant). Modifiable from
--     /customer/card/[merchantId]. No unique constraint (same email may be reused
--     across merchants by the same person; we don't dedupe identity globally).
--   - merchant_planning_slots.customer_email: snapshot at booking time, used to
--     deliver the confirmation email even if the customer later updates their
--     account email. Avoids retro-sending wrong addresses.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS email TEXT
    CHECK (email IS NULL OR (length(email) <= 254 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'));

ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS customer_email TEXT
    CHECK (customer_email IS NULL OR (length(customer_email) <= 254 AND customer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'));
