// ---------------------------------------------------------------------------
// api/consultation — save a consultation booking request (prompt Sec 18).
// Consultation members only (server-side gate). The request is stored in
// the database; the mentor team confirms the live audio/video slot.
// The audio/video provider is [Placeholder — Siam to confirm].
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../lib/http.js";
import { getDb } from "../../../lib/db.js";
import { getSessionUser } from "../../../lib/auth.js";
import { canEnterConsultation } from "../../../lib/access.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !canEnterConsultation(user.id)) {
    return redirectTo("/consultation");
  }
  const form = await request.formData();
  const topic = String(form.get("topic") || "").trim();
  const mode = String(form.get("mode") || "").trim();
  const date = String(form.get("date") || "").trim();
  const time = String(form.get("time") || "").trim();
  const name = String(form.get("name") || "").trim();
  const note = String(form.get("note") || "").trim();
  if (!topic || !mode || !date || !time || !name) {
    return redirectTo("/consultation?error=" + encodeURIComponent("Please fill in topic, mode, date, time and your name."));
  }
  getDb()
    .prepare("INSERT INTO consultation_requests (user_id, topic, mode, preferred_date, preferred_time, name, note) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(user.id, topic, mode, date, time, name, note);
  return redirectTo("/consultation?booked=1");
}
