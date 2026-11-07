# Sri Homoeo Care — Product Roadmap & Execution Status

**Brand**: Sri Homoeo Care  
**Motto**: Cure at the Core / வேரிலிருந்து முழுமையான குணம்  
**Lead Physician**: Dr. Sriindhuja C, BHMS, MSc (Psychology) · Reg. No: 5397 · Tirupattur, Tamil Nadu  
**Status**: Production-Ready / System Concluded (v2.5)  
**Last Updated**: November 2026  

---

## 1. Completed Milestones (Current Release — v2.5)

### Phase 1: Brand & Identity Modernization
- [x] **Brand Evolution**: Fully migrated branding from "Sri Homoeo Clinic" to "Sri Homoeo Care".
- [x] **New Visual Emblem**: Integrated the official high-resolution golden winged/botanical logo framed with stethoscope and heart motif.
- [x] **Multi-Platform Iconography**:
  - Web: High-definition 1024×1024 PNG/JPG, multi-resolution `favicon.ico` (16, 32, 48, 64px), and `favicon.png` (192px).
  - Android: Generated multi-density launcher icons (`mipmap-mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`) for both square and round styles.
  - Windows: Embedded native Windows multi-size `.ico` directly into the executable binary.
- [x] **Bilingual Clinical Localization**: Instant UI switching between English and Tamil (தமிழ்), covering clinical terms, doctor qualifications, and instructions.

### Phase 2: Frictionless Authentication & Security
- [x] **OTP Dependency Elimination**: Completely excised brittle third-party SMS/WhatsApp OTP dependencies (MSG91 widget, WA Automate) for reliable, zero-cost access.
- [x] **Direct Credential Flow**: Secure mobile/email and password sign-in for returning patients, doctors, care staff, and administrators.
- [x] **Interactive Feedback**: Added active button loaders (`Loader2` spinner + "Registering…" state) during patient account registration.
- [x] **Strict Access Guarding**: Reinforced `AuthGate` across the application so unauthenticated users cannot browse internal clinical data or booking flows.
- [x] **Demo Account Pruning**: Removed temporary mock accounts in favor of clean role-based accounts and production patient profiles.

### Phase 3: Clinical Queue & Appointment Engine
- [x] **Free 1-Tap Booking**: Direct consultation booking without payment barriers or mandatory gateway fees.
- [x] **Daily Evening Scheduling**: Fixed 6:00 p.m. to 8:00 p.m. IST consultation window with automated 15-minute slot allocation.
- [x] **Daily Token Numbers**: Automated sequential token generation (`#01` through `#15`) per consultation date.
- [x] **Secure Tracking Reference**: High-entropy booking references (`SHC-2026-XXXXXX`) for instant status lookup.
- [x] **5-Stage Live Queue Tracker**:
  - Stage 1: Consultation Request Submitted
  - Stage 2: Confirmed by Dr. Sriindhuja C
  - Stage 3: Token Called · Get Ready (WhatsApp Video/Audio alert)
  - Stage 4: Consultation in Progress
  - Stage 5: Prescription Ready

### Phase 4: Classical Homeopathic Records & Dispensing Desk
- [x] **Comprehensive Case Records**: Past medical history, constitutional symptoms, and mental/emotional modalities.
- [x] **Prescription Management**: Classical remedies, potencies (30C, 200C, 1M), dosage, and specific dietary restrictions (avoiding raw onion, garlic, coffee, camphor).
- [x] **Courier Dispatch Portal (Option C)**: Dedicated desk for care operations staff to record India Post / DTDC tracking numbers and dispatch classical medicines across Tamil Nadu and India.

### Phase 5: Multi-Platform Triad & Distribution
- [x] **Web Application**: High-performance TanStack Start SSR + React 19 app with Vite 8.
- [x] **Android Companion APK**: Native Kotlin & Jetpack Compose APK (`homoeo-care.apk`, 16.9 MB) available for direct download.
- [x] **Windows Desktop App**: Standalone .NET C# desktop app (`homoeo-care-windows.exe`, 22 KB) with embedded icon and dedicated profile sandbox.
- [x] **Direct Downloads Hub**: One-click download buttons on the landing page for Android and Windows binaries.

### Phase 6: Codebase Hygiene & Optimization
- [x] **Dead Code Pruning**: Removed unused OTP libraries, orphaned test scripts, and deprecated dependencies (`@open-wa/wa-automate`, `input-otp`).
- [x] **Dependency Footprint**: Pruned 230 unneeded transitive packages, shrinking install size and accelerating CI/CD build speeds.
- [x] **Verification Quality**: 100% test pass rate across Vitest suites, with zero TypeScript compilation diagnostics (`tsc --noEmit`).

---

## 2. Upcoming Roadmap (Next Releases)

### Phase 7: Automated Notifications & Communication (v3.0)
- [ ] **Official WhatsApp Cloud API**: Integrate Meta-verified WhatsApp Business Cloud API webhooks for automated token call alerts and tracking updates directly to the patient's phone.
- [ ] **SMS Gateway Fallback**: Optional transactional SMS alert via DLT-approved Indian telecom gateways for patients without WhatsApp.
- [ ] **Email Consultation Summaries**: Automated PDF prescription delivery to the patient's registered email address upon doctor sign-off.

### Phase 8: Clinical Tele-Consultation Enhancements (v3.1)
- [ ] **Integrated WebRTC Video**: Optional in-browser and in-app encrypted video consultation rooms for patients preferring not to use external WhatsApp calls.
- [ ] **Follow-up Reminder Engine**: Automated 14-day and 30-day chronic case follow-up scheduling with prompt alerts.
- [ ] **Patient Vital Logs**: Interactive symptom tracking journal where chronic patients log daily symptom changes before their next appointment.

### Phase 9: In-Care Physical Clinic Expansion (v3.2)
- [ ] **In-Care Clinic Queue Display**: Dedicated TV/display mode for the physical clinic waiting room showing the active live token number.
- [ ] **Walk-in Reception Terminal**: Quick receptionist tablet check-in module to seamlessly interleave walk-in patients with online booked tokens.
- [ ] **Inventory & Pharmacy Stock Control**: Automated stock decrement when Dr. Sriindhuja C prescribes homeopathic mother tinctures and dilutions.
