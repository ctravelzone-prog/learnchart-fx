// ---------------------------------------------------------------------------
// courses/page.jsx — Courses & Services (prompt Section 10). Separate page
// from Home. The three offers come from the database (seeded from the
// prompt); the page never hard-codes them, so the later master admin can
// add more. Enrolled state is read from the session on the server.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getAllCourses, getEnrollments } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { PAYMENT_METHOD } from "../../lib/config.js";

export const metadata = {
  title: "Courses & Services — LearnChart FX",
  description:
    "Forex Trading Premium Course ($250), Premium Live Trade Support (Free) and Trading Consultation (Free) — LearnChart FX.",
};

function EnrollButton({ course, enrolled }) {
  if (enrolled) {
    return <span className="btn btn-green">✓ ENROLLED</span>;
  }
  if (course.button_type === "coming_soon") {
    return <button type="button" className="btn btn-dark" disabled>Coming Soon</button>;
  }
  return (
    <Link href={`/enroll/${course.slug}`} className="btn btn-amber">
      {course.button_label}
    </Link>
  );
}

export default async function CoursesPage() {
  const courses = getAllCourses();
  const user = await getSessionUser();
  const myEnrollments = user ? getEnrollments(user.id) : [];
  const enrolledSlugs = new Set(myEnrollments.map((e) => e.course_slug));

  return (
    <div className="wrap section">
      <p className="muted small">HOME › COURSES &amp; SERVICES</p>
      <h1 style={{ fontSize: 40 }}>
        Mastering Trading With <span className="amber">Experts</span>
      </h1>
      <p className="muted">Comprehensive trading courses designed by professionals to help you succeed in financial markets.</p>

      <div className="grid-3" style={{ marginTop: 28 }}>
        {courses.map((c) => (
          <div className="card" key={c.slug}>
            {c.slug === "forex-premium-course" ? <span className="badge badge-amber">★ BESTSELLER</span> : null}
            <h2 style={{ marginTop: 10 }}>{c.title}</h2>
            <p className="muted small">{c.subtitle}</p>
            <p>
              <span className="chip">{c.level}</span>{" "}
              <span className="chip">{c.status}</span>
            </p>
            <ul className="check-list">
              {c.features.map((f) => (<li key={f}>{f}</li>))}
            </ul>
            <p className="price">{c.price_label}</p>
            <EnrollButton course={c} enrolled={enrolledSlugs.has(c.slug)} />
            {c.slug === "forex-premium-course" && enrolledSlugs.has(c.slug) ? (
              <div style={{ marginTop: 12 }}>
                <Link href="/course-videos" className="btn btn-dark btn-sm">
                  ▶ Watch Course Videos — 10 lessons, unlock with your key 🔑
                </Link>
              </div>
            ) : null}
            {c.button_type === "join_telegram" ? (
              <p className="small muted" style={{ marginTop: 10 }}>
                Telegram link: [Placeholder — Siam to provide]
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 28 }}>
        <h3>Payment</h3>
        <p className="muted">
          Payment method: <strong>{PAYMENT_METHOD}</strong> — enrollment for the paid
          course records your place; the payment step will be connected here before launch.
        </p>
        <p className="small muted">
          The Forex Trading Premium Course is $250 · 10 sessions / 10 lessons.
        </p>
      </div>
    </div>
  );
}
