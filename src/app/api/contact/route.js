// ---------------------------------------------------------------------------
// api/contact — save a contact message to the database (prompt Section 14)
// and show the success confirmation. No admin inbox exists in this phase.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db.js";

export async function POST(request) {
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const subject = String(form.get("subject") || "").trim();
  const message = String(form.get("message") || "").trim();

  if (!name || !email.includes("@") || !subject || !message) {
    return NextResponse.redirect(new URL("/contact?error=1", request.url), 303);
  }
  getDb()
    .prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)")
    .run(name, email, subject, message);
  return NextResponse.redirect(new URL("/contact?sent=1", request.url), 303);
}
