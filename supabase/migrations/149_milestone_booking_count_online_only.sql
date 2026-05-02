-- Migration 149 — fix booking_count to count online bookings only
--
-- Bug : la colonne `booking_count` de la RPC `merchant_milestone_stats`
-- (mig 133) compte tout slot avec `client_name IS NOT NULL AND client_name
-- <> '__blocked__'`, donc les saisies manuelles du marchand depuis son
-- dashboard. Elle est utilisee dans le cron email-engagement pour declencher
-- la milestone "Premiere reservation en ligne" — ce qui envoyait email + push
-- "Premiere resa en ligne !" au marchand des qu'il enregistrait son premier
-- RDV manuellement (cas observe : letjbeauty@hotmail.com 2026-05-02).
--
-- Fix : ajouter `AND booked_online = true` dans le lateral join `b` pour
-- compter uniquement les resas issues de la vitrine publique.

CREATE OR REPLACE FUNCTION merchant_milestone_stats(merchant_ids uuid[])
RETURNS TABLE (
  merchant_id uuid,
  confirmed_visit_count bigint,
  last_confirmed_visit_at timestamptz,
  pending_visit_count bigint,
  oldest_pending_visit_at timestamptz,
  booking_count bigint,
  total_rewards_earned bigint,
  unique_customer_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id AS merchant_id,
    COALESCE(v_conf.cnt, 0)             AS confirmed_visit_count,
    v_conf.last_at                      AS last_confirmed_visit_at,
    COALESCE(v_pend.cnt, 0)             AS pending_visit_count,
    v_pend.oldest_at                    AS oldest_pending_visit_at,
    COALESCE(b.cnt, 0)                  AS booking_count,
    COALESCE(r.total, 0)                AS total_rewards_earned,
    COALESCE(c.cnt, 0)                  AS unique_customer_count
  FROM unnest(merchant_ids) AS m(id)
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS cnt, MAX(visited_at) AS last_at
    FROM visits
    WHERE merchant_id = m.id AND status = 'confirmed'
  ) v_conf ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS cnt, MIN(visited_at) AS oldest_at
    FROM visits
    WHERE merchant_id = m.id AND status = 'pending'
  ) v_pend ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS cnt
    FROM merchant_planning_slots
    WHERE merchant_id = m.id
      AND client_name IS NOT NULL
      AND client_name <> '__blocked__'
      AND booked_online = true
  ) b ON TRUE
  LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(rewards_earned), 0)::bigint AS total
    FROM loyalty_cards
    WHERE merchant_id = m.id AND rewards_earned > 0
  ) r ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(DISTINCT customer_id)::bigint AS cnt
    FROM loyalty_cards
    WHERE merchant_id = m.id
  ) c ON TRUE;
$$;

GRANT EXECUTE ON FUNCTION merchant_milestone_stats(uuid[]) TO service_role;

COMMENT ON FUNCTION merchant_milestone_stats IS
  'Renvoie les compteurs milestone par merchant. booking_count filtre desormais '
  'sur booked_online=true pour ne pas declencher la milestone "premiere resa en '
  'ligne" sur les saisies manuelles dashboard. Voir mig 133 + 149.';
