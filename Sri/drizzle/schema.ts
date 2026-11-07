import {
  mysqlTable,
  varchar,
  int,
  text,
  mysqlEnum,
  boolean,
  datetime,
  date,
  time,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * =====================================================================
 * AUTO-ONTOLOGY SEMANTIC LAYER: SRI HOMOEO CLINIC DATA MODEL
 * =====================================================================
 */

/**
 * 1. Profiles (Patients, Doctor, Staff, Admin)
 */
export const profiles = mysqlTable("profiles", {
  id: varchar("id", { length: 64 }).primaryKey(),
  fullName: varchar("full_name", { length: 120 }).notNull(),
  email: varchar("email", { length: 120 }),
  phone: varchar("phone", { length: 32 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  role: mysqlEnum("role", ["patient", "doctor", "member", "admin"]).default("patient").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  appointments: many(clinicAppointments),
  prescriptions: many(clinicPrescriptions),
  consultationNotes: many(clinicConsultationNotes),
}));

/**
 * 2. Clinic Appointments (Consultation Queues, Tokens, 15-Min Slots)
 */
export const clinicAppointments = mysqlTable("clinic_appointments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  referenceId: varchar("reference_id", { length: 32 }).notNull().unique(),
  patientId: varchar("patient_id", { length: 64 }).notNull(),
  patientName: varchar("patient_name", { length: 120 }).notNull(),
  patientAge: int("patient_age").default(30).notNull(),
  gender: varchar("gender", { length: 20 }).default("other").notNull(),
  symptoms: text("symptoms"),
  contactMethod: mysqlEnum("contact_method", ["phone", "whatsapp", "email"]).default("whatsapp").notNull(),
  contactValue: varchar("contact_value", { length: 120 }).notNull(),
  appointmentDate: date("appointment_date").notNull(),
  appointmentTime: time("appointment_time").notNull(),
  status: mysqlEnum("status", [
    "requested",
    "confirmed",
    "checked_in",
    "in_consultation",
    "prescription_ready",
    "reschedule_suggested",
    "cancelled",
  ]).default("requested").notNull(),
  stage: int("stage").default(1).notNull(),
  tokenNumber: int("token_number").default(1).notNull(),
  paymentStatus: mysqlEnum("payment_status", ["unpaid", "paid", "refunded"]).default("paid").notNull(),
  paymentReference: varchar("payment_reference", { length: 64 }).default("RZP-₹100-DIRECT"),
  suggestedDate: date("suggested_date"),
  suggestedTime: time("suggested_time"),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const clinicAppointmentsRelations = relations(clinicAppointments, ({ one, many }) => ({
  patient: one(profiles, {
    fields: [clinicAppointments.patientId],
    references: [profiles.id],
  }),
  prescriptions: many(clinicPrescriptions),
  consultationNotes: many(clinicConsultationNotes),
}));

/**
 * 3. Clinic Prescriptions & Diet Vault
 */
export const clinicPrescriptions = mysqlTable("clinic_prescriptions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  appointmentId: varchar("appointment_id", { length: 64 }).notNull(),
  patientId: varchar("patient_id", { length: 64 }).notNull(),
  remedyName: varchar("remedy_name", { length: 120 }).notNull(),
  potency: varchar("potency", { length: 32 }).notNull(),
  dosageSchedule: text("dosage_schedule").notNull(),
  dietaryGuidelines: text("dietary_guidelines"),
  deliveryMode: mysqlEnum("delivery_mode", ["pdf_download", "clinic_courier"]).default("pdf_download").notNull(),
  courierAddress: text("courier_address"),
  courierTrackingId: varchar("courier_tracking_id", { length: 64 }),
  version: int("version").default(1).notNull(),
  createdAt: datetime("created_at").notNull(),
});

export const clinicPrescriptionsRelations = relations(clinicPrescriptions, ({ one }) => ({
  appointment: one(clinicAppointments, {
    fields: [clinicPrescriptions.appointmentId],
    references: [clinicAppointments.id],
  }),
  patient: one(profiles, {
    fields: [clinicPrescriptions.patientId],
    references: [profiles.id],
  }),
}));

/**
 * 4. Consultation Notes (Holistic & Psychology Case Taking)
 */
export const clinicConsultationNotes = mysqlTable("clinic_consultation_notes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  appointmentId: varchar("appointment_id", { length: 64 }).notNull(),
  patientId: varchar("patient_id", { length: 64 }).notNull(),
  noteSummary: text("note_summary").notNull(),
  clinicalNotes: text("clinical_notes").notNull(),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const clinicConsultationNotesRelations = relations(clinicConsultationNotes, ({ one }) => ({
  appointment: one(clinicAppointments, {
    fields: [clinicConsultationNotes.appointmentId],
    references: [clinicAppointments.id],
  }),
  patient: one(profiles, {
    fields: [clinicConsultationNotes.patientId],
    references: [profiles.id],
  }),
}));

/**
 * 5. 3-Minute Clash-Free OTP Verifications
 */
export const otpVerifications = mysqlTable("otp_verifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  identifier: varchar("identifier", { length: 120 }).notNull(),
  otpCode: varchar("otp_code", { length: 6 }).notNull(),
  purpose: mysqlEnum("purpose", ["login", "register"]).default("register").notNull(),
  expiresAt: datetime("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  createdAt: datetime("created_at").notNull(),
});
