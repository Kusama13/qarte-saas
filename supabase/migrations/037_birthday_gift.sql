-- 037: Birthday gift feature — customer birthday, merchant config, voucher source tracking

-- ============================================
-- 1. Add birthday fields to customers
-- ============================================
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_month INTEGER CHECK (birth_month >= 1 AND birth_month <= 12);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_day INTEGER CHECK (birth_day >= 1 AND birth_day <= 31);
CREATE INDEX IF NOT EXISTS idx_customers_birthday ON customers(birth_month, birth_day);

-- ============================================
-- 2. Add birthday gift config to merchants
-- ============================================
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS birthday_gift_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS birthday_gift_description TEXT;

-- ============================================
-- 3. Add source field to vouchers for type tracking
-- ============================================
ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS source TEXT CHECK (source IN ('birthday', 'referral', 'redemption'));
CREATE INDEX IF NOT EXISTS idx_vouchers_source_customer ON vouchers(customer_id, source, created_at) WHERE source = 'birthday';
