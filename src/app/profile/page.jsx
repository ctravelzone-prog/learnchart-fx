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
import { getDb, getEnrollments } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import PostCard from "../../components/PostCard.jsx";

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

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>My Profile</h1>
      {sp?.saved === "1" ? <div className="alert alert-ok">Profile picture updated.</div> : null}
      {sp?.keymail === "resent" ? <div className="alert alert-ok">Your Course Key was emailed to {user.email} — check your Gmail inbox (and Spam folder).</div> : null}
      {sp?.keymail === "failed" ? <div className="alert alert-error">We could not send your Course Key email right now. Please try again in a little while.</div> : null}
      {sp?.keymail === "unconfigured" ? <div className="alert alert-info">Email service is not connected yet — your key will be emailed once the site owner connects email.</div> : null}
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
                {e.course_has_videos ? (
                  <>
                    <p className="small muted">
                      Your Course Key was emailed to your Gmail when you enrolled. Enter it on the Course Videos
                      page — it is asked again every time you open the page.
                    </p>
                    <form action="/api/course-videos/resend-key" method="post" style={{ marginTop: 8 }}>
                      <input type="hidden" name="course" value={e.course_slug} />
                      <button type="submit" className="btn btn-dark btn-sm">Resend my key to my Gmail</button>
                    </form>
                    <p style={{ marginTop: 10 }}>
                      <Link href={`/course-videos?course=${e.course_slug}`} className="btn btn-amber btn-sm">My Course Videos →</Link>
                    </p>
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
