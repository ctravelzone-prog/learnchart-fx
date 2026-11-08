// ---------------------------------------------------------------------------
// profile/page.jsx — My Profile (prompt Section 15). Login required.
// Shows details, uploadable profile picture, My Enrollments, a My Course
// Videos link for every video-course enrollment, and My Posts / My Uploads
// (the user's own community posts). The Course Key is NEVER shown here —
// since Nov 2026 it is emailed to the student's Gmail; a video-course
// student can ask for it to be re-sent from here. Gated page: noindex.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDb, getEnrollments, isEnrollmentActive, displayPrice } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { canEnterCommunity } from "../../lib/access.js";
import PostCard from "../../components/PostCard.jsx";
import FbComposer from "../../components/FbComposer.jsx";

export const metadata = {
  title: "My Profile — LearnChart FX",
  description: "Your LearnChart FX profile and enrollments.",
  robots: { index: false, follow: false },
};

// The user's own posts, newest first, with like count + comments.
// Plain objects only (see PostCard) — node:sqlite rows are spread into
// fresh plain objects before rendering.
function getMyPosts(userId) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50")
    .all(userId)
    .map((p) => ({
      ...p,
      likes: db.prepare("SELECT COUNT(*) AS c FROM likes WHERE post_id = ?").get(p.id).c,
      comments: db
        .prepare(
          `SELECT c.*, u.name AS author_name FROM comments c
           JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at ASC`
        )
        .all(p.id),
    }));
}

export default async function ProfilePage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/profile");

  const enrollments = getEnrollments(user.id);
  const myPosts = getMyPosts(user.id);
  // The composer only shows for members who can actually post (an
  // active PAID enrollment — Nov 2026 paid-only Community gate). A
  // free Consultation enrollment alone never sees a dead composer.
  const canPost = canEnterCommunity(user.id);

  // What this student can actually open right now (active, unexpired
  // enrollments only) — the quick links below show only real access.
  // Community is PAID-ONLY (Nov 2026): it shows only when the student
  // holds an active PAID enrollment — a free Consultation enrollment
  // alone does not open it.
  const hasPaidEnrollment = enrollments.some((e) => isEnrollmentActive(e) && e.course_price_cents > 0);
  const hasLiveRoom = enrollments.some((e) => isEnrollmentActive(e) && e.course_unlocks === "live-room");
  const hasConsultation = enrollments.some((e) => isEnrollmentActive(e) && e.course_unlocks === "consultation");
  // SQLite stores datetimes as UTC "YYYY-MM-DD HH:MM:SS" — parse as
  // UTC so the expiry day shown is the real one, not a day off.
  const fmtSqlite = (s) =>
    new Date(String(s).replace(" ", "T") + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>My Profile</h1>
      {sp?.saved === "1" ? <div className="alert alert-ok">Profile picture updated.</div> : null}
      {sp?.keymail === "resent" ? <div className="alert alert-ok">Your Course Key was emailed to {user.email} — check your Gmail inbox (and Spam folder).</div> : null}
      {sp?.keymail === "failed" ? <div className="alert alert-error">We could not send your Course Key email right now. Please try again in a little while.</div> : null}
      {sp?.keymail === "unconfigured" ? <div className="alert alert-info">Email service is not connected yet — your key will be emailed once the site owner connects email.</div> : null}
      {sp?.posted === "1" ? <div className="alert alert-ok">Your post is live — it shows at the top of your posts below.</div> : null}
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
            // One card per enrollment — two enrollments show as two
            // cards, each with its own status, dates and access
            // buttons, so the student sees at a glance what they own.
            enrollments.map((e) => {
              const active = isEnrollmentActive(e);
              const expired = e.status === "active" && e.expires_at && !active;
              const isMonthly = e.course_billing === "monthly";
              return (
                <div
                  key={e.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderLeft: `4px solid ${active ? "#22c55e" : "#e5484d"}`,
                    borderRadius: 12,
                    padding: 14,
                    marginTop: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 17 }}>{e.course_title}</strong>
                    {active ? (
                      <span className="badge badge-green">● Active</span>
                    ) : expired ? (
                      <span className="badge" style={{ background: "#fde8e8", color: "#b42318" }}>● Expired</span>
                    ) : (
                      <span className="badge badge-amber">{e.status}</span>
                    )}
                  </div>
                  <p className="small muted" style={{ margin: "6px 0" }}>
                    Enrolled {new Date(e.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {isMonthly && e.expires_at ? (
                      active ? ` · Access until ${fmtSqlite(e.expires_at)}` : ` · Expired on ${fmtSqlite(e.expires_at)}`
                    ) : (
                      " · No expiry"
                    )}
                    {isMonthly ? ` · ${displayPrice({ price_label: e.course_price_label, billing: "monthly" })}` : null}
                  </p>
                  {isMonthly && active ? (
                    <p className="small muted" style={{ margin: "4px 0" }}>
                      Monthly subscription — your access runs until {fmtSqlite(e.expires_at)}. Renew by paying again; nothing is charged automatically.
                    </p>
                  ) : null}
                  {expired ? (
                    <div className="alert alert-error" style={{ margin: "8px 0" }}>
                      Your subscription expired on <strong>{fmtSqlite(e.expires_at)}</strong> and your access stopped.
                    </div>
                  ) : null}

                  {/* Access buttons for THIS enrollment only. */}
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    {active && e.course_unlocks === "live-room" ? (
                      <Link href="/live-room" className="btn btn-amber btn-sm">Live Room →</Link>
                    ) : null}
                    {active && e.course_unlocks === "consultation" ? (
                      <Link href="/consultation" className="btn btn-amber btn-sm">Consultation →</Link>
                    ) : null}
                    {active && e.course_has_videos ? (
                      <Link href={`/course-videos?course=${e.course_slug}`} className="btn btn-amber btn-sm">My Course Videos →</Link>
                    ) : null}
                    {expired ? (
                      <Link href={`/enroll/${e.course_slug}`} className="btn btn-amber btn-sm">Renew — {displayPrice({ price_label: e.course_price_label, billing: "monthly" })} →</Link>
                    ) : null}
                  </div>
                  {active && e.course_has_videos ? (
                    <>
                      <p className="small muted" style={{ marginTop: 10 }}>
                        Your Course Key was emailed to your Gmail when you enrolled. Enter it on the Course Videos
                        page — it is asked again every time you open the page.
                      </p>
                      <form action="/api/course-videos/resend-key" method="post" style={{ marginTop: 8 }}>
                        <input type="hidden" name="course" value={e.course_slug} />
                        <button type="submit" className="btn btn-dark btn-sm">Resend my key to my Gmail</button>
                      </form>
                    </>
                  ) : null}
                </div>
              );
            })
          )}
          {/* Quick links — only the areas this student can actually open. */}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            {hasPaidEnrollment ? <Link href="/community" className="btn btn-dark btn-sm">Community</Link> : null}
            {hasLiveRoom ? <Link href="/live-room" className="btn btn-dark btn-sm">Live Room</Link> : null}
            {hasConsultation ? <Link href="/consultation" className="btn btn-dark btn-sm">Consultation</Link> : null}
            <Link href="/courses" className="btn btn-dark btn-sm">Browse Courses</Link>
          </div>
        </div>
      </div>

      {/* The same Facebook composer as the Community feed (Nov 2026):
          posting from here returns to /profile with the new post at
          the top of your own posts. Only paid members see it. */}
      {canPost ? <FbComposer me={{ id: user.id, name: user.name, profile_pic: user.profile_pic }} returnTo="/profile" /> : null}

      {/* My Posts / My Uploads — everything this user posted in the Community. */}
      <h2 style={{ marginTop: 32 }}>📤 My Posts / My Uploads</h2>
      {myPosts.length === 0 ? (
        <div className="card"><p className="muted">You have not posted anything yet. <Link href="/community" className="amber">Write your first post in the Community →</Link></p></div>
      ) : null}
      {myPosts.map((p) => (
        <PostCard key={p.id} post={p} authorName={user.name} authorPic={user.profile_pic} authorId={user.id} />
      ))}
    </div>
  );
}
