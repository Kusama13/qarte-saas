-- Point adjustments audit table
-- Migration: 002_point_adjustments.sql

CREATE TABLE IF NOT EXISTS point_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_card_id UUID NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    adjustment INTEGER NOT NULL,
    reason TEXT,
    adjusted_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_point_adjustments_loyalty_card ON point_adjustments(loyalty_card_id);
CREATE INDEX IF NOT EXISTS idx_point_adjustments_merchant ON point_adjustments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_point_adjustments_created_at ON point_adjustments(created_at DESC);

-- RLS policies
ALTER TABLE point_adjustments ENABLE ROW LEVEL SECURITY;

-- Merchants can view their own point adjustments
CREATE POLICY "Merchants can view their point adjustments"
    ON point_adjustments
    FOR SELECT
    TO authenticated
    USING (
        merchant_id IN (
            SELECT id FROM merchants WHERE user_id = auth.uid()
        )
    );

-- Merchants can insert point adjustments for their customers
CREATE POLICY "Merchants can insert point adjustments"
    ON point_adjustments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        merchant_id IN (
            SELECT id FROM merchants WHERE user_id = auth.uid()
        )
        AND adjusted_by = auth.uid()
    );
