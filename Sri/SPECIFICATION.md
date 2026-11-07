# Sri Homoeo Care System — Comprehensive Specification

**Brand**: Sri Homoeo Care  
**Motto**: Cure at the Core / வேரிலிருந்து முழுமையான குணம்  
**Lead Physician**: Dr. Sriindhuja C, BHMS, MSc (Psychology) · Reg. No: 5397 · Tirupattur, Tamil Nadu  
**Version**: 2.5 (Post-Discovery Architecture & System Concluded)  
**Last Updated**: November 2026  

---

## 1. Executive Summary & Clinical Philosophy

Sri Homoeo Care is a dedicated single-doctor homeopathic healthcare facility in Tamil Nadu, India. Homeopathic consultations require deep, individualized constitutional case-taking—exploring physical symptoms alongside psychological, emotional, and lifestyle modalities.

This system provides a high-reliability, bilingual clinical solution tailored for both remote online care and in-care clinic visits, strict patient privacy, role-based workflows, and patient convenience through Web, Android, and Windows companion software.

### Key Clinical Parameters
- **Consultation Mode**: Online WhatsApp video/audio consultations (Active) and In-Care Clinic visits (Coming Soon).
- **Appointment Schedule**: Every day, 6:00 p.m. to 8:00 p.m. IST (15-minute consultation slots).
- **Lead Doctor**: Dr. Sriindhuja C, BHMS, MSc (Psychology).
- **Languages**: English and Tamil (தமிழ்) with instant UI locale switching.
- **Primary Branding**: Dark aurora background (`#0B1318`), luminous emerald teal accents (`#00A884`), and metallic gold highlights (`#E0B86C`).
- **Logo & Emblem**: Botanical/winged silhouette embraced by a heart-shaped stethoscope with a vibrant red heart accent, bearing the typography *"SRI HOMOEO CARE"* and *"Cure at the Core"*.

---

## 2. Multi-Platform System Architecture

The system is architected as a cohesive triad covering mobile, desktop, and web users:

```
d:\New Project\
├── Sri\                       # Web App (TanStack Start, React 19, Vite 8, Tailwind v4)
│   └── src\desktop\           # Windows Desktop App (C# .NET App-Mode Launcher)
├── Sri-App\                   # Android Companion App (Kotlin, Jetpack Compose, Material 3)
└── dist\                      # Packaged release binaries (homoeo-care.apk, homoeo-care.exe)
```

### Core Platform Technology Choices
1. **Web Platform (`Sri`):**
   - React 19 with TanStack Start (v1.168) and Vite 8.
   - Styling: Tailwind CSS v4 with OKLCH tokens, Radix UI accessible primitives, Lucide React icons.
   - Database Connection: MySQL 8.0+ connection pool via `mysql2/promise`.
   - Client State: Resilient LocalStorage session vault with zero guest leaks.
   - Testing: Vitest 4 with full unit and integration coverage.

2. **Android Companion App (`Sri-App`):**
   - Native Android application built with Kotlin 2.2 and Jetpack Compose.
   - Material 3 dark-first clinical UI tokens.
   - Target SDK: 36, Min SDK: 24.
   - Direct appointment booking, 5-stage live tracker, and digital prescription viewer.

3. **Windows Desktop App (`Sri/src/desktop`):**
   - C# .NET application compiled with `csc.exe`.
   - Runs in dedicated browser App Mode with isolated profile directory (`SriHomoeoCareProfile`).
   - Automatically creates desktop shortcut (`Sri Homoeo Care.lnk`) with embedded icon (`app.ico`).

---

## 3. User Roles & Permission Matrix

| Feature / Action | Guest (Unauthenticated) | Authenticated Patient | Operations Member | Doctor (Dr. Sriindhuja C) | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Access Public Information & Downloads | Yes | Yes | Yes | Yes | Yes |
| View Care Portals | Blocked by AuthGate | Yes (Patient Portal) | Yes (Member Desk) | Yes (Doctor Queue) | Yes (Admin Desk) |
| Direct 1-Tap Booking | No (Auth Required) | Yes | Yes (Assisted) | Yes | Yes |
| Track Live Queue Status | No (Auth Required) | Yes (Own token) | Yes (Full roster) | Yes (Full roster) | Yes (Full roster) |
| Conduct Case Taking & Call Patient | No | No | No | Yes (WhatsApp) | No |
| Issue Digital Prescription | No | No | No | Yes | No |
| Download Private Prescription PDF | No | Yes (Self only) | Yes (Print only) | Yes | Yes |
| Dispatch Care Courier & Enter Tracking | No | No | Yes | No | Yes |
| Manage User Roles & Accounts | No | No | No | No | Yes |

---

## 4. End-to-End Clinical Lifecycle

The appointment workflow strictly enforces five sequential states without external payment gates or SMS OTP hurdles:

```
[1. REQUESTED]           ◄── Patient books direct 1-tap slot (6:00-8:00 PM IST)
      │
      ▼
[2. CONFIRMED]           ◄── Doctor reviews and accepts slot
      │
      ▼
[3. TOKEN_CALLED]        ◄── Doctor initiates WhatsApp call in ~5 minutes
      │
      ▼
[4. IN_CONSULTATION]     ◄── Constitutional case taking via WhatsApp
      │
      ▼
[5. PRESCRIPTION_READY]  ◄── Doctor signs prescription; unlocks PDF / Courier delivery
```

### Critical Rules:
1. **Operating Slot Window**: Daily slots from 18:00 to 20:00 IST in 15-minute increments (8 to 15 slots per evening).
2. **Double-Booking Prevention**: Database-level and state-level unique constraint on `(appointment_date, slot_time)`.
3. **Reference Identification**: Public tracking utilizes human-friendly, high-entropy reference strings (e.g. `SHC-2026-8A41D2`).
4. **Zero Guest Browsing**: The portal enforces `AuthGate` across all platforms to protect patient data privacy.
