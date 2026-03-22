-- Rollback function: decrement claim_count when voucher creation fails after increment
CREATE OR REPLACE FUNCTION decrement_offer_claim(p_offer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE merchant_offers
  SET claim_count = GREATEST(claim_count - 1, 0)
  WHERE id = p_offer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
