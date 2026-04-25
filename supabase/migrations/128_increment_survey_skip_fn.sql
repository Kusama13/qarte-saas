-- Migration 128 : RPC atomique pour incrementer churn_survey_skip_count
--
-- Avant : la route /api/merchant/survey-skip faisait SELECT puis UPDATE (race
-- condition possible si double-clic, on perdait des increments).
-- Maintenant : un seul UPDATE atomique avec CASE pour auto-seen au seuil.

CREATE OR REPLACE FUNCTION increment_churn_survey_skip(p_user_id UUID, p_max INTEGER)
RETURNS TABLE(skip_count INTEGER, auto_seen BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE merchants
  SET
    churn_survey_skip_count = churn_survey_skip_count + 1,
    churn_survey_seen_at = CASE
      WHEN churn_survey_skip_count + 1 >= p_max AND churn_survey_seen_at IS NULL
      THEN NOW()
      ELSE churn_survey_seen_at
    END
  WHERE user_id = p_user_id AND churn_survey_seen_at IS NULL
  RETURNING merchants.churn_survey_skip_count, (merchants.churn_survey_seen_at IS NOT NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION increment_churn_survey_skip(UUID, INTEGER) TO authenticated, service_role;
