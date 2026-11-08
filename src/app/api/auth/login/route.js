// ---------------------------------------------------------------------------
// api/auth/login — check email + password, then create a session.
// Wrong credentials give one generic error (never say which half failed).
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getUserByEmail } from "../../../../lib/db.js";
import { verifyPassword, createSession } from "../../../../lib/auth.js";

export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const next = String(form.get("next") || "/profile");

  const user = getUserByEmail(email);
  const ok = user && verifyPassword(password, user.password_hash, user.password_salt);
  if (!ok) {
    return redirectTo(`/login?error=${encodeURIComponent("Invalid email or password.")}`);
  }
  // A deactivated account (admin action) cannot log in, even with the
  // right password. The message says why, without leaking anything
  // about other accounts.
  if (user.status && user.status !== "active") {
    return redirectTo(`/login?error=${encodeURIComponent("Your account is deactivated. Please contact support.")}`);
  }

  await createSession(user.id);
  const dest = next.startsWith("/") ? next : "/profile";
  return redirectTo(dest);
}
