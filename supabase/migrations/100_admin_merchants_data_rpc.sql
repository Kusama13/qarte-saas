-- Migration 100: RPC pour API admin/merchants-data (C3)
-- Remplace les SELECT merchant_id LIMIT 10000 par des COUNT GROUP BY cote DB

CREATE OR REPLACE FUNCTION get_counts_per_merchant(p_table TEXT)
RETURNS TABLE(merchant_id UUID, cnt BIGINT) AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT merchant_id, COUNT(*)::BIGINT as cnt FROM %I GROUP BY merchant_id',
    p_table
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Pending visits count per merchant
CREATE OR REPLACE FUNCTION get_pending_visits_per_merchant()
RETURNS TABLE(merchant_id UUID, cnt BIGINT) AS $$
  SELECT merchant_id, COUNT(*)::BIGINT as cnt
  FROM visits
  WHERE status = 'pending'
  GROUP BY merchant_id;
$$ LANGUAGE sql STABLE;

-- Planning slots summary per merchant (slots, bookings, pending deposits)
CREATE OR REPLACE FUNCTION get_planning_summary_per_merchant()
RETURNS TABLE(merchant_id UUID, total_slots BIGINT, bookings BIGINT, pending_deposits BIGINT) AS $$
  SELECT
    merchant_id,
    COUNT(*)::BIGINT as total_slots,
    COUNT(*) FILTER (WHERE client_name IS NOT NULL)::BIGINT as bookings,
    COUNT(*) FILTER (WHERE client_name IS NOT NULL AND deposit_confirmed = false AND slot_date >= CURRENT_DATE)::BIGINT as pending_deposits
  FROM merchant_planning_slots
  GROUP BY merchant_id;
$$ LANGUAGE sql STABLE;
