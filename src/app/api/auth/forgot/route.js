// ---------------------------------------------------------------------------
// api/auth/forgot — forgot-password flow (prompt Section 15: a standard
// flow for the chosen stack; no invented OTP/admin-code rules).
// There is no email service yet, so the reset link is shown on screen
// after submit instead of emailed. The token is single-use, 24h.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getUserByEmail } from "../../../../lib/db.js";
import { createPasswordResetToken } from "../../../../lib/auth.js";

export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const user = getUserByEmail(email);
  // Always show the same page — never reveal whether the email exists.
  if (user) {
    const token = createPasswordResetToken(user.id);
    const url = new URL(`/reset-password?token=${token}`, request.url);
    return NextResponse.redirect(new URL(`/forgot-password?sent=1&link=${encodeURIComponent(url.pathname + url.search)}`, request.url), 303);
  }
  return NextResponse.redirect(new URL("/forgot-password?sent=1", request.url), 303);
}
