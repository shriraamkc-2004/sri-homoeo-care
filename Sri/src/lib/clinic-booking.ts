import { z } from "zod";

const contactValueSchema = z.string().trim().min(3).max(255);

export const appointmentSchema = z.object({
  patient_name: z.string().trim().min(1, "Enter your name").max(100),
  contact_method: z.enum(["phone", "email"]),
  contact_value: contactValueSchema,
  patient_age: z.coerce.number().int().min(1).max(120),
  gender: z.enum(["female", "male", "other", "prefer_not_to_say"]),
  symptoms: z.string().trim().min(1, "Share your main concern").max(2000),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointment_time: z.string().regex(/^\d{2}:\d{2}$/),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;

export function normalizeContact(value: string, method: "phone" | "email") {
  return method === "email" ? value.trim().toLowerCase() : value.trim().replace(/[\s()-]/g, "");
}

export function contactMatchesVerifiedIdentity(
  input: Pick<AppointmentInput, "contact_method" | "contact_value">,
  verified: { email?: string | null; phone?: string | null },
) {
  const submitted = normalizeContact(input.contact_value, input.contact_method);
  const claimed = verified[input.contact_method];
  return Boolean(claimed && submitted === normalizeContact(claimed, input.contact_method));
}

export function createAppointmentReference(
  date = new Date(),
  randomUUID: () => string = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 14)
) {
  const year = new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
  return `SHC-${year}-${suffix}`;
}

export function availableEveningSlots() {
  return ["18:00", "18:15", "18:30", "18:45", "19:00", "19:15", "19:30", "19:45"];
}

export function formatIstTime(value: string) {
  const [hoursText, minutes] = value.split(":");
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${suffix}`;
}

export function isSameDayOrFutureInIst(value: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const today = `${values["year"]}-${values["month"]}-${values["day"]}`;
  return value >= today;
}