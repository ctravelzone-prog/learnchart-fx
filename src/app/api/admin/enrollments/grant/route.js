// ---------------------------------------------------------------------------
// api/admin/enrollments/grant — grant an enrollment from the admin panel
// (admin only). This is the manual way to give a student access to a
// course WITHOUT a payment — e.g. a comp for a tester, or the demo
// account. Paid enrollments still go through the Binance verification
// in src/lib/payments.js; this route never touches that flow and never
// claims a payment happened (payment_status reads "granted by admin").
//
// Rules (same shape as the paid/free success paths):
// - The student must already exist (registered on the site) and the
//   course must exist, otherwise the admin is sent back with an error.
// - An ACTIVE enrollment for that user + course is refused, not
//   duplicated — enrollments has UNIQUE(user_id, course_id) and the
//   access checks only count active, unexpired rows.
// - A cancelled (or lapsed monthly) row is REACTIVATED instead: status
//   back to 'active', expiry reset, created_at reset to now.
// - Monthly courses (billing = 'monthly', e.g. Private Live Trade)
//   get expires_at = now + 30 days; one-time courses get NULL.
// - Video courses (has_videos) get a Course Key exactly like the paid
//   flow (INSERT OR IGNORE + same key format); a freshly created key
//   is emailed to the student when mail is configured.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../../lib/http.js";
import { getDb, getCourseBySlug, getEnrollmentForCourse, hasEnrollment, monthlyExpiresAt } from "../../../../../lib/db.js";
import { getAdminUser } from "../../../../../lib/admin.js";
import { generateCourseKey, hashKey, encryptKey } from "../../../../../lib/keys.js";
import { sendCourseKeyEmail, isMailConfigured } from "../../../../../lib/mail.js";

// The marker stored in enrollments.payment_status for a manual grant.
// Deliberately NOT "paid ..." — no money changed hands.
const GRANT_PAYMENT_STATUS = "granted by admin";

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const slug = String(form.get("slug") || "").trim();
  if (!email || !slug) {
    return redirectTo("/admin/enrollments?grant=missing");
  }

  // The student must exist — grants never create accounts.
  const user = getDb().prepare("SELECT id, name, email FROM users WHERE email = ?").get(email);
  if (!user) {
    return redirectTo("/admin/enrollments?grant=no-user");
  }
  const course = getCourseBySlug(slug);
  if (!course) {
    return redirectTo("/admin/enrollments?grant=no-course");
  }

  // Already actively enrolled? Refuse — never duplicate a live row.
  if (hasEnrollment(user.id, slug)) {
    return redirectTo("/admin/enrollments?grant=already-enrolled");
  }

  const db = getDb();
  const expiresAt = course.billing === "monthly" ? monthlyExpiresAt() : null;
  const existing = getEnrollmentForCourse(user.id, slug);
  let enrollmentId;
  if (existing) {
    // Cancelled or lapsed row: reactivate it and reset its expiry.
    db.prepare(
      "UPDATE enrollments SET status = 'active', payment_status = ?, expires_at = ?, created_at = datetime('now') WHERE id = ?"
    ).run(GRANT_PAYMENT_STATUS, expiresAt, existing.id);
    enrollmentId = existing.id;
  } else {
    enrollmentId = db
      .prepare("INSERT INTO enrollments (user_id, course_id, status, payment_status, expires_at) VALUES (?, ?, 'active', ?, ?)")
      .run(user.id, course.id, GRANT_PAYMENT_STATUS, expiresAt).lastInsertRowid;
  }

  // Video course (has_videos): one unique Course Key, exactly like the
  // paid flow. INSERT OR IGNORE keeps the key a reactivated enrollment
  // already has; only a freshly created key is emailed.
  if (course.has_videos) {
    const key = generateCourseKey();
    const inserted = db
      .prepare("INSERT OR IGNORE INTO course_keys (enrollment_id, key_hash, key_encrypted) VALUES (?, ?, ?)")
      .run(enrollmentId, hashKey(key), encryptKey(key));
    if (inserted.changes > 0 && isMailConfigured()) {
      await sendCourseKeyEmail({ to: user.email, name: user.name, key });
    }
  }

  return redirectTo(`/admin/enrollments?grant=ok&email=${encodeURIComponent(user.email)}`);
}
