ALTER TABLE public.clinic_appointments DROP CONSTRAINT IF EXISTS clinic_appointments_check;
DROP POLICY IF EXISTS "Patients can request appointments with their verified contact" ON public.clinic_appointments;
CREATE POLICY "Patients can request appointments with their verified contact" ON public.clinic_appointments FOR INSERT TO authenticated WITH CHECK (
  patient_id = auth.uid() AND
  ((contact_method = 'email' AND lower(contact_value) = lower(coalesce(auth.jwt() ->> 'email', ''))) OR
   (contact_method = 'phone' AND contact_value = coalesce(auth.jwt() ->> 'phone', '')))
);