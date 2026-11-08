// ---------------------------------------------------------------------------
// admin.js — the master admin panel's auth. ONE place for the admin check:
// every /admin page calls requireAdmin() and every /api/admin route calls
// getAdminUser(). The admin session is SEPARATE from the user session
// (its own cookie + its own sessions table) — being logged in as a
// student never makes anyone an admin, and vice versa.
//
// Passwords use the same scrypt approach as user passwords
// (src/lib/auth.js): salted hash, timing-safe compare, never plain text.
// ---------------------------------------------------------------------------
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, getAdminById } from "./db.js";

const COOKIE_NAME = "lcfx_admin";
const SESSION_DAYS = 7;

// Check a plain password against a stored scrypt hash + salt.
// Same parameters as src/lib/auth.js verifyPassword (64-byte hash).
export function verifyAdminPassword(password, hash, salt) {
  const test = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return test.length === expected.length && crypto.timingSafeEqual(test, expected);
}

// Create an admin session and set the cookie. Returns the token.
export async function createAdminSession(adminId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  getDb()
    .prepare("INSERT INTO admin_sessions (token, admin_id, expires_at) VALUES (?, ?, ?)")
    .run(token, adminId, expires);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(expires),
  });
  return token;
}

// End the current admin session (log out) and clear the cookie.
export async function destroyAdminSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) getDb().prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
  jar.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(0) });
}

// Return the logged-in admin (id + email + password_changed flag) or
// null. An expired session is deleted and treated as logged out.
export async function getAdminUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const row = getDb().prepare("SELECT * FROM admin_sessions WHERE token = ?").get(token);
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    getDb().prepare("DELETE FROM admin_sessions WHERE token = ?").run(token);
    return null;
  }
  return getAdminById(row.admin_id);
}

// Page guard: every /admin page (except the login page itself) calls
// this first. Not logged in as admin → sent to the admin login page.
// API routes must NOT use this (they cannot redirect usefully) — they
// call getAdminUser() and return 401/403 instead.
export async function requireAdmin() {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return admin;
}
