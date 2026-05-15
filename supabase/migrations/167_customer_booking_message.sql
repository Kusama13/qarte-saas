-- Migration 167 — note libre laissée par la cliente à la réservation en ligne
--
-- La cliente peut écrire un message au pro depuis le BookingModal de la vitrine
-- (allergie, inspiration, précision sur le RDV). Stocké sur le slot, distinct de
-- `notes` qui reste la note du merchant (éditable dans le dashboard).
--
-- Colonne additive nullable — aucune rétrocompat à gérer.

ALTER TABLE merchant_planning_slots
  ADD COLUMN IF NOT EXISTS customer_message TEXT NULL;

-- move_booking : transférer + reset `customer_message` comme les autres champs
-- de réservation, sinon déplacer un RDV laisserait le message orphelin sur la
-- source et la cible le perdrait. Recrée la fonction de la mig 151 + 1 champ.

CREATE OR REPLACE FUNCTION move_booking(
  p_merchant_id UUID,
  p_source_slot_id UUID,
  p_target_date DATE,
  p_target_time VARCHAR(5)
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source RECORD;
  v_target_id UUID;
  v_target_existing RECORD;
BEGIN
  SELECT * INTO v_source
  FROM merchant_planning_slots
  WHERE id = p_source_slot_id AND merchant_id = p_merchant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'source_not_found');
  END IF;

  IF v_source.client_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'source_not_booked');
  END IF;

  IF EXISTS (
    SELECT 1 FROM merchant_planning_slots
    WHERE primary_slot_id = p_source_slot_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'multi_slot_not_supported');
  END IF;

  IF v_source.slot_date = p_target_date AND v_source.start_time = p_target_time THEN
    RETURN jsonb_build_object('success', true, 'target_id', p_source_slot_id);
  END IF;

  SELECT * INTO v_target_existing
  FROM merchant_planning_slots
  WHERE merchant_id = p_merchant_id
    AND slot_date = p_target_date
    AND start_time = p_target_time;

  IF FOUND THEN
    IF v_target_existing.client_name IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'target_already_booked');
    END IF;
    v_target_id := v_target_existing.id;
  ELSE
    INSERT INTO merchant_planning_slots (merchant_id, slot_date, start_time)
    VALUES (p_merchant_id, p_target_date, p_target_time)
    RETURNING id INTO v_target_id;
  END IF;

  -- Transfert : réservation, home service, presta sur mesure, message cliente.
  UPDATE merchant_planning_slots
  SET
    client_name = v_source.client_name,
    client_phone = v_source.client_phone,
    customer_id = v_source.customer_id,
    service_id = v_source.service_id,
    notes = v_source.notes,
    customer_message = v_source.customer_message,
    deposit_confirmed = v_source.deposit_confirmed,
    deposit_deadline_at = v_source.deposit_deadline_at,
    booked_online = v_source.booked_online,
    booked_at = v_source.booked_at,
    customer_address = v_source.customer_address,
    customer_lat = v_source.customer_lat,
    customer_lng = v_source.customer_lng,
    travel_time_minutes = v_source.travel_time_minutes,
    travel_time_overridden = v_source.travel_time_overridden,
    custom_service_name = v_source.custom_service_name,
    custom_service_duration = v_source.custom_service_duration,
    custom_service_price = v_source.custom_service_price,
    custom_service_color = v_source.custom_service_color
  WHERE id = v_target_id;

  UPDATE planning_slot_services SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;
  UPDATE planning_slot_photos SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;
  UPDATE planning_slot_result_photos SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;
  UPDATE customer_notes SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;

  -- Reset complet de la source.
  UPDATE merchant_planning_slots
  SET
    client_name = NULL,
    client_phone = NULL,
    customer_id = NULL,
    service_id = NULL,
    notes = NULL,
    customer_message = NULL,
    deposit_confirmed = NULL,
    deposit_deadline_at = NULL,
    booked_online = false,
    booked_at = NULL,
    customer_address = NULL,
    customer_lat = NULL,
    customer_lng = NULL,
    travel_time_minutes = NULL,
    travel_time_overridden = false,
    custom_service_name = NULL,
    custom_service_duration = NULL,
    custom_service_price = NULL,
    custom_service_color = NULL
  WHERE id = p_source_slot_id;

  RETURN jsonb_build_object('success', true, 'target_id', v_target_id);
END;
$$;

REVOKE ALL ON FUNCTION move_booking(UUID, UUID, DATE, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION move_booking(UUID, UUID, DATE, VARCHAR) TO service_role;
