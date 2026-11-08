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
// page says so honestly.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../lib/http.js";
import { getDb, getCourseBySlug, hasEnrollment } from "../../../lib/db.js";
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
  const enrollmentId = db
    .prepare("INSERT INTO enrollments (user_id, course_id, status, payment_status) VALUES (?, ?, 'active', ?)")
    .run(user.id, course.id, "free — enrolled on confirmation").lastInsertRowid;

  // Forex course: one unique Course Key for THIS student + enrollment.
  // The plain key exists only here, in this request — it is emailed to
  // the student's Gmail right away and never shown on any page.
  let keymail = null;
  if (slug === "forex-premium-course") {
    const key = generateCourseKey();
    db.prepare("INSERT INTO course_keys (enrollment_id, key_hash, key_encrypted) VALUES (?, ?, ?)")
      .run(enrollmentId, hashKey(key), encryptKey(key));
    if (!isMailConfigured()) {
      keymail = "unconfigured";
    } else {
      const result = await sendCourseKeyEmail({ to: user.email, name: user.name, key });
      keymail = result.sent ? "sent" : "failed";
    }
  }

  return redirectTo(`/enroll/${slug}/success${keymail ? `?keymail=${keymail}` : ""}`);
}
