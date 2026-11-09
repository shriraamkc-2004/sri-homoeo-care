import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Stethoscope, Phone, Clock3, CheckCircle2, User,
  Plus, FileText, Check, AlertCircle, ChevronRight, MessageSquare, Sparkles, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { AppointmentRecord, DigitalPrescription, PrescriptionMedicine } from "@/lib/types/clinic-types";
import { formatIstTime } from "@/lib/clinic-booking";
import { getStoredAppointments, saveAppointment } from "@/lib/clinic-auth";

interface DoctorPortalProps {
  locale: "en" | "ta";
}

const COMMON_REMEDIES = [
  "Arnica Montana", "Bryonia Alba", "Nux Vomica", "Pulsatilla",
  "Rhus Toxicodendron", "Sulphur", "Arsenicum Album", "Belladonna",
  "Calcarea Carbonica", "Lycopodium", "Natrum Muriaticum", "Sepia",
  "Gelsemium", "Ignatia Amara", "Thuja Occidentalis"
];

const POTENCIES = ["30CH", "200CH", "1M", "10M", "6X", "12X", "Mother Tincture (Q)"];

const DOSAGE_PRESETS = [
  "4 sweet globules dry on tongue, twice daily before meals",
  "4 sweet globules dry on tongue, thrice daily before meals",
  "4 sweet globules dry on tongue, once daily at bedtime",
  "4 sweet globules morning empty stomach",
  "SOS / 4 globules as needed during acute symptoms",
];

export function DoctorPortal({ locale }: DoctorPortalProps) {
  const isTa = locale === "ta";
  const [appointments, setAppointments] = useState<AppointmentRecord[]>(() => getStoredAppointments());
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);

  // Prescription Builder State
  const [showRxBuilder, setShowRxBuilder] = useState(false);
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([
    {
      id: "med-1",
      name: "Arnica Montana",
      potency: "200CH",
      form: "Sweet Globules (Sugar Pills)",
      dosage: DOSAGE_PRESETS[0] ?? "4 globules 3 times daily before food",
      duration: "14 Days",
    },
  ]);
  const [doctorAdvice, setDoctorAdvice] = useState("Avoid raw onion, garlic, coffee, and camphor within 30 minutes of taking medicine.");

  const todayStr = new Date().toISOString().slice(0, 10);

  // Group appointments for today
  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === todayStr || true) // Show all recent appointments
      .sort((a, b) => a.tokenNumber - b.tokenNumber);
  }, [appointments, todayStr]);

  const activeInCall = todayAppointments.find((a) => a.stage === 4);
  const completedCount = todayAppointments.filter((a) => a.stage === 5).length;

  function advanceStage(record: AppointmentRecord, targetStage: 1 | 2 | 3 | 4 | 5) {
    const updated: AppointmentRecord = { ...record, stage: targetStage };
    saveAppointment(updated);
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

    if (targetStage === 3) {
      toast.info(isTa ? `டோக்கன் #${record.tokenNumber} அழைக்கப்பட்டது! நோயாளிக்கு அறிவிக்கப்பட்டது.` : `Token #${record.tokenNumber} called! Patient notified to prepare.`);
    } else if (targetStage === 4) {
      toast.success(isTa ? `WhatsApp ஆலோசனை தொடங்கப்பட்டது!` : `Consultation in progress with ${record.patientName}`);
    }
  }

  function handleStartWhatsAppCall(record: AppointmentRecord) {
    advanceStage(record, 4);
    const cleanPhone = record.patientPhone.replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `Hello ${record.patientName}, this is Dr. Sriindhuja C from Sri Homoeo Care. I am initiating your online consultation now.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  }

  function handleAddMedicine() {
    setMedicines((prev) => [
      ...prev,
      {
        id: `med-${Date.now()}`,
        name: "Bryonia Alba",
        potency: "30CH",
        form: "Sweet Globules (Sugar Pills)",
        dosage: DOSAGE_PRESETS[1] ?? "4 globules morning & night before food",
        duration: "14 Days",
      },
    ]);
  }

  function handleRemoveMedicine(id: string) {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  }

  function handleIssuePrescription() {
    if (!selectedAppointment) return;

    const prescription: DigitalPrescription = {
      id: `rx-${Date.now()}`,
      referenceId: selectedAppointment.referenceId,
      patientId: selectedAppointment.patientId,
      patientName: selectedAppointment.patientName,
      patientAge: selectedAppointment.patientAge,
      patientGender: selectedAppointment.patientGender,
      doctorName: "Dr. Sriindhuja C",
      doctorQualifications: "BHMS, MSc (Psychology)",
      doctorRegNo: "5397",
      date: new Date().toISOString().slice(0, 10),
      medicines,
      dietaryRestrictions: [
        "Avoid raw onion, garlic, and hing within 30 mins before/after globules.",
        "Avoid camphor, strong eucalyptus balms, and menthol inhalers.",
        "Do not touch globules with bare fingers. Dissolve dry on clean tongue.",
      ],
      doctorAdvice,
      deliveryMethod: "local_pharmacy", // default, patient can choose courier in vault
    };

    const updated: AppointmentRecord = {
      ...selectedAppointment,
      stage: 5, // Completed
      prescription,
    };

    saveAppointment(updated);
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setShowRxBuilder(false);
    toast.success(
      isTa
        ? `மருந்து சீட்டு கையொப்பமிடப்பட்டு நோயாளிக்கு அனுப்பப்பட்டது!`
        : `Prescription signed and issued to ${selectedAppointment.patientName}!`
    );
  }

  return (
    <div className="space-y-7 animate-fade-up">
      {/* Doctor Header Banner */}
      <Card className="glass-card-premium rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl border-2 border-gold/40 bg-white p-1.5 flex items-center justify-center shrink-0 shadow-lg shadow-gold/15">
            <img src="/sri-homeo-care-logo.png" alt="Sri Homoeo Care" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-xl font-bold text-foreground">Dr. Sriindhuja C</h2>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold">
                Reg. 5397
              </span>
            </div>
            <p className="text-xs text-primary font-medium mt-0.5">
              Doctor Clinical Desk · Evening Consultations (6:00 – 8:00 p.m. IST)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-start sm:justify-end">
          <div className="px-4 py-2.5 rounded-2xl glass-card-premium border-white/10 text-center min-w-[80px]">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Scheduled</div>
            <div className="font-display text-xl font-bold text-foreground">{todayAppointments.length}</div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl glass-card-premium border-white/10 text-center min-w-[80px]">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Completed</div>
            <div className="font-display text-xl font-bold text-primary">{completedCount}</div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl glass-card-premium border-white/10 text-center min-w-[80px]">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Fees</div>
            <div className="font-display text-xl font-bold text-gold font-mono">₹{todayAppointments.length * 100}</div>
          </div>
        </div>
      </Card>

      {/* Patient Queue Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Clock3 className="w-4 h-4 text-primary" />
            {isTa ? "இன்றைய மாலை ஆலோசனை வரிசை (6:00 – 8:00 PM)" : "Evening Care Queue (6:00 – 8:00 p.m. IST)"}
          </h3>
          <span className="text-xs font-mono text-muted-foreground px-3 py-1 rounded-full bg-background/50 border border-border/50">
            {todayAppointments.length} Patients Booked
          </span>
        </div>

        {todayAppointments.length === 0 ? (
          <Card className="glass-card-premium p-10 text-center text-muted-foreground text-sm rounded-3xl border-white/10">
            No consultations booked yet for this evening.
          </Card>
        ) : (
          todayAppointments.map((apt) => {
            const isCompleted = apt.stage === 5;
            const isInCall = apt.stage === 4;
            const isCalled = apt.stage === 3;

            return (
              <Card
                key={apt.id}
                className={`p-5 md:p-6 transition-all duration-300 rounded-3xl card-3d ${
                  isInCall
                    ? "border-primary/60 bg-primary/10 shadow-[0_0_30px_rgba(38,198,166,0.2)]"
                    : isCalled
                    ? "border-gold/50 bg-gold/10 shadow-[0_0_25px_rgba(242,185,13,0.15)]"
                    : "glass-card-premium border-white/10"
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  {/* Left: Patient Info & Symptoms */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-lg bg-primary text-primary-foreground shadow-sm">
                        Token #{apt.tokenNumber}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {apt.date} · {formatIstTime(apt.slotTime)}
                      </span>
                      <span className="text-[10px] font-mono text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/25">
                        {apt.referenceId}
                      </span>
                      {isInCall && (
                        <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                          <span className="status-live-pulse" />
                          Consultation In Progress
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2 pt-0.5">
                      <h4 className="text-base font-bold text-foreground">{apt.patientName}</h4>
                      <span className="text-xs text-muted-foreground">
                        ({apt.patientAge}y · {apt.patientGender}) · {apt.patientPhone}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                      <strong className="text-foreground font-semibold">Chief Symptoms:</strong> {apt.chiefSymptoms}
                    </p>
                  </div>

                  {/* Right: Doctor Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Stage 1: Confirm */}
                    {apt.stage === 1 && (
                      <Button
                        size="sm"
                        onClick={() => advanceStage(apt, 2)}
                        className="rounded-xl text-xs h-9 px-3.5 bg-secondary hover:bg-white/10 text-foreground"
                      >
                        <Check className="w-3.5 h-3.5 mr-1 text-primary" /> Confirm Slot
                      </Button>
                    )}

                    {/* Stage 2: Call Token */}
                    {apt.stage <= 2 && (
                      <Button
                        size="sm"
                        onClick={() => advanceStage(apt, 3)}
                        className="rounded-xl text-xs h-9 px-3.5 bg-gold text-black font-bold hover:bg-gold/90 shadow-md shadow-gold/20"
                      >
                        Call Token #{apt.tokenNumber}
                      </Button>
                    )}

                    {/* Stage 3 or 4: Start WhatsApp Call */}
                    {apt.stage >= 2 && apt.stage < 5 && (
                      <Button
                        size="sm"
                        variant="shimmer"
                        onClick={() => handleStartWhatsAppCall(apt)}
                        className="rounded-xl text-xs h-9 px-3.5 font-bold"
                      >
                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                        {isInCall ? "Open WhatsApp Call" : "Start WhatsApp Call"}
                      </Button>
                    )}

                    {/* Stage 4 or 5: Write / View Prescription */}
                    {apt.stage >= 3 && (
                      <Button
                        size="sm"
                        variant={isCompleted ? "outline" : "default"}
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setShowRxBuilder(true);
                        }}
                        className={`rounded-xl text-xs h-9 px-3.5 font-bold ${
                          isCompleted
                            ? "border-primary/40 text-primary hover:bg-primary/10"
                            : "bg-teal-500 hover:bg-teal-400 text-black shadow-lg shadow-teal-500/20"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        {isCompleted ? "View / Edit Rx" : "Write Prescription"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* QUICK PRESCRIPTION BUILDER MODAL */}
      <Dialog open={showRxBuilder} onOpenChange={setShowRxBuilder}>
        <DialogContent className="glass-card-premium border-white/15 text-foreground sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-display flex items-center justify-between">
              <span>Write Digital Prescription</span>
              <span className="text-xs font-mono text-gold px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/25">
                {selectedAppointment?.referenceId}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Patient: <strong className="text-foreground">{selectedAppointment?.patientName}</strong> ({selectedAppointment?.patientAge}y · {selectedAppointment?.patientGender})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Common Remedies Quick Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Remedy Palette:</span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_REMEDIES.slice(0, 8).map((rem) => (
                  <button
                    key={rem}
                    type="button"
                    onClick={() => {
                      setMedicines((prev) => [
                        ...prev,
                        {
                          id: `med-${Date.now()}-${rem}`,
                          name: rem,
                          potency: "200CH",
                          form: "Sweet Globules (Sugar Pills)",
                          dosage: DOSAGE_PRESETS[0] ?? "4 sweet globules dry on tongue, twice daily before meals",
                          duration: "14 Days",
                        },
                      ]);
                    }}
                    className="text-[10px] font-medium px-2 py-1 rounded-lg bg-background/60 hover:bg-primary/15 hover:text-primary border border-border/60 transition"
                  >
                    + {rem}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicines List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Remedies & Globules Dosage
                </Label>
                <Button size="sm" variant="ghost" onClick={handleAddMedicine} className="text-xs text-primary h-7 px-2">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Remedy
                </Button>
              </div>

              {medicines.map((med, idx) => (
                <div key={med.id} className="p-4 rounded-2xl border border-white/10 bg-background/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Remedy #{idx + 1}</span>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(med.id)}
                        className="text-destructive hover:underline text-[11px] font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Medicine Name</Label>
                      <Input
                        value={med.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMedicines((prev) => prev.map((m) => (m.id === med.id ? { ...m, name: val } : m)));
                        }}
                        placeholder="e.g. Arnica Montana"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Potency</Label>
                      <select
                        value={med.potency}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMedicines((prev) => prev.map((m) => (m.id === med.id ? { ...m, potency: val } : m)));
                        }}
                        className="w-full bg-background/80 border border-border/80 rounded-xl text-foreground h-9 text-xs px-3 focus:outline-none focus:border-primary"
                      >
                        {POTENCIES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Dosage Instructions</Label>
                    <select
                      value={med.dosage}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMedicines((prev) => prev.map((m) => (m.id === med.id ? { ...m, dosage: val } : m)));
                      }}
                      className="w-full bg-background/80 border border-border/80 rounded-xl text-foreground h-9 text-xs px-3 focus:outline-none focus:border-primary"
                    >
                      {DOSAGE_PRESETS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* Doctor Advice / Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Doctor Advice & Dietary Guidelines</Label>
              <Textarea
                rows={2}
                value={doctorAdvice}
                onChange={(e) => setDoctorAdvice(e.target.value)}
                className="rounded-xl text-xs bg-background/60 border-border/80"
              />
            </div>

            <Button
              onClick={handleIssuePrescription}
              variant="shimmer"
              size="lg"
              className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/25 text-sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Sign & Issue Digital Prescription (Stage 5)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
