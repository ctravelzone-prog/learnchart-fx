// ---------------------------------------------------------------------------
// api/course-videos/unlock — verify an entered Course Key (prompt Sec 11,
// Nov 2026 per-visit rule). Server-side only: the entered key is hashed
// and compared with the hash stored for THIS student's own Forex
// enrollment. A wrong key shows a clear error and the page stays locked.
// On success the server mints ONE single-use visit token (15 min) and
// redirects to /course-videos?visit=<token> — the lessons render for
// that visit only. Nothing is remembered: leaving and coming back asks
// for the key again. The old video_unlocks row is never written anymore.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { getForexEnrollment, createKeyVisit } from "../../../../lib/access.js";
import { verifyKey } from "../../../../lib/keys.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return redirectTo("/login?next=/course-videos");

  const enrollment = getForexEnrollment(user.id);
  if (!enrollment) {
    return redirectTo("/course-videos");
  }

  const form = await request.formData();
  const entered = String(form.get("key") || "");
  const row = getDb().prepare("SELECT key_hash FROM course_keys WHERE enrollment_id = ?").get(enrollment.id);
  if (!row || !verifyKey(entered, row.key_hash)) {
    return redirectTo("/course-videos?error=" + encodeURIComponent("Wrong key. Check your Gmail for your Course Key and try again."));
  }

  // Correct key — one single-visit token, then show the lessons.
  const token = createKeyVisit(user.id);
  if (!token) return redirectTo("/course-videos");
  return redirectTo("/course-videos?visit=" + encodeURIComponent(token));
}
