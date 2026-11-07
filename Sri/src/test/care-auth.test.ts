import { describe, expect, it, beforeEach } from "vitest";
import { getStoredUsers, saveUser, setActiveUser, getActiveUser } from "@/lib/clinic-auth";
import type { ClinicUser } from "@/lib/types/clinic-types";

describe("Sri Homoeo Care Authentication & Session Consistency", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and retrieves a newly registered patient", () => {
    const newPatient: ClinicUser = {
      id: "pat-123456",
      name: "Senthil Kumar",
      phone: "+919876543210",
      email: "senthil@example.com",
      role: "patient",
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    saveUser(newPatient);
    const users = getStoredUsers();
    expect(users).toHaveLength(1);
    expect(users[0]?.name).toBe("Senthil Kumar");
    expect(users[0]?.phone).toBe("+919876543210");
  });

  it("manages active user session correctly without guest leaks", () => {
    expect(getActiveUser()).toBeNull();

    const patient: ClinicUser = {
      id: "pat-999",
      name: "Lakshmi Narayanan",
      phone: "+919443726526",
      email: "lakshmi@example.com",
      role: "patient",
      isVerified: true,
      createdAt: new Date().toISOString(),
    };

    setActiveUser(patient);
    const active = getActiveUser();
    expect(active).not.toBeNull();
    expect(active?.name).toBe("Lakshmi Narayanan");
    expect(active?.role).toBe("patient");

    setActiveUser(null);
    expect(getActiveUser()).toBeNull();
  });

  it("preserves updated patient profiles on re-saving", () => {
    const patient: ClinicUser = {
      id: "pat-100",
      name: "Original Name",
      phone: "+919791426526",
      email: "test@example.com",
      role: "patient",
      isVerified: true,
      createdAt: new Date().toISOString(),
    };
    saveUser(patient);

    const updated: ClinicUser = {
      ...patient,
      name: "Updated Name",
    };
    saveUser(updated);

    const users = getStoredUsers();
    expect(users).toHaveLength(1);
    expect(users[0]?.name).toBe("Updated Name");
  });
});
