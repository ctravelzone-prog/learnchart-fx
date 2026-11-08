// ---------------------------------------------------------------------------
// api/admin/consultations/decide — admin confirms or rejects a consultation
// request (admin only). Confirm needs a confirmed date + time and a
// MEETING LINK the admin pasted (any provider — Google Meet / Zoom /
// other; the site creates no links). The link must start with http:// or
// https://. Reject needs nothing but an optional note. The member sees
// the decision on /consultation: Confirmed + Join button with the exact
// link, or Rejected with the note.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../../lib/http.js";
import { getDb } from "../../../../../lib/db.js";
import { getAdminUser } from "../../../../../lib/admin.js";

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const id = Number(form.get("id") || 0);
  const action = String(form.get("action") || "");
  if (!id || !["confirm", "reject"].includes(action)) {
    return redirectTo("/admin/consultations");
  }
  const back = `/admin/consultations/${id}`;

  if (action === "confirm") {
    const confirmedDate = String(form.get("confirmed_date") || "").trim();
    const confirmedTime = String(form.get("confirmed_time") || "").trim();
    const meetingLink = String(form.get("meeting_link") || "").trim();
    const adminNote = String(form.get("admin_note") || "").trim();
    if (!confirmedDate || !confirmedTime || !meetingLink) {
      return redirectTo(`${back}?error=${encodeURIComponent("To confirm, fill in the confirmed date, time and meeting link.")}`);
    }
    if (!/^https?:\/\/.+/.test(meetingLink)) {
      return redirectTo(`${back}?error=${encodeURIComponent("The meeting link must start with http:// or https://.")}`);
    }
    getDb()
      .prepare(
        `UPDATE consultation_requests
         SET status = 'confirmed', confirmed_date = ?, confirmed_time = ?,
             meeting_link = ?, admin_note = ?, decided_at = datetime('now')
         WHERE id = ?`
      )
      .run(confirmedDate, confirmedTime, meetingLink, adminNote, id);
  } else {
    const adminNote = String(form.get("admin_note") || "").trim();
    getDb()
      .prepare(
        `UPDATE consultation_requests
         SET status = 'rejected', confirmed_date = '', confirmed_time = '',
             meeting_link = '', admin_note = ?, decided_at = datetime('now')
         WHERE id = ?`
      )
      .run(adminNote, id);
  }
  return redirectTo(`${back}?saved=1`);
}
