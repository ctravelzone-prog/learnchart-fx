// ---------------------------------------------------------------------------
// api/course-videos/resend-key — re-send the student's own Course Key to
// their own Gmail (Nov 2026 key rule: the key lives in email, never on
// the site). GENERALIZED: the course comes from the form (?course=
// <slug>, default Forex) — only the logged-in student's OWN enrollment
// for THAT video course can be re-sent, and only to the email on their
// own account. Never throws: a mail failure redirects back with an
// honest status instead.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { getVideoEnrollment, SLUGS } from "../../../../lib/access.js";
import { decryptKey } from "../../../../lib/keys.js";
import { sendCourseKeyEmail } from "../../../../lib/mail.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return redirectTo("/login?next=/profile");

  const form = await request.formData();
  const courseSlug = String(form.get("course") || "") || SLUGS.FOREX;

  // Only a student of this video course has a key at all.
  const enrollment = getVideoEnrollment(user.id, courseSlug);
  if (!enrollment) return redirectTo("/profile");
  const row = getDb()
    .prepare("SELECT key_encrypted FROM course_keys WHERE enrollment_id = ?")
    .get(enrollment.id);
  if (!row) return redirectTo("/profile");

  // Decrypt the owner's own key (server-side only) and email it to the
  // email address on their own account — nowhere else.
  const result = await sendCourseKeyEmail({ to: user.email, name: user.name, key: decryptKey(row.key_encrypted) });
  if (result.sent) return redirectTo("/profile?keymail=resent");
  if (result.reason === "unconfigured") return redirectTo("/profile?keymail=unconfigured");
  return redirectTo("/profile?keymail=failed");
}
