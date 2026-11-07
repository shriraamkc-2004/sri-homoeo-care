CREATE FUNCTION public.staff_suggest_clinic_appointment_time(_appointment_id UUID, _suggested_date DATE, _suggested_time TIME)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE changed_count INTEGER;
BEGIN
  IF NOT public.current_user_is_clinic_staff() THEN
    RETURN FALSE;
  END IF;
  IF _suggested_time < TIME '18:00' OR _suggested_time > TIME '19:30' OR extract(minute FROM _suggested_time)::integer % 30 <> 0 THEN
    RETURN FALSE;
  END IF;
  UPDATE public.clinic_appointments a
  SET status = 'reschedule_suggested', suggested_date = _suggested_date,
      suggested_time = _suggested_time, updated_at = now()
  WHERE a.id = _appointment_id AND a.status <> 'cancelled';
  GET DIAGNOSTICS changed_count = ROW_COUNT;
  RETURN changed_count = 1;
EXCEPTION WHEN unique_violation THEN
  RETURN FALSE;
END;
$$;
REVOKE ALL ON FUNCTION public.staff_suggest_clinic_appointment_time(UUID, DATE, TIME) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_suggest_clinic_appointment_time(UUID, DATE, TIME) TO authenticated;