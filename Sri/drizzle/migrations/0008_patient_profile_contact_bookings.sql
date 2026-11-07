ALTER TABLE public.clinic_appointments DROP CONSTRAINT IF EXISTS clinic_appointments_check;
DROP POLICY IF EXISTS "Patients can request appointments with their verified contact" ON public.clinic_appointments;
DROP POLICY IF EXISTS "Patients can request appointments with their profile contact" ON public.clinic_appointments;
CREATE POLICY "Patients can request appointments with their profile contact" ON public.clinic_appointments FOR INSERT TO authenticated WITH CHECK (
  patient_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(coalesce(p.email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND ((contact_method = 'email' AND lower(p.email) = lower(contact_value))
        OR (contact_method = 'phone' AND p.phone = contact_value))
  )
);