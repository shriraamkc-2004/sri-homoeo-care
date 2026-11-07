import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  CalendarDays, CheckCircle2, Clock3, HeartPulse, ShieldCheck,
  Smartphone, Stethoscope, Video, ArrowRight, User, Phone,
  CreditCard, QrCode, FileText, AlertCircle, RefreshCw, Truck,
  MapPin, Check, Copy, ExternalLink, Download, Home, Pill, Ban, Activity, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { ClinicUser, AppointmentRecord, DigitalPrescription, DeliveryMethod } from "@/lib/types/clinic-types";
import { availableEveningSlots, formatIstTime, createAppointmentReference } from "@/lib/clinic-booking";
import {
  getPatientAppointments,
  saveAppointment,
  getNextTokenNumber,
  getTodayServingToken
} from "@/lib/clinic-auth";

interface PatientPortalProps {
  user: ClinicUser;
  locale: "en" | "ta";
}

export function PatientPortal({ user, locale }: PatientPortalProps) {
  const isTa = locale === "ta";
  const [currentTab, setCurrentTab] = useState<"home" | "book" | "track" | "rx">("home");

  // Patient bookings from storage
  const [appointments, setAppointments] = useState<AppointmentRecord[]>(() =>
    getPatientAppointments(user.id)
  );

  const activeAppointment = useMemo(() => {
    return appointments.find((a) => a.stage < 5) || appointments[appointments.length - 1] || null;
  }, [appointments]);

  // Booking Form State
  const [bookingFor, setBookingFor] = useState<"self" | "family">("self");
  const [patientName, setPatientName] = useState(user.name);
  const [patientAge, setPatientAge] = useState(user.age?.toString() || "30");
  const [patientGender, setPatientGender] = useState<"female" | "male" | "child" | "other">(user.gender || "female");
  const [symptoms, setSymptoms] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState("18:30");
  const [isBooking, setIsBooking] = useState(false);

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("18:30");

  // Courier Address Modal State
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");

  const slots = availableEveningSlots();
  const servingToken = getTodayServingToken();

  async function handleStartBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error(isTa ? "நோயாளி பெயரை உள்ளிடவும்" : "Please enter the patient name.");
      return;
    }

    setIsBooking(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const refId = createAppointmentReference();
      const tokenNum = getNextTokenNumber(selectedDate);

      const newAppointment: AppointmentRecord = {
        id: `apt-${Date.now()}`,
        referenceId: refId,
        patientId: user.id,
        patientName: patientName.trim(),
        patientPhone: user.phone,
        patientEmail: user.email,
        patientAge: parseInt(patientAge) || 30,
        patientGender,
        chiefSymptoms: symptoms.trim() || (isTa ? "பொதுவான ஆலோசனை" : "General Consultation"),
        date: selectedDate,
        slotTime: selectedSlot,
        mode: "online",
        tokenNumber: tokenNum,
        stage: 1, // 1: Consultation Request Submitted
        consultationFee: 0,
        paymentStatus: "paid",
        paymentMethod: "direct",
        paymentId: `ref_${Date.now()}`,
        paymentTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      saveAppointment(newAppointment);
      setAppointments((prev) => [...prev, newAppointment]);
      toast.success(
        isTa
          ? `சந்திப்பு வெற்றிகரமாக பதிவு செய்யப்பட்டது! டோக்கன் #${tokenNum}`
          : `Appointment booked successfully! Token #${tokenNum} assigned.`
      );
      setCurrentTab("track");
    } finally {
      setIsBooking(false);
    }
  }

  function handleReschedule() {
    if (!activeAppointment || !rescheduleDate) return;
    const updated: AppointmentRecord = {
      ...activeAppointment,
      date: rescheduleDate,
      slotTime: rescheduleSlot,
      rescheduledFrom: `${activeAppointment.date} ${activeAppointment.slotTime}`,
      stage: 1,
    };
    saveAppointment(updated);
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setShowRescheduleModal(false);
    toast.success(isTa ? "நேரம் வெற்றிகரமாக மாற்றப்பட்டது!" : "Appointment successfully rescheduled!");
  }

  function handleSaveCourierDelivery() {
    if (!activeAppointment?.prescription || !shippingAddress.trim()) {
      toast.error(isTa ? "முகவரியை உள்ளிடவும்" : "Please enter your full delivery address.");
      return;
    }
    const updatedPrescription: DigitalPrescription = {
      ...activeAppointment.prescription,
      deliveryMethod: "clinic_courier",
      shippingAddress: shippingAddress.trim(),
    };
    const updatedAppointment: AppointmentRecord = {
      ...activeAppointment,
      prescription: updatedPrescription,
    };
    saveAppointment(updatedAppointment);
    setAppointments((prev) => prev.map((a) => (a.id === updatedAppointment.id ? updatedAppointment : a)));
    setShowCourierModal(false);
    toast.success(isTa ? "மருந்து அனுப்பும் முகவரி பதிவு செய்யப்பட்டது!" : "Medicine courier delivery request registered!");
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Patient Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl liquid-glass">
          <button
            onClick={() => setCurrentTab("home")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentTab === "home"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <Home className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />
            {isTa ? "முகப்பு" : "Home"}
          </button>
          <button
            onClick={() => setCurrentTab("book")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentTab === "book"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <CalendarDays className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />
            {isTa ? "முன்பதிவு" : "Book"}
          </button>
          <button
            onClick={() => setCurrentTab("track")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentTab === "track"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <Clock3 className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />
            {isTa ? "டோக்கன்" : "Queue"}
            {activeAppointment && activeAppointment.stage < 5 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[oklch(0.82_0.12_85)] text-[oklch(0.18_0.03_75)] font-bold text-[10px]">
                #{activeAppointment.tokenNumber}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentTab("rx")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentTab === "rx"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <Pill className="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" />
            {isTa ? "மருந்து" : "Rx Vault"}
          </button>
        </div>

        {/* Verified User Tag */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono px-3 py-1.5 rounded-full glass-subtle">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-foreground font-medium">{user.name}</span>
          <span className="text-muted-foreground/70">({user.phone})</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. HOME SCREEN */}
      {/* ======================================================== */}
      {currentTab === "home" && (
        <div className="space-y-6">
          {/* Active Appointment Callout OR Empty State Callout */}
          {activeAppointment && activeAppointment.stage < 5 ? (
            <Card className="p-5 glass border-[oklch(0.82_0.12_85)]/30 rounded-2xl depth-2 card-3d">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[oklch(0.82_0.12_85)]/10 border border-[oklch(0.82_0.12_85)]/30 text-[oklch(0.82_0.12_85)] text-xs font-semibold mb-2">
                    <Clock3 className="w-3.5 h-3.5" />
                    {isTa ? "இன்றைய நேரலை டோக்கன்" : "Today's Active Consultation"}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <h2 className="font-display text-2xl font-bold text-foreground">
                      {isTa ? "உங்கள் டோக்கன்" : "Your Token"}: <span className="text-gradient-primary">#{activeAppointment.tokenNumber}</span>
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      ({formatIstTime(activeAppointment.slotTime)} · WhatsApp Online Call)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isTa ? "தற்போது பரிசோதிப்பது" : "Now Serving"}: <strong className="text-foreground">Token #{servingToken}</strong> ·{" "}
                    {activeAppointment.tokenNumber - servingToken > 0
                      ? `${activeAppointment.tokenNumber - servingToken} ${isTa ? "நபர்கள் முன்னிலையில்" : "patient(s) ahead"}`
                      : isTa ? "உங்கள் முறை வந்துவிட்டது!" : "Your turn has arrived!"}
                  </p>
                </div>
                <Button onClick={() => setCurrentTab("track")}>
                  {isTa ? "நேரடி நிலையைப் பார்க்க" : "View Live Tracker"}
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6 glass rounded-2xl depth-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {isTa ? `வணக்கம், ${user.name}!` : `Welcome, ${user.name}!`}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    {isTa
                      ? "உங்களுக்கு தற்போது முன்பதிவுகள் இல்லை. டாக்டர் ஸ்ரீஇந்துஜா C அவர்களிடம் ஆலோசனை பெற கீழே பதிவு செய்க."
                      : "You have no active appointments scheduled today. Book your evening consultation with Dr. Sriindhuja C below."}
                  </p>
                </div>
                <Button onClick={() => setCurrentTab("book")}>
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {isTa ? "ஆலோசனை முன்பதிவு" : "Book Online Visit"}
                </Button>
              </div>
            </Card>
          )}

          {/* Doctor Credential Profile Card */}
          <Card className="p-5 glass rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 lift">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-[oklch(0.82_0.12_85)]/50 bg-white p-1 flex items-center justify-center shrink-0 shadow-md glow-gold">
                <img src="/sri-homeo-care-logo.png" alt="Sri Homoeo Care" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  Dr. Sriindhuja C
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                    Reg. 5397
                  </span>
                </h3>
                <p className="text-xs text-primary font-medium">BHMS, MSc (Psychology) · Classical Homoeopathy</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Tirupattur, Tamil Nadu · Daily 6:00 p.m. – 8:00 p.m. IST · <Phone className="inline h-3 w-3 -mt-0.5" /> +91 97914 26526
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary font-semibold">
                Online WhatsApp Consultation Active
              </span>
            </div>
          </Card>

          {/* Quick Action Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card
              onClick={() => setCurrentTab("book")}
              className="p-5 border-border bg-card hover:border-primary/30 transition cursor-pointer rounded-xl group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">{isTa ? "ஆலோசனை முன்பதிவு" : "Book Consultation"}</h4>
              <p className="text-xs text-muted-foreground mt-1">{isTa ? "மாலை 6:00–8:00 IST · நேரலை சந்திப்பு" : "Daily 6–8 PM IST · WhatsApp Video/Audio"}</p>
            </Card>

            <Card
              onClick={() => setCurrentTab("track")}
              className="p-5 border-border bg-card hover:border-primary/30 transition cursor-pointer rounded-xl group"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[oklch(0.82_0.12_85)] flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Clock3 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">{isTa ? "5-நிலை நேரடி நிலை" : "5-Stage Queue Tracker"}</h4>
              <p className="text-xs text-muted-foreground mt-1">{isTa ? "டோக்கன் நிலை & அழைப்பு அறிவிப்பு" : "Live token status & call alert"}</p>
            </Card>

            <Card
              onClick={() => setCurrentTab("rx")}
              className="p-5 border-border bg-card hover:border-primary/30 transition cursor-pointer rounded-xl group"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">{isTa ? "மருந்து & உணவு முறை" : "Prescriptions & Diet Vault"}</h4>
              <p className="text-xs text-muted-foreground mt-1">{isTa ? "மருந்து விவரங்கள் & உணவு விதிகள்" : "Dosage globules & food rules"}</p>
            </Card>

            <Card
              onClick={() => window.open("tel:+919791426526")}
              className="p-5 border-border bg-card hover:border-primary/30 transition cursor-pointer rounded-xl group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 text-primary flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Phone className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-foreground text-sm">{isTa ? "சிகிச்சை மைய தொடர்பு" : "Care Contact Helpline"}</h4>
              <p className="text-xs text-muted-foreground mt-1">+91 97914 26526 · Tirupattur</p>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. BOOK CONSULTATION SCREEN */}
      {/* ======================================================== */}
      {currentTab === "book" && (
        <Card className="p-6 border-border bg-card rounded-2xl max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">{isTa ? "ஆன்லைன் ஆலோசனை முன்பதிவு" : "Book Online Consultation"}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isTa
                ? "மாலை 6:00 – 8:00 IST இடைவெளிகள் · டாக்டர் ஸ்ரீஇந்துஜா C உடன் நேரடி WhatsApp அழைப்பு"
                : "Daily 6:00 – 8:00 p.m. IST · Direct WhatsApp consultation with Dr. Sriindhuja C"}
            </p>
          </div>

          <form onSubmit={handleStartBooking} className="space-y-4">
            {/* Consultation Mode Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{isTa ? "சிகிச்சை முறை (Consultation Mode)" : "Consultation Mode"}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border-2 border-primary bg-primary/10 flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-primary" />
                  <div>
                    <div className="text-xs font-bold text-foreground">Online WhatsApp Call</div>
                    <div className="text-[10px] text-primary font-semibold">{isTa ? "● தற்போது இயங்குகிறது (Active)" : "● Currently Active"}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-secondary/40 opacity-60 flex items-center gap-2.5 cursor-not-allowed">
                  <MapPin className="w-4 h-4 text-muted-foreground/70" />
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground">In-Clinic Visit</div>
                    <div className="text-[10px] text-[oklch(0.82_0.12_85)] font-mono">{isTa ? "விரைவில் வரும் (Coming Soon)" : "Coming Soon"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Who is it for? */}
            <div className="flex items-center gap-4 text-xs pt-1">
              <span className="text-muted-foreground">{isTa ? "யாருக்கு முன்பதிவு?" : "Booking For:"}</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="bookingfor"
                  checked={bookingFor === "self"}
                  onChange={() => {
                    setBookingFor("self");
                    setPatientName(user.name);
                  }}
                  className="accent-emerald-500"
                />
                <span className="text-foreground">{isTa ? "எனக்கு (Myself)" : "Myself"}</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="bookingfor"
                  checked={bookingFor === "family"}
                  onChange={() => {
                    setBookingFor("family");
                    setPatientName("");
                  }}
                  className="accent-emerald-500"
                />
                <span className="text-foreground">{isTa ? "குடும்பத்தினர் / குழந்தை" : "Family Member / Child"}</span>
              </label>
            </div>

            {/* Patient Name, Age & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">{isTa ? "நோயாளி பெயர் *" : "Patient Name *"}</Label>
                <Input
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="bg-secondary/80 border-border text-foreground h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{isTa ? "வயது *" : "Age *"}</Label>
                <Input
                  required
                  type="number"
                  min={1}
                  max={110}
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="bg-secondary/80 border-border text-foreground h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{isTa ? "பாலினம் *" : "Gender *"}</Label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as any)}
                  className="w-full bg-secondary/80 border border-border rounded-md text-foreground h-9 text-xs px-2 focus:ring-emerald-500"
                >
                  <option value="female">{isTa ? "பெண் (Female)" : "Female"}</option>
                  <option value="male">{isTa ? "ஆண் (Male)" : "Male"}</option>
                  <option value="child">{isTa ? "குழந்தை (Child)" : "Child"}</option>
                  <option value="other">{isTa ? "மற்றவை (Other)" : "Other"}</option>
                </select>
              </div>
            </div>

            {/* Appointment Date & Slot */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{isTa ? "தேதி *" : "Appointment Date *"}</Label>
                  <Input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-secondary/80 border-border text-foreground h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{isTa ? "அழைப்பு எண்" : "WhatsApp Number"}</Label>
                  <Input
                    readOnly
                    disabled
                    value={user.phone}
                    className="bg-secondary/80 border-border text-muted-foreground h-9 text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <Label className="text-xs text-muted-foreground block pt-1">
                {isTa ? "மாலை நேர இடைவெளி (6:00 – 8:00 PM IST) *" : "Evening Time Slot (6:00 – 8:00 p.m. IST) *"}
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition ${
                        isSelected
                          ? "border-primary/30 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                          : "border-border bg-secondary/80 text-muted-foreground hover:border-border"
                      }`}
                    >
                      {formatIstTime(slot)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Symptoms */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{isTa ? "பிரதான உடல் குறை / அறிகுறிகள் (விருப்பம்)" : "Chief Medical Concern / Symptoms (Optional)"}</Label>
              <Textarea
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder={isTa ? "எ.கா. ஒற்றைத் தலைவலி, தோல் அரிப்பு, செரிமானக் கோளாறு... (விருப்பம்)" : "e.g. Skin allergy, chronic migraine, indigestion, pediatric cough... (Optional)"}
                className="bg-secondary/80 border-border text-foreground text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={isBooking}
              className="w-full h-11 bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              {isBooking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isTa ? "முன்பதிவு செய்யப்படுகிறது..." : "Booking Consultation..."}
                </>
              ) : (
                <>
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {isTa ? "சந்திப்பை உறுதிசெய்க" : "Confirm & Book Consultation"}
                </>
              )}
            </Button>
          </form>
        </Card>
      )}

      {/* ======================================================== */}
      {/* 3. 5-STAGE LIVE QUEUE TRACKER */}
      {/* ======================================================== */}
      {currentTab === "track" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {activeAppointment ? (
            <Card className="p-6 border-border bg-card rounded-2xl space-y-6">
              {/* Tracker Top Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-4 gap-3">
                <div>
                  <span className="text-[11px] font-mono text-[oklch(0.82_0.12_85)]">{activeAppointment.referenceId}</span>
                  <h2 className="text-xl font-bold text-foreground mt-0.5">
                    {isTa ? "நேரடி வரிசை கண்காணிப்பான்" : "Live Queue & Token Status"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {activeAppointment.patientName} · {activeAppointment.date} · {formatIstTime(activeAppointment.slotTime)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{isTa ? "உங்கள் டோக்கன்" : "Your Token"}</div>
                  <div className="text-3xl font-black text-primary">#{activeAppointment.tokenNumber}</div>
                </div>
              </div>

              {/* Live Queue Counter Box */}
              <div className="p-4 rounded-xl border border-border bg-secondary/70 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">{isTa ? "தற்போது பரிசோதிப்பது" : "Now Serving"}</span>
                  <div className="text-2xl font-extrabold text-foreground">Token #{servingToken}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">{isTa ? "காத்திருப்பு" : "Queue Position"}</span>
                  <div className="text-sm font-bold text-[oklch(0.82_0.12_85)]">
                    {activeAppointment.tokenNumber > servingToken
                      ? `${activeAppointment.tokenNumber - servingToken} ${isTa ? "நபர்கள் முன்னிலையில்" : "patient(s) ahead"}`
                      : isTa ? "உங்கள் முறை!" : "Your Turn!"}
                  </div>
                </div>
              </div>

              {/* 5-Stage Visual Stepper */}
              <div className="space-y-4 pt-2">
                {[
                  {
                    num: 1,
                    titleEn: "1. Consultation Request Submitted",
                    titleTa: "1. ஆலோசனை முன்பதிவு செய்யப்பட்டது",
                    descEn: "Token assigned. Scheduled with Dr. Sriindhuja C.",
                    descTa: "டோக்கன் ஒதுக்கப்பட்டது. மருத்துவர் பரிசீலனைக்கு தயார்.",
                  },
                  {
                    num: 2,
                    titleEn: "2. Confirmed by Dr. Sriindhuja C",
                    titleTa: "2. மருத்துவர் உறுதிப்படுத்தினார்",
                    descEn: "Doctor reviewed your slot for evening care session.",
                    descTa: "மாலை ஆலோசனை நேரம் உறுதி செய்யப்பட்டது.",
                  },
                  {
                    num: 3,
                    titleEn: "3. Token Called · Get Ready",
                    titleTa: "3. உங்கள் முறை · தயாராக இருங்கள்",
                    descEn: "Dr. Sriindhuja C will initiate WhatsApp call in ~5 mins.",
                    descTa: "மருத்துவர் விரைவில் WhatsApp அழைப்பு விடுப்பார்.",
                  },
                  {
                    num: 4,
                    titleEn: "4. Online Consultation in Progress",
                    titleTa: "4. ஆலோசனை நடைபெறுகிறது",
                    descEn: "WhatsApp video/voice call active with doctor.",
                    descTa: "மருத்துவருடன் WhatsApp அழைப்பு இயங்குகிறது.",
                  },
                  {
                    num: 5,
                    titleEn: "5. Prescription & Remedies Ready",
                    titleTa: "5. மருந்து சீட்டு தயார்",
                    descEn: "Prescription uploaded to your vault.",
                    descTa: "மருந்து சீட்டு உங்கள் பெட்டகத்தில் உள்ளது.",
                  },
                ].map((st) => {
                  const isDone = activeAppointment.stage > st.num;
                  const isCurrent = activeAppointment.stage === st.num;

                  return (
                    <div key={st.num} className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition ${
                          isDone
                            ? "bg-primary/10 text-black"
                            : isCurrent
                            ? "bg-[oklch(0.82_0.12_85)] text-[oklch(0.18_0.03_75)] ring-4 ring-amber-400/20"
                            : "bg-secondary text-muted-foreground/70"
                        }`}
                      >
                        {isDone ? <Check className="w-4 h-4" /> : st.num}
                      </div>
                      <div className="flex-1">
                        <div
                          className={`text-xs font-bold ${
                            isCurrent ? "text-[oklch(0.82_0.12_85)] text-sm" : isDone ? "text-foreground" : "text-muted-foreground/70"
                          }`}
                        >
                          {isTa ? st.titleTa : st.titleEn}
                          {isCurrent && (
                            <span className="ml-2 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/20 text-[oklch(0.82_0.12_85)]">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{isTa ? st.descTa : st.descEn}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Call Guidance Box when Stage 3 or 4 */}
              {(activeAppointment.stage === 3 || activeAppointment.stage === 4) && (
                <div className="p-3.5 rounded-xl border border-primary/40 bg-primary/10 text-xs text-primary flex items-center gap-3">
                  <Phone className="w-5 h-5 shrink-0 text-primary animate-pulse" />
                  <div>
                    <strong>{isTa ? "முக்கிய அறிவிப்பு" : "Doctor Call in Progress"}</strong>:{" "}
                    {isTa
                      ? `டாக்டர் ஸ்ரீஇந்துஜா C உங்கள் எண்ணிற்கு (+91 ${user.phone}) WhatsApp அழைப்பு விடுப்பார். தயவுசெய்து அழைப்பை ஏற்கவும்.`
                      : `Dr. Sriindhuja C is calling your WhatsApp number (${user.phone}). Please keep your phone nearby and answer.`}
                  </div>
                </div>
              )}

              {/* Action Buttons: Reschedule Only (No Cancellation) */}
              <div className="border-t border-border pt-4 flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRescheduleDate(activeAppointment.date);
                    setRescheduleSlot(activeAppointment.slotTime);
                    setShowRescheduleModal(true);
                  }}
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  {isTa ? "நேரத்தை மாற்றவும் (Reschedule)" : "Reschedule Appointment"}
                </Button>

                {activeAppointment.stage === 5 && (
                  <Button
                    size="sm"
                    onClick={() => setCurrentTab("rx")}
                    className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    {isTa ? "மருந்து சீட்டு பார்க்க" : "View Prescription"}
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            /* Clean Empty State for New Patients */
            <Card className="p-10 border-border bg-card rounded-2xl text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
                <Clock3 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{isTa ? "தற்போது முன்பதிவுகள் இல்லை" : "No Active Appointments"}</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isTa
                  ? "நீங்கள் இன்னும் ஆலோசனை முன்பதிவு செய்யவில்லை. முன்பதிவு செய்தவுடன் உங்கள் டோக்கன் எண் மற்றும் 5-நிலை கண்காணிப்பு இங்கு தோன்றும்."
                  : "You have not scheduled any appointments yet. Once you book, your live token and 5-stage progress will appear here."}
              </p>
              <Button onClick={() => setCurrentTab("book")} className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                <CalendarDays className="w-4 h-4 mr-2" />
                {isTa ? "ஆலோசனை முன்பதிவு செய்க" : "Book Consultation"}
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. PRESCRIPTION & DIET VAULT */}
      {/* ======================================================== */}
      {currentTab === "rx" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {activeAppointment?.prescription ? (
            <Card className="p-6 border-border bg-card rounded-2xl space-y-5">
              {/* Prescription Header */}
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <span className="text-[11px] font-mono text-[oklch(0.82_0.12_85)]">{activeAppointment.prescription.referenceId}</span>
                  <h3 className="text-lg font-bold text-foreground">Dr. Sriindhuja C</h3>
                  <p className="text-xs text-primary font-medium">BHMS, MSc (Psychology) · Reg. No: 5397</p>
                  <p className="text-[11px] text-muted-foreground">Sri Homoeo Care · Tirupattur, TN</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>Date: {activeAppointment.prescription.date}</div>
                  <div className="text-foreground font-semibold">Patient: {activeAppointment.prescription.patientName}</div>
                </div>
              </div>

              {/* Remedies List */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-muted-foreground">
                  {isTa ? "பரிந்துரைக்கப்பட்ட ஹோமியோபதி மருந்துகள்" : "Prescribed Homoeopathic Remedies"}
                </Label>
                {activeAppointment.prescription.medicines.map((med) => (
                  <div key={med.id} className="p-3.5 rounded-xl border border-border bg-secondary/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">{med.name}</span>
                      <span className="text-xs font-mono text-[oklch(0.82_0.12_85)]">{med.potency}</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {med.dosage} ({med.form})
                    </div>
                    <div className="text-[11px] text-muted-foreground/70">Course: {med.duration}</div>
                  </div>
                ))}
              </div>

              {/* Medicine Delivery Choice (Option C) */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {isTa ? "மருந்து விநியோக முறை (Delivery Choice)" : "How to Receive Medicines:"}
                  </span>
                  <span className="text-[10px] text-primary font-mono">Option C Dual Care</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => toast.success(isTa ? "மருந்து சீட்டு PDF பதிவிறக்கப்பட்டது!" : "Prescription PDF ready for local pharmacy!")}
                    className="p-2.5 rounded-lg border border-border bg-secondary/80 hover:border-primary/30 text-left transition"
                  >
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-primary" />
                      {isTa ? "உள்ளூரில் வாங்கவும்" : "Buy Locally (PDF)"}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{isTa ? "மருந்தகத்தில் காட்ட PDF" : "Show PDF at any local pharmacy"}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCourierModal(true)}
                    className="p-2.5 rounded-lg border border-border bg-secondary/80 hover:border-primary/30 text-left transition"
                  >
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[oklch(0.82_0.12_85)]" />
                      {isTa ? "கொரியர் மூலம் பெற" : "Care Courier"}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{isTa ? "வீட்டு முகவரிக்கு அனுப்ப" : "Dispatch to your home address"}</p>
                  </button>
                </div>

                {/* If Courier Tracking exists */}
                {activeAppointment.prescription.courierTrackingNumber && (
                  <div className="p-2.5 rounded-lg border border-amber-500/30 bg-[oklch(0.82_0.12_85)]/10 text-xs text-[oklch(0.82_0.12_85)]">
                    <strong>Courier Tracking</strong>: {activeAppointment.prescription.courierProvider} -{" "}
                    <span className="font-mono">{activeAppointment.prescription.courierTrackingNumber}</span>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            /* Clean Empty Prescription State */
            <Card className="p-8 border-border bg-card rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">{isTa ? "மருந்து சீட்டு எதுவும் இல்லை" : "No Prescriptions Issued Yet"}</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {isTa
                  ? "டாக்டர் ஸ்ரீஇந்துஜா C அவர்களுடனான WhatsApp ஆலோசனை முடிந்ததும், உங்கள் தனிப்பட்ட ஹோமியோபதி மருந்து சீட்டு இங்கு பதிவேற்றப்படும்."
                  : "After your WhatsApp consultation with Dr. Sriindhuja C, your individualized digital prescription will be uploaded here."}
              </p>
            </Card>
          )}

          {/* Golden Dietary Rules (Always visible for patient guidance) */}
          <Card className="p-6 border-border bg-card rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-[oklch(0.82_0.12_85)] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {isTa ? "ஹோமியோபதி முக்கிய உணவு கட்டுப்பாடுகள்" : "Classical Homoeopathy Golden Dietary Rules"}
            </h3>

            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <Ban className="h-4 w-4 text-destructive" />
                <div>
                  <strong>{isTa ? "கடுமையான வாசனைகளை தவிர்க்கவும்" : "Avoid Strong Flavors & Odors (30 Mins Before/After)"}</strong>:
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {isTa
                      ? "பச்சை வெங்காயம், பச்சை பூண்டு, பெருங்காயம், காபி ஆகியவற்றை மருந்து எடுப்பதற்கு 30 நிமிடம் முன் மற்றும் பின் தவிர்க்கவும்."
                      : "Avoid raw onion, raw garlic, strong coffee, and hing (asafoetida) within 30 minutes before and after taking remedies."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Ban className="h-4 w-4 text-destructive" />
                <div>
                  <strong>{isTa ? "கற்பூரம் & தைலம் விலக்கவும்" : "Avoid Camphor & Strong Balms"}</strong>:
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {isTa
                      ? "கற்பூரம் (Camphor), தைலம், புதினா வாசனை ஆகியவை மருந்தின் வீரியத்தை முறிக்கும்."
                      : "Keep camphor, eucalyptus oil, menthol inhalers, and strong balms away from medicines as they neutralize potencies."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Activity className="h-4 w-4 text-primary" />
                <div>
                  <strong>{isTa ? "நாக்கில் கரைக்கவும் (Dissolve on Tongue)" : "Dissolve Dry on Clean Tongue"}</strong>:
                  <p className="text-muted-foreground text-[11px] mt-0.5">
                    {isTa
                      ? "மருந்தை கைகளில் தொடாமல், மூடியில் கொட்டி நேரடியாக நாக்கில் கரைக்கவும்."
                      : "Do not touch globules with bare fingers. Pour into bottle cap and dissolve dry on tongue."}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {isTa ? "நேரத்தை மாற்றவும் (Reschedule Only)" : "Reschedule Appointment Slot"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isTa ? "கட்டணம் ரத்து செய்யப்படாது; புதிய நேரத்தைத் தேர்ந்தெடுக்கலாம்." : "Consultation fee is non-refundable. You can reschedule to any available evening slot."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{isTa ? "புதிய தேதி" : "New Date"}</Label>
              <Input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="bg-secondary/80 border-border text-foreground h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{isTa ? "புதிய மாலை நேரம்" : "New Evening Slot"}</Label>
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setRescheduleSlot(s)}
                    className={`py-1.5 text-xs rounded border ${
                      rescheduleSlot === s ? "border-primary/30 bg-primary text-primary-foreground font-semibold hover:bg-primary/90" : "border-border bg-secondary/80 text-muted-foreground"
                    }`}
                  >
                    {formatIstTime(s)}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleReschedule} className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
              {isTa ? "நேரத்தை உறுதி செய்" : "Confirm Reschedule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* COURIER ADDRESS MODAL */}
      <Dialog open={showCourierModal} onOpenChange={setShowCourierModal}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Truck className="w-5 h-5 text-[oklch(0.82_0.12_85)]" />
              {isTa ? "மருந்து அனுப்பும் முகவரி" : "Care Courier Delivery"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isTa
                ? "சிகிச்சை மையத்திலிருந்து உங்கள் முகவரிக்கு நேரடியாக மருந்து அனுப்பப்படும்."
                : "Enter your full shipping address. Care team will dispatch via Speed Post / DTDC with tracking."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              rows={4}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Door No, Street Name, Landmark, City, PIN code, Contact Number"
              className="bg-secondary/80 border-border text-foreground text-xs"
            />
            <Button onClick={handleSaveCourierDelivery} className="w-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
              {isTa ? "முகவரியை உறுதி செய்" : "Request Care Courier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

