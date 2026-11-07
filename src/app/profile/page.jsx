// ---------------------------------------------------------------------------
// profile/page.jsx — My Profile (prompt Section 15). Login required.
// Shows details, uploadable profile picture, My Enrollments, a My Course
// Videos link for Forex students, and — for a Forex student — their own
// Course Key, visible only to them. Gated page: noindex.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb, getEnrollments, hasEnrollment } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { decryptKey } from "../../lib/keys.js";

export const metadata = {
  title: "My Profile — LearnChart FX",
  description: "Your LearnChart FX profile and enrollments.",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/profile");

  const enrollments = getEnrollments(user.id);
  const isForex = hasEnrollment(user.id, "forex-premium-course");
  let myKey = null;
  if (isForex) {
    const row = getDb()
      .prepare(
        `SELECT ck.key_encrypted FROM course_keys ck
         JOIN enrollments e ON e.id = ck.enrollment_id
         JOIN courses_services c ON c.id = e.course_id
         WHERE e.user_id = ? AND c.slug = 'forex-premium-course'`
      )
      .get(user.id);
    if (row) myKey = decryptKey(row.key_encrypted);
  }

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>My Profile</h1>
      {sp?.saved === "1" ? <div className="alert alert-ok">Profile picture updated.</div> : null}
      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}

      <div className="grid-2">
        <div className="card">
          <div className="post-head">
            <span className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
              {user.profile_pic ? <img src={user.profile_pic} alt={user.name} /> : user.name[0]}
            </span>
            <div>
              <h2>{user.name}</h2>
              <p className="muted small" style={{ margin: 0 }}>{user.email}</p>
            </div>
          </div>
          <form action="/api/profile" method="post" encType="multipart/form-data" style={{ marginTop: 16 }}>
            <div className="field">
              <label htmlFor="pic">Profile picture (image only, up to 5 MB)</label>
              <input id="pic" name="picture" type="file" accept="image/*" />
            </div>
            <button type="submit" className="btn btn-dark btn-sm">Upload Picture</button>
          </form>
          <dl className="kv" style={{ marginTop: 18 }}>
            <dt>Member since</dt><dd>{new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
          </dl>
        </div>

        <div className="card">
          <h3>My Enrollments</h3>
          {enrollments.length === 0 ? (
            <p className="muted">You have no enrollments yet. <Link href="/courses" className="amber">Browse Courses &amp; Services →</Link></p>
          ) : (
            enrollments.map((e) => (
              <div key={e.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 12 }}>
                <strong>{e.course_title}</strong>
                <p className="small muted" style={{ margin: "4px 0" }}>
                  Status: {e.status} · Enrolled {new Date(e.created_at).toLocaleDateString("en-GB")}
                </p>
                {e.course_slug === "forex-premium-course" && myKey ? (
                  <>
                    <p className="small"><strong>Your Course Key:</strong></p>
                    <div className="key-box" style={{ fontSize: 16 }}>{myKey}</div>
                    <p className="small muted">Enter this key on the Course Videos page to unlock all 10 lessons. Never share it.</p>
                    <Link href="/course-videos" className="btn btn-amber btn-sm">My Course Videos →</Link>
                  </>
                ) : null}
              </div>
            ))
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <Link href="/community" className="btn btn-dark btn-sm">Community</Link>
            <Link href="/live-room" className="btn btn-dark btn-sm">Live Room</Link>
            <Link href="/consultation" className="btn btn-dark btn-sm">Consultation</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
