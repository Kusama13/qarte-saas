-- Migration 133 — merchant_milestone_stats RPC
--
-- Contexte : les crons email-engagement/email-onboarding faisaient des
-- requêtes globales `select … in(merchant_ids[…]) limit 10000` puis comptaient
-- en mémoire. Quand le total dépassait le cap, le sous-ensemble retourné était
-- arbitraire et les compteurs par merchant devenaient incorrects (cas observé :
-- mail "premier client fidélisé" envoyé à un merchant ayant 99 visites).
--
-- Cette RPC remplace ces agrégations par un GROUP BY côté DB, exact à chaque
-- merchant et indexable.

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
  'Renvoie les compteurs milestone par merchant (visites confirmées/pending, '
  'résas, récompenses totales, clients uniques, dernière visite). Remplace les '
  'agrégations en mémoire des crons email-* qui se brisaient au-delà du cap '
  'PostgREST. Voir docs/context.md.';
