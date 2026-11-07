CREATE FUNCTION public.track_clinic_appointment(_reference_id TEXT)
RETURNS TABLE (
  reference_id TEXT,
  status TEXT,
  appointment_date DATE,
  appointment_time TIME,
  suggested_date DATE,
  suggested_time TIME
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.reference_id, a.status, a.appointment_date, a.appointment_time, a.suggested_date, a.suggested_time
  FROM public.clinic_appointments AS a
  WHERE a.reference_id = _reference_id
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.track_clinic_appointment(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_clinic_appointment(TEXT) TO anon, authenticated;