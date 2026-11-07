CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) BETWEEN 1 AND 100),
  phone TEXT,
  email TEXT,
  patient_number TEXT NOT NULL UNIQUE DEFAULT ('SHC-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients can read their own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Patients can create their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Patients can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.clinic_staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'receptionist')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.clinic_staff_roles TO authenticated;
GRANT ALL ON public.clinic_staff_roles TO service_role;
ALTER TABLE public.clinic_staff_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can read their own roles" ON public.clinic_staff_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE FUNCTION public.current_user_is_clinic_staff()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.clinic_staff_roles WHERE user_id = auth.uid()) $$;
REVOKE ALL ON FUNCTION public.current_user_is_clinic_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_clinic_staff() TO authenticated;

CREATE FUNCTION public.current_user_is_clinic_doctor()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.clinic_staff_roles WHERE user_id = auth.uid() AND role = 'doctor') $$;
REVOKE ALL ON FUNCTION public.current_user_is_clinic_doctor() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_clinic_doctor() TO authenticated;

CREATE TABLE public.clinic_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id TEXT NOT NULL UNIQUE CHECK (reference_id ~ '^SHC-[0-9]{4}-[0-9]{4,6}$'),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL CHECK (char_length(trim(patient_name)) BETWEEN 1 AND 100),
  contact_method TEXT NOT NULL CHECK (contact_method IN ('phone', 'email')),
  contact_value TEXT NOT NULL CHECK (char_length(contact_value) BETWEEN 5 AND 255),
  patient_age SMALLINT NOT NULL CHECK (patient_age BETWEEN 1 AND 120),
  gender TEXT NOT NULL CHECK (gender IN ('female', 'male', 'other', 'prefer_not_to_say')),
  symptoms TEXT NOT NULL CHECK (char_length(trim(symptoms)) BETWEEN 1 AND 2000),
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'confirmed', 'checked_in', 'in_consultation', 'prescription_ready', 'reschedule_suggested', 'cancelled')),
  suggested_date DATE,
  suggested_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((contact_method = 'email' AND lower(contact_value) = lower(coalesce(auth.jwt() ->> 'email', ''))) OR (contact_method = 'phone' AND contact_value = coalesce(auth.jwt() ->> 'phone', '')))
);
GRANT SELECT, INSERT, UPDATE ON public.clinic_appointments TO authenticated;
GRANT ALL ON public.clinic_appointments TO service_role;
ALTER TABLE public.clinic_appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients and staff can read appropriate appointments" ON public.clinic_appointments FOR SELECT TO authenticated USING (patient_id = auth.uid() OR public.current_user_is_clinic_staff());
CREATE POLICY "Patients can request appointments with their verified contact" ON public.clinic_appointments FOR INSERT TO authenticated WITH CHECK (
  patient_id = auth.uid() AND
  ((contact_method = 'email' AND lower(contact_value) = lower(coalesce(auth.jwt() ->> 'email', ''))) OR (contact_method = 'phone' AND contact_value = coalesce(auth.jwt() ->> 'phone', '')))
);
CREATE POLICY "Doctors can update appointment status" ON public.clinic_appointments FOR UPDATE TO authenticated USING (public.current_user_is_clinic_doctor()) WITH CHECK (public.current_user_is_clinic_doctor());

CREATE TABLE public.clinic_appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.clinic_appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('cancel', 'reschedule')),
  suggested_date DATE,
  suggested_time TIME,
  note TEXT CHECK (note IS NULL OR char_length(note) <= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.clinic_appointment_requests TO authenticated;
GRANT ALL ON public.clinic_appointment_requests TO service_role;
ALTER TABLE public.clinic_appointment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients and staff can view appointment requests" ON public.clinic_appointment_requests FOR SELECT TO authenticated USING (patient_id = auth.uid() OR public.current_user_is_clinic_staff());
CREATE POLICY "Patients can submit their own appointment requests" ON public.clinic_appointment_requests FOR INSERT TO authenticated WITH CHECK (
  patient_id = auth.uid() AND EXISTS (SELECT 1 FROM public.clinic_appointments a WHERE a.id = appointment_id AND a.patient_id = auth.uid())
);
CREATE POLICY "Clinic staff can respond to appointment requests" ON public.clinic_appointment_requests FOR UPDATE TO authenticated USING (public.current_user_is_clinic_staff()) WITH CHECK (public.current_user_is_clinic_staff());

CREATE TABLE public.clinic_appointment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.clinic_appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clinic_appointment_history TO authenticated;
GRANT ALL ON public.clinic_appointment_history TO service_role;
ALTER TABLE public.clinic_appointment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients and staff can view appointment history" ON public.clinic_appointment_history FOR SELECT TO authenticated USING (patient_id = auth.uid() OR public.current_user_is_clinic_staff());

CREATE FUNCTION public.record_clinic_appointment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.clinic_appointment_history (appointment_id, patient_id, status, changed_by)
    VALUES (NEW.id, NEW.patient_id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.record_clinic_appointment_status() FROM PUBLIC;
CREATE TRIGGER clinic_appointment_status_history
AFTER INSERT OR UPDATE OF status ON public.clinic_appointments
FOR EACH ROW EXECUTE FUNCTION public.record_clinic_appointment_status();

CREATE TABLE public.clinic_consultation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.clinic_appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note_summary TEXT NOT NULL CHECK (char_length(note_summary) <= 2000),
  clinical_notes TEXT NOT NULL CHECK (char_length(clinical_notes) <= 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.clinic_consultation_notes TO authenticated;
GRANT ALL ON public.clinic_consultation_notes TO service_role;
ALTER TABLE public.clinic_consultation_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients and doctors can read consultation notes" ON public.clinic_consultation_notes FOR SELECT TO authenticated USING (patient_id = auth.uid() OR public.current_user_is_clinic_doctor());
CREATE POLICY "Doctors can write consultation notes" ON public.clinic_consultation_notes FOR INSERT TO authenticated WITH CHECK (public.current_user_is_clinic_doctor());
CREATE POLICY "Doctors can update consultation notes" ON public.clinic_consultation_notes FOR UPDATE TO authenticated USING (public.current_user_is_clinic_doctor()) WITH CHECK (public.current_user_is_clinic_doctor());

CREATE TABLE public.clinic_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.clinic_appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  remedy_name TEXT NOT NULL CHECK (char_length(trim(remedy_name)) BETWEEN 1 AND 200),
  potency TEXT NOT NULL CHECK (potency IN ('6C', '30C', '200C', '1M', 'Other')),
  dosage_schedule TEXT NOT NULL CHECK (char_length(dosage_schedule) <= 2000),
  dietary_guidelines TEXT CHECK (dietary_guidelines IS NULL OR char_length(dietary_guidelines) <= 2000),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (appointment_id, version)
);
GRANT SELECT, INSERT ON public.clinic_prescriptions TO authenticated;
GRANT ALL ON public.clinic_prescriptions TO service_role;
ALTER TABLE public.clinic_prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients and doctors can read prescriptions" ON public.clinic_prescriptions FOR SELECT TO authenticated USING (patient_id = auth.uid() OR public.current_user_is_clinic_doctor());
CREATE POLICY "Doctors can issue prescriptions" ON public.clinic_prescriptions FOR INSERT TO authenticated WITH CHECK (public.current_user_is_clinic_doctor());

CREATE INDEX clinic_appointments_patient_created_idx ON public.clinic_appointments (patient_id, created_at DESC);
CREATE INDEX clinic_appointments_status_date_idx ON public.clinic_appointments (status, appointment_date, appointment_time);
CREATE INDEX clinic_appointment_requests_pending_idx ON public.clinic_appointment_requests (status, created_at) WHERE status = 'pending';
CREATE INDEX clinic_appointment_history_patient_created_idx ON public.clinic_appointment_history (patient_id, created_at DESC);
CREATE INDEX clinic_prescriptions_patient_created_idx ON public.clinic_prescriptions (patient_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'clinic_appointments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_appointments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'clinic_appointment_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clinic_appointment_requests;
  END IF;
END $$;