-- =====================================================================
-- SRI HOMOEO CARE — PostgreSQL schema (Voroa / Neon / Supabase)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) UNIQUE,
  phone VARCHAR(32) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'patient'
    CHECK (role IN ('patient', 'doctor', 'member', 'admin')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_appointments (
  id VARCHAR(64) PRIMARY KEY,
  reference_id VARCHAR(32) NOT NULL UNIQUE,
  patient_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_name VARCHAR(120) NOT NULL,
  patient_age INT NOT NULL DEFAULT 30,
  gender VARCHAR(20) NOT NULL DEFAULT 'other',
  symptoms TEXT,
  contact_method VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
  contact_value VARCHAR(120) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'requested',
  stage INT NOT NULL DEFAULT 1,
  token_number INT NOT NULL DEFAULT 1,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'paid',
  payment_reference VARCHAR(64) DEFAULT 'RZP-DIRECT',
  suggested_date DATE,
  suggested_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appts_patient ON clinic_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appts_date_token ON clinic_appointments(appointment_date, token_number);

CREATE TABLE IF NOT EXISTS clinic_prescriptions (
  id VARCHAR(64) PRIMARY KEY,
  appointment_id VARCHAR(64) NOT NULL REFERENCES clinic_appointments(id) ON DELETE CASCADE,
  patient_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  remedy_name VARCHAR(120) NOT NULL,
  potency VARCHAR(32) NOT NULL,
  dosage_schedule TEXT NOT NULL,
  dietary_guidelines TEXT,
  delivery_mode VARCHAR(32) NOT NULL DEFAULT 'pdf_download',
  courier_address TEXT,
  courier_tracking_id VARCHAR(64),
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_consultation_notes (
  id VARCHAR(64) PRIMARY KEY,
  appointment_id VARCHAR(64) NOT NULL REFERENCES clinic_appointments(id) ON DELETE CASCADE,
  patient_id VARCHAR(64) NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_summary TEXT NOT NULL,
  clinical_notes TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_appointment_history (
  id VARCHAR(64) PRIMARY KEY,
  appointment_id VARCHAR(64) NOT NULL REFERENCES clinic_appointments(id) ON DELETE CASCADE,
  patient_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  changed_by VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_appointment_requests (
  id VARCHAR(64) PRIMARY KEY,
  appointment_id VARCHAR(64) NOT NULL REFERENCES clinic_appointments(id) ON DELETE CASCADE,
  patient_id VARCHAR(64) NOT NULL,
  request_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  suggested_date DATE,
  suggested_time TIME,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id VARCHAR(64) PRIMARY KEY,
  identifier VARCHAR(120) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) NOT NULL DEFAULT 'register',
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed staff (temporary passwords — change after first login)
-- Same scrypt hashes as MySQL migration
INSERT INTO profiles (id, full_name, email, phone, password_hash, role, is_verified) VALUES
  ('user-doctor', 'Dr. Sriindhuja C', 'doctor@srihomoeoclinic.com', '+919443726526',
   'scrypt:20ef7a64e967432df7c6186a894d3006:31dfc1e7668d158c36dbc35046184f367b44c6d3e0fc5a507e737e414fe02d7fba204def07951adc403a120368c4e0b4ab635b0babb373a6da289bb3d4bd3c24',
   'doctor', TRUE),
  ('user-admin', 'Clinic Administrator', 'admin@srihomoeoclinic.com', '+919791426526',
   'scrypt:6b4aeae1e5cb24ee04e0471c96a44b93:52f77cbffaa85a194461642d57da772525f3e3b8106e38a807c66edf3369501bea7b8a76bce68fd8eb1883457aca11975f87c3ffbe491fbdc5f7c6844fe35d80',
   'admin', TRUE),
  ('user-member', 'Clinic Operations Desk', 'member@srihomoeoclinic.com', '+919791426527',
   'scrypt:adda89bf045800b8fd185043163e6563:3d910c56c55c5d221de09befe7c0708690a8cf7f8fe87c43491214fec2c413be564fa31abd8957960710534a15b9265b5ea3bcfb980e87bc16405f25566677a9',
   'member', TRUE),
  ('patient-demo', 'Suresh Kumar', 'suresh@example.com', '+919876543210',
   'scrypt:0b257fcd8b87934a212b6aae9bffb4e9:cbcbd3b40f2953dcde5aaf99118a5cc19fb4dfa0b23ffeb7edf3736dd12a14583bebc700e7461decceedab80d48d54607525acd97e88dc0e42bdef04d32ddd62',
   'patient', TRUE)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = COALESCE(EXCLUDED.password_hash, profiles.password_hash);

SELECT 'PostgreSQL schema ready for Sri Homoeo Care' AS status;
