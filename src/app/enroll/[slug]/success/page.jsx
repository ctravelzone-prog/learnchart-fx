// ---------------------------------------------------------------------------
// enroll/[slug]/success — enrollment confirmation screen (prompt Sec 15).
// Shows what was unlocked. For the Forex course this is ALSO where the
// student's unique Course Key is first shown — decrypted from the DB for
// the owner only, with a clear instruction to save it. Nobody else can
// open this page and see another student's key (server checks ownership).
// ---------------------------------------------------------------------------
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb, getCourseBySlug, hasEnrollment } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { decryptKey } from "../../../../lib/keys.js";

export const metadata = { title: "Enrollment Confirmed — LearnChart FX", description: "Your LearnChart FX enrollment is confirmed." };

export default async function EnrollSuccessPage({ params }) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) redirect("/courses");

  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/enroll/${slug}`);
  if (!hasEnrollment(user.id, slug)) redirect(`/enroll/${slug}`);

  // The owner's own Course Key (Forex only), decrypted for display.
  let myKey = null;
  if (slug === "forex-premium-course") {
    const row = getDb()
      .prepare(
        `SELECT ck.key_encrypted FROM course_keys ck
         JOIN enrollments e ON e.id = ck.enrollment_id
         WHERE e.user_id = ? AND e.course_id = ?`
      )
      .get(user.id, course.id);
    if (row) myKey = decryptKey(row.key_encrypted);
  }

  const unlocked = [];
  unlocked.push("Community — Premium Live Trade Everyday");
  if (slug === "premium-live-trade-support") unlocked.push("Live Room");
  if (slug === "trading-consultation") unlocked.push("Trading Consultation area");
  if (slug === "forex-premium-course") unlocked.push("Course Videos (after you enter your Course Key below)");

  return (
    <div className="wrap section">
      <div className="card form-card">
        <span className="badge badge-green">✓ ENROLLMENT CONFIRMED</span>
        <h1 style={{ marginTop: 12 }}>Welcome aboard, {user.name}!</h1>
        <p className="muted">
          You are now enrolled in <strong>{course.title}</strong>.
        </p>
        <h3>What unlocked for you</h3>
        <ul className="check-list">
          {unlocked.map((u) => (<li key={u}>{u}</li>))}
        </ul>

        {myKey ? (
          <>
            <div className="alert alert-info">
              <strong>Your personal Course Key</strong> — save it now. You will need it to unlock the Course Videos page.
              Every student&apos;s key is different. Never share it.
            </div>
            <div className="key-box">{myKey}</div>
            <p className="small muted center" style={{ marginTop: 10 }}>
              This key is also saved in your profile (My Enrollments) — only you can see it.
            </p>
          </>
        ) : null}

        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <Link href="/community" className="btn btn-amber">Go to Community</Link>
          {slug === "forex-premium-course" ? (
            <Link href="/course-videos" className="btn btn-dark">Course Videos</Link>
          ) : null}
          <Link href="/profile" className="btn btn-dark">My Profile</Link>
        </div>
      </div>
    </div>
  );
}
