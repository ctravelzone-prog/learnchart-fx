// ---------------------------------------------------------------------------
// api/course-videos/unlock — verify an entered Course Key (prompt Sec 11).
// Server-side only: the entered key is hashed and compared with the hash
// stored for THIS student's own Forex enrollment. A wrong key shows a
// clear error and the page stays locked. On success an unlock row is
// recorded, so the student does not re-enter the key on every visit.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { getForexEnrollment } from "../../../../lib/access.js";
import { verifyKey } from "../../../../lib/keys.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/course-videos", request.url), 303);

  const enrollment = getForexEnrollment(user.id);
  if (!enrollment) {
    return NextResponse.redirect(new URL("/course-videos", request.url), 303);
  }

  const form = await request.formData();
  const entered = String(form.get("key") || "");
  const row = getDb().prepare("SELECT key_hash FROM course_keys WHERE enrollment_id = ?").get(enrollment.id);
  if (!row || !verifyKey(entered, row.key_hash)) {
    return NextResponse.redirect(
      new URL("/course-videos?error=" + encodeURIComponent("Wrong key. Check your Course Key from your enrollment confirmation or profile and try again."), request.url),
      303
    );
  }

  getDb().prepare("INSERT OR IGNORE INTO video_unlocks (enrollment_id) VALUES (?)").run(enrollment.id);
  return NextResponse.redirect(new URL("/course-videos?unlocked=1", request.url), 303);
}
