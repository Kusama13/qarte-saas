-- Mig 091: Function to atomically move a booking between slots
-- Used by POST /api/planning/shift-slot when moving a BOOKED slot.
-- Transfers booking data (client fields, deposit, notes, FK tables) from source to target.
-- Source becomes a free slot, target becomes booked. If target doesn't exist, it's created.
-- Limitation: does not support multi-slot bookings (caller must verify no secondaries).

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
  -- 1. Load source (must belong to merchant, must be booked)
  SELECT * INTO v_source
  FROM merchant_planning_slots
  WHERE id = p_source_slot_id AND merchant_id = p_merchant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'source_not_found');
  END IF;

  IF v_source.client_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'source_not_booked');
  END IF;

  -- 2. Reject multi-slot bookings (source has filler secondaries)
  IF EXISTS (
    SELECT 1 FROM merchant_planning_slots
    WHERE primary_slot_id = p_source_slot_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'multi_slot_not_supported');
  END IF;

  -- 3. No-op: same date/time
  IF v_source.slot_date = p_target_date AND v_source.start_time = p_target_time THEN
    RETURN jsonb_build_object('success', true, 'target_id', p_source_slot_id);
  END IF;

  -- 4. Check target slot at destination
  SELECT * INTO v_target_existing
  FROM merchant_planning_slots
  WHERE merchant_id = p_merchant_id
    AND slot_date = p_target_date
    AND start_time = p_target_time;

  IF FOUND THEN
    -- Target already booked → reject
    IF v_target_existing.client_name IS NOT NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'target_already_booked');
    END IF;
    -- Empty target: reuse its id
    v_target_id := v_target_existing.id;
  ELSE
    -- Create new empty target slot
    INSERT INTO merchant_planning_slots (merchant_id, slot_date, start_time)
    VALUES (p_merchant_id, p_target_date, p_target_time)
    RETURNING id INTO v_target_id;
  END IF;

  -- 5. Copy booking fields from source to target
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
    booked_at = v_source.booked_at
  WHERE id = v_target_id;

  -- 6. Re-point FK tables from source → target
  UPDATE planning_slot_services SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;
  UPDATE planning_slot_photos SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;
  UPDATE planning_slot_result_photos SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;
  UPDATE customer_notes SET slot_id = v_target_id WHERE slot_id = p_source_slot_id;

  -- 7. Clear source slot (stays in grid as a free slot)
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
    booked_at = NULL
  WHERE id = p_source_slot_id;

  RETURN jsonb_build_object('success', true, 'target_id', v_target_id);
END;
$$;

-- Restrict execution to service_role (admin client) — merchant ownership already verified in JS
REVOKE ALL ON FUNCTION move_booking(UUID, UUID, DATE, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION move_booking(UUID, UUID, DATE, VARCHAR) TO service_role;
