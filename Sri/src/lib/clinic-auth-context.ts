import { createContext, useContext } from "react";
import type { ClinicUser } from "@/lib/types/clinic-types";

export const ClinicAuthContext = createContext<ClinicUser | null>(null);

export function useClinicUser(): ClinicUser | null {
  return useContext(ClinicAuthContext);
}
