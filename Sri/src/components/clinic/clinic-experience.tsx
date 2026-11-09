import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowRight, CalendarDays, Check, CheckCircle2, ChevronDown,
  ClipboardCheck, Clock3, Download, HeartPulse, Languages, Laptop, LockKeyhole,
  LogOut, Menu, MessageCircle, NotebookPen, ShieldCheck, Smartphone, Sparkles, Stethoscope,
  X, Search, Copy, FileText, Pill, Truck, Activity,
} from "lucide-react";
import { AuthGate } from "./auth-gate";
import { PatientPortal } from "./patient-portal";
import { DoctorPortal } from "./doctor-portal";
import { MemberPortal } from "./member-portal";
import { AdminPortal } from "./admin-portal";
import { getActiveUser, setActiveUser } from "@/lib/clinic-auth";
import type { ClinicUser } from "@/lib/types/clinic-types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getClinicStaffAppointments,
  updateClinicAppointmentAsStaff,
  findPublicAppointmentStatus,
} from "@/lib/clinic.functions";
import { ClinicAuthContext, useClinicUser } from "@/lib/clinic-auth-context";
import { formatIstTime } from "@/lib/clinic-booking";

type Locale = "en" | "ta";
type AppTab = "booking" | "prescription" | "notes";
type AppointmentRow = {
  id: string;
  reference_id: string;
  patient_name: string;
  patient_age: number;
  gender: string;
  symptoms: string;
  contact_method: string;
  contact_value: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  suggested_date: string | null;
  suggested_time: string | null;
  created_at: string;
};

const words = {
  en: {
    features: "Features", how: "How it works", doctor: "Doctor & Care", track: "Track status",
    installation: "Installation",
    download: "Download APK", eyebrow: "Thoughtful care, made easier", headlineA: "Healing begins",
    headlineB: "at the core.", intro: "Personalised homoeopathic care, with a simpler way to book visits and keep your care journey close.",
    book: "Book a consultation", explore: "Explore the experience", inClinic: "In-clinic & Online visits",
    everyday: "Appointments every day · 6:00–8:00 p.m. IST", sectionTag: "A calmer care journey",
    featureHeading: "Care that stays connected.", bookFeature: "Request a visit in minutes",
    bookText: "Choose an evening time that works for you, then keep your appointment reference close.",
    rxFeature: "Your prescription, in reach", rxText: "Private clinical details stay with your signed-in patient account.",
    remindersFeature: "Know what comes next", remindersText: "Check your appointment progress and respond if the doctor suggests a new time.",
    appFeature: "Android companion app", appText: "Manage appointments, track queue tokens, and view prescription history directly on your phone.",
    queueFeature: "Live queue & wait times", queueText: "Real-time token counter and estimated arrival times for stress-free visits.",
    holisticFeature: "Personalised consultation", holisticText: "In-depth case taking focusing on root-cause understanding and psychological well-being.",
    howHeading: "From request to ready.", howText: "A clear path from booking your consultation to receiving your prescription.",
    step1: "Book in the Android app", step2: "Doctor confirms your visit", step3: "Attend consultation (In-Clinic or Online)", step4: "Your prescription is ready",
    installHeading: "How to Install the Android App",
    installSub: "Follow these simple steps to install the Sri Homoeo Care app directly on your Android phone.",
    installStep1Title: "1. Download the APK",
    installStep1Text: "Download the official compiled package (homoeo-care.apk) directly to your device.",
    installStep2Title: "2. Allow Unknown Sources",
    installStep2Text: "When Android prompts, open Settings > Install Unknown Apps and authorize your browser.",
    installStep3Title: "3. Install & Connect",
    installStep3Text: "Tap Install, open the app, and enter your appointment reference or sign in.",
    downloadCtaTitle: "Ready to keep your healthcare connected?",
    downloadCtaSub: "Download Sri Homoeo Care directly for your Android smartphone or Windows laptop for seamless appointments, instant queue updates, and digital records.",
    downloadBtnText: "Download Android APK (16.9 MB)",
    downloadLaptopBtnText: "Download Windows Laptop App (.exe)",
    apkBadge: "Sri Homoeo Care · v1.2.0 · Official Multi-Platform Release",
    apkStats: "Mobile APK: ~16.9 MB • Android 8.0+ • com.srihomeocare.app",
    laptopStats: "Windows App: ~48 KB • Windows 10/11 • Standalone .exe",
    statInClinic: "In-Clinic & Online", statInClinicLabel: "Consultation Modes",
    statStages: "5-Stage Live", statStagesLabel: "Queue & Token Tracker",
    statApk: "Mobile & PC", statApkLabel: "APK & Windows Apps",
    statBilingual: "Bilingual Care", statBilingualLabel: "English & தமிழ்",
    trackerHeading: "Your visit, at a glance.", trackerText: "Enter the reference from your booking ticket to see its latest stage.",
    lookup: "Appointment reference", search: "Check status", exampleRef: "SHC-2026-…", noResult: "No appointment found for that reference.",
    doctorHeading: "Dr. Sriindhuja C", qualification: "BHMS · MSc (Psychology)", doctorText: "A holistic, patient-centred approach to understanding concerns at their root.",
    timeLabel: "Care appointments", location: "In-clinic visits & online consultations", clinicNote: "Care center address and contact number to be added.",
    bookTitle: "Request your visit", name: "Full name", email: "Email address", password: "Password", phone: "Mobile number (optional)",
    age: "Age", gender: "Gender", chooseGender: "Choose", female: "Female", male: "Male", other: "Other", preferNot: "Prefer not to say",
    concern: "Main concern or symptoms", date: "Appointment date", slot: "Available time", noSlots: "No times available on this date.",
    submit: "Request appointment", signIn: "Sign in", createAccount: "Create patient account", signOut: "Sign out",
    accountFirst: "Please sign in or create a patient account to continue.", appointmentOnly: "In-clinic appointment", requested: "Requested",
    confirmed: "Confirmed by doctor", checked_in: "Checked in · waiting at clinic", in_consultation: "In consultation",
    prescription_ready: "Prescription ready", reschedule_suggested: "New time suggested", cancelled: "Cancelled",
    ticketTitle: "Your visit request is in.", ref: "Reference ID", secureNote: "Keep this reference private. Prescription details require your signed-in account.",
    installTitle: "Android installation guide", install1: "Download the official APK package to your device.",
    install2: "Open the downloaded file and choose Settings if Android asks.", install3: "Allow installs from this source, then return to complete installation.",
    installWarning: "Official release package (v1.2.0 • 16.9 MB). Verified SHA-256 Android build with offline caching.",
    staff: "Staff portal", staffOnly: "For authorised care staff", staffDenied: "This account is not authorised for care staff access.",
    demo: "v1.2.0 • Official Android Build",
    allStages: "Appointment journey", requestedLabel: "Requested", confirmedLabel: "Confirmed by doctor", checkedLabel: "Checked in",
    consultLabel: "In consultation", readyLabel: "Prescription ready", noAppointments: "No appointments yet.",
    acceptTime: "Accept new time", anotherSlot: "Pick another slot", cancel: "Cancel appointment", requestChange: "Request a change",
    saveProfile: "Save patient profile", contactPreference: "Use a verified email address for booking.", authRequired: "Sign in to see your appointment and prescription details.",
    privatePrescription: "View private prescription", privateNotes: "Consultation summary", newTime: "Suggested appointment",
    consultation: "Summary and doctor notes", clinicalPrivacy: "Your health information is private to your patient account.",
    demoTab1: "Appointment", demoTab2: "Prescription", demoTab3: "Visit summary", slotChosen: "6:30 p.m.", remedy: "As prescribed by your doctor", potency: "Potency", schedule: "Dosage schedule", dietary: "Dietary guidance",
    disclaimer: "Homoeopathic care is provided by Sri Homoeo Care; this website does not diagnose or recommend treatment.",
  },
  ta: {
    features: "சிறப்பம்சங்கள்", how: "செயல்முறை", doctor: "மருத்துவர் மற்றும் சிகிச்சை மையம்", track: "நிலையைப் பார்க்க",
    installation: "நிறுவல் வழிகாட்டி",
    download: "APK பதிவிறக்கம்", eyebrow: "அக்கறையான சிகிச்சை, எளிய முறையில்", headlineA: "குணமடைதல்",
    headlineB: "ஆழத்திலிருந்து.", intro: "தனிப்பட்ட ஹோமியோபதி பராமரிப்பு; சந்திப்பை முன்பதிவு செய்து உங்கள் வருகை விவரங்களை எளிதாகப் பாருங்கள்.",
    book: "ஆலோசனை முன்பதிவு", explore: "செயல்முறையைப் பாருங்கள்", inClinic: "நேரடி & இணையதள ஆலோசனை",
    everyday: "தினமும் · மாலை 6:00–8:00 IST", sectionTag: "அமைதியான சிகிச்சைப் பயணம்",
    featureHeading: "தொடர்புடன் இருக்கும் பராமரிப்பு.", bookFeature: "சில நிமிடங்களில் முன்பதிவு", bookText: "உங்களுக்கு ஏற்ற மாலை நேரத்தைத் தேர்ந்தெடுத்து குறிப்பு எண்ணை வைத்திருங்கள்.",
    rxFeature: "மருந்துச் சீட்டு உங்கள் கணக்கில்", rxText: "மருத்துவ விவரங்கள் உள்நுழைந்த நோயாளி கணக்கில் பாதுகாக்கப்படும்.",
    remindersFeature: "அடுத்த கட்டத்தை அறியுங்கள்", remindersText: "சந்திப்பு நிலையைப் பார்த்து மருத்துவர் பரிந்துரைக்கும் புதிய நேரத்திற்கு பதிலளிக்கலாம்.",
    appFeature: "ஆண்ட்ராய்டு செயலி", appText: "நேரடி முன்பதிவு, டோக்கன் கண்காணிப்பு மற்றும் மருந்துச் சீட்டு உங்கள் கைபேசியில்.",
    queueFeature: "நேரலை டோக்கன் வரிசை", queueText: "காத்திருப்பு நேரம் மற்றும் வரிசை நிலையை நிகழ்நேரத்தில் தெரிந்து கொள்ளுங்கள்.",
    holisticFeature: "முழுமையான மருத்துவ ஆலோசனை", holisticText: "டாக்டர் ஸ்ரீஇந்துஜா C அவர்களின் வழிகாட்டுதலில் மூலக்காரணங்களை நீக்கும் சிகிச்சை.",
    howHeading: "கோரிக்கையிலிருந்து தயாராகும் வரை.", howText: "முன்பதிவிலிருந்து மருந்துச் சீட்டு வரை தெளிவான நடைமுறை.",
    step1: "செயலியில் முன்பதிவு செய்க", step2: "மருத்துவர் உறுதிப்படுத்துவார்", step3: "ஆலோசனையில் பங்கேற்கவும் (நேரடி / இணையம்)", step4: "மருந்துச் சீட்டு தயாராகும்",
    installHeading: "ஆண்ட்ராய்டு செயலியை எவ்வாறு நிறுவுவது",
    installSub: "உங்கள் கைபேசியில் ஸ்ரீ ஹோமியோ கேர் செயலியை நிறுவ இந்த எளிய வழிமுறைகளைப் பின்பற்றவும்.",
    installStep1Title: "1. APK-ஐப் பதிவிறக்கவும்",
    installStep1Text: "அதிகாரப்பூர்வ தொகுப்பான 'homoeo-care.apk'-ஐ உங்கள் கைபேசியில் பதிவிறக்கவும்.",
    installStep2Title: "2. அமைப்புகளில் அனுமதி வழங்கவும்",
    installStep2Text: "அமைப்புகள் > அறியப்படாத செயலிகள் (Settings > Install Unknown Apps) சென்று அனுமதி அளிக்கவும்.",
    installStep3Title: "3. நிறுவி பயன்படுத்தவும்",
    installStep3Text: "'Install' என்பதை அழுத்தி, செயலியைத் திறந்து முன்பதிவு செய்து பயன்படுத்தத் தொடங்குங்கள்.",
    downloadCtaTitle: "ஸ்ரீ ஹோமியோ கேர் செயலி உங்கள் விரல் நுனியில்",
    downloadCtaSub: "நேரடி முன்பதிவு, நிகழ்நேர டோக்கன் அறிவிப்புகள் மற்றும் டிஜிட்டல் பதிவுகளை உங்கள் Android கைபேசி அல்லது Windows லேப்டாப்பில் பெறுங்கள்.",
    downloadBtnText: "Android APK பதிவிறக்கம் (16.9 MB)",
    downloadLaptopBtnText: "Windows லேப்டாப் செயலி (.exe)",
    apkBadge: "ஸ்ரீ ஹோமியோ கேர் · v1.2.0 · அதிகாரப்பூர்வ வெளியீடு",
    apkStats: "மொபைல் APK: ~16.9 MB • Android 8.0+ • com.srihomeocare.app",
    laptopStats: "Windows செயலி: ~48 KB • Windows 10/11 • நேரடி .exe",
    statInClinic: "நேரடி & இணையம்", statInClinicLabel: "ஆலோசனை முறைகள்",
    statStages: "5-நிலை நேரலை", statStagesLabel: "டோக்கன் மற்றும் வரிசை",
    statApk: "மொபைல் & PC", statApkLabel: "APK & Windows",
    statBilingual: "இருமொழி சேவை", statBilingualLabel: "ஆங்கிலம் & தமிழ்",
    trackerHeading: "உங்கள் சந்திப்பு நிலை.", trackerText: "முன்பதிவு சீட்டிலுள்ள குறிப்பு எண்ணை உள்ளிடவும்.",
    lookup: "சந்திப்பு குறிப்பு எண்", search: "நிலையைப் பார்க்க", exampleRef: "SHC-2026-…", noResult: "இந்த குறிப்பு எண்ணில் சந்திப்பு இல்லை.",
    doctorHeading: "டாக்டர் ஸ்ரீஇந்துஜா C", qualification: "BHMS · MSc (உளவியல்)", doctorText: "மூலக் காரணங்களைப் புரிந்துகொள்ளும் முழுமையான, நோயாளி மைய அணுகுமுறை.",
    timeLabel: "சிகிச்சை சந்திப்புகள்", location: "நேரடி மற்றும் இணையதள ஆலோசனைகள்", clinicNote: "மைய முகவரி மற்றும் தொடர்பு எண் பின்னர் சேர்க்கப்படும்.",
    bookTitle: "சந்திப்பைக் கோருங்கள்", name: "முழுப் பெயர்", email: "மின்னஞ்சல் முகவரி", password: "கடவுச்சொல்", phone: "கைபேசி எண் (விருப்பம்)",
    age: "வயது", gender: "பாலினம்", chooseGender: "தேர்வு செய்யுங்கள்", female: "பெண்", male: "ஆண்", other: "மற்றவை", preferNot: "சொல்ல விருப்பமில்லை",
    concern: "முக்கிய குறை அல்லது அறிகுறிகள்", date: "சந்திப்பு தேதி", slot: "கிடைக்கும் நேரம்", noSlots: "இந்த தேதியில் நேரம் இல்லை.",
    submit: "சந்திப்பைக் கோருங்கள்", signIn: "உள்நுழை", createAccount: "நோயாளர் கணக்கு உருவாக்கு", signOut: "வெளியேறு",
    accountFirst: "தொடர நோயாளர் கணக்கில் உள்நுழையவும் அல்லது கணக்கை உருவாக்கவும்.", appointmentOnly: "நேரடி மருத்துவமனை சந்திப்பு", requested: "கோரப்பட்டது",
    confirmed: "மருத்துவர் உறுதிப்படுத்தினார்", checked_in: "வந்துவிட்டார் · காத்திருக்கிறார்", in_consultation: "ஆலோசனையில்",
    prescription_ready: "மருந்துச் சீட்டு தயாராக உள்ளது", reschedule_suggested: "புதிய நேரம் பரிந்துரை", cancelled: "ரத்து செய்யப்பட்டது",
    ticketTitle: "சந்திப்பு கோரிக்கை பதிவு செய்யப்பட்டது.", ref: "குறிப்பு எண்", secureNote: "இந்த எண்ணை பாதுகாப்பாக வைத்திருங்கள். மருந்துச் சீட்டுக்கு உள்நுழைவு தேவை.",
    installTitle: "ஆண்ட்ராய்டு நிறுவல் வழிகாட்டி", install1: "அதிகாரப்பூர்வ APK கோப்பை சாதனத்தில் பதிவிறக்கவும்.", install2: "கோப்பைத் திறந்து, ஆண்ட்ராய்டு கேட்டால் அமைப்புகளைத் தேர்ந்தெடுக்கவும்.", install3: "இந்த மூலத்திலிருந்து நிறுவ அனுமதித்து, நிறுவலை முடிக்கவும்.",
    installWarning: "அதிகாரப்பூர்வ வெளியீட்டுத் தொகுப்பு (v1.2.0 • 15.8 MB). சரிபார்க்கப்பட்ட Android உருவாக்கம்.",
    staff: "பணியாளர் நுழைவு", staffOnly: "அங்கீகரிக்கப்பட்ட பணியாளர்களுக்கு மட்டும்", staffDenied: "இந்தக் கணக்கிற்கு பணியாளர் அனுமதி இல்லை.",
    demo: "v1.2.0 • அதிகாரப்பூர்வ Android வெளியீடு",
    allStages: "சந்திப்பு நிலைகள்", requestedLabel: "கோரப்பட்டது", confirmedLabel: "மருத்துவர் உறுதி", checkedLabel: "வருகை பதிவு",
    consultLabel: "ஆலோசனையில்", readyLabel: "மருந்துச் சீட்டு தயாராக உள்ளது", noAppointments: "சந்திப்புகள் இன்னும் இல்லை.",
    acceptTime: "புதிய நேரத்தை ஏற்கவும்", anotherSlot: "வேறு நேரத்தைத் தேர்வு", cancel: "சந்திப்பை ரத்து", requestChange: "மாற்றத்தைக் கோருங்கள்",
    saveProfile: "நோயாளர் விவரங்களைச் சேமி", contactPreference: "சரிபார்க்கப்பட்ட மின்னஞ்சலைப் பயன்படுத்தி முன்பதிவு செய்யவும்.", authRequired: "சந்திப்பு மற்றும் மருந்துச் சீட்டு விவரங்களைப் பார்க்க உள்நுழையவும்.",
    privatePrescription: "தனிப்பட்ட மருந்துச் சீட்டைப் பார்க்க", privateNotes: "ஆலோசனை சுருக்கம்", newTime: "பரிந்துரைக்கப்பட்ட நேரம்",
    consultation: "சுருக்கம் மற்றும் மருத்துவர் குறிப்புகள்", clinicalPrivacy: "உங்கள் மருத்துவத் தகவல்கள் உங்கள் கணக்கில் பாதுகாப்பாக இருக்கும்.",
    demoTab1: "சந்திப்பு", demoTab2: "மருந்துச் சீட்டு", demoTab3: "சுருக்கம்", slotChosen: "மாலை 6:30", remedy: "மருத்துவர் பரிந்துரைப்படி", potency: "திறன்", schedule: "மருந்து அட்டவணை", dietary: "உணவு வழிகாட்டுதல்",
    disclaimer: "சிகிச்சை மருத்துவமனை மருத்துவரால் வழங்கப்படும்; இந்தத் தளம் நோயைக் கண்டறியவோ சிகிச்சை பரிந்துரைக்கவோ செய்யாது.",
  },
} as const;

const stages = ["requested", "confirmed", "checked_in", "in_consultation", "prescription_ready"] as const;

function localDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function statusLabel(status: string, t: (typeof words)[Locale]) {
  return t[status as keyof typeof t] ?? t.requested;
}

function formatDate(value: string, locale: Locale) {
  const date = new Date(`${value}T12:00:00+05:30`);
  return new Intl.DateTimeFormat(locale === "ta" ? "ta-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(date);
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[oklch(0.82_0.12_85)]/50 bg-white p-0.5 shadow-md glow-gold">
        <img src="/sri-homeo-care-logo.png" alt="Sri Homoeo Care" className="h-full w-full object-contain" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold tracking-tight text-foreground">Sri Homoeo Care</p>
        {!compact && <p className="text-xs font-medium tracking-wide text-gradient-gold">Cure at the Core</p>}
      </div>
    </div>
  );
}

function InstallDialog({ open, onOpenChange, t, onDownload }: { open: boolean; onOpenChange: (open: boolean) => void; t: (typeof words)[Locale]; onDownload: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto border-border/80 bg-card text-foreground sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="font-display text-xl">{t.installTitle}</DialogTitle>
          <DialogDescription className="text-muted-foreground">{t.apkBadge}</DialogDescription>
        </DialogHeader>
        <ol className="space-y-4 py-2">
          {[t.install1, t.install2, t.install3].map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6 text-foreground/85">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-accent text-xs font-semibold text-primary">{index + 1}</span>{step}
            </li>
          ))}
        </ol>
        <div className="rounded-lg border border-primary/30 bg-accent/30 p-3.5 text-xs leading-relaxed text-foreground/85">
          <p className="mb-1 flex items-center gap-2 font-semibold text-primary"><ShieldCheck className="h-4 w-4" />{t.apkBadge}</p>
          {t.installWarning}
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { onDownload(); onOpenChange(false); }}>
            <Download className="mr-2 h-4 w-4" /> {t.downloadBtnText}
          </Button>
          <Button variant="outline" className="w-full border-border text-foreground" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-foreground/85">{label}</Label>{children}</div>;
}

function StatusSteps({ status, t }: { status: string; t: (typeof words)[Locale] }) {
  const index = status === "reschedule_suggested" ? 1 : stages.indexOf(status as (typeof stages)[number]);
  return (
    <ol className="mt-5 grid grid-cols-5 gap-2">
      {stages.map((stage, position) => {
        const complete = position <= index && status !== "cancelled";
        return <li key={stage} className="min-w-0 text-center">
          <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border ${complete ? "border-primary/60 bg-accent text-primary" : "border-border bg-background text-muted-foreground"}`}>
            {complete ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px]">{position + 1}</span>}
          </span>
          <span className="mt-2 block text-[10px] leading-4 text-muted-foreground sm:text-xs">{[t.requestedLabel, t.confirmedLabel, t.checkedLabel, t.consultLabel, t.readyLabel][position]}</span>
        </li>;
      })}
    </ol>
  );
}

function PhonePreview({ tab, setTab, t }: { tab: AppTab; setTab: (tab: AppTab) => void; t: (typeof words)[Locale] }) {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      {/* Ambient Glow */}
      <div className="absolute -inset-10 rounded-[3rem] bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -inset-5 rounded-[2.5rem] bg-gold/15 blur-2xl pointer-events-none" />

      {/* Titanium Frame */}
      <div className="relative rounded-[2.6rem] border-2 border-primary/30 bg-[#0C161D] p-3.5 shadow-[0_25px_80px_-20px_rgba(45,212,191,0.35)] card-3d">
        {/* Dynamic Island / Speaker Pill */}
        <div className="mx-auto mb-2 flex items-center justify-between px-3 text-[11px] font-mono text-slate-400">
          <span>6:15 PM</span>
          <div className="h-4 w-20 rounded-full bg-black/80 border border-slate-700/60 flex items-center justify-center">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse mr-1.5" />
            <span className="text-[9px] text-primary font-sans font-bold">ONLINE</span>
          </div>
          <span>100% ⚡</span>
        </div>

        {/* Screen Bezel */}
        <div className="rounded-[2rem] border border-primary/20 bg-[#0E1A22] p-4 text-slate-100 min-h-[480px] flex flex-col justify-between">
          <div>
            {/* Clinic Mini Header inside preview */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full border border-gold/60 bg-white p-0.5">
                  <img src="/sri-homeo-care-logo.png" alt="Logo" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Sri Homoeo Care</p>
                  <p className="text-[10px] text-primary font-medium">Dr. Sriindhuja C · Reg. 5397</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/60 border border-primary/30 text-primary font-mono font-bold">
                Online Active
              </span>
            </div>

            {/* Quick Tab Selector */}
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800">
              {([["booking", "📅 Book"], ["prescription", "⏱️ Queue #04"], ["notes", "💊 Rx & Diet"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key as AppTab)}
                  className={`rounded-lg py-1.5 text-[11px] font-bold transition-all ${
                    tab === key
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* TAB 1: BOOKING PREVIEW */}
            {tab === "booking" && (
              <div className="mt-3.5 space-y-2.5">
                <div className="rounded-xl border border-primary/30 bg-accent/20 p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-primary">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                      WhatsApp Call Consultation
                    </span>
                    <span className="text-gold font-mono">Today</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">Evening Slots (6:00 – 8:00 PM IST)</p>
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {["6:00 PM", "6:15 PM", "6:30 PM", "6:45 PM"].map((s, i) => (
                      <span
                        key={s}
                        className={`text-center py-1 rounded text-[10px] font-mono font-medium border ${
                          i === 2
                            ? "border-primary bg-primary/20 text-white font-bold"
                            : "border-slate-700 bg-slate-900/60 text-slate-400"
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-[11px] text-slate-300 space-y-1">
                  <p className="text-slate-400 text-[10px]">Chief Symptoms (Strictly Optional):</p>
                  <p className="text-slate-200 font-medium">e.g. Migraine & evening fatigue</p>
                </div>

                <div className="rounded-xl border border-primary/20 bg-accent/20 p-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Consultation Booking</span>
                  <span className="text-primary font-bold">Instant 1-Tap Booking</span>
                </div>
              </div>
            )}

            {/* TAB 2: 5-STAGE LIVE QUEUE */}
            {tab === "prescription" && (
              <div className="mt-3.5 space-y-2.5">
                <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-gold font-semibold">Your Live Sequence Token</p>
                  <p className="text-3xl font-extrabold text-gold tracking-tight my-1">#04</p>
                  <p className="text-[11px] text-slate-300 font-mono">Ref: SHC-2026-8A41D2</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent/60 border border-primary/40 px-2.5 py-0.5 text-[10px] text-primary font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Now Serving: #03 · Wait: ~10 mins
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-2.5 space-y-1.5 text-[11px]">
                  <p className="text-slate-400 text-[10px] font-semibold uppercase">5-Stage Consultation Tracker</p>
                  {[
                    { label: "1. Requested & Paid", done: true },
                    { label: "2. Confirmed by Doctor", done: true },
                    { label: "3. Checked In Online", done: true },
                    { label: "4. In WhatsApp Consultation", active: true },
                    { label: "5. Prescription Ready", pending: true },
                  ].map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px]">
                      {step.done && <span className="h-4 w-4 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center text-[10px]">✓</span>}
                      {step.active && <span className="h-4 w-4 rounded-full bg-gold/20 text-gold border border-gold/40 flex items-center justify-center text-[10px] animate-pulse">●</span>}
                      {step.pending && <span className="h-4 w-4 rounded-full bg-slate-800 text-slate-500 border border-slate-700 flex items-center justify-center text-[10px]">○</span>}
                      <span className={step.active ? "text-gold font-bold" : step.done ? "text-slate-200" : "text-slate-500"}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: RX & DIET VAULT */}
            {tab === "notes" && (
              <div className="mt-3.5 space-y-2.5">
                <div className="rounded-xl border border-primary/30 bg-accent/20 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-primary">Prescribed Remedies</span>
                    <span className="text-[10px] text-gold font-mono">Classical Homoeo</span>
                  </div>
                  <div className="bg-slate-900/90 rounded-lg p-2 text-[11px] border border-slate-800">
                    <div className="flex justify-between font-semibold text-white">
                      <span>Arnica Montana</span>
                      <span className="text-gold">200C</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">4 sugar globules · Morning & Night</p>
                  </div>
                  <div className="bg-slate-900/90 rounded-lg p-2 text-[11px] border border-slate-800">
                    <div className="flex justify-between font-semibold text-white">
                      <span>Nux Vomica</span>
                      <span className="text-gold">30C</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">4 sugar globules · Bedtime</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gold/30 bg-gold/10 p-2.5 text-[11px] text-slate-300 space-y-1">
                  <p className="text-gold font-bold text-[10px]">⚠️ Classical Dietary Restrictions:</p>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Strictly avoid raw onion, raw garlic, coffee, menthol, camphor, and eucalyptus 30 mins before & after dose.
                  </p>
                </div>

                <div className="rounded-xl border border-primary/20 bg-accent/20 p-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">Option C Dual Delivery</span>
                  <span className="text-primary font-semibold">PDF Download / Courier</span>
                </div>
              </div>
            )}
          </div>

          {/* Phone Bottom Micro Dock */}
          <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span className="text-primary font-medium">● Online Active</span>
            <span>SHC App v1.2.0</span>
            <span className="text-gold font-mono">Tirupattur</span>
          </div>
        </div>
      </div>
      <div className="relative mt-3 text-center text-xs text-muted-foreground font-mono">
        Official Multi-Platform Companion Preview
      </div>
    </div>
  );
}

function StaffPortal({ open, onOpenChange, t }: { open: boolean; onOpenChange: (open: boolean) => void; t: (typeof words)[Locale] }) {
  const user = useClinicUser();
  const listStaffAppointments = useServerFn(getClinicStaffAppointments);
  const updateStaffAppointment = useServerFn(updateClinicAppointmentAsStaff);
  const [authorized, setAuthorized] = useState(false);
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AppointmentRow | null>(null);
  const [suggestDate, setSuggestDate] = useState(localDateString());
  const [suggestTime, setSuggestTime] = useState("18:00");

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await listStaffAppointments();
      setRows(result as AppointmentRow[]);
      setAuthorized(true);
    } catch { setAuthorized(false); }
    finally { setLoading(false); }
  }, [user, listStaffAppointments]);

  useEffect(() => { if (open) void refresh(); }, [open, refresh]);

  async function staffAction(action: "status" | "reschedule", row: AppointmentRow, status?: "confirmed" | "checked_in" | "in_consultation" | "prescription_ready" | "cancelled") {
    try {
      if (action === "status" && status) await updateStaffAppointment({ data: { action, appointmentId: row.id, status } });
      else await updateStaffAppointment({ data: { action: "reschedule", appointmentId: row.id, date: suggestDate, time: suggestTime } });
      toast.success("Appointment updated.");
      setSuggestion(null);
      await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update appointment."); }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[88vh] overflow-y-auto border-border/80 bg-card text-foreground sm:max-w-3xl">
      <DialogHeader className="text-left"><DialogTitle className="font-display text-xl">{t.staff}</DialogTitle><DialogDescription>{t.staffOnly}</DialogDescription></DialogHeader>
      {!user ? <p className="text-sm text-muted-foreground">{t.accountFirst}</p> : !authorized && !loading ? <p className="text-sm text-muted-foreground">{t.staffDenied}</p> : <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {rows.map((row) => <div key={row.id} className="border-b border-border py-4">
          <div className="flex flex-wrap justify-between gap-3"><div><p className="font-medium">{row.patient_name} · {row.patient_age}</p><p className="mt-1 font-mono text-xs text-primary">{row.reference_id}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(row.appointment_date, "en")} · {formatIstTime(row.appointment_time)} · {statusLabel(row.status, t)}</p><p className="mt-2 line-clamp-2 max-w-lg text-xs text-muted-foreground">{row.symptoms}</p></div><div className="flex flex-wrap items-start gap-2">
            {row.status === "requested" && <Button size="sm" onClick={() => void staffAction("status", row, "confirmed")}>Confirm</Button>}
            {row.status === "confirmed" && <Button size="sm" onClick={() => void staffAction("status", row, "checked_in")}>Check in</Button>}
            {row.status === "checked_in" && <Button size="sm" onClick={() => void staffAction("status", row, "in_consultation")}>Start visit</Button>}
            {row.status === "in_consultation" && <Button size="sm" onClick={() => void staffAction("status", row, "prescription_ready")}>Prescription ready</Button>}
            {!(["cancelled", "prescription_ready"].includes(row.status)) && <Button size="sm" variant="outline" onClick={() => setSuggestion(row)}>Suggest time</Button>}
          </div></div>
          {suggestion?.id === row.id && <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Input type="date" min={localDateString()} value={suggestDate} onChange={(e) => setSuggestDate(e.target.value)} /><select className="h-10 rounded-sm border border-input bg-background px-3 text-sm" value={suggestTime} onChange={(e) => setSuggestTime(e.target.value)}>{["18:00", "18:30", "19:00", "19:30"].map((time) => <option key={time} value={time}>{formatIstTime(time)}</option>)}</select><Button size="sm" onClick={() => void staffAction("reschedule", row)}>Send suggestion</Button></div>}
        </div>)}
      </div>}
    </DialogContent>
  </Dialog>;
}



function ClinicPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [viewPortal, setViewPortal] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.search.includes("portal=true") || window.location.hash.includes("portal");
    }
    return false;
  });
  const [tab, setTab] = useState<AppTab>("booking");
  const [clinicUser, setClinicUser] = useState<ClinicUser | null>(null);
  const t = words[locale];

  useEffect(() => {
    const active = getActiveUser();
    if (active) {
      setClinicUser(active);
    }
  }, []);

  function handleAuthenticated(user: ClinicUser) {
    setActiveUser(user);
    setClinicUser(user);
    toast.success(
      locale === "ta"
        ? `வரவேற்கிறோம், ${user.name}!`
        : `Welcome, ${user.name}!`
    );
  }

  function handleSignOut() {
    setActiveUser(null);
    setClinicUser(null);
    toast.info(locale === "ta" ? "வெளியேறிவிட்டீர்கள்." : "Signed out.");
  }

  function triggerDownload(url: string, filename: string) {
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function downloadApk() {
    triggerDownload("/downloads/homoeo-care.apk", "homoeo-care.apk");
    toast.success(
      locale === "ta"
        ? "ஸ்ரீ ஹோமியோ கேர் Android APK பதிவிறக்கம் தொடங்குகிறது (~16.9 MB)..."
        : "Downloading Sri Homoeo Care Android APK (~16.9 MB)..."
    );
  }

  function downloadLaptopApp() {
    triggerDownload("/downloads/homoeo-care-windows.exe", "homoeo-care-windows.exe");
    toast.success(
      locale === "ta"
        ? "ஸ்ரீ ஹோமியோ கேர் Windows செயலி பதிவிறக்கம் தொடங்குகிறது (.exe)..."
        : "Downloading Sri Homoeo Care Windows Laptop App (.exe)..."
    );
  }

  const findAppointmentFn = useServerFn(findPublicAppointmentStatus);
  const [trackRef, setTrackRef] = useState("");
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [isSearchingTrack, setIsSearchingTrack] = useState(false);

  async function handleTrackSearch(e?: React.FormEvent, directRef?: string) {
    if (e) e.preventDefault();
    const clean = (directRef || trackRef).trim().toUpperCase();
    if (!clean) {
      toast.error(
        locale === "ta"
          ? "சந்திப்பு குறிப்பு எண்ணை உள்ளிடவும் (எ.கா. SHC-2026-8A41D2)"
          : "Please enter your appointment reference ID (e.g. SHC-2026-8A41D2)"
      );
      return;
    }
    setIsSearchingTrack(true);
    try {
      const res = await findAppointmentFn({ data: { referenceId: clean } });
      if (!res) {
        toast.error(
          locale === "ta"
            ? "சந்திப்பு காணப்படவில்லை. குறிப்பு எண்ணை சரிபார்க்கவும்."
            : "No active appointment found with that reference ID."
        );
        setTrackingResult(null);
      } else {
        setTrackingResult(res);
        toast.success(
          locale === "ta"
            ? "சந்திப்பு விவரங்கள் வெற்றிகரமாக பெறப்பட்டன!"
            : "Appointment details loaded successfully!"
        );
      }
    } catch {
      toast.error(
        locale === "ta"
          ? "சந்திப்பு நிலையைப் பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
          : "Could not retrieve appointment status. Please try again."
      );
    } finally {
      setIsSearchingTrack(false);
    }
  }

  const navItems = useMemo(
    () =>
      [
        ["features", t.features],
        ["track", t.track],
        ["how", t.how],
        ["installation", t.installation],
        ["download", t.download],
        ["doctor", t.doctor],
      ] as const,
    [t]
  );

  // If viewing the dedicated inner portal (Patient / Doctor / Member / Admin)
  if (viewPortal) {
    return (
      <main className="min-h-screen bg-mesh-aurora text-foreground flex flex-col justify-between">
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-2xl">
          <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button
                variant="glass"
                size="sm"
                onClick={() => setViewPortal(false)}
              >
                ← {locale === "ta" ? "வலைத்தளத்திற்கு திரும்பு" : "Back to Website"}
              </Button>
              <Brand compact />
              {clinicUser && (
                <div className="hidden sm:flex items-center gap-2 rounded-full glass-subtle px-3 py-1.5 text-xs">
                  <span className="font-semibold text-primary">
                    {clinicUser.role === "admin" && "👑 Admin (Clinic Owner)"}
                    {clinicUser.role === "doctor" && "🩺 Dr. Sriindhuja C (Doctor)"}
                    {clinicUser.role === "member" && "📋 Operations Desk (Member)"}
                    {clinicUser.role === "patient" && `👤 ${clinicUser.name}`}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Toggle */}
              <button
                type="button"
                onClick={() => setLocale(locale === "en" ? "ta" : "en")}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-foreground hover:bg-accent transition"
                aria-label="Switch language"
              >
                <Languages className="h-4 w-4 text-primary" />
                <span>{locale === "en" ? "தமிழ்" : "English"}</span>
              </button>

              {/* Sign Out if logged in */}
              {clinicUser && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSignOut}
                  className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>{locale === "ta" ? "வெளியேறு" : "Sign Out"}</span>
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1">
          {!clinicUser ? (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <AuthGate
                onAuthenticated={handleAuthenticated}
                locale={locale}
                onToggleLocale={() => setLocale(locale === "en" ? "ta" : "en")}
              />
            </div>
          ) : (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {clinicUser.role === "admin" && <AdminPortal locale={locale} />}
              {clinicUser.role === "doctor" && <DoctorPortal locale={locale} />}
              {clinicUser.role === "member" && <MemberPortal locale={locale} />}
              {clinicUser.role === "patient" && <PatientPortal user={clinicUser} locale={locale} />}
            </div>
          )}
        </div>

        <footer className="border-t border-border/60 bg-card/40 py-6 text-center text-xs text-muted-foreground">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Sri Homoeo Care · Dr. Sriindhuja C (BHMS, MSc Psychology)</p>
            <p className="text-gold font-medium">Cure at the Core · வேரிலிருந்து முழுமையான குணம்</p>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Appointments: Daily 6:00 – 8:00 PM IST</span>
              <span>•</span>
              <span>Direct Online Booking</span>
            </div>
          </div>
        </footer>
      </main>
    );
  }

  // DEFAULT VIEW: Rich Website Landing Page
  return (
    <main className="min-h-screen overflow-hidden bg-mesh-aurora text-foreground">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/80 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="#top" aria-label="Sri Homoeo Care home" className="shrink-0 group">
            <Brand />
          </a>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
            {navItems.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-primary relative py-1 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-primary after:transition-all hover:after:w-full"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="hidden items-center gap-2.5 md:flex">
            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "ta" : "en")}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/50 px-3 text-xs font-semibold text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-all duration-200"
              aria-label="Switch language"
            >
              <Languages className="h-4 w-4 text-primary" />
              <span>{locale === "en" ? "EN" : "தமிழ்"}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>
            <Button size="sm" variant="outline" onClick={downloadApk} className="rounded-xl border-border/80 hover:border-primary/40">
              <Smartphone className="h-4 w-4 mr-1.5 text-primary" />
              Mobile APK
            </Button>
            <Button size="sm" variant="glass" onClick={downloadLaptopApp} className="rounded-xl">
              <Laptop className="h-4 w-4 mr-1.5 text-[oklch(0.82_0.12_85)]" />
              Laptop App
            </Button>
            <Button
              size="sm"
              variant="premium"
              onClick={() => setViewPortal(true)}
              className="rounded-xl"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              {clinicUser ? (
                clinicUser.role === "admin" ? "👑 Admin Portal" :
                clinicUser.role === "doctor" ? "🩺 Doctor Queue" :
                clinicUser.role === "member" ? "📋 Member Desk" : `👤 ${clinicUser.name}`
              ) : (locale === "ta" ? "கேர் போர்டல்" : "Care Portal")}
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" aria-label={mobileMenu ? "Close menu" : "Open menu"} onClick={() => setMobileMenu((value) => !value)}>
            {mobileMenu ? <X /> : <Menu />}
          </Button>
        </div>
        {mobileMenu && (
          <div className="border-t border-border/80 bg-background/95 backdrop-blur-2xl px-5 py-5 md:hidden animate-fade-rise">
            <nav className="grid gap-3.5">
              {navItems.map(([id, label]) => (
                <a key={id} href={`#${id}`} onClick={() => setMobileMenu(false)} className="py-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2.5 pt-3 border-t border-border/60">
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setLocale(locale === "en" ? "ta" : "en")}>
                  <Languages className="h-4 w-4 mr-1.5 text-primary" />
                  {locale === "en" ? "தமிழ்" : "English"}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={downloadApk}>
                  <Smartphone className="h-4 w-4 mr-1.5" />
                  {t.download}
                </Button>
              </div>
              <Button size="sm" variant="shimmer" className="w-full" onClick={() => { setMobileMenu(false); setViewPortal(true); }}>
                {locale === "ta" ? "கேர் போர்டல் / உள்நுழை" : "Care Portal / Sign In"}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="top" className="relative border-b border-border/40 overflow-hidden">
        <div className="absolute inset-y-0 right-0 hidden w-[55%] bg-[radial-gradient(ellipse_at_center,oklch(0.45_0.1_192_/_0.22),transparent_70%)] lg:block" />
        <div className="absolute top-20 left-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-10 right-20 w-80 h-80 bg-[oklch(0.82_0.12_85)]/8 rounded-full blur-3xl pointer-events-none animate-float" />
        
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:gap-16 lg:py-24">
          <div className="max-w-2xl animate-fade-up">
            {/* Live Consultation Pulse Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-primary backdrop-blur-md shadow-sm">
              <span className="status-live-pulse" />
              <span className="font-semibold text-foreground/90">{locale === "ta" ? "நேரடி ஆலோசனை · மாலை 6:00 – 8:00 IST" : "In-Clinic & Online Care · Daily 6:00 – 8:00 PM IST"}</span>
              <span className="h-3 w-px bg-primary/30" />
              <span className="text-gold font-mono hidden sm:inline">{t.apkBadge}</span>
            </div>

            <p className="mt-8 text-xs font-bold tracking-widest text-primary uppercase">{t.eyebrow}</p>
            <h1 className="mt-3 font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              {t.headlineA}<br />
              <span className="text-gradient-primary">{t.headlineB}</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">{t.intro}</p>
            
            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-3.5">
              <Button size="xl" variant="shimmer" onClick={() => setViewPortal(true)} className="gap-2">
                <Sparkles className="h-5 w-5" />
                {t.book}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button size="xl" variant="outline" onClick={downloadApk} className="border-border/80 hover:border-primary/50">
                <Smartphone className="h-5 w-5 mr-2 text-primary" />
                {t.downloadBtnText}
              </Button>
              <Button size="xl" variant="glass" onClick={downloadLaptopApp} className="hidden sm:inline-flex">
                <Laptop className="h-5 w-5 mr-2 text-gold" />
                {t.downloadLaptopBtnText}
              </Button>
            </div>

            {/* Trust Highlights Row */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{t.inClinic}</span>
              <span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-gold" />{t.everyday}</span>
              <span className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" />Dr. Sriindhuja C · BHMS, MSc (Psychology)</span>
            </div>

            {/* 4 Bento Stat Cards */}
            <div className="mt-10 grid grid-cols-2 gap-3.5 border-t border-border/60 pt-6 sm:grid-cols-4">
              <div className="glass-card-premium p-4 rounded-2xl">
                <p className="font-display text-2xl font-extrabold text-foreground">{t.statInClinic}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.statInClinicLabel}</p>
              </div>
              <div className="glass-card-premium p-4 rounded-2xl">
                <p className="font-display text-2xl font-extrabold text-primary">{t.statStages}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.statStagesLabel}</p>
              </div>
              <div className="glass-card-premium p-4 rounded-2xl">
                <p className="font-display text-2xl font-extrabold text-gold">{t.statApk}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.statApkLabel}</p>
              </div>
              <div className="glass-card-premium p-4 rounded-2xl">
                <p className="font-display text-2xl font-extrabold text-foreground">{t.statBilingual}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t.statBilingualLabel}</p>
              </div>
            </div>

            {/* Doctor Branding Stamp */}
            <div className="mt-8 flex items-center gap-3.5 border-t border-border/60 pt-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-white p-1 shadow-sm glow-gold">
                <img src="/sri-homeo-care-logo.png" alt="Sri Homoeo Care" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-foreground">Cure at the Core · வேரிலிருந்து குணம்</p>
                <p className="text-xs text-gold">Dr. Sriindhuja C · Reg. No: 5397 (Tirupattur)</p>
              </div>
              <span className="ml-2 h-px flex-1 bg-border/80" />
            </div>
          </div>
          <PhonePreview tab={tab} setTab={setTab} t={t} />
        </div>
      </section>

      {/* Interactive Public Appointment Tracker Section */}
      <section id="track" className="border-b border-border/60 bg-card/25 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{t.track}</span>
            <h2 className="section-title mt-2">{t.trackerHeading}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.trackerText}</p>
          </div>

          <div className="mt-8 mx-auto max-w-xl">
            <form onSubmit={handleTrackSearch} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-muted-foreground" />
                <Input
                  value={trackRef}
                  onChange={(e) => setTrackRef(e.target.value)}
                  placeholder="Enter reference ID (e.g. SHC-2026-8A41D2)"
                  className="pl-10 h-11 bg-background/80 border-border text-foreground font-mono text-sm focus-visible:ring-primary rounded-xl"
                />
              </div>
              <Button
                type="submit"
                disabled={isSearchingTrack}
                variant="shimmer"
                className="h-11 px-6 rounded-xl shrink-0"
              >
                {isSearchingTrack ? "Searching..." : t.search}
              </Button>
            </form>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>{locale === "ta" ? "மாதிரி குறிப்பு எண்:" : "Test sample reference:"}</span>
              <button
                type="button"
                onClick={() => { setTrackRef("SHC-2026-8A41D2"); void handleTrackSearch(undefined, "SHC-2026-8A41D2"); }}
                className="font-mono text-primary hover:underline font-semibold"
              >
                SHC-2026-8A41D2
              </button>
            </div>

            {/* Tracking Result Card */}
            {trackingResult && (
              <div className="mt-6 p-6 rounded-2xl glass-card-premium border-primary/30 animate-fade-rise">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Appointment Reference</span>
                    <p className="font-mono font-bold text-lg text-primary">{trackingResult.referenceId || trackRef}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">Token Sequence</span>
                    <p className="font-display font-extrabold text-2xl text-gold">#{trackingResult.tokenNumber || 1}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block mb-1">Appointment Date:</span>
                    <span className="font-medium text-foreground">{trackingResult.appointmentDate ? formatDate(trackingResult.appointmentDate, locale) : "Today"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Scheduled Time:</span>
                    <span className="font-medium text-foreground">{trackingResult.appointmentTime ? formatIstTime(trackingResult.appointmentTime) : "6:30 PM IST"}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">Current Live Stage</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                      {statusLabel(trackingResult.status || "requested", t)}
                    </span>
                  </div>
                  <StatusSteps status={trackingResult.status || "requested"} t={t} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Expanded Features Bento Grid Section */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-widest text-primary uppercase">{t.sectionTag}</p>
          <h2 className="font-display mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t.featureHeading}</h2>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-3 perspective-1000">
          {/* Bento Card 1: Large (Span-2) Holistic Root-Cause Care */}
          <article className="glass-card-premium rounded-3xl p-8 card-3d md:col-span-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/15 transition-all duration-500" />
            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
                    <Stethoscope className="h-6 w-6" />
                  </span>
                  <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Clinical Architecture · 01
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold text-foreground">{t.holisticFeature}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xl">{t.holisticText}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/50 text-xs">
                <div className="p-3 rounded-xl bg-background/50 border border-border/60">
                  <span className="font-bold text-foreground block mb-1">Classical Homeopathy</span>
                  <span className="text-muted-foreground text-[11px]">Hahnemannian principles targeting root miasmatic cause.</span>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/60">
                  <span className="font-bold text-primary block mb-1">Psychology Intake</span>
                  <span className="text-muted-foreground text-[11px]">BHMS & MSc Psychology dual-discipline case taking.</span>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/60">
                  <span className="font-bold text-gold block mb-1">Zero Side-Effects</span>
                  <span className="text-muted-foreground text-[11px]">Natural potencies safe for infants, adults, and seniors.</span>
                </div>
              </div>
            </div>
          </article>

          {/* Bento Card 2: 5-Stage Live Queue Tracker */}
          <article className="glass-card-premium rounded-3xl p-8 card-3d md:col-span-1 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-[oklch(0.82_0.12_85)]/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/15 text-gold">
                  <Clock3 className="h-6 w-6" />
                </span>
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
                  Live Queue · 02
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-foreground">{t.queueFeature}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.queueText}</p>
            </div>
            <div className="mt-6 p-4 rounded-2xl bg-background/60 border border-border/60 text-center">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block">Active Sequence</span>
              <p className="text-3xl font-extrabold text-gold my-1 font-display">#03 Serving</p>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-primary">
                <span className="status-live-pulse" />
                Est. wait 10 mins
              </span>
            </div>
          </article>

          {/* Bento Card 3: Tamper-Proof Digital Prescriptions */}
          <article className="glass-card-premium rounded-3xl p-8 card-3d md:col-span-1 flex flex-col justify-between relative overflow-hidden group">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Rx Vault · 03
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-foreground">{t.rxFeature}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.rxText}</p>
            </div>
            <div className="mt-6 p-3.5 rounded-2xl bg-background/60 border border-border/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-foreground font-semibold">
                <span>Safe Home Delivery</span>
                <span className="text-primary font-mono text-[11px]">Courier Active</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Medicated sweet globules securely packaged with diet precautions sheet.
              </p>
            </div>
          </article>

          {/* Bento Card 4: Multi-Platform Companion Suite (Span-2) */}
          <article className="glass-card-premium rounded-3xl p-8 card-3d md:col-span-2 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
                      <Smartphone className="h-6 w-6" />
                    </span>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/15 text-gold">
                      <Laptop className="h-6 w-6" />
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Ecosystem · 04
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold text-foreground">{t.appFeature}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-xl">{t.appText}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
                <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
                  <span className="px-3 py-1.5 rounded-lg bg-background/60 border border-border">📱 Android 8.0+ APK (16.9 MB)</span>
                  <span className="px-3 py-1.5 rounded-lg bg-background/60 border border-border">💻 Windows 10/11 Standalone (.exe)</span>
                </div>
                <Button size="sm" variant="shimmer" onClick={downloadApk} className="rounded-xl">
                  <Download className="h-4 w-4 mr-1.5" />
                  {t.download}
                </Button>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* How it works Section */}
      <section id="how" className="border-y border-border/60 bg-card/25 py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="eyebrow">{t.how}</p>
            <h2 className="section-title mt-3">{t.howHeading}</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">{t.howText}</p>
            <Button className="mt-7" onClick={downloadApk}>
              <Download className="h-4 w-4 mr-2" />
              {t.download}
            </Button>
          </div>
          <ol className="grid gap-0 sm:grid-cols-2">
            {[t.step1, t.step2, t.step3, t.step4].map((step, index) => (
              <li key={step} className="flex min-h-28 gap-4 border-t border-border py-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 text-sm text-gold">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display font-semibold">{step}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{index === 0 ? t.everyday : t.inClinic}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Dedicated Installation & Setup Guide */}
      <section id="installation" className="border-b border-border/60 bg-card/30 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{t.installation}</p>
            <h2 className="section-title mt-3">{t.installHeading}</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">{t.installSub}</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="relative glass rounded-2xl p-8 card-3d">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-accent text-sm font-bold text-primary">1</div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">{t.installStep1Title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.installStep1Text}</p>
              <Button size="sm" onClick={downloadApk} className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Download className="mr-2 h-4 w-4" /> {t.download}
              </Button>
            </div>

            <div className="relative glass rounded-2xl p-8 card-3d">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold">2</div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">{t.installStep2Title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.installStep2Text}</p>
              <div className="mt-6 rounded-lg border border-border bg-background/80 p-3 text-xs text-muted-foreground">
                Settings &rarr; Apps &rarr; Install Unknown Apps &rarr; Toggle &quot;Allow&quot;
              </div>
            </div>

            <div className="relative glass rounded-2xl p-8 card-3d">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-accent text-sm font-bold text-primary">3</div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">{t.installStep3Title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.installStep3Text}</p>
              <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4" /> {t.demo}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download CTA Section */}
      <section id="download" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl glass-strong p-8 text-center depth-3 sm:p-14">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl pointer-events-none animate-float-slow" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[oklch(0.82_0.12_85)]/10 blur-3xl pointer-events-none animate-float" />
          <div className="relative z-10 mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent/60 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t.apkBadge}
            </div>
            <h2 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">{t.downloadCtaTitle}</h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{t.downloadCtaSub}</p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={downloadApk} className="h-14 px-8 text-base font-bold btn-magnetic">
                <Smartphone className="mr-3 h-5 w-5" />
                {t.downloadBtnText}
              </Button>
              <Button size="lg" onClick={downloadLaptopApp} className="h-14 px-8 text-base font-bold btn-magnetic" variant="outline">
                <Laptop className="mr-3 h-5 w-5" />
                {t.downloadLaptopBtnText}
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-xs font-mono text-muted-foreground/80 pt-2">
              <span>📱 {t.apkStats}</span>
              <span>💻 {t.laptopStats}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor & Clinic Profile */}
      <section id="doctor" className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[.5fr_1.5fr] lg:py-24">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gold/40 bg-white p-1.5 shadow-lg">
            <img src="/sri-homeo-care-logo.png" alt="Sri Homoeo Care - Cure at the Core" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="eyebrow">DOCTOR & CARE</p>
            <p className="mt-1 font-display text-sm font-bold text-foreground">Sri Homoeo Care</p>
            <p className="text-xs text-gold">Cure at the Core</p>
          </div>
        </div>
        <div className="border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <h2 className="font-display text-3xl font-semibold">{t.doctorHeading}</h2>
          <p className="mt-2 text-sm text-gold">{t.qualification}</p>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">{t.doctorText}</p>
          <div className="mt-7 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">{t.timeLabel}</p>
              <p className="mt-2 text-sm">Every day · 6:00–8:00 p.m. IST</p>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Visit type</p>
              <p className="mt-2 text-sm">{t.location}</p>
            </div>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">{t.clinicNote}</p>
        </div>
      </section>

      {/* Footer Section */}
      <section className="border-t border-border/60 bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Brand />
          <p className="max-w-xl text-xs leading-5 text-muted-foreground">{t.disclaimer}</p>
          <button
            type="button"
            onClick={() => setViewPortal(true)}
            className="flex items-center gap-2 self-start text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <LockKeyhole className="h-3.5 w-3.5" />
            {t.staff}
          </button>
        </div>
        <div className="mx-auto mt-6 max-w-7xl px-5 text-[10px] text-muted-foreground sm:px-8">
          © {new Date().getFullYear()} Sri Homoeo Care · Cure at the Core
        </div>
      </section>

      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setViewPortal(true)}
        aria-label="Open Care Portal"
        title="Open Sri Homoeo Care Portal"
        className="fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-primary/35 bg-card text-primary shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      <InstallDialog open={installOpen} onOpenChange={setInstallOpen} t={t} onDownload={downloadApk} />
    </main>
  );
}

export default ClinicPage;