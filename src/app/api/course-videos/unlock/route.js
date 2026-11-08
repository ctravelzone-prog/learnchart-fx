// ---------------------------------------------------------------------------
// api/course-videos/unlock — verify an entered Course Key (prompt Sec 11,
// Nov 2026 per-visit rule). GENERALIZED: the key is checked against the
// enrollment for the COURSE named in the form (?course=<slug>, default
// Forex) — any video course works, not just Forex. Server-side only:
// the entered key is hashed and compared with the hash stored for THIS
// student's own enrollment for that course. A wrong key shows a clear
// error and the page stays locked. On success the server mints ONE
// single-use visit token (15 min) and redirects to
// /course-videos?course=<slug>&visit=<token> — the lessons render for
// that visit only. Nothing is remembered: leaving and coming back asks
// for the key again. The old video_unlocks row is never written anymore.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { getVideoEnrollment, createKeyVisit, SLUGS } from "../../../../lib/access.js";
import { verifyKey } from "../../../../lib/keys.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return redirectTo("/login?next=/course-videos");

  const form = await request.formData();
  const courseSlug = String(form.get("course") || "") || SLUGS.FOREX;
  const back = `/course-videos?course=${encodeURIComponent(courseSlug)}`;

  const enrollment = getVideoEnrollment(user.id, courseSlug);
  if (!enrollment) {
    return redirectTo(back);
  }

  const entered = String(form.get("key") || "");
  const row = getDb().prepare("SELECT key_hash FROM course_keys WHERE enrollment_id = ?").get(enrollment.id);
  if (!row || !verifyKey(entered, row.key_hash)) {
    return redirectTo(back + "&error=" + encodeURIComponent("Wrong key. Check your Gmail for your Course Key and try again."));
  }

  // Correct key — one single-visit token, then show the lessons.
  const token = createKeyVisit(user.id, enrollment.id);
  if (!token) return redirectTo(back);
  return redirectTo(`${back}&visit=${encodeURIComponent(token)}`);
}
