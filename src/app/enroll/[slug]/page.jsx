// ---------------------------------------------------------------------------
// enroll/[slug] — enrollment confirmation page (prompt Section 15).
// Not logged in? Asked to sign up / log in first, then returned here.
// The confirm button posts to /api/enroll; payment is a [Placeholder]
// step that plugs in at this point without changing access logic.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCourseBySlug, hasEnrollment } from "../../../lib/db.js";
import { getSessionUser } from "../../../lib/auth.js";
import { PAYMENT_METHOD } from "../../../lib/config.js";

export const metadata = { title: "Enroll — LearnChart FX", description: "Enroll in a LearnChart FX course or service." };

export default async function EnrollPage({ params }) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) redirect("/courses");

  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/enroll/${slug}`);
  if (hasEnrollment(user.id, slug)) redirect(`/enroll/${slug}/success`);

  return (
    <div className="wrap section">
      <div className="card form-card">
        <p className="muted small">ENROLLMENT</p>
        <h1>{course.title}</h1>
        <p className="muted">{course.subtitle}</p>
        <dl className="kv">
          <dt>Level</dt><dd>{course.level}</dd>
          <dt>Status</dt><dd>{course.status}</dd>
          <dt>Price</dt><dd><strong className="amber">{course.price_label}</strong></dd>
        </dl>
        <ul className="check-list">
          {course.features.map((f) => (<li key={f}>{f}</li>))}
        </ul>
        {course.price_cents > 0 ? (
          <div className="alert alert-info">
            Payment method: <strong>{PAYMENT_METHOD}</strong> — the payment step will be
            connected here before launch. Your enrollment is recorded now so you can use
            the member areas.
          </div>
        ) : (
          <div className="alert alert-info">
            This service is free — enrollment completes on confirmation.
          </div>
        )}
        <form action="/api/enroll" method="post">
          <input type="hidden" name="slug" value={slug} />
          <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>
            Confirm Enrollment — {course.price_label}
          </button>
        </form>
        <p className="small muted center" style={{ marginTop: 14 }}>
          <Link href="/courses" className="amber">Back to Courses &amp; Services</Link>
        </p>
      </div>
    </div>
  );
}
