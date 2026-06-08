-- Mig 175 — Réservation atomique en mode libre (anti double-booking)
-- ════════════════════════════════════════════════════════════════════════
-- Contexte : en mode libre, toutes les routes de réservation faisaient
-- "SELECT chevauchements -> si rien -> INSERT" sans verrou. Entre le SELECT et
-- l'INSERT, deux réservations concurrentes qui se chevauchent (à des start_time
-- DIFFÉRENTS) pouvaient toutes deux passer => double-booking. L'index UNIQUE
-- (merchant_id, slot_date, start_time) ne couvre que la collision au start_time
-- EXACT, pas le chevauchement.
--
-- Fix : 2 fonctions qui sérialisent le check+write par (merchant, jour) via un
-- advisory lock transactionnel. Le lock est pris au début et tenu jusqu'au COMMIT
-- de la fonction (même transaction), donc le check et l'écriture sont atomiques.
--
--  - reserve_free_slot : pose une ligne qui occupe immédiatement la plage
--    (client_name + durée). Les chemins JS enrichissent ensuite la ligne par un
--    UPDATE — la plage est déjà réservée, donc toute résa concurrente la verra.
--  - move_booking_free : check de chevauchement de plage + déplacement atomique
--    (réutilise move_booking pour la mécanique de transfert).
--
-- p_force=true (résa manuelle merchant) : saute le check de chevauchement mais
-- garde le lock + le nettoyage du slot vide résiduel. La superposition volontaire
-- reste donc possible (sauf au start_time exact, bloqué par la contrainte UNIQUE).
--
-- Idempotent (CREATE OR REPLACE). Aucune donnée modifiée.

-- ─── 1. reserve_free_slot ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reserve_free_slot(
  p_merchant_id uuid,
  p_slot_date date,
  p_start_time varchar(5),
  p_duration int,
  p_buffer int,
  p_client_name text,
  p_exclude_slot_id uuid DEFAULT NULL,
  p_force boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req_start int := split_part(p_start_time, ':', 1)::int * 60 + split_part(p_start_time, ':', 2)::int;
  v_req_end int := v_req_start + p_duration;
  v_conflict boolean;
  v_id uuid;
BEGIN
  -- Sérialise les écritures concurrentes pour ce merchant + jour.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_merchant_id::text || ':' || p_slot_date::text, 0));

  IF NOT p_force THEN
    SELECT EXISTS (
      SELECT 1 FROM merchant_planning_slots s
      WHERE s.merchant_id = p_merchant_id
        AND s.slot_date = p_slot_date
        AND s.client_name IS NOT NULL
        AND s.primary_slot_id IS NULL
        AND (p_exclude_slot_id IS NULL OR s.id <> p_exclude_slot_id)
        AND v_req_start < (split_part(s.start_time, ':', 1)::int * 60 + split_part(s.start_time, ':', 2)::int)
                          + COALESCE(s.total_duration_minutes, 30) + COALESCE(p_buffer, 0)
        AND v_req_end > (split_part(s.start_time, ':', 1)::int * 60 + split_part(s.start_time, ':', 2)::int)
    ) INTO v_conflict;

    IF v_conflict THEN
      RETURN jsonb_build_object('success', false, 'error', 'conflict');
    END IF;
  END IF;

  -- Nettoie un slot vide résiduel au même start_time (résidu mode créneaux) pour
  -- éviter une violation de la contrainte UNIQUE(merchant_id, slot_date, start_time).
  DELETE FROM merchant_planning_slots
  WHERE merchant_id = p_merchant_id
    AND slot_date = p_slot_date
    AND start_time = p_start_time
    AND client_name IS NULL
    AND primary_slot_id IS NULL;

  -- Réserve la plage : la ligne occupe immédiatement le créneau.
  INSERT INTO merchant_planning_slots (merchant_id, slot_date, start_time, client_name, total_duration_minutes, booked_at)
  VALUES (p_merchant_id, p_slot_date, p_start_time, p_client_name, p_duration, now())
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'slot_id', v_id);
EXCEPTION
  WHEN unique_violation THEN
    -- Course au start_time exact : une autre résa a gagné la ligne.
    RETURN jsonb_build_object('success', false, 'error', 'conflict');
END;
$$;

REVOKE ALL ON FUNCTION reserve_free_slot(uuid, date, varchar, int, int, text, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION reserve_free_slot(uuid, date, varchar, int, int, text, uuid, boolean) TO service_role;

-- ─── 2. move_booking_free ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION move_booking_free(
  p_merchant_id uuid,
  p_source_slot_id uuid,
  p_target_date date,
  p_target_time varchar(5),
  p_duration int,
  p_buffer int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req_start int := split_part(p_target_time, ':', 1)::int * 60 + split_part(p_target_time, ':', 2)::int;
  v_req_end int := v_req_start + p_duration;
  v_conflict boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_merchant_id::text || ':' || p_target_date::text, 0));

  SELECT EXISTS (
    SELECT 1 FROM merchant_planning_slots s
    WHERE s.merchant_id = p_merchant_id
      AND s.slot_date = p_target_date
      AND s.client_name IS NOT NULL
      AND s.primary_slot_id IS NULL
      AND s.id <> p_source_slot_id
      AND v_req_start < (split_part(s.start_time, ':', 1)::int * 60 + split_part(s.start_time, ':', 2)::int)
                        + COALESCE(s.total_duration_minutes, 30) + COALESCE(p_buffer, 0)
      AND v_req_end > (split_part(s.start_time, ':', 1)::int * 60 + split_part(s.start_time, ':', 2)::int)
  ) INTO v_conflict;

  IF v_conflict THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_already_booked');
  END IF;

  -- move_booking tourne dans la même transaction => couvert par le même lock.
  RETURN move_booking(p_merchant_id, p_source_slot_id, p_target_date, p_target_time);
END;
$$;

REVOKE ALL ON FUNCTION move_booking_free(uuid, uuid, date, varchar, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION move_booking_free(uuid, uuid, date, varchar, int, int) TO service_role;
