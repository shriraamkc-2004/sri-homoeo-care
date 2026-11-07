DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.clinic_appointments'::regclass AND conname = 'clinic_appointments_reference_id_check') THEN
    ALTER TABLE public.clinic_appointments ADD CONSTRAINT clinic_appointments_reference_id_check CHECK (reference_id ~ '^SHC-[0-9]{4}-[A-F0-9]{12}$');
  ELSE
    ALTER TABLE public.clinic_appointments DROP CONSTRAINT clinic_appointments_reference_id_check;
    ALTER TABLE public.clinic_appointments ADD CONSTRAINT clinic_appointments_reference_id_check CHECK (reference_id ~ '^SHC-[0-9]{4}-[A-F0-9]{12}$');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_clinic_available_slots(_date DATE)
RETURNS TABLE (slot_time TIME)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (slots.slot_start::time) AS slot_time
  FROM generate_series(
    _date::timestamp + TIME '18:00',
    _date::timestamp + TIME '19:30',
    INTERVAL '30 minutes'
  ) AS slots(slot_start)
  WHERE (slots.slot_start AT TIME ZONE 'Asia/Kolkata') > now()
    AND NOT EXISTS (
      SELECT 1 FROM public.clinic_appointments a
      WHERE a.appointment_date = _date
        AND a.appointment_time = slots.slot_start::time
        AND a.status <> 'cancelled'
    )
  ORDER BY slots.slot_start
$$;
REVOKE ALL ON FUNCTION public.get_clinic_available_slots(DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_clinic_available_slots(DATE) TO anon, authenticated;