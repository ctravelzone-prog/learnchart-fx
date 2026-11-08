// ---------------------------------------------------------------------------
// api/contact — save a contact message to the database (prompt Section 14)
// and show the success confirmation. No admin inbox exists in this phase.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../lib/http.js";
import { getDb } from "../../../lib/db.js";

export async function POST(request) {
  const form = await request.formData();
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const subject = String(form.get("subject") || "").trim();
  const message = String(form.get("message") || "").trim();

  if (!name || !email.includes("@") || !subject || !message) {
    return redirectTo("/contact?error=1");
  }
  getDb()
    .prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)")
    .run(name, email, subject, message);
  return redirectTo("/contact?sent=1");
}
