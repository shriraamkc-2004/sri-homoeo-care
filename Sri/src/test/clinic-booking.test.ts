import { describe, expect, it } from "vitest";
import {
  availableEveningSlots,
  contactMatchesVerifiedIdentity,
  createAppointmentReference,
  formatIstTime,
  isSameDayOrFutureInIst,
} from "@/lib/clinic-booking";

describe("Sri Homoeo Care booking rules", () => {
  it("offers daily evening slots from 6 to 8 p.m. in 15-minute steps", () => {
    expect(availableEveningSlots()).toEqual([
      "18:00", "18:15", "18:30", "18:45",
      "19:00", "19:15", "19:30", "19:45"
    ]);
  });

  it("uses a year-specific SHC reference ID", () => {
    expect(createAppointmentReference(new Date("2026-01-01T00:00:00Z"), () => "12345678-abcd-4ef0-9abc-123456789012"))
      .toBe("SHC-2026-12345678ABCD");
  });

  it("formats appointment times in 12-hour display", () => {
    expect(formatIstTime("18:00")).toBe("6:00 PM");
  });

  it("only matches the contact method verified on the signed-in identity", () => {
    expect(contactMatchesVerifiedIdentity({ contact_method: "email", contact_value: " PATIENT@EXAMPLE.COM " }, { email: "patient@example.com" })).toBe(true);
    expect(contactMatchesVerifiedIdentity({ contact_method: "phone", contact_value: "+91 98765 43210" }, { phone: "+919876543210" })).toBe(true);
    expect(contactMatchesVerifiedIdentity({ contact_method: "phone", contact_value: "+919876543210" }, { email: "patient@example.com" })).toBe(false);
  });

  it("recognizes the local clinic date for appointment selection", () => {
    expect(isSameDayOrFutureInIst("2026-11-06", new Date("2026-11-06T02:00:00Z"))).toBe(true);
    expect(isSameDayOrFutureInIst("2026-11-05", new Date("2026-11-06T02:00:00Z"))).toBe(false);
  });
});