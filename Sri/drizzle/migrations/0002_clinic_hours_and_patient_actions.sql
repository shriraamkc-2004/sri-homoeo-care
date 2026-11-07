CREATE UNIQUE INDEX clinic_appointments_active_slot_uidx ON public.clinic_appointments (appointment_date, appointment_time) WHERE status <> 'cancelled';
ALTER TABLE public.clinic_appointments DROP CONSTRAINT IF EXISTS clinic_appointments_reference_id_check;
ALTER TABLE public.clinic_appointments ADD CONSTRAINT clinic_appointments_reference_id_check CHECK (reference_id ~ '^SHC-[0-9]{4}-[A-F0-9]{12}$');

CREATE FUNCTION public.get_clinic_available_slots(_date DATE)
RETURNS TABLE (slot_time TIME)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT slots.slot_time::time
  FROM generate_series(
    _date::timestamp + TIME '18:00',
    _date::timestamp + TIME '19:30',
    INTERVAL '30 minutes'
  ) AS slots(slot_time)
  WHERE slots.slot_time > now()
    AND NOT EXISTS (
      SELECT 1 FROM public.clinic_appointments a
      WHERE a.appointment_date = _date
        AND a.appointment_time = (slots.slot_time::timestamp::time)
        AND a.status <> 'cancelled'
    )
  ORDER BY slots.slot_time
$$;
REVOKE ALL ON FUNCTION public.get_clinic_available_slots(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_clinic_available_slots(DATE) TO anon, authenticated;

CREATE FUNCTION public.cancel_own_clinic_appointment(_reference_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE changed_count INTEGER;
BEGIN
  UPDATE public.clinic_appointments a
  SET status = 'cancelled', updated_at = now()
  WHERE a.reference_id = _reference_id
    AND a.patient_id = auth.uid()
    AND a.status IN ('requested', 'confirmed', 'checked_in');
  GET DIAGNOSTICS changed_count = ROW_COUNT;
  RETURN changed_count = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_own_clinic_appointment(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_own_clinic_appointment(TEXT) TO authenticated;

CREATE FUNCTION public.accept_own_clinic_suggested_time(_reference_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE changed_count INTEGER;
BEGIN
  UPDATE public.clinic_appointments a
  SET appointment_date = a.suggested_date,
      appointment_time = a.suggested_time,
      suggested_date = NULL,
      suggested_time = NULL,
      status = 'confirmed',
      updated_at = now()
  WHERE a.reference_id = _reference_id
    AND a.patient_id = auth.uid()
    AND a.status = 'reschedule_suggested'
    AND a.suggested_date IS NOT NULL
    AND a.suggested_time IS NOT NULL;
  GET DIAGNOSTICS changed_count = ROW_COUNT;
  RETURN changed_count = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_own_clinic_suggested_time(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_own_clinic_suggested_time(TEXT) TO authenticated;