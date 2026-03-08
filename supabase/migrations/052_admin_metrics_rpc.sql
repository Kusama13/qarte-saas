-- =============================================
-- Migration 052: RPC functions for admin metrics
-- Replaces unbounded client-side queries with
-- efficient server-side aggregations
-- =============================================

-- 1. First visit date per merchant (for activation rate + funnel)
CREATE OR REPLACE FUNCTION get_first_visit_per_merchant()
RETURNS TABLE(merchant_id uuid, first_visit_date timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT v.merchant_id, MIN(v.visited_at) AS first_visit_date
  FROM visits v
  GROUP BY v.merchant_id;
$$;

-- 2. Date of the 10th loyalty card per merchant (for "avg time to 10 customers")
CREATE OR REPLACE FUNCTION get_tenth_card_date_per_merchant()
RETURNS TABLE(merchant_id uuid, tenth_card_date timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT merchant_id, created_at AS tenth_card_date
  FROM (
    SELECT merchant_id, created_at,
           ROW_NUMBER() OVER (PARTITION BY merchant_id ORDER BY created_at ASC) AS rn
    FROM loyalty_cards
  ) sub
  WHERE rn = 10;
$$;

-- 3. Loyalty card count per merchant (for customer counts in admin list + top merchants)
CREATE OR REPLACE FUNCTION get_loyalty_card_counts_per_merchant()
RETURNS TABLE(merchant_id uuid, card_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT merchant_id, COUNT(*) AS card_count
  FROM loyalty_cards
  GROUP BY merchant_id;
$$;
