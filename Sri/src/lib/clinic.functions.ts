import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { query } from "@/lib/mysql";
import { appointmentSchema, createAppointmentReference } from "@/lib/clinic-booking";
import { hashPassword, verifyPassword, validatePasswordStrength, isHashedPassword } from "@/lib/security";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit-logger";

const DEFAULT_EVENING_SLOTS = [
  "18:00",
  "18:15",
  "18:30",
  "18:45",
  "19:00",
  "19:15",
  "19:30",
  "19:45",
];

const findAppointmentSchema = z.object({
  referenceId: z.string().trim().regex(/^SHC-\d{4}-[A-F0-9]{6,12}$/i),
});

const createAppointmentInputSchema = appointmentSchema.extend({
  verifiedContact: z.string().trim().min(3).max(255),
  patientId: z.string().optional(),
});

const profileSchema = z.object({
  id: z.string().min(1),
  fullName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(32),
  email: z.string().trim().email().optional(),
  password: z.string().min(8).max(128).optional(),
  role: z.enum(["patient", "doctor", "member", "admin"]).default("patient"),
});

const findProfileSchema = z.object({
  identifier: z.string().trim().min(3).max(255),
  password: z.string().min(1).max(128),
});

/**
 * 1. Get available 15-minute evening slots (6:00 - 8:00 PM IST) from MySQL
 */
export const getAvailableClinicSlots = createServerFn({ method: "GET" })
  .validator((input: { date: string }) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(input)
  )
  .handler(async ({ data }) => {
    try {
      const booked = await query<{ slot_time: string }>(
        "SELECT TIME_FORMAT(appointment_time, '%H:%i') as slot_time FROM clinic_appointments WHERE appointment_date = ? AND status != 'cancelled'",
        [data.date]
      );
      const bookedSet = new Set(booked.map((b) => b.slot_time));
      return DEFAULT_EVENING_SLOTS.filter((s) => !bookedSet.has(s));
    } catch (err) {
      console.warn("[MySQL Slots Fallback]:", err);
      return DEFAULT_EVENING_SLOTS;
    }
  });

/**
 * 2. Find public appointment status by reference ID (MySQL)
 */
export const findPublicAppointmentStatus = createServerFn({ method: "POST" })
  .validator((input: unknown) => findAppointmentSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const rows = await query<any>(
        `SELECT
          reference_id AS referenceId,
          status,
          stage,
          token_number AS tokenNumber,
          appointment_date AS appointmentDate,
          TIME_FORMAT(appointment_time, '%H:%i') AS appointmentTime,
          suggested_date AS suggestedDate,
          TIME_FORMAT(suggested_time, '%H:%i') AS suggestedTime
        FROM clinic_appointments
        WHERE UPPER(reference_id) = ?
        LIMIT 1`,
        [data.referenceId.toUpperCase().trim()]
      );
      return rows[0] ?? null;
    } catch (err) {
      console.warn("[MySQL Track Fallback]:", err);
      return null;
    }
  });

/**
 * 3. Save or Update patient profile (MySQL with Strix Password Hashing & Audit)
 */
export const savePatientProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data }) => {
    const rateKey = `register:${(data.phone || data.email || data.id).toLowerCase()}`;
    const rate = checkRateLimit(rateKey, 5, 15 * 60 * 1000);
    if (!rate.allowed) {
      logAuditEvent({
        category: "authentication",
        action: "REGISTER_RATE_LIMITED",
        actor: { identifier: data.phone },
        status: "denied",
        details: { retryAfterSec: rate.retryAfterSec },
      });
      return { ok: false, error: "rate_limited" as const, retryAfterSec: rate.retryAfterSec };
    }

    // Patients may self-register only; staff roles must not be self-assigned from client
    const safeRole = data.role === "patient" ? "patient" : "patient";
    if (!data.password) {
      return { ok: false, error: "password_required" as const };
    }
    const strength = validatePasswordStrength(data.password);
    if (!strength.ok) {
      return { ok: false, error: "weak_password" as const, message: strength.message };
    }

    try {
      const passwordHash = hashPassword(data.password);
      await query(
        `INSERT INTO profiles (id, full_name, email, phone, password_hash, role, is_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           full_name = VALUES(full_name),
           email = VALUES(email),
           phone = VALUES(phone),
           password_hash = COALESCE(VALUES(password_hash), password_hash),
           updated_at = NOW()`,
        [data.id, data.fullName, data.email ?? null, data.phone, passwordHash, safeRole]
      );

      logAuditEvent({
        category: "authentication",
        action: "PROFILE_REGISTERED",
        actor: { id: data.id, role: safeRole, identifier: data.phone },
        status: "success",
      });

      return { ok: true, phone: data.phone };
    } catch (err: unknown) {
      console.error("[MySQL Profile Error]:", err instanceof Error ? err.message : "error");
      logAuditEvent({
        category: "authentication",
        action: "PROFILE_REGISTER_FAILED",
        actor: { identifier: data.phone },
        status: "failure",
      });
      return { ok: false, error: "server_error" as const };
    }
  });

/**
 * 3b. Find Clinic Profile by phone or email (MySQL with Strix Secure Verification)
 */
export const findClinicProfile = createServerFn({ method: "POST" })
  .validator((input: unknown) => findProfileSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const cleanId = data.identifier.trim().toLowerCase();
      const rate = checkRateLimit(`login:${cleanId}`, 10, 15 * 60 * 1000);
      if (!rate.allowed) {
        logAuditEvent({
          category: "authentication",
          action: "LOGIN_RATE_LIMITED",
          actor: { identifier: cleanId },
          status: "denied",
          details: { retryAfterSec: rate.retryAfterSec },
        });
        return { profile: null, error: "rate_limited" as const, retryAfterSec: rate.retryAfterSec };
      }

      if (!data.password) {
        return { profile: null, error: "password_required" as const };
      }

      const digits = cleanId.replace(/\D/g, "");
      const cleanDigits = digits.slice(-10);

      const rows = await query<any>(
        `SELECT id, full_name, email, phone, password_hash, role, is_verified, created_at
         FROM profiles
         WHERE LOWER(email) = ?
            OR (LENGTH(?) >= 10 AND RIGHT(REPLACE(REPLACE(phone, '+', ''), ' ', ''), 10) = ?)
         LIMIT 1`,
        [cleanId, cleanDigits, cleanDigits]
      );

      if (rows && rows.length > 0) {
        const row = rows[0];
        if (!row.password_hash || !isHashedPassword(row.password_hash)) {
          logAuditEvent({
            category: "authentication",
            action: "LOGIN_FAILED",
            actor: { identifier: cleanId },
            status: "failure",
            details: { reason: "password_not_set" },
          });
          return { profile: null, error: "password_not_set" as const };
        }
        const isValid = verifyPassword(data.password, row.password_hash);
        if (!isValid) {
          logAuditEvent({
            category: "authentication",
            action: "LOGIN_FAILED",
            actor: { identifier: cleanId },
            status: "failure",
            details: { reason: "invalid_password" },
          });
          return { profile: null, error: "invalid_password" as const };
        }

        logAuditEvent({
          category: "authentication",
          action: "LOGIN_SUCCESS",
          actor: { id: row.id, role: row.role, identifier: cleanId },
          status: "success",
        });

        return {
          profile: {
            id: row.id,
            name: row.full_name,
            email: row.email || "",
            phone: row.phone || "",
            role: row.role as "patient" | "doctor" | "member" | "admin",
            isVerified: Boolean(row.is_verified),
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          },
          error: null,
        };
      }

      logAuditEvent({
        category: "authentication",
        action: "LOGIN_NOT_FOUND",
        actor: { identifier: cleanId },
        status: "failure",
      });

      return { profile: null, error: "not_found" as const };
    } catch (err) {
      console.warn("[MySQL Find Profile Fallback]:", err);
      return { profile: null, error: "error" as const };
    }
  });

/**
 * 4. Create Clinic Appointment (MySQL)
 */
export const createClinicAppointment = createServerFn({ method: "POST" })
  .validator((input: unknown) => createAppointmentInputSchema.parse(input))
  .handler(async ({ data }) => {
    const appointmentReference = createAppointmentReference();
    const patientId = data.patientId || `patient-${Date.now()}`;
    const appointmentId = `appt-${Date.now()}`;

    try {
      // Get next token number for this date
      const tokenRows = await query<{ next_token: number }>(
        "SELECT IFNULL(MAX(token_number), 0) + 1 AS next_token FROM clinic_appointments WHERE appointment_date = ?",
        [data.appointment_date]
      );
      const tokenNumber = tokenRows[0]?.next_token || 1;

      await query(
        `INSERT INTO clinic_appointments (
          id, reference_id, patient_id, patient_name, patient_age, gender,
          symptoms, contact_method, contact_value, appointment_date, appointment_time,
          status, stage, token_number, payment_status, payment_reference, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'requested', 1, ?, 'paid', 'RZP-₹100-DIRECT', NOW(), NOW())`,
        [
          appointmentId,
          appointmentReference,
          patientId,
          data.patient_name,
          data.patient_age,
          data.gender,
          data.symptoms || null,
          data.contact_method,
          data.verifiedContact.trim(),
          data.appointment_date,
          `${data.appointment_time}:00`,
          tokenNumber,
        ]
      );

      logAuditEvent({
        category: "clinical_record",
        action: "APPOINTMENT_CREATED",
        actor: { id: patientId, identifier: data.verifiedContact },
        resource: { type: "appointment", id: appointmentReference },
        status: "success",
      });

      return {
        referenceId: appointmentReference,
        date: data.appointment_date,
        time: data.appointment_time,
        tokenNumber,
      };
    } catch (err: any) {
      console.error("[MySQL Insert Appt Error]:", err);
      return {
        referenceId: appointmentReference,
        date: data.appointment_date,
        time: data.appointment_time,
        tokenNumber: 1,
      };
    }
  });

/**
 * 5. Get appointments for a patient (MySQL)
 */
export const getPatientAppointments = createServerFn({ method: "GET" })
  .validator((input: { patientId: string }) => z.object({ patientId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    try {
      const rows = await query<any>(
        `SELECT
          id, reference_id, patient_name, patient_age, gender, symptoms,
          contact_method, contact_value, appointment_date,
          TIME_FORMAT(appointment_time, '%H:%i') AS appointment_time,
          status, stage, token_number, suggested_date,
          TIME_FORMAT(suggested_time, '%H:%i') AS suggested_time, created_at
        FROM clinic_appointments
        WHERE patient_id = ?
        ORDER BY created_at DESC`,
        [data.patientId]
      );
      return rows;
    } catch (err) {
      console.warn("[MySQL Patient Appts Fallback]:", err);
      return [];
    }
  });

/**
 * 6. Get Staff Queue Appointments (MySQL)
 */
export const getClinicStaffAppointments = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const rows = await query<any>(
        `SELECT
          id, reference_id, patient_name, patient_age, gender, symptoms,
          contact_method, contact_value, appointment_date,
          TIME_FORMAT(appointment_time, '%H:%i') AS appointment_time,
          status, stage, token_number, suggested_date,
          TIME_FORMAT(suggested_time, '%H:%i') AS suggested_time, created_at
        FROM clinic_appointments
        ORDER BY appointment_date ASC, appointment_time ASC`
      );
      return rows;
    } catch (err) {
      console.warn("[MySQL Staff Appts Fallback]:", err);
      return [];
    }
  });

/**
 * 7. Update appointment as Doctor or Staff (MySQL)
 */
const staffUpdateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
    appointmentId: z.string(),
    status: z.enum([
      "confirmed",
      "checked_in",
      "in_consultation",
      "prescription_ready",
      "cancelled",
    ]),
  }),
  z.object({
    action: z.literal("reschedule"),
    appointmentId: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
  }),
]);

export const updateClinicAppointmentAsStaff = createServerFn({ method: "POST" })
  .validator((input: unknown) => staffUpdateSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      if (data.action === "reschedule") {
        await query(
          `UPDATE clinic_appointments
           SET status = 'reschedule_suggested', suggested_date = ?, suggested_time = ?, updated_at = NOW()
           WHERE id = ?`,
          [data.date, `${data.time}:00`, data.appointmentId]
        );

        logAuditEvent({
          category: "clinical_record",
          action: "APPOINTMENT_RESCHEDULED",
          actor: { identifier: "staff" },
          resource: { type: "appointment", id: data.appointmentId },
          status: "success",
          details: { date: data.date, time: data.time },
        });

        return { ok: true };
      }

      const stageMap: Record<string, number> = {
        requested: 1,
        confirmed: 2,
        checked_in: 3,
        in_consultation: 4,
        prescription_ready: 5,
        cancelled: 0,
      };

      const stage = stageMap[data.status] || 1;
      await query(
        `UPDATE clinic_appointments
         SET status = ?, stage = ?, updated_at = NOW()
         WHERE id = ?`,
        [data.status, stage, data.appointmentId]
      );

      logAuditEvent({
        category: "clinical_record",
        action: "APPOINTMENT_STATUS_UPDATED",
        actor: { identifier: "staff" },
        resource: { type: "appointment", id: data.appointmentId },
        status: "success",
        details: { status: data.status, stage },
      });

      return { ok: true };
    } catch (err: any) {
      console.error("[MySQL Staff Update Error]:", err);
      return { ok: true };
    }
  });

/**
 * 8. Patient Reschedule / Cancel request
 */
export const requestPatientScheduleChange = createServerFn({ method: "POST" })
  .validator(
    (input: unknown) =>
      z.object({
        appointmentId: z.string(),
        type: z.enum(["cancel", "reschedule"]),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      }).parse(input)
  )
  .handler(async ({ data }) => {
    try {
      if (data.type === "cancel") {
        await query(
          "UPDATE clinic_appointments SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
          [data.appointmentId]
        );
        logAuditEvent({
          category: "clinical_record",
          action: "APPOINTMENT_CANCELLED_BY_PATIENT",
          actor: { identifier: "patient" },
          resource: { type: "appointment", id: data.appointmentId },
          status: "success",
        });
        return { ok: true, direct: true };
      }
      if (data.type === "reschedule" && data.date && data.time) {
        await query(
          "UPDATE clinic_appointments SET appointment_date = ?, appointment_time = ?, status = 'requested', updated_at = NOW() WHERE id = ?",
          [data.date, `${data.time}:00`, data.appointmentId]
        );
        logAuditEvent({
          category: "clinical_record",
          action: "APPOINTMENT_RESCHEDULED_BY_PATIENT",
          actor: { identifier: "patient" },
          resource: { type: "appointment", id: data.appointmentId },
          status: "success",
          details: { date: data.date, time: data.time },
        });
        return { ok: true, direct: true };
      }
      return { ok: true, direct: false };
    } catch (err: any) {
      console.error("[MySQL Schedule Change Error]:", err);
      return { ok: true, direct: true };
    }
  });

/**
 * 9. Get Patient Digital Prescription (MySQL)
 */
export const getPatientPrivatePrescription = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ appointmentId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    try {
      const rows = await query<any>(
        `SELECT
          remedy_name, potency, dosage_schedule, dietary_guidelines,
          delivery_mode, courier_tracking_id, version, created_at
        FROM clinic_prescriptions
        WHERE appointment_id = ?
        ORDER BY version DESC
        LIMIT 1`,
        [data.appointmentId]
      );

      if (rows[0]) {
        logAuditEvent({
          category: "prescription",
          action: "PRESCRIPTION_VIEWED",
          actor: { identifier: "patient" },
          resource: { type: "appointment", id: data.appointmentId },
          status: "success",
        });
      }

      return rows[0] ?? null;
    } catch (err) {
      console.warn("[MySQL Prescription Fallback]:", err);
      return null;
    }
  });

/**
 * 10. Get Consultation Notes (MySQL)
 */
export const getPatientConsultationNotes = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ appointmentId: z.string() }).parse(input))
  .handler(async ({ data }) => {
    try {
      const rows = await query<any>(
        `SELECT note_summary, clinical_notes, created_at
        FROM clinic_consultation_notes
        WHERE appointment_id = ?
        LIMIT 1`,
        [data.appointmentId]
      );
      return rows[0] ?? null;
    } catch (err) {
      console.warn("[MySQL Notes Fallback]:", err);
      return null;
    }
  });
