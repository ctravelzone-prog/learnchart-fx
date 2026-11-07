// ---------------------------------------------------------------------------
// api/enroll — record an enrollment (prompt Section 15). Server-side only.
// Steps: must be logged in; the course must exist; one enrollment per
// user+course. For the Forex Premium Course the server generates ONE
// unique Course Key for this student and this enrollment (hash + encrypted
// copy stored; plain key is never stored). Payment: [Placeholder] — the
// payment step plugs in here before launch without changing access logic;
// for now the enrollment is recorded with payment_status noted as such.
// Free services enroll on confirmation.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getDb, getCourseBySlug, hasEnrollment } from "../../../lib/db.js";
import { getSessionUser } from "../../../lib/auth.js";
import { generateCourseKey, hashKey, encryptKey } from "../../../lib/keys.js";
import { PAYMENT_METHOD } from "../../../lib/config.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/courses", request.url), 303);
  }
  const form = await request.formData();
  const slug = String(form.get("slug") || "");
  const course = getCourseBySlug(slug);
  if (!course) {
    return NextResponse.redirect(new URL("/courses", request.url), 303);
  }
  if (hasEnrollment(user.id, slug)) {
    return NextResponse.redirect(new URL(`/enroll/${slug}/success`, request.url), 303);
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
  if (slug === "forex-premium-course") {
    const key = generateCourseKey();
    db.prepare("INSERT INTO course_keys (enrollment_id, key_hash, key_encrypted) VALUES (?, ?, ?)")
      .run(enrollmentId, hashKey(key), encryptKey(key));
  }

  return NextResponse.redirect(new URL(`/enroll/${slug}/success`, request.url), 303);
}
