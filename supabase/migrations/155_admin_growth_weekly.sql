-- 155 — Admin analytics : RPC weekly + index pour la nouvelle Growth tab
--
-- Pousse l'agrégation des séries hebdomadaires côté Postgres au lieu d'agréger
-- en mémoire JS (full table scans non scalables sur merchants/visits/cards).
--
-- Source de vérité du schéma : src/app/api/admin/analytics/growth/route.ts
--
-- Convention : semaines ISO Lundi-start, fuseau Europe/Paris (sinon les RDV
-- du dimanche soir 23h UTC tombent sur lundi côté affichage français).

-- ─── Index manquants ───────────────────────────────────────────────
-- Hot path : COUNT bookings par semaine, filtré sur (booked_online, client_name, primary_slot_id)
-- Le partial index permet d'éviter de scanner les slots vides + fillers multi-créneaux.
CREATE INDEX IF NOT EXISTS idx_planning_slots_booked_at_growth
  ON merchant_planning_slots(booked_at)
  WHERE client_name IS NOT NULL
    AND primary_slot_id IS NULL
    AND booked_at IS NOT NULL;

-- ─── RPC : agrégation weekly multi-séries en 1 requête ─────────────
CREATE OR REPLACE FUNCTION admin_growth_weekly(weeks_back INT DEFAULT 16)
RETURNS TABLE (
  week_start DATE,
  bookings_online INT,
  bookings_manual INT,
  new_customers INT,
  new_cards INT,
  scans INT,
  signups INT,
  paid_conversions INT,
  marketing_sms INT,
  gift_cards_paid_amount NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
  series AS (
    SELECT generate_series(
      date_trunc('week', (NOW() AT TIME ZONE 'Europe/Paris')::date - ((weeks_back - 1) * 7)),
      date_trunc('week', (NOW() AT TIME ZONE 'Europe/Paris')::date),
      '7 days'::interval
    )::date AS week_start
  ),
  cutoff AS (
    SELECT (NOW() AT TIME ZONE 'Europe/Paris')::date - (weeks_back * 7) AS d
  ),
  excluded AS (
    SELECT m.id FROM merchants m
    JOIN super_admins sa ON sa.user_id = m.user_id
  ),
  -- Note SQL : on utilise CROSS JOIN cutoff (pas la virgule) car la virgule
  -- a une précédence LÂCHE → `FROM t, cutoff LEFT JOIN ex ON t.col` parse en
  -- `FROM t, (cutoff LEFT JOIN ex ON t.col)` et casse la résolution de t.
  bookings AS (
    SELECT
      date_trunc('week', (s.booked_at AT TIME ZONE 'Europe/Paris'))::date AS w,
      s.booked_online,
      COUNT(*)::int AS n
    FROM merchant_planning_slots s
    CROSS JOIN cutoff
    LEFT JOIN excluded ex ON ex.id = s.merchant_id
    WHERE s.booked_at IS NOT NULL
      AND s.booked_at >= cutoff.d
      AND s.client_name IS NOT NULL
      AND s.primary_slot_id IS NULL
      AND ex.id IS NULL
    GROUP BY 1, 2
  ),
  -- customers n'a pas de merchant_id direct ; on filtre via EXISTS sur loyalty_cards
  -- (sinon on compterait les clientes de comptes super_admin qui testent).
  new_customers_w AS (
    SELECT date_trunc('week', (c.created_at AT TIME ZONE 'Europe/Paris'))::date AS w, COUNT(*)::int AS n
    FROM customers c
    CROSS JOIN cutoff
    WHERE c.created_at >= cutoff.d
      AND EXISTS (
        SELECT 1 FROM loyalty_cards lc
        LEFT JOIN excluded ex ON ex.id = lc.merchant_id
        WHERE lc.customer_id = c.id AND ex.id IS NULL
      )
    GROUP BY 1
  ),
  new_cards_w AS (
    SELECT date_trunc('week', (lc.created_at AT TIME ZONE 'Europe/Paris'))::date AS w, COUNT(*)::int AS n
    FROM loyalty_cards lc
    CROSS JOIN cutoff
    LEFT JOIN excluded ex ON ex.id = lc.merchant_id
    WHERE lc.created_at >= cutoff.d
      AND ex.id IS NULL
    GROUP BY 1
  ),
  scans_w AS (
    SELECT date_trunc('week', (v.visited_at AT TIME ZONE 'Europe/Paris'))::date AS w, COUNT(*)::int AS n
    FROM visits v
    CROSS JOIN cutoff
    LEFT JOIN excluded ex ON ex.id = v.merchant_id
    WHERE v.visited_at >= cutoff.d
      AND ex.id IS NULL
    GROUP BY 1
  ),
  signups_w AS (
    SELECT date_trunc('week', (m.created_at AT TIME ZONE 'Europe/Paris'))::date AS w, COUNT(*)::int AS n
    FROM merchants m
    CROSS JOIN cutoff
    LEFT JOIN excluded ex ON ex.id = m.id
    WHERE m.created_at >= cutoff.d
      AND ex.id IS NULL
    GROUP BY 1
  ),
  paid_conversions_w AS (
    -- Proxy date conversion = trial_ends_at (cohérent avec route principale).
    -- Liste des statuts payants doit rester en sync avec PAID_STATUSES dans src/lib/sms.ts.
    SELECT date_trunc('week', (m.trial_ends_at AT TIME ZONE 'Europe/Paris'))::date AS w, COUNT(*)::int AS n
    FROM merchants m
    CROSS JOIN cutoff
    LEFT JOIN excluded ex ON ex.id = m.id
    WHERE m.trial_ends_at IS NOT NULL
      AND m.trial_ends_at >= cutoff.d
      AND m.subscription_status IN ('active', 'canceling', 'past_due', 'canceled')
      AND ex.id IS NULL
    GROUP BY 1
  ),
  marketing_sms_w AS (
    SELECT date_trunc('week', (sent_at AT TIME ZONE 'Europe/Paris'))::date AS w, COUNT(*)::int AS n
    FROM merchant_marketing_sms_logs
    CROSS JOIN cutoff
    WHERE sent_at >= cutoff.d
      AND status = 'sent'
    GROUP BY 1
  ),
  gift_cards_w AS (
    SELECT date_trunc('week', (gc.paid_at AT TIME ZONE 'Europe/Paris'))::date AS w, COALESCE(SUM(gc.amount), 0)::numeric AS n
    FROM gift_cards gc
    CROSS JOIN cutoff
    LEFT JOIN excluded ex ON ex.id = gc.merchant_id
    WHERE gc.paid_at IS NOT NULL
      AND gc.paid_at >= cutoff.d
      AND ex.id IS NULL
    GROUP BY 1
  )
  SELECT
    s.week_start,
    COALESCE((SELECT n FROM bookings b WHERE b.w = s.week_start AND b.booked_online = true), 0)::int,
    COALESCE((SELECT n FROM bookings b WHERE b.w = s.week_start AND b.booked_online = false), 0)::int,
    COALESCE((SELECT n FROM new_customers_w nc WHERE nc.w = s.week_start), 0)::int,
    COALESCE((SELECT n FROM new_cards_w nc WHERE nc.w = s.week_start), 0)::int,
    COALESCE((SELECT n FROM scans_w sc WHERE sc.w = s.week_start), 0)::int,
    COALESCE((SELECT n FROM signups_w sg WHERE sg.w = s.week_start), 0)::int,
    COALESCE((SELECT n FROM paid_conversions_w pc WHERE pc.w = s.week_start), 0)::int,
    COALESCE((SELECT n FROM marketing_sms_w ms WHERE ms.w = s.week_start), 0)::int,
    COALESCE((SELECT n FROM gift_cards_w gc WHERE gc.w = s.week_start), 0)::numeric
  FROM series s
  ORDER BY s.week_start;
$$;

COMMENT ON FUNCTION admin_growth_weekly(INT) IS
  'Admin analytics — séries hebdomadaires (Europe/Paris, lundi). Exclut super_admins. Source de vérité UI : /admin/analytics tab Growth.';

-- ─── RPC : KPIs rolling (4 sem glissantes vs 4 sem précédentes, WAU/MAU, cohort retention) ──
CREATE OR REPLACE FUNCTION admin_growth_rolling()
RETURNS TABLE (
  net_new_paying_4w INT,
  net_new_paying_4w_prev INT,
  wau INT,
  mau INT,
  booking_online_share NUMERIC,
  cohort_4w_retention NUMERIC,
  gift_cards_paid_amount_4w NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH
  excluded AS (
    SELECT m.id FROM merchants m
    JOIN super_admins sa ON sa.user_id = m.user_id
  ),
  base AS (
    SELECT
      (NOW() AT TIME ZONE 'Europe/Paris')::date - 28 AS d28,
      (NOW() AT TIME ZONE 'Europe/Paris')::date - 56 AS d56,
      (NOW() AT TIME ZONE 'Europe/Paris')::date - 7 AS d7,
      (NOW() AT TIME ZONE 'Europe/Paris')::date - 30 AS d30
  )
  -- Note SQL : CROSS JOIN base (pas la virgule) — cf bookings dans admin_growth_weekly.
  SELECT
    -- net_new_paying_4w : merchants converted in last 28d
    (SELECT COUNT(*)::int FROM merchants m
       CROSS JOIN base
       LEFT JOIN excluded ex ON ex.id = m.id
       WHERE m.trial_ends_at IS NOT NULL
         AND m.trial_ends_at >= base.d28
         AND m.subscription_status IN ('active', 'canceling', 'past_due', 'canceled')
         AND ex.id IS NULL),
    (SELECT COUNT(*)::int FROM merchants m
       CROSS JOIN base
       LEFT JOIN excluded ex ON ex.id = m.id
       WHERE m.trial_ends_at IS NOT NULL
         AND m.trial_ends_at >= base.d56
         AND m.trial_ends_at < base.d28
         AND m.subscription_status IN ('active', 'canceling', 'past_due', 'canceled')
         AND ex.id IS NULL),
    -- WAU : merchants distincts ayant eu au moins 1 visit en 7d
    (SELECT COUNT(DISTINCT v.merchant_id)::int FROM visits v
       CROSS JOIN base
       LEFT JOIN excluded ex ON ex.id = v.merchant_id
       WHERE v.visited_at >= base.d7 AND ex.id IS NULL),
    -- MAU : merchants distincts ayant eu au moins 1 visit en 30d
    (SELECT COUNT(DISTINCT v.merchant_id)::int FROM visits v
       CROSS JOIN base
       LEFT JOIN excluded ex ON ex.id = v.merchant_id
       WHERE v.visited_at >= base.d30 AND ex.id IS NULL),
    -- booking_online_share : online / (online + manual) sur 28 derniers jours
    COALESCE((
      SELECT ROUND(
        SUM(CASE WHEN s.booked_online = true THEN 1 ELSE 0 END)::numeric
        / NULLIF(COUNT(*), 0)
      , 3)
      FROM merchant_planning_slots s
      CROSS JOIN base
      LEFT JOIN excluded ex ON ex.id = s.merchant_id
      WHERE s.booked_at >= base.d28
        AND s.client_name IS NOT NULL
        AND s.primary_slot_id IS NULL
        AND ex.id IS NULL
    ), 0),
    -- cohort_4w_retention : merchants signup [56j, 28j[ qui sont active/trial/canceling aujourd'hui
    COALESCE((
      WITH cohort AS (
        SELECT m.id, m.subscription_status FROM merchants m
        CROSS JOIN base
        LEFT JOIN excluded ex ON ex.id = m.id
        WHERE m.created_at >= base.d56
          AND m.created_at < base.d28
          AND ex.id IS NULL
      )
      SELECT ROUND(
        SUM(CASE WHEN subscription_status IN ('active', 'canceling', 'trial') THEN 1 ELSE 0 END)::numeric
        / NULLIF(COUNT(*), 0)
      , 3)
      FROM cohort
    ), 0),
    -- gift_cards_paid_amount_4w
    COALESCE((
      SELECT SUM(gc.amount)::numeric FROM gift_cards gc
      CROSS JOIN base
      LEFT JOIN excluded ex ON ex.id = gc.merchant_id
      WHERE gc.paid_at IS NOT NULL
        AND gc.paid_at >= base.d28
        AND ex.id IS NULL
    ), 0);
$$;

COMMENT ON FUNCTION admin_growth_rolling() IS
  'Admin analytics — KPIs rolling 4 semaines. Source de vérité UI : /admin/analytics tab Growth (cards en haut).';
