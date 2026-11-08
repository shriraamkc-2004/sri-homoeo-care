import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;
const PREFIX = "scrypt:";

/** Minimum production password policy */
export function validatePasswordStrength(password: string): { ok: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  if (password.length > 128) {
    return { ok: false, message: "Password is too long." };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { ok: false, message: "Password must include letters and numbers." };
  }
  const common = ["password", "12345678", "qwerty123", "admin123", "changeme"];
  if (common.some((c) => password.toLowerCase().includes(c))) {
    return { ok: false, message: "Password is too common. Choose a stronger one." };
  }
  return { ok: true };
}

export function hashPassword(password: string): string {
  const check = validatePasswordStrength(password);
  if (!check.ok) {
    throw new Error(check.message || "Invalid password.");
  }
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${PREFIX}${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  if (!storedHash.startsWith(PREFIX)) return false;

  const parts = storedHash.slice(PREFIX.length).split(":");
  if (parts.length !== 2) return false;
  const [salt, hashHex] = parts;
  if (!salt || !hashHex) return false;

  try {
    const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN);
    const storedKeyBuffer = Buffer.from(hashHex, "hex");
    if (derivedKey.length !== storedKeyBuffer.length) return false;
    return timingSafeEqual(derivedKey, storedKeyBuffer);
  } catch {
    return false;
  }
}

export function isHashedPassword(stored: string | null | undefined): boolean {
  return typeof stored === "string" && stored.startsWith(PREFIX);
}
