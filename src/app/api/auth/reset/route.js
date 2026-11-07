// ---------------------------------------------------------------------------
// api/auth/reset — set a new password with a valid reset token. The token
// is single-use: it is marked used the moment the password changes.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db.js";
import { hashPassword } from "../../../../lib/auth.js";

export async function POST(request) {
  const form = await request.formData();
  const token = String(form.get("token") || "");
  const password = String(form.get("password") || "");

  const row = getDb().prepare("SELECT * FROM password_resets WHERE token = ? AND used = 0").get(token);
  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(
      new URL(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent("This reset link is invalid or expired. Please request a new one.")}`, request.url),
      303
    );
  }
  if (password.length < 8) {
    return NextResponse.redirect(
      new URL(`/reset-password?token=${encodeURIComponent(token)}&error=${encodeURIComponent("Password must be at least 8 characters.")}`, request.url),
      303
    );
  }

  const { hash, salt } = hashPassword(password);
  getDb().prepare("UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?").run(hash, salt, row.user_id);
  getDb().prepare("UPDATE password_resets SET used = 1 WHERE token = ?").run(token);
  return NextResponse.redirect(new URL("/login?reset=1", request.url), 303);
}
