import type { ClinicUser, UserRole, AppointmentRecord, DigitalPrescription } from "./types/clinic-types";

const ACTIVE_USER_KEY = "shc_active_user_v2";
const APPOINTMENTS_KEY = "shc_clinic_appointments_v2";
const USERS_KEY = "shc_registered_users_v2";

export const INITIAL_TEAM_USERS: ClinicUser[] = [];

const DEMO_USER_IDS = new Set(["user-admin", "user-doctor", "user-member", "patient-demo"]);

export function getStoredUsers(): ClinicUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: ClinicUser[] = JSON.parse(raw);
    const cleaned = parsed.filter((u) => !DEMO_USER_IDS.has(u.id));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(USERS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveUser(user: ClinicUser) {
  if (typeof window === "undefined") return;
  const users = getStoredUsers().filter((u) => u.id !== user.id && u.phone !== user.phone && u.email !== user.email);
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getActiveUser(): ClinicUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_USER_KEY);
    if (!raw) return null;
    const user: ClinicUser = JSON.parse(raw);
    if (DEMO_USER_IDS.has(user.id)) {
      localStorage.removeItem(ACTIVE_USER_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function setActiveUser(user: ClinicUser | null) {
  if (typeof window === "undefined") return;
  if (!user || DEMO_USER_IDS.has(user.id)) {
    localStorage.removeItem(ACTIVE_USER_KEY);
  } else {
    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
  }
}

// -------------------------------------------------------------
// Appointments Storage & Queries
// -------------------------------------------------------------
export function getStoredAppointments(): AppointmentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPOINTMENTS_KEY);
    if (!raw) return [];
    const parsed: AppointmentRecord[] = JSON.parse(raw);
    const cleaned = parsed.filter((a) => a.patientId !== "patient-demo" && a.id !== "appt-sample-01");
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveAppointment(record: AppointmentRecord) {
  if (typeof window === "undefined") return;
  const list = getStoredAppointments().filter((r) => r.id !== record.id);
  list.push(record);
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(list));
}

export function getPatientAppointments(patientId: string): AppointmentRecord[] {
  return getStoredAppointments().filter((r) => r.patientId === patientId);
}

export function getTodayServingToken(): number {
  const list = getStoredAppointments();
  return list.find((a) => a.stage === 4)?.tokenNumber ?? list.find((a) => a.stage === 3)?.tokenNumber ?? 1;
}

export function getNextTokenNumber(dateStr: string): number {
  const forDate = getStoredAppointments().filter((a) => a.date === dateStr);
  return forDate.length ? Math.max(...forDate.map((a) => a.tokenNumber)) + 1 : 1;
}

