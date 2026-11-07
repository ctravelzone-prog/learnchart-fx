// ---------------------------------------------------------------------------
// auth.js — passwords and sessions. Passwords are hashed with scrypt
// (salted, server-side) and never stored in plain text. Sessions are
// random tokens stored in the DB and sent as an httpOnly cookie.
// ---------------------------------------------------------------------------
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb, getUserById } from "./db.js";

const COOKIE_NAME = "lcfx_session";
const SESSION_DAYS = 7;

// Hash a password with a fresh random salt. Returns { hash, salt }.
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

// Check a plain password against a stored hash + salt. Timing-safe.
export function verifyPassword(password, hash, salt) {
  const test = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return test.length === expected.length && crypto.timingSafeEqual(test, expected);
}

// Create a session for a user and set the cookie. Returns the token.
export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  getDb().prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expires);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
  return token;
}

// End the current session (log out) and clear the cookie.
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  jar.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(0) });
}

// Return the logged-in user (public fields only) or null.
// A session that expired is deleted and treated as logged out.
export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const row = getDb().prepare("SELECT * FROM sessions WHERE token = ?").get(token);
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }
  return getUserById(row.user_id);
}

// Create a one-time password-reset token (valid 24h). The token itself
// is returned so the forgot-password page can show it to the user in
// this phase — there is no email service yet, so the reset link is
// displayed on screen instead of emailed. (Later: send by email.)
export function createPasswordResetToken(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  getDb().prepare("INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expires);
  return token;
}
