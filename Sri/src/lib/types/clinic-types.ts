export type UserRole = "admin" | "doctor" | "member" | "patient";

export interface ClinicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  age?: number;
  gender?: "female" | "male" | "child" | "other";
  city?: string;
  createdAt: string;
}

export type AppointmentStage =
  | 1 // 1. Booking & ₹100 Paid
  | 2 // 2. Confirmed by Doctor
  | 3 // 3. Token Called / Prepare for WhatsApp Call
  | 4 // 4. Consultation in Progress (WhatsApp Call Active)
  | 5; // 5. Completed & Prescription Ready

export type ConsultationMode = "online" | "in_clinic";

export type DeliveryMethod = "local_pharmacy" | "clinic_courier";

export interface PrescriptionMedicine {
  id: string;
  name: string; // e.g. "Arnica Montana 200CH"
  potency: string; // e.g. "200CH", "30CH", "1M"
  form: string; // e.g. "Sweet Globules (Sugar Pills)"
  dosage: string; // e.g. "4 globules twice daily before meals"
  duration: string; // e.g. "14 Days"
  notes?: string;
}

export interface DigitalPrescription {
  id: string;
  referenceId: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorName: string;
  doctorQualifications: string;
  doctorRegNo: string;
  date: string;
  medicines: PrescriptionMedicine[];
  dietaryRestrictions: string[];
  doctorAdvice?: string;
  deliveryMethod?: DeliveryMethod;
  shippingAddress?: string;
  courierProvider?: string; // e.g. "India Post", "DTDC"
  courierTrackingNumber?: string;
}

export interface AppointmentRecord {
  id: string;
  referenceId: string; // e.g. "SHC-2026-8A41D2"
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientAge: number;
  patientGender: "female" | "male" | "child" | "other";
  chiefSymptoms: string;
  date: string; // e.g. "2026-11-07"
  slotTime: string; // e.g. "18:30"
  mode: ConsultationMode; // "online" (active) or "in_clinic" (dummy)
  tokenNumber: number; // e.g. 4
  stage: AppointmentStage;
  consultationFee: number; // 100
  paymentStatus: "paid" | "pending";
  paymentMethod: "razorpay_upi" | "razorpay_card" | "assisted_cash" | "direct";
  paymentId: string; // e.g. "pay_Rzp_948123"
  paymentTime: string;
  prescription?: DigitalPrescription;
  rescheduledFrom?: string;
  createdAt: string;
}

export interface ClinicStats {
  todayTotalAppointments: number;
  todayCompleted: number;
  todayActiveToken: number;
  todayServingToken: number;
  todayRevenue: number;
  totalPatientsCount: number;
}

