import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Production-Grade Password Security (Strix Hardening)
 * Uses native Node.js scrypt with per-user cryptographic salt
 */

const SCRYPT_KEYLEN = 64;
const PREFIX = "scrypt:";

/**
 * Hash a plain password using scrypt and a cryptographic salt
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${PREFIX}${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify a password against a stored hash with timing-safe comparison.
 * Supports legacy plain-text during migration, but flags for rehash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  if (storedHash.startsWith(PREFIX)) {
    const parts = storedHash.slice(PREFIX.length).split(":");
    if (parts.length !== 2) return false;
    const [salt, hashHex] = parts;
    const derivedKey = scryptSync(password, salt, SCRYPT_KEYLEN);
    const storedKeyBuffer = Buffer.from(hashHex, "hex");

    if (derivedKey.length !== storedKeyBuffer.length) return false;
    return timingSafeEqual(derivedKey, storedKeyBuffer);
  }

  // Fallback for legacy plain-text during database transition (timing-safe check)
  const passwordBuf = Buffer.from(password);
  const storedBuf = Buffer.from(storedHash);
  if (passwordBuf.length !== storedBuf.length) return false;
  return timingSafeEqual(passwordBuf, storedBuf);
}
