-- Migration 099: RPC pour page admin metriques (C3/C4)
-- Remplace les SELECT merchant_id LIMIT 10000 par des DISTINCT cote DB

CREATE OR REPLACE FUNCTION get_merchants_with_services()
RETURNS TABLE(merchant_id UUID) AS $$
  SELECT DISTINCT merchant_id FROM merchant_services;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_merchants_with_photos()
RETURNS TABLE(merchant_id UUID) AS $$
  SELECT DISTINCT merchant_id FROM merchant_photos;
$$ LANGUAGE sql STABLE;
