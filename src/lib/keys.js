// ---------------------------------------------------------------------------
// keys.js — Course Keys (prompt Section 11).
// When a student enrolls in the Forex Premium Course, the server makes
// ONE unique key for that student and that enrollment. The plain key is
// shown only once (enrollment confirmation) and in the owner's own
// profile — never to anyone else, never one shared key for everyone.
// Storage: a SHA-256 hash (for verification) + an AES-256-GCM encrypted
// copy (so the owner can see their own key again in their profile).
// ---------------------------------------------------------------------------
import crypto from "node:crypto";

function encryptionKey() {
  // Dev default only so the project runs with zero config. Set a real
  // KEY_ENCRYPTION_SECRET before any launch (see .env.example).
  const secret = process.env.KEY_ENCRYPTION_SECRET || "learnchart-fx-dev-key-secret";
  return crypto.scryptSync(secret, "learnchart-fx-key-salt", 32);
}

// Make a readable key, e.g. LCFX-7K2Q-9M4D-3X8P.
export function generateCourseKey() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  const chunk = () =>
    Array.from({ length: 4 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
  return `LCFX-${chunk()}-${chunk()}-${chunk()}`;
}

export function hashKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

// Encrypt the plain key so only the owner can ever see it again.
export function encryptKey(key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

// Decrypt an encrypted key (owner's profile view only).
export function decryptKey(encrypted) {
  const buf = Buffer.from(encrypted, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

// Check an entered key against a stored hash. Timing-safe.
export function verifyKey(entered, storedHash) {
  const test = hashKey(entered.trim().toUpperCase());
  const a = Buffer.from(test, "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
