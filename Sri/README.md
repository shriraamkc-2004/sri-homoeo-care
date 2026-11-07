# Sri Homoeo Care – Digital Clinical Platform

> **"Cure at the Core"** / **"வேரிலிருந்து முழுமையான குணம்"**  
> Lead Physician: **Dr. Sriindhuja C**, BHMS, MSc (Psychology) · Reg. No: 5397 · Tirupattur, Tamil Nadu  
> Daily Consultations: 6:00 p.m. – 8:00 p.m. IST  

---

## Overview

**Sri Homoeo Care** is an enterprise-grade, multi-platform digital healthcare solution designed specifically for homeopathic clinical practice. The platform delivers seamless patient registration, direct consultation booking, live 5-stage queue tracking, classical remedy prescription records, and multi-platform companion software across Web, Android, and Windows.

---

## Key Features

1. **Direct Authentication (No OTP Hurdles)**:
   - Streamlined Sign-In with Mobile/Email and Password.
   - Fast Patient Registration with responsive visual feedback (`Registering…` spinner).
   - Strict no-guest browsing policy enforced by `AuthGate`.

2. **1-Tap Direct Booking (No Payment Gateways)**:
   - Free/direct consultation scheduling for evening sessions (6:00–8:00 PM IST).
   - Real-time token number assignment (`#01` to `#15`).
   - High-entropy tracking reference generator (`SHC-2026-XXXXXX`).

3. **5-Stage Live Queue Tracker**:
   - Stage 1: Consultation Request Submitted
   - Stage 2: Confirmed by Dr. Sriindhuja C
   - Stage 3: Token Called · Get Ready (WhatsApp Call in ~5 mins)
   - Stage 4: Consultation in Progress
   - Stage 5: Prescription Ready

4. **Digital Prescription & Option C Courier Delivery**:
   - Classical homeopathic remedy & potency records.
   - Comprehensive dietary restrictions (avoiding raw onion, garlic, coffee, camphor).
   - Instant PDF prescription download or home delivery via India Post / DTDC with live tracking number.

5. **Multi-Platform Triad**:
   - **Web App**: Full responsive portal running TanStack Start and React 19.
   - **Android Companion App**: Native Kotlin & Jetpack Compose APK (`homoeo-care.apk`, 16.9 MB).
   - **Windows Desktop App**: Standalone .NET C# desktop launcher with official icon (`homoeo-care-windows.exe`, 22 KB).

---

## Tech Stack

- **Framework**: TanStack Start v1.168 with React 19
- **Bundler & Server**: Vite 8
- **Styling**: Tailwind CSS v4, Lucide React icons, Radix UI primitives
- **Database**: MySQL 8.0+ / MariaDB via `mysql2/promise` connection pool
- **Testing**: Vitest 4 with React Testing Library (100% pass rate)
- **Type Checking**: Strict TypeScript (0 errors)

---

## Quick Start (Development)

### Prerequisites
- Node.js 20+ and `pnpm`
- MySQL 8.0+ running on `localhost:3306`

### Installation & Run

```bash
# 1. Install dependencies
pnpm install

# 2. Start Vite development server
pnpm dev -- --port 5173 --host

# 3. Open in browser
http://localhost:5173/
```

### Running Tests & Verification

```bash
# Run Vitest test suite
pnpm test

# Run TypeScript compile check
npx tsc --noEmit
```

---

## Multi-Platform Build Commands

### Android APK (`Sri-App`)
```powershell
$env:JAVA_HOME = "C:\Users\kcshr\.jdks\dragonwell-ex-21.0.11"
cd "d:\New Project\Sri-App"
.\gradlew.bat assembleDebug
```
Output: `Sri-App/app/build/outputs/apk/debug/app-debug.apk` $\rightarrow$ `Sri/public/downloads/homoeo-care.apk`.

### Windows Desktop App (`Sri/src/desktop`)
```powershell
& "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /target:winexe /win32icon:"d:\New Project\Sri\src\desktop\app.ico" /out:"d:\New Project\Sri\public\downloads\homoeo-care-windows.exe" "d:\New Project\Sri\src\desktop\SriHomeoCare.cs"
```
Output: `Sri/public/downloads/homoeo-care-windows.exe`.
