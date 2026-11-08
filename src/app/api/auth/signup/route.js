// ---------------------------------------------------------------------------
// api/auth/signup — create an account (prompt Section 15). Password is
// hashed server-side (scrypt) and never stored in plain text. On success
// the user is logged in and sent to their profile (or back to the
// enrollment they started, via ?next=).
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getDb, getUserByEmail } from "../../../../lib/db.js";
import { hashPassword, createSession } from "../../../../lib/auth.js";

export async function POST(request) {
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/profile");

  // Basic validation — never trust the browser alone.
  if (!name || !email.includes("@") || password.length < 8) {
    return redirectTo(`/signup?error=${encodeURIComponent("Name, a valid email and a password of 8+ characters are required.")}`);
  }
  if (getUserByEmail(email)) {
    return redirectTo(`/signup?error=${encodeURIComponent("An account with this email already exists. Please log in.")}`);
  }

  const { hash, salt } = hashPassword(password);
  const id = getDb()
    .prepare("INSERT INTO users (name, email, password_hash, password_salt) VALUES (?, ?, ?, ?)")
    .run(name, email, hash, salt).lastInsertRowid;

  await createSession(id);
  const dest = next.startsWith("/") ? next : "/profile";
  return redirectTo(dest);
}
