# Sri Homoeo Care — Privacy & Data Protection (DPDP-oriented)

**Brand:** Sri Homoeo Care (“Cure at the Core”)  
**Purpose:** Homoeopathic appointment booking, queue tracking, and digital prescription access.

## Data we process
- Account: name, phone, email, password hash (scrypt — never plain text)
- Appointments: date/time, token, symptoms notes, stage
- Clinical: prescriptions, diet guidance, consultation notes (authorized roles only)

## Legal basis / consent
- Patients provide data to receive clinical services they request.
- Staff access is role-limited (patient / doctor / member / admin).

## Storage & security
- Passwords: scrypt with unique salt
- Transport: HTTPS
- Access: authenticated portals; public tracking only via appointment reference where designed
- Browser storage: session profile cache only — not a substitute for server records

## Retention
- Keep clinical records as required for care continuity and applicable law.
- Delete or anonymize on verified patient request where legally permitted.

## Patient rights (India DPDP spirit)
- Access and correction of personal data
- Withdrawal of non-essential processing
- Complaint to clinic admin contact

## Contact
Clinic administration — use the phone number published on the live site.

This document is operational guidance; have a qualified advisor review before formal legal publishing.
