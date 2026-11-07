import { useState } from "react";
import { toast } from "sonner";
import {
  UserPlus, Truck, Clock3, CheckCircle2, Phone,
  Mail, MapPin, KeyRound, Copy, CalendarDays, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClinicUser, AppointmentRecord } from "@/lib/types/clinic-types";
import { saveUser, getStoredUsers, getStoredAppointments, saveAppointment, getNextTokenNumber } from "@/lib/clinic-auth";
import { availableEveningSlots, formatIstTime, createAppointmentReference } from "@/lib/clinic-booking";

interface MemberPortalProps {
  locale: "en" | "ta";
}

export function MemberPortal({ locale }: MemberPortalProps) {
  const isTa = locale === "ta";
  const [activeTab, setActiveTab] = useState<"onboard" | "courier">("onboard");

  // Onboard Patient Form State
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientAge, setPatientAge] = useState("35");
  const [patientGender, setPatientGender] = useState<"female" | "male" | "child" | "other">("female");
  const [patientCity, setPatientCity] = useState("Tirupattur");
  const [patientPassword, setPatientPassword] = useState("srihomoeo123");

  // Immediate assisted booking toggle
  const [bookAppointmentNow, setBookAppointmentNow] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState("18:30");
  const [symptoms, setSymptoms] = useState("");

  // Courier Desk State
  const [appointments, setAppointments] = useState<AppointmentRecord[]>(() => getStoredAppointments());
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { provider: string; trackingNum: string }>>({});

  const slots = availableEveningSlots();

  function handleRegisterPatient(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      toast.error(isTa ? "பெயர் மற்றும் கைபேசி எண்ணை உள்ளிடவும்" : "Please enter the patient name and phone number.");
      return;
    }

    const cleanPhone = patientPhone.trim().startsWith("+91") ? patientPhone.trim() : `+91${patientPhone.trim().replace(/^0+/, "")}`;
    const cleanEmail = patientEmail.trim() ? patientEmail.trim().toLowerCase() : `patient_${Date.now()}@srihomoeoclinic.local`;

    const newPatient: ClinicUser = {
      id: `pat-${Date.now()}`,
      name: patientName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      role: "patient",
      isVerified: true,
      age: parseInt(patientAge) || 35,
      gender: patientGender,
      city: patientCity.trim(),
      createdAt: new Date().toISOString(),
    };

    saveUser(newPatient);

    // If immediate appointment is requested:
    if (bookAppointmentNow) {
      const todayDate = new Date().toISOString().slice(0, 10);
      const tokenNum = getNextTokenNumber(todayDate);
      const refId = createAppointmentReference();

      const newApt: AppointmentRecord = {
        id: `apt-${Date.now()}`,
        referenceId: refId,
        patientId: newPatient.id,
        patientName: newPatient.name,
        patientPhone: newPatient.phone,
        patientEmail: newPatient.email,
        patientAge: newPatient.age || 35,
        patientGender: newPatient.gender || "female",
        chiefSymptoms: symptoms.trim() || (isTa ? "பொதுவான ஆலோசனை" : "General Consultation"),
        date: todayDate,
        slotTime: selectedSlot,
        mode: "online",
        tokenNumber: tokenNum,
        stage: 1,
        consultationFee: 100,
        paymentStatus: "paid",
        paymentMethod: "assisted_cash",
        paymentId: `assisted_${Date.now()}`,
        paymentTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      saveAppointment(newApt);
      setAppointments((prev) => [...prev, newApt]);
    }

    toast.success(
      isTa
        ? `நோயாளி ${newPatient.name} கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!`
        : `Patient ${newPatient.name} onboarded! Login credentials active.`
    );

    // Reset form
    setPatientName("");
    setPatientPhone("");
    setPatientEmail("");
    setSymptoms("");
  }

  function handleSaveCourierTracking(appointmentId: string) {
    const input = trackingInputs[appointmentId];
    if (!input || !input.trackingNum.trim()) {
      toast.error(isTa ? "கொரியர் எண் உள்ளிடவும்" : "Please enter the courier tracking number.");
      return;
    }

    const apt = appointments.find((a) => a.id === appointmentId);
    if (!apt || !apt.prescription) return;

    const updated = {
      ...apt,
      prescription: {
        ...apt.prescription,
        courierProvider: input.provider || "India Post Speed Post",
        courierTrackingNumber: input.trackingNum.trim(),
      },
    };

    saveAppointment(updated);
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    toast.success(isTa ? "கொரியர் எண் நோயாளிக்கு பகிரப்பட்டது!" : "Tracking number updated and visible to patient!");
  }

  // Filter courier delivery requests
  const courierRequests = appointments.filter(
    (a) => a.prescription && a.prescription.deliveryMethod === "clinic_courier"
  );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Member Header */}
      <Card className="p-5 glass rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 depth-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-foreground">Care Operations Member</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              Operations Desk
            </span>
          </div>
          <p className="text-xs text-primary font-medium">Patient Onboarding & Medicine Dispatch Management</p>
        </div>

        <div className="flex gap-2 p-1 rounded-xl liquid-glass">
          <Button
            size="sm"
            onClick={() => setActiveTab("onboard")}
            variant={activeTab === "onboard" ? "default" : "ghost"}
            className="text-xs"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            {isTa ? "நோயாளி சேர்க்க" : "Add Patient"}
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveTab("courier")}
            variant={activeTab === "courier" ? "gold" : "ghost"}
            className="text-xs"
          >
            <Truck className="w-3.5 h-3.5 mr-1.5" />
            {isTa ? "கொரியர்" : "Dispatch"}
            {courierRequests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[oklch(0.82_0.12_85)] text-[oklch(0.18_0.03_75)] text-[10px] font-bold">
                {courierRequests.length}
              </span>
            )}
          </Button>
        </div>
      </Card>

      {/* ======================================================== */}
      {/* TAB 1: ADD PATIENT & CREATE LOGIN */}
      {/* ======================================================== */}
      {activeTab === "onboard" && (
        <Card className="p-6 glass rounded-2xl max-w-2xl mx-auto space-y-5 depth-1">
          <div>
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              {isTa ? "புதிய நோயாளியைப் பதிவு செய்து கணக்கு உருவாக்குதல்" : "Onboard Patient & Generate Login"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isTa
                ? "தொலைபேசி மூலம் தொடர்பு கொள்ளும் நோயாளிகளுக்கு உறுப்பினர் மூலம் கணக்கு உருவாக்கும் வசதி."
                : "Create login credentials for patients calling in, and optionally book their evening slot directly."}
            </p>
          </div>

          <form onSubmit={handleRegisterPatient} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Patient Full Name *</Label>
                <Input
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Meenakshi Sundaram"
                  className="bg-secondary/80 border-border text-foreground h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Mobile Number (+91) *</Label>
                <Input
                  type="tel"
                  required
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="98765 43210"
                  className="bg-secondary/80 border-border text-foreground h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Email Address (Optional)</Label>
                <Input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="bg-secondary/80 border-border text-foreground h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Age & Gender</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-16 bg-secondary/80 border-border text-foreground h-9 text-xs"
                  />
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="flex-1 bg-secondary/80 border border-border rounded-md text-foreground h-9 text-xs px-2"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="child">Child</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Initial Password</Label>
                <Input
                  value={patientPassword}
                  onChange={(e) => setPatientPassword(e.target.value)}
                  className="bg-secondary/80 border-border text-foreground h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Immediate Booking Option */}
            <div className="p-3.5 rounded-xl border border-border bg-secondary/60 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-foreground">
                <input
                  type="checkbox"
                  checked={bookAppointmentNow}
                  onChange={(e) => setBookAppointmentNow(e.target.checked)}
                  className="accent-blue-500 rounded"
                />
                Book Evening Consultation Now (Today 6:00 – 8:00 PM IST)
              </label>

              {bookAppointmentNow && (
                <div className="space-y-2 pt-1 border-t border-border">
                  <div className="grid grid-cols-4 gap-1.5">
                    {slots.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setSelectedSlot(s)}
                        className={`py-1.5 text-xs rounded border ${
                          selectedSlot === s ? "border-primary/30 bg-primary/15 text-foreground font-bold" : "border-border bg-secondary/80 text-muted-foreground"
                        }`}
                      >
                        {formatIstTime(s)}
                      </button>
                    ))}
                  </div>

                  <Input
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder={isTa ? "பிரதான அறிகுறிகள் / குறைபாடு (விருப்பம்)" : "Chief symptoms / medical concern (Optional)"}
                    className="bg-secondary/80 border-border text-foreground h-8 text-xs mt-2"
                  />
                  <div className="text-[11px] text-[oklch(0.82_0.12_85)] font-mono">
                    Token will be automatically assigned for evening care session.
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-11 bg-primary/15 hover:bg-primary/15 text-foreground font-bold text-sm">
              <UserPlus className="w-4 h-4 mr-2" />
              {isTa ? "நோயாளியைப் பதிவு செய்து கணக்கு தொடங்கு" : "Create Patient Account & Generate Login"}
            </Button>
          </form>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MEDICINE COURIER DISPATCH DESK */}
      {/* ======================================================== */}
      {activeTab === "courier" && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Truck className="w-4 h-4 text-[oklch(0.82_0.12_85)]" />
              {isTa ? "மருந்து பார்சல் அனுப்பும் பிரிவு (Option C)" : "Care Courier Dispatch Desk (Option C Delivery)"}
            </h3>
            <span className="text-xs text-muted-foreground">{courierRequests.length} Courier Orders</span>
          </div>

          {courierRequests.length === 0 ? (
            <Card className="p-8 border-border bg-card text-center text-muted-foreground text-xs rounded-xl">
              No pending care courier requests. (Patients who choose Option C will appear here).
            </Card>
          ) : (
            courierRequests.map((apt) => {
              const currentInput = trackingInputs[apt.id] || {
                provider: apt.prescription?.courierProvider || "India Post Speed Post",
                trackingNum: apt.prescription?.courierTrackingNumber || "",
              };

              return (
                <Card key={apt.id} className="p-5 border-border bg-card rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-3 gap-2">
                    <div>
                      <span className="text-xs font-bold text-foreground">{apt.patientName}</span>
                      <span className="text-xs text-muted-foreground ml-2">{apt.patientPhone}</span>
                      <div className="text-[11px] text-[oklch(0.82_0.12_85)] font-mono">Ref: {apt.referenceId}</div>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-[oklch(0.82_0.12_85)] border border-amber-800 font-mono">
                      Remedies Prescribed by Dr. Sriindhuja C
                    </span>
                  </div>

                  {/* Shipping Address */}
                  <div className="p-3 rounded-lg border border-border bg-secondary/80 text-xs text-muted-foreground">
                    <strong className="text-muted-foreground flex items-center gap-1.5 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-red-400" /> Delivery Address:
                    </strong>
                    {apt.prescription?.shippingAddress || "Address provided during checkout"}
                  </div>

                  {/* Medicines to Pack */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <strong>Remedies to Pack:</strong>
                    <ul className="list-disc list-inside text-primary">
                      {apt.prescription?.medicines.map((m) => (
                        <li key={m.id}>
                          {m.name} {m.potency} ({m.dosage})
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tracking Input */}
                  <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center gap-2">
                    <Input
                      value={currentInput.provider}
                      onChange={(e) =>
                        setTrackingInputs((prev) => ({
                          ...prev,
                          [apt.id]: { ...currentInput, provider: e.target.value },
                        }))
                      }
                      placeholder="Courier (e.g. India Post / DTDC)"
                      className="bg-secondary/80 border-border h-8 text-xs text-foreground sm:w-1/3"
                    />
                    <Input
                      value={currentInput.trackingNum}
                      onChange={(e) =>
                        setTrackingInputs((prev) => ({
                          ...prev,
                          [apt.id]: { ...currentInput, trackingNum: e.target.value },
                        }))
                      }
                      placeholder="Enter Consignment / Tracking No."
                      className="bg-secondary/80 border-border h-8 text-xs text-foreground font-mono flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveCourierTracking(apt.id)}
                      className="bg-[oklch(0.82_0.12_85)] text-[oklch(0.18_0.03_75)] font-semibold"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Update Tracking
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

