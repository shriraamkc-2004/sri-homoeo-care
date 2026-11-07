ALTER TABLE public.clinic_appointments DROP CONSTRAINT IF EXISTS clinic_appointments_check;
ALTER TABLE public.clinic_appointments ADD CONSTRAINT clinic_appointments_evening_slot_check CHECK (
  appointment_time >= TIME '18:00' AND appointment_time <= TIME '19:30'
  AND extract(minute FROM appointment_time)::integer % 30 = 0
);

CREATE OR REPLACE FUNCTION public.validate_clinic_appointment_slot()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF ((NEW.appointment_date + NEW.appointment_time) AT TIME ZONE 'Asia/Kolkata') <= now() THEN
    RAISE EXCEPTION 'Choose a future appointment slot';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_clinic_appointment_slot_before_save
BEFORE INSERT OR UPDATE OF appointment_date, appointment_time ON public.clinic_appointments
FOR EACH ROW EXECUTE FUNCTION public.validate_clinic_appointment_slot();

DROP POLICY IF EXISTS "Patients can request appointments with their verified contact" ON public.clinic_appointments;
DROP POLICY IF EXISTS "Patients can request appointments with their profile contact" ON public.clinic_appointments;
CREATE POLICY "Patients can request appointments with their profile contact" ON public.clinic_appointments FOR INSERT TO authenticated WITH CHECK (
  patient_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND (
      (contact_method = 'email' AND lower(p.email) = lower(contact_value)) OR
      (contact_method = 'phone' AND p.phone = contact_value)
    )
  )
);

CREATE OR REPLACE FUNCTION public.create_clinic_patient_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    left(coalesce(nullif(trim(NEW.raw_user_meta_data ->> 'full_name'), ''), nullif(NEW.email, ''), nullif(NEW.phone, ''), 'Patient'), 100),
    coalesce(nullif(NEW.raw_user_meta_data ->> 'phone', ''), NEW.phone),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_clinic_patient_profile() FROM PUBLIC;
CREATE TRIGGER create_clinic_patient_profile_after_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_clinic_patient_profile();