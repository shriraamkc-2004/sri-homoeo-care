import { useState } from "react";
import { toast } from "sonner";
import {
  Shield, CreditCard, Users, Clock3, CalendarDays,
  TrendingUp, Download, CheckCircle2, Settings, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ClinicUser, AppointmentRecord } from "@/lib/types/clinic-types";
import { getStoredAppointments, getStoredUsers } from "@/lib/clinic-auth";
import { formatIstTime } from "@/lib/clinic-booking";

interface AdminPortalProps {
  locale: "en" | "ta";
}

export function AdminPortal({ locale }: AdminPortalProps) {
  const isTa = locale === "ta";
  const [appointments, setAppointments] = useState<AppointmentRecord[]>(() => getStoredAppointments());
  const [users, setUsers] = useState<ClinicUser[]>(() => getStoredUsers());

  // Financial stats
  const totalCollections = appointments.filter((a) => a.paymentStatus === "paid").length * 100;
  const completedAppointments = appointments.filter((a) => a.stage === 5).length;
  const patientsCount = users.filter((u) => u.role === "patient").length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Admin Master Header */}
      <Card className="p-5 glass rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 depth-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-[oklch(0.82_0.12_85)]" />
              {isTa ? "நிர்வாகி கட்டுப்பாட்டு மையம்" : "Admin Master Console"}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[oklch(0.82_0.12_85)]/15 text-[oklch(0.82_0.12_85)] border border-[oklch(0.82_0.12_85)]/30">
              Master Admin
            </span>
          </div>
          <p className="text-xs text-[oklch(0.82_0.12_85)]/90 font-medium">
            Sri Homoeo Care · Complete Oversight, Financials & Operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="gold"
            onClick={() => toast.success("All daily transaction logs exported as CSV.")}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {isTa ? "நிதி அறிக்கை (CSV)" : "Export Financials (CSV)"}
          </Button>
        </div>
      </Card>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 perspective-1000">
        <Card className="p-4 glass rounded-xl card-3d">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span className="uppercase tracking-wide">{isTa ? "நேரடி முன்பதிவுகள்" : "Direct Bookings"}</span>
            <CalendarDays className="w-4 h-4 text-primary" />
          </div>
          <div className="font-display text-2xl font-bold text-gradient-primary font-mono">{appointments.length}</div>
          <p className="text-[10px] text-muted-foreground mt-1">{isTa ? "நேரலை சந்திப்புகள்" : "Online Appointments"}</p>
        </Card>

        <Card className="p-4 glass rounded-xl card-3d">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span className="uppercase tracking-wide">{isTa ? "முன்பதிவுகள்" : "Consultations"}</span>
            <CalendarDays className="w-4 h-4 text-primary" />
          </div>
          <div className="font-display text-2xl font-bold text-foreground">{appointments.length}</div>
          <p className="text-[10px] text-muted-foreground mt-1">{completedAppointments} Completed</p>
        </Card>

        <Card className="p-4 glass rounded-xl card-3d">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span className="uppercase tracking-wide">{isTa ? "நோயாளிகள்" : "Patients"}</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="font-display text-2xl font-bold text-foreground">{patientsCount}</div>
          <p className="text-[10px] text-muted-foreground mt-1">Verified OTP Accounts</p>
        </Card>

        <Card className="p-4 glass rounded-xl card-3d">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span className="uppercase tracking-wide">{isTa ? "நேரம்" : "Hours"}</span>
            <Clock3 className="w-4 h-4 text-[oklch(0.82_0.12_85)]" />
          </div>
          <div className="font-display text-sm font-bold text-gradient-gold font-mono mt-1">6:00 – 8:00 PM IST</div>
          <p className="text-[10px] text-primary mt-1">● Online Telemedicine Active</p>
        </Card>
      </div>

      {/* Financial Transactions Audit Table */}
      <Card className="p-5 glass rounded-2xl space-y-4 depth-1">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            {isTa ? "ஆலோசனை முன்பதிவு பட்டியல்" : "Consultation Bookings Audit"}
          </h3>
          <span className="text-xs font-mono text-primary font-bold">
            {appointments.length} Consultations Scheduled
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No transactions recorded yet. Once patients book online, verified receipts will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2 font-semibold">Payment ID</th>
                  <th className="pb-2 font-semibold">Patient Name</th>
                  <th className="pb-2 font-semibold">Date & Time</th>
                  <th className="pb-2 font-semibold">Amount</th>
                  <th className="pb-2 font-semibold">Method</th>
                  <th className="pb-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {appointments.map((a) => (
                  <tr key={a.id} className="text-muted-foreground hover:bg-secondary/40">
                    <td className="py-2.5 font-mono text-[oklch(0.82_0.12_85)]">{a.paymentId}</td>
                    <td className="py-2.5 font-bold text-foreground">{a.patientName}</td>
                    <td className="py-2.5 text-muted-foreground">
                      {a.date} · {formatIstTime(a.slotTime)}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-primary">₹{a.consultationFee}.00</td>
                    <td className="py-2.5 font-mono text-[11px] text-muted-foreground">
                      {a.paymentMethod.replace("_", " ").toUpperCase()}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        Captured
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Team Hierarchy & Care Management */}
      <Card className="p-5 border-border bg-card rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" />
          {isTa ? "கேர் குழு மேலாண்மை (Team Roles)" : "Care Team Roster & Access"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-border bg-secondary/70 space-y-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
              Doctor
            </span>
            <h4 className="text-sm font-bold text-foreground pt-1">Dr. Sriindhuja C</h4>
            <p className="text-xs text-muted-foreground">BHMS, MSc (Psychology) · Reg. 5397</p>
            <p className="text-[11px] text-primary font-mono">doctor@srihomoeocare.com</p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-secondary/70 space-y-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-[oklch(0.82_0.12_85)] border border-amber-800">
              Admin (You)
            </span>
            <h4 className="text-sm font-bold text-foreground pt-1">Master Administrator</h4>
            <p className="text-xs text-muted-foreground">Care Owner & Management</p>
            <p className="text-[11px] text-[oklch(0.82_0.12_85)] font-mono">admin@srihomoeocare.com</p>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-secondary/70 space-y-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
              Operations Member
            </span>
            <h4 className="text-sm font-bold text-foreground pt-1">Care Operations Member</h4>
            <p className="text-xs text-muted-foreground">Onboarding & Medicine Courier Dispatch</p>
            <p className="text-[11px] text-primary font-mono">member@srihomoeocare.com</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

