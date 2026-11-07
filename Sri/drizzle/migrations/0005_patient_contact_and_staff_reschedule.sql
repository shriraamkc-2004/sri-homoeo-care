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
CREATE POLICY "Patients can create pending reschedule requests" ON public.clinic_appointment_requests FOR INSERT TO authenticated WITH CHECK (
  patient_id = auth.uid() AND status = 'pending' AND EXISTS (
    SELECT 1 FROM public.clinic_appointments a WHERE a.id = appointment_id AND a.patient_id = auth.uid()
  )
);
