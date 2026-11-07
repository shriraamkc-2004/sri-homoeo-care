-- =====================================================================
-- SRI HOMOEO CLINIC — COMPLETE MYSQL WORKBENCH DATABASE SCHEMA
-- Dr. Sriindhuja C, BHMS, MSc (Psychology) · Reg. No: 5397
-- "Cure at the Core" · "வேரிலிருந்து முழுமையான குணம்"
-- Tirupattur, Tamil Nadu · Daily 6:00 PM – 8:00 PM IST
-- =====================================================================
-- Instructions for MySQL Workbench:
-- 1. Open MySQL Workbench and connect to your MySQL Server (e.g. localhost:3306).
-- 2. Click "File" -> "Open SQL Script..." and select this file.
-- 3. Click the lightning bolt icon (Execute) or press Ctrl+Shift+Enter.
-- 4. In the left Navigator pane, right-click "Schemas" and click "Refresh All".
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `sri_homoeo_clinic`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `sri_homoeo_clinic`;

-- Disable foreign key checks for clean recreation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `clinic_appointment_history`;
DROP TABLE IF EXISTS `clinic_consultation_notes`;
DROP TABLE IF EXISTS `clinic_prescriptions`;
DROP TABLE IF EXISTS `clinic_appointment_requests`;
DROP TABLE IF EXISTS `clinic_appointments`;
DROP TABLE IF EXISTS `otp_verifications`;
DROP TABLE IF EXISTS `profiles`;

SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------------
-- 1. PROFILES & USER ACCOUNTS (Patients, Doctor, Staff, Admin)
-- -------------------------------------------------------------
CREATE TABLE `profiles` (
  `id` VARCHAR(64) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(120) DEFAULT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `role` ENUM('patient', 'doctor', 'member', 'admin') NOT NULL DEFAULT 'patient',
  `is_verified` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_profiles_phone` (`phone`),
  UNIQUE KEY `idx_profiles_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 2. CLINIC APPOINTMENTS (Evening 6:00–8:00 PM IST, 15-Min Slots)
-- -------------------------------------------------------------
CREATE TABLE `clinic_appointments` (
  `id` VARCHAR(64) NOT NULL,
  `reference_id` VARCHAR(32) NOT NULL,
  `patient_id` VARCHAR(64) NOT NULL,
  `patient_name` VARCHAR(120) NOT NULL,
  `patient_age` INT NOT NULL DEFAULT 30,
  `gender` VARCHAR(20) NOT NULL DEFAULT 'other',
  `symptoms` TEXT DEFAULT NULL,
  `contact_method` ENUM('phone', 'whatsapp', 'email') NOT NULL DEFAULT 'whatsapp',
  `contact_value` VARCHAR(120) NOT NULL,
  `appointment_date` DATE NOT NULL,
  `appointment_time` TIME NOT NULL,
  `status` ENUM(
    'requested',
    'confirmed',
    'checked_in',
    'in_consultation',
    'prescription_ready',
    'reschedule_suggested',
    'cancelled'
  ) NOT NULL DEFAULT 'requested',
  `stage` INT NOT NULL DEFAULT 1,
  `token_number` INT NOT NULL DEFAULT 1,
  `payment_status` ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'paid',
  `payment_reference` VARCHAR(64) DEFAULT 'RZP-₹100-DIRECT',
  `suggested_date` DATE DEFAULT NULL,
  `suggested_time` TIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_appts_ref` (`reference_id`),
  KEY `idx_appts_patient` (`patient_id`),
  KEY `idx_appts_date_token` (`appointment_date`, `token_number`),
  CONSTRAINT `fk_appts_patient` FOREIGN KEY (`patient_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 3. DIGITAL PRESCRIPTIONS & DIET CARE VAULT (Classical Homoeo)
-- -------------------------------------------------------------
CREATE TABLE `clinic_prescriptions` (
  `id` VARCHAR(64) NOT NULL,
  `appointment_id` VARCHAR(64) NOT NULL,
  `patient_id` VARCHAR(64) NOT NULL,
  `remedy_name` VARCHAR(120) NOT NULL,
  `potency` VARCHAR(32) NOT NULL,
  `dosage_schedule` TEXT NOT NULL,
  `dietary_guidelines` TEXT DEFAULT NULL,
  `delivery_mode` ENUM('pdf_download', 'clinic_courier') NOT NULL DEFAULT 'pdf_download',
  `courier_address` TEXT DEFAULT NULL,
  `courier_tracking_id` VARCHAR(64) DEFAULT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_presc_appt` (`appointment_id`),
  KEY `idx_presc_patient` (`patient_id`),
  CONSTRAINT `fk_presc_appt` FOREIGN KEY (`appointment_id`) REFERENCES `clinic_appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_presc_patient` FOREIGN KEY (`patient_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 4. CLINIC CONSULTATION NOTES (Holistic & Psychology Case Taking)
-- -------------------------------------------------------------
CREATE TABLE `clinic_consultation_notes` (
  `id` VARCHAR(64) NOT NULL,
  `appointment_id` VARCHAR(64) NOT NULL,
  `patient_id` VARCHAR(64) NOT NULL,
  `note_summary` TEXT NOT NULL,
  `clinical_notes` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notes_appt` (`appointment_id`),
  KEY `idx_notes_patient` (`patient_id`),
  CONSTRAINT `fk_notes_appt` FOREIGN KEY (`appointment_id`) REFERENCES `clinic_appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notes_patient` FOREIGN KEY (`patient_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 5. APPOINTMENT AUDIT & STAGE TRANSITION HISTORY
-- -------------------------------------------------------------
CREATE TABLE `clinic_appointment_history` (
  `id` VARCHAR(64) NOT NULL,
  `appointment_id` VARCHAR(64) NOT NULL,
  `patient_id` VARCHAR(64) NOT NULL,
  `status` VARCHAR(32) NOT NULL,
  `changed_by` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_hist_appt` (`appointment_id`),
  CONSTRAINT `fk_hist_appt` FOREIGN KEY (`appointment_id`) REFERENCES `clinic_appointments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 6. APPOINTMENT RESCHEDULING & SPECIAL REQUESTS
-- -------------------------------------------------------------
CREATE TABLE `clinic_appointment_requests` (
  `id` VARCHAR(64) NOT NULL,
  `appointment_id` VARCHAR(64) NOT NULL,
  `patient_id` VARCHAR(64) NOT NULL,
  `request_type` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `suggested_date` DATE DEFAULT NULL,
  `suggested_time` TIME DEFAULT NULL,
  `note` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_req_appt` (`appointment_id`),
  CONSTRAINT `fk_req_appt` FOREIGN KEY (`appointment_id`) REFERENCES `clinic_appointments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- 7. CLASH-FREE RANDOM OTP VERIFICATIONS (3-Minute Expiry Engine)
-- -------------------------------------------------------------
CREATE TABLE `otp_verifications` (
  `id` VARCHAR(64) NOT NULL,
  `identifier` VARCHAR(120) NOT NULL,
  `otp_code` VARCHAR(6) NOT NULL,
  `purpose` ENUM('login', 'register') NOT NULL DEFAULT 'register',
  `expires_at` DATETIME NOT NULL,
  `is_used` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otp_id_code` (`identifier`, `otp_code`, `expires_at`, `is_used`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- STORED PROCEDURES (MATCHING CLINICAL REQUIREMENTS)
-- =====================================================================

DELIMITER $$

-- Procedure to compute next available token number for a given clinic date
DROP PROCEDURE IF EXISTS `sp_get_next_token`$$
CREATE PROCEDURE `sp_get_next_token`(
  IN p_date DATE,
  OUT p_next_token INT
)
BEGIN
  SELECT IFNULL(MAX(`token_number`), 0) + 1 INTO p_next_token
  FROM `clinic_appointments`
  WHERE `appointment_date` = p_date;
END$$

-- Procedure to track appointment status securely by reference ID
DROP PROCEDURE IF EXISTS `sp_track_clinic_appointment`$$
CREATE PROCEDURE `sp_track_clinic_appointment`(
  IN p_reference_id VARCHAR(32)
)
BEGIN
  SELECT
    `id`,
    `reference_id`,
    `appointment_date`,
    TIME_FORMAT(`appointment_time`, '%H:%i') AS `appointment_time`,
    `status`,
    `stage`,
    `token_number`,
    `suggested_date`,
    TIME_FORMAT(`suggested_time`, '%H:%i') AS `suggested_time`
  FROM `clinic_appointments`
  WHERE `reference_id` = UPPER(TRIM(p_reference_id))
  LIMIT 1;
END$$

DELIMITER ;

-- =====================================================================
-- INITIAL CLINIC SEED DATA (DOCTOR, ADMIN, OPERATIONS & REMEDIES)
-- =====================================================================

-- Insert Doctor Dr. Sriindhuja C
INSERT INTO `profiles` (`id`, `full_name`, `email`, `phone`, `role`, `is_verified`)
VALUES
  (
    'user-doctor',
    'Dr. Sriindhuja C',
    'doctor@srihomoeoclinic.com',
    '+919443726526',
    'doctor',
    TRUE
  ),
  (
    'user-admin',
    'Clinic Administrator',
    'admin@srihomoeoclinic.com',
    '+919791426526',
    'admin',
    TRUE
  ),
  (
    'user-member',
    'Clinic Operations Desk',
    'member@srihomoeoclinic.com',
    '+919791426527',
    'member',
    TRUE
  ),
  (
    'patient-demo',
    'Suresh Kumar',
    'suresh@example.com',
    '+919876543210',
    'patient',
    TRUE
  )
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- Insert Sample Evening Appointment
INSERT INTO `clinic_appointments` (
  `id`,
  `reference_id`,
  `patient_id`,
  `patient_name`,
  `patient_age`,
  `gender`,
  `symptoms`,
  `contact_method`,
  `contact_value`,
  `appointment_date`,
  `appointment_time`,
  `status`,
  `stage`,
  `token_number`,
  `payment_status`,
  `payment_reference`
) VALUES (
  'appt-sample-01',
  'SHC-2026-8A41D2',
  'patient-demo',
  'Suresh Kumar',
  34,
  'male',
  'Migraine headaches and evening physical fatigue',
  'whatsapp',
  '+919876543210',
  CURDATE(),
  '18:30:00',
  'in_consultation',
  4,
  4,
  'paid',
  'RZP-₹100-DIRECT'
) ON DUPLICATE KEY UPDATE `reference_id` = VALUES(`reference_id`);

-- Insert Verified Prescriptions for Patient
INSERT INTO `clinic_prescriptions` (
  `id`,
  `appointment_id`,
  `patient_id`,
  `remedy_name`,
  `potency`,
  `dosage_schedule`,
  `dietary_guidelines`,
  `delivery_mode`,
  `version`
) VALUES (
  'presc-sample-01',
  'appt-sample-01',
  'patient-demo',
  'Arnica Montana',
  '200C',
  '4 medicated sugar globules on tongue, twice daily (Morning and Night)',
  'Strictly avoid raw onion, raw garlic, coffee, menthol, camphor, and eucalyptus 30 mins before & after dose.',
  'clinic_courier',
  1
),
(
  'presc-sample-02',
  'appt-sample-01',
  'patient-demo',
  'Nux Vomica',
  '30C',
  '4 medicated sugar globules on tongue at bedtime',
  'Avoid stimulants and strong pungent aromas. Keep in dry, cool place away from direct sunlight.',
  'pdf_download',
  1
) ON DUPLICATE KEY UPDATE `remedy_name` = VALUES(`remedy_name`);

-- Verify Table Status
SELECT 'Database sri_homoeo_clinic initialized successfully for MySQL Workbench!' AS `Status`;
SELECT COUNT(*) AS `Total_Profiles` FROM `profiles`;
SELECT COUNT(*) AS `Total_Appointments` FROM `clinic_appointments`;
SELECT COUNT(*) AS `Total_Prescriptions` FROM `clinic_prescriptions`;

