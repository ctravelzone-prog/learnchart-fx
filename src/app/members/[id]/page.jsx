// ---------------------------------------------------------------------------
// members/[id] — a member's profile page, Instagram-style (Nov 2026).
// Big avatar, name, REAL post count + member-since — never invented
// followers/following counts (they don't exist). Below, a 3-column square
// grid of their posts/pictures; tap a tile to open that post in the
// Community feed. Clicking any author's name or picture in the feed
// opens their page here. Members only: the viewer must be logged in
// and enrolled (same gate as the Community); everyone else sees the
// locked preview. Gated page: noindex.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getDb, getUserById } from "../../../lib/db.js";
import { getSessionUser } from "../../../lib/auth.js";
import { canEnterCommunity } from "../../../lib/access.js";
import LockedPreview from "../../../components/LockedPreview.jsx";

export const metadata = {
  title: "Member Profile — LearnChart FX",
  description: "A LearnChart FX member's profile and posts.",
  robots: { index: false, follow: false },
};

// That member's posts, newest first. Plain objects only (server page).
function getMemberPosts(memberId) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50")
    .all(memberId);
}

// Posts this member bookmarked (saved) — shown only on your own profile.
function getSavedPosts(memberId) {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.* FROM saved_posts s JOIN posts p ON p.id = s.post_id
       WHERE s.user_id = ? ORDER BY s.created_at DESC, s.id DESC LIMIT 50`
    )
    .all(memberId);
}

export default async function MemberProfilePage({ params }) {
  // Next.js 15: params is a Promise — await it first.
  const { id } = await params;
  const memberId = Number(id);
  const user = await getSessionUser();

  // Members only — same gate as the Community itself. No separate login
  // inside the community: members are already logged in; the locked
  // preview below is the only gate, for non-enrolled visitors.
  if (!user) redirect(`/login?next=/members/${id}`);
  if (!canEnterCommunity(user.id)) {
    return (
      <div className="wrap section">
        <h1 style={{ fontSize: 36 }}>Member <span className="amber">Profile</span></h1>
        <LockedPreview
          title="🔒 Members-Only Community"
          text="Member profiles are only for members who have purchased a course or a service. Enroll in any program to unlock the Community and see member profiles."
          unlocks="Unlocks with: any enrollment (any course or service)"
          buttons={[
            { href: "/enroll/forex-premium-course", label: "Enroll — Premium Course $250", style: "btn-amber" },
            { href: "/enroll/premium-live-trade-support", label: "Join Live Trade — Free", style: "btn-dark" },
          ]}
        />
      </div>
    );
  }

  const member = memberId ? getUserById(memberId) : null;
  if (!member) notFound();

  const posts = getMemberPosts(member.id);
  const isMe = member.id === user.id;
  const savedPosts = isMe ? getSavedPosts(member.id) : [];

  return (
    <div className="wrap section">
      <p className="muted small">COMMUNITY › MEMBER PROFILE</p>

      {/* Instagram profile header: big avatar, name, real stats only. */}
      <div className="ig-profile">
        <span className="avatar">
          {member.profile_pic ? <img src={member.profile_pic} alt={member.name} /> : member.name[0]}
        </span>
        <div>
          <h1>{member.name}</h1>
          <div className="ig-stats">
            <span><b>{posts.length}</b> post{posts.length === 1 ? "" : "s"}</span>
            <span>Member since {new Date(member.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {isMe ? (
              <Link href="/profile" className="btn btn-dark btn-sm">Edit My Profile →</Link>
            ) : (
              <Link href={`/chat?with=${member.id}`} className="btn btn-amber btn-sm">💬 Chat with {member.name} →</Link>
            )}
            <Link href="/community" className="btn btn-dark btn-sm">Back to Community →</Link>
          </div>
        </div>
      </div>

      {/* Post grid — tap a tile to open that post in the feed. */}
      <div className="ig-grid-head">▦ POSTS</div>
      {posts.length === 0 ? (
        <div className="card center"><p className="muted">{member.name} has not posted anything yet.</p></div>
      ) : (
        <div className="ig-grid">
          {posts.map((p) => (
            <Link key={p.id} href={`/community#post-${p.id}`} className="ig-tile" aria-label={`Open post from ${new Date(p.created_at).toLocaleDateString("en-GB")}`}>
              {p.image_path ? (
                <img src={p.image_path} alt="Post picture" loading="lazy" />
              ) : p.drive_file_id ? (
                <span className="ig-tile-play">▶</span>
              ) : (
                <span className="ig-tile-text">{p.text}</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Saved posts — your bookmarks, only on your own profile. */}
      {isMe ? (
        <>
          <div className="ig-grid-head" style={{ marginTop: 28 }}>🔖 SAVED</div>
          {savedPosts.length === 0 ? (
            <div className="card center"><p className="muted">No saved posts yet — tap the bookmark icon on any post to save it here.</p></div>
          ) : (
            <div className="ig-grid">
              {savedPosts.map((p) => (
                <Link key={p.id} href={`/community#post-${p.id}`} className="ig-tile" aria-label={`Open saved post from ${new Date(p.created_at).toLocaleDateString("en-GB")}`}>
                  {p.image_path ? (
                    <img src={p.image_path} alt="Post picture" loading="lazy" />
                  ) : p.drive_file_id ? (
                    <span className="ig-tile-play">▶</span>
                  ) : (
                    <span className="ig-tile-text">{p.text}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
