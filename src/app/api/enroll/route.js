// ---------------------------------------------------------------------------
// api/enroll — record an enrollment (prompt Section 15). Server-side only.
// Steps: must be logged in; the course must exist; one enrollment per
// user+course. For the Forex Premium Course the server generates ONE
// unique Course Key for this student and this enrollment (hash + encrypted
// copy stored; plain key is never stored) and EMAILS it to the student's
// Gmail (Nov 2026 key rule — the key is never shown on the site). If the
// email cannot be sent, enrollment still completes and the confirmation
// page says so honestly. Payment: [Placeholder] — the payment step plugs
// in here before launch without changing access logic; for now the
// enrollment is recorded with payment_status noted as such.
// Free services enroll on confirmation.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../lib/http.js";
import { getDb, getCourseBySlug, hasEnrollment } from "../../../lib/db.js";
import { getSessionUser } from "../../../lib/auth.js";
import { generateCourseKey, hashKey, encryptKey } from "../../../lib/keys.js";
import { sendCourseKeyEmail, isMailConfigured } from "../../../lib/mail.js";
import { PAYMENT_METHOD } from "../../../lib/config.js";

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

  const db = getDb();
  // Payment status: the paid course records the placeholder until Siam
  // confirms the payment method; free services are complete on confirm.
  const paymentStatus =
    course.price_cents > 0
      ? `pending — ${PAYMENT_METHOD}`
      : "free — enrolled on confirmation";
  const enrollmentId = db
    .prepare("INSERT INTO enrollments (user_id, course_id, status, payment_status) VALUES (?, ?, 'active', ?)")
    .run(user.id, course.id, paymentStatus).lastInsertRowid;

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
