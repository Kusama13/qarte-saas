-- Migration 151 — move_booking: transférer aussi les champs prestation sur mesure
--
-- Bug : les colonnes custom_service_* (mig 130) n'étaient ni copiées vers la
-- destination ni nettoyées sur la source lors d'un déplacement de RDV. Résultat :
-- la prestation sur mesure restait orpheline sur l'ancien créneau et la
-- destination perdait la presta après un déplacement (drag&drop merchant ou
-- self-reschedule client en mode créneaux).
--
-- Cette migration recrée move_booking pour transférer ET nettoyer les 4 champs
-- custom_service_name, custom_service_duration, custom_service_price,
-- custom_service_color, en gardant la même signature et les mêmes garanties
-- atomiques que la mig 136.

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

  -- Transfert des champs de réservation, home service ET prestation sur mesure.
  UPDATE merchant_planning_slots
  SET
    client_name = v_source.client_name,
    client_phone = v_source.client_phone,
    customer_id = v_source.customer_id,
    service_id = v_source.service_id,
    notes = v_source.notes,
    deposit_confirmed = v_source.deposit_confirmed,
    deposit_deadline_at = v_source.deposit_deadline_at,
    booked_online = v_source.booked_online,
    booked_at = v_source.booked_at,
    -- Home service
    customer_address = v_source.customer_address,
    customer_lat = v_source.customer_lat,
    customer_lng = v_source.customer_lng,
    travel_time_minutes = v_source.travel_time_minutes,
    travel_time_overridden = v_source.travel_time_overridden,
    -- Prestation sur mesure
    custom_service_name = v_source.custom_service_name,
    custom_service_duration = v_source.custom_service_duration,
    custom_service_price = v_source.custom_service_price,
    custom_service_color = v_source.custom_service_color
  WHERE id = v_target_id;

  UPDATE planning_slot_services SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;
  UPDATE planning_slot_photos SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;
  UPDATE planning_slot_result_photos SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;
  UPDATE customer_notes SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;

  -- Reset complet de la source — réservation, home service ET presta sur mesure.
  UPDATE merchant_planning_slots
  SET
    client_name = NULL,
    client_phone = NULL,
    customer_id = NULL,
    service_id = NULL,
    notes = NULL,
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
