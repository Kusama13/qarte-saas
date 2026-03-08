-- =============================================
-- Migration 052: RPC functions for admin metrics
-- Replaces unbounded client-side queries with
-- efficient server-side aggregations
-- All functions require super_admin or service_role
-- =============================================

-- 1. First visit date per merchant (for activation rate + funnel)
CREATE OR REPLACE FUNCTION get_first_visit_per_merchant()
RETURNS TABLE(merchant_id uuid, first_visit_date timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  -- Allow service_role (API routes) or super_admins (browser client)
  IF current_setting('role', true) = 'service_role'
     OR auth.uid() IN (SELECT user_id FROM super_admins) THEN
    RETURN QUERY
      SELECT v.merchant_id, MIN(v.visited_at) AS first_visit_date
      FROM visits v
      GROUP BY v.merchant_id;
  ELSE
    RAISE EXCEPTION 'Accès refusé';
  END IF;
END;
$$;

-- 2. Date of the 10th loyalty card per merchant (for "avg time to 10 customers")
CREATE OR REPLACE FUNCTION get_tenth_card_date_per_merchant()
RETURNS TABLE(merchant_id uuid, tenth_card_date timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR auth.uid() IN (SELECT user_id FROM super_admins) THEN
    RETURN QUERY
      SELECT sub.merchant_id, sub.created_at AS tenth_card_date
      FROM (
        SELECT lc.merchant_id, lc.created_at,
               ROW_NUMBER() OVER (PARTITION BY lc.merchant_id ORDER BY lc.created_at ASC) AS rn
        FROM loyalty_cards lc
      ) sub
      WHERE sub.rn = 10;
  ELSE
    RAISE EXCEPTION 'Accès refusé';
  END IF;
END;
$$;

-- 3. Loyalty card count per merchant (for customer counts in admin list + top merchants)
CREATE OR REPLACE FUNCTION get_loyalty_card_counts_per_merchant()
RETURNS TABLE(merchant_id uuid, card_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR auth.uid() IN (SELECT user_id FROM super_admins) THEN
    RETURN QUERY
      SELECT lc.merchant_id, COUNT(*) AS card_count
      FROM loyalty_cards lc
      GROUP BY lc.merchant_id;
  ELSE
    RAISE EXCEPTION 'Accès refusé';
  END IF;
END;
$$;
