// ---------------------------------------------------------------------------
// api/course-videos/resend-key — re-send the student's own Course Key to
// their own Gmail (Nov 2026 key rule: the key lives in email, never on
// the site). Only the logged-in student's OWN Forex enrollment can be
// re-sent, and only to the email on their own account. Never throws:
// a mail failure redirects back with an honest status instead.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { getForexEnrollment } from "../../../../lib/access.js";
import { decryptKey } from "../../../../lib/keys.js";
import { sendCourseKeyEmail } from "../../../../lib/mail.js";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return redirectTo("/login?next=/profile");

  // Only a Forex student has a key at all.
  const enrollment = getForexEnrollment(user.id);
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
