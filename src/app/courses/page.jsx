// ---------------------------------------------------------------------------
// courses/page.jsx — Courses & Services (prompt Section 10). Separate page
// from Home. The offers come from the database (seeded from the prompt);
// the page never hard-codes them, so the master admin can add more.
// Card images and badges come from the course record too (editable in
// /admin). Enrolled state is read from the session on the server.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getAllCourses, getEnrollments, getLessons } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { PAYMENT_METHOD } from "../../lib/config.js";
import { getUsdtAmount } from "../../lib/settings.js";

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
  // Lesson counts for video courses (shown on the Watch link).
  const lessonCounts = {};
  for (const c of courses) {
    if (c.has_videos) lessonCounts[c.slug] = getLessons(c.id).length;
  }
  const usdtAmount = getUsdtAmount(250);

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
            {c.image ? (
              <div className="course-thumb">
                <img src={c.image} alt={c.title} />
                {c.badge ? <span className="badge badge-amber thumb-badge">{c.badge}</span> : null}
              </div>
            ) : null}
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
            {c.has_videos && enrolledSlugs.has(c.slug) ? (
              <div style={{ marginTop: 12 }}>
                <Link href={`/course-videos?course=${c.slug}`} className="btn btn-dark btn-sm">
                  ▶ Watch Course Videos — {lessonCounts[c.slug] || ""} lessons, unlock with your key 🔑
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
          Payment method: <strong>{PAYMENT_METHOD}</strong> — pay exactly {usdtAmount} USDT on Binance and the site
          verifies your payment automatically. No manual check, no waiting for the owner.
        </p>
        <p className="small muted">
          Paid courses are paid in USDT on Binance; free services enroll on confirmation.
        </p>
      </div>
    </div>
  );
}
