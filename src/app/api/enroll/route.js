// ---------------------------------------------------------------------------
// api/enroll — record an enrollment (prompt Section 15). Server-side only.
// Steps: must be logged in; the course must exist; one enrollment per
// user+course. FREE services enroll here on confirmation. PAID courses
// NEVER enroll here: posting a paid slug directly is refused and sent
// back to the payment page — a paid enrollment is created ONLY after a
// Binance payment verifies (src/lib/payments.js completePaidEnrollment).
// For the Forex Premium Course the server generates ONE unique Course
// Key for this student and this enrollment (hash + encrypted copy
// stored; plain key is never stored) and EMAILS it to the student's
// Gmail (Nov 2026 key rule — the key is never shown on the site). If the
// email cannot be sent, enrollment still completes and the confirmation
// page says so honestly. GENERALIZED (Nov 2026): ANY course with
// has_videos = 1 gets a key exactly the same way — the Forex course is
// just the first video course; a course added from admin with
// has_videos works with zero code changes.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../lib/http.js";
import { getDb, getCourseBySlug, hasEnrollment, getEnrollmentForCourse, monthlyExpiresAt } from "../../../lib/db.js";
import { getSessionUser } from "../../../lib/auth.js";
import { generateCourseKey, hashKey, encryptKey } from "../../../lib/keys.js";
import { sendCourseKeyEmail, isMailConfigured } from "../../../lib/mail.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return redirectTo("/login?next=/courses");
  }
  const form = await request.formData();
  const slug = String(form.get("slug") || "");
  const course = getCourseBySlug(slug);
  if (!course) {
    return redirectTo("/courses");
  }
  if (hasEnrollment(user.id, slug)) {
    return redirectTo(`/enroll/${slug}/success`);
  }

  // Paid courses NEVER enroll here: a direct POST is refused and sent
  // back to the payment page. Paid enrollment happens ONLY after a
  // Binance payment verifies (src/lib/payments.js). Free services
  // enroll on confirmation, as before.
  if (course.price_cents > 0) {
    return redirectTo(
      `/enroll/${slug}?error=${encodeURIComponent("Please pay with Binance first — enrollment completes automatically once your payment verifies.")}`
    );
  }

  const db = getDb();
  // MONTHLY RENEWAL (Nov 2026): one row per user + course. A lapsed
  // monthly enrollment keeps its row, so re-enrolling EXTENDS it
  // (status back to active, expires_at = now + 30 days) instead of
  // failing on the UNIQUE constraint. One-time courses stay NULL.
  const expiresAt = course.billing === "monthly" ? monthlyExpiresAt() : null;
  const existing = getEnrollmentForCourse(user.id, slug);
  let enrollmentId;
  if (existing) {
    db.prepare("UPDATE enrollments SET status = 'active', payment_status = ?, expires_at = ? WHERE id = ?")
      .run("free — enrolled on confirmation", expiresAt, existing.id);
    enrollmentId = existing.id;
  } else {
    enrollmentId = db
      .prepare("INSERT INTO enrollments (user_id, course_id, status, payment_status, expires_at) VALUES (?, ?, 'active', ?, ?)")
      .run(user.id, course.id, "free — enrolled on confirmation", expiresAt).lastInsertRowid;
  }

  // Video course (has_videos): one unique Course Key for THIS student +
  // enrollment. The plain key exists only here, in this request — it is
  // emailed to the student's Gmail right away and never shown on any
  // page. Any course added from admin with has_videos works the same
  // way; the Forex course is just the first one.
  let keymail = null;
  if (course.has_videos) {
    const key = generateCourseKey();
    // INSERT OR IGNORE: a renewal keeps the key it already has — and
    // in that case no new key is emailed (see payments.js).
    const inserted = db
      .prepare("INSERT OR IGNORE INTO course_keys (enrollment_id, key_hash, key_encrypted) VALUES (?, ?, ?)")
      .run(enrollmentId, hashKey(key), encryptKey(key));
    if (inserted.changes > 0) {
      if (!isMailConfigured()) {
        keymail = "unconfigured";
      } else {
        const result = await sendCourseKeyEmail({ to: user.email, name: user.name, key });
        keymail = result.sent ? "sent" : "failed";
      }
    }
  }

  return redirectTo(`/enroll/${slug}/success${keymail ? `?keymail=${keymail}` : ""}`);
}
