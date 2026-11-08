// ---------------------------------------------------------------------------
// api/course-videos/unlock — verify an entered Course Key (prompt Sec 11).
// Server-side only: the entered key is hashed and compared with the hash
// stored for THIS student's own Forex enrollment. A wrong key shows a
// clear error and the page stays locked. On success an unlock row is
// recorded, so the student does not re-enter the key on every visit.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { getForexEnrollment } from "../../../../lib/access.js";
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
    return redirectTo("/course-videos?error=" + encodeURIComponent("Wrong key. Check your Course Key from your enrollment confirmation or profile and try again."));
  }

  getDb().prepare("INSERT OR IGNORE INTO video_unlocks (enrollment_id) VALUES (?)").run(enrollment.id);
  return redirectTo("/course-videos?unlocked=1");
}
