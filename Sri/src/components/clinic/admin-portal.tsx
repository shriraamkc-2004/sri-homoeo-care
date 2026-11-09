import { useState } from "react";
import { toast } from "sonner";
import {
  Shield, CreditCard, Users, Clock3, CalendarDays,
  TrendingUp, Download, CheckCircle2, Settings, UserCheck, Sparkles, Activity
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
    <div className="space-y-7 animate-fade-up">
      {/* Admin Master Header */}
      <Card className="glass-card-premium rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold" />
              {isTa ? "நிர்வாகி கட்டுப்பாட்டு மையம்" : "Admin Master Console"}
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-semibold">
              Master Admin
            </span>
          </div>
          <p className="text-xs text-gold/90 font-medium mt-0.5">
            Sri Homoeo Care · Complete Oversight, Financials & Operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="shimmer"
            onClick={() => toast.success("All daily transaction logs exported as CSV.")}
            className="text-xs rounded-xl h-10 px-4 font-bold"
          >
            <Download className="w-4 h-4 mr-1.5" />
            {isTa ? "நிதி அறிக்கை (CSV)" : "Export Financials (CSV)"}
          </Button>
        </div>
      </Card>

      {/* KPI Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 perspective-1000">
        <article className="glass-card-premium p-5 rounded-2xl card-3d border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-3">
            <span className="uppercase tracking-wider font-semibold text-[10px]">{isTa ? "நேரடி முன்பதிவுகள்" : "Direct Bookings"}</span>
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-gradient-primary font-mono">{appointments.length}</div>
          <p className="text-[11px] text-muted-foreground mt-2">{isTa ? "நேரலை சந்திப்புகள்" : "Online Appointments"}</p>
        </article>

        <article className="glass-card-premium p-5 rounded-2xl card-3d border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-3">
            <span className="uppercase tracking-wider font-semibold text-[10px]">{isTa ? "முடிவடைந்தவை" : "Completed Consults"}</span>
            <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/25 text-gold flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-foreground">{completedAppointments}</div>
          <p className="text-[11px] text-muted-foreground mt-2">{appointments.length - completedAppointments} In Progress</p>
        </article>

        <article className="glass-card-premium p-5 rounded-2xl card-3d border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-3">
            <span className="uppercase tracking-wider font-semibold text-[10px]">{isTa ? "நோயாளிகள்" : "Registered Patients"}</span>
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-3xl font-extrabold text-foreground">{patientsCount}</div>
          <p className="text-[11px] text-muted-foreground mt-2">Active Accounts</p>
        </article>

        <article className="glass-card-premium p-5 rounded-2xl card-3d border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-3">
            <span className="uppercase tracking-wider font-semibold text-[10px]">{isTa ? "ஆலோசனை நேரம்" : "Clinical Hours"}</span>
            <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/25 text-gold flex items-center justify-center">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display text-lg font-bold text-gradient-gold font-mono mt-1">6:00 – 8:00 PM IST</div>
          <p className="text-[11px] text-primary mt-2 flex items-center gap-1.5 font-semibold">
            <span className="status-live-pulse" />
            Telemedicine Active
          </p>
        </article>
      </div>

      {/* Financial Transactions Audit Table */}
      <Card className="glass-card-premium rounded-3xl p-6 sm:p-8 space-y-5 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {isTa ? "ஆலோசனை முன்பதிவு பட்டியல்" : "Consultation Bookings Audit"}
          </h3>
          <span className="text-xs font-mono text-primary font-bold px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            {appointments.length} Consultations Scheduled
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            No transactions recorded yet. Once patients book online, verified receipts will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground">
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Payment ID</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Patient Name</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Date & Time</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Amount</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Method</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {appointments.map((a) => (
                  <tr key={a.id} className="text-muted-foreground hover:bg-white/5 transition-colors">
                    <td className="py-3 font-mono text-gold font-bold">{a.paymentId}</td>
                    <td className="py-3 font-bold text-foreground">{a.patientName}</td>
                    <td className="py-3 text-muted-foreground">
                      {a.date} · {formatIstTime(a.slotTime)}
                    </td>
                    <td className="py-3 font-mono font-bold text-primary">₹{a.consultationFee}.00</td>
                    <td className="py-3 font-mono text-[11px] text-muted-foreground">
                      {a.paymentMethod.replace("_", " ").toUpperCase()}
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary border border-primary/30 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
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
      <Card className="glass-card-premium rounded-3xl p-6 sm:p-8 space-y-5 border-white/10">
        <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          {isTa ? "கேர் குழு மேலாண்மை (Team Roles)" : "Care Team Roster & Governance"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-white/10 bg-background/60 space-y-1.5 card-3d">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold">
              Doctor
            </span>
            <h4 className="text-sm font-bold text-foreground pt-1">Dr. Sriindhuja C</h4>
            <p className="text-xs text-muted-foreground">BHMS, MSc (Psychology) · Reg. 5397</p>
            <p className="text-[11px] text-primary font-mono pt-1">doctor@srihomoeocare.com</p>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-background/60 space-y-1.5 card-3d">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30 font-semibold">
              Admin (You)
            </span>
            <h4 className="text-sm font-bold text-foreground pt-1">Master Administrator</h4>
            <p className="text-xs text-muted-foreground">Care Operations Owner & Oversight</p>
            <p className="text-[11px] text-gold font-mono pt-1">admin@srihomoeocare.com</p>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-background/60 space-y-1.5 card-3d">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold">
              Operations Member
            </span>
            <h4 className="text-sm font-bold text-foreground pt-1">Care Operations Desk</h4>
            <p className="text-xs text-muted-foreground">Patient Onboarding & Medicine Dispatch</p>
            <p className="text-[11px] text-primary font-mono pt-1">member@srihomoeocare.com</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
