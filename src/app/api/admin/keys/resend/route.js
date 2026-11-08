// ---------------------------------------------------------------------------
// api/admin/keys/resend — the admin re-sends one student's Course Key
// to that student's own email (admin only, owner-only access: the key
// is decrypted server-side and emailed to the email on the student's
// account — the plain key never appears in any page or API response).
// The enrollment must belong to a video course (has_videos = 1).
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../../lib/http.js";
import { getDb, getEnrollmentDetail } from "../../../../../lib/db.js";
import { getAdminUser } from "../../../../../lib/admin.js";
import { decryptKey } from "../../../../../lib/keys.js";
import { sendCourseKeyEmail } from "../../../../../lib/mail.js";

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const id = Number(form.get("enrollment_id") || 0);
  const detail = id ? getEnrollmentDetail(id) : null;
  if (!detail || !detail.course_has_videos) {
    return redirectTo("/admin/enrollments");
  }
  const row = getDb()
    .prepare("SELECT key_encrypted FROM course_keys WHERE enrollment_id = ?")
    .get(id);
  if (!row) {
    return redirectTo(`/admin/enrollments/${id}?error=${encodeURIComponent("This enrollment has no Course Key stored.")}`);
  }
  const result = await sendCourseKeyEmail({
    to: detail.user_email,
    name: detail.user_name,
    key: decryptKey(row.key_encrypted),
  });
  if (result.sent) return redirectTo(`/admin/enrollments/${id}?saved=key-resent`);
  if (result.reason === "unconfigured") {
    return redirectTo(`/admin/enrollments/${id}?error=${encodeURIComponent("Email service is not connected yet — fill in the SMTP settings in Payment Settings first.")}`);
  }
  return redirectTo(`/admin/enrollments/${id}?error=${encodeURIComponent("The key email could not be sent right now — try again in a little while.")}`);
}
