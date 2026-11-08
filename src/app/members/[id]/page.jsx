// ---------------------------------------------------------------------------
// members/[id] — a member's profile page (Nov 2026: Community is
// Facebook-like, so every member has a page of their own). Shows the
// member's name, picture, member-since date, and THEIR posts/uploads
// (newest first). Clicking any author's name or picture in the feed
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
import PostCard from "../../../components/PostCard.jsx";

export const metadata = {
  title: "Member Profile — LearnChart FX",
  description: "A LearnChart FX member's profile and posts.",
  robots: { index: false, follow: false },
};

// That member's posts, newest first, with like count + comments.
// Plain objects only (see PostCard).
function getMemberPosts(memberId) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 50")
    .all(memberId)
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

export default async function MemberProfilePage({ params }) {
  // Next.js 15: params is a Promise — await it first.
  const { id } = await params;
  const memberId = Number(id);
  const user = await getSessionUser();

  // Members only — same gate as the Community itself.
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

  return (
    <div className="wrap section">
      <p className="muted small">COMMUNITY › MEMBER PROFILE</p>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="post-head">
          <span className="avatar" style={{ width: 72, height: 72, fontSize: 28 }}>
            {member.profile_pic ? <img src={member.profile_pic} alt={member.name} /> : member.name[0]}
          </span>
          <div>
            <h1 style={{ fontSize: 32 }}>{member.name}</h1>
            <p className="muted small" style={{ margin: 0 }}>
              Member since {new Date(member.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              {" · "}{posts.length} post{posts.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {isMe ? (
            <Link href="/profile" className="btn btn-dark btn-sm">This is you — Edit My Profile →</Link>
          ) : (
            <Link href={`/chat?with=${member.id}`} className="btn btn-amber btn-sm">💬 Chat with {member.name} →</Link>
          )}
          <Link href="/community" className="btn btn-dark btn-sm">Back to Community →</Link>
        </div>
      </div>

      <h2>{isMe ? "My Posts / My Uploads" : `${member.name}'s Posts / Uploads`}</h2>
      {posts.length === 0 ? (
        <div className="card"><p className="muted">{member.name} has not posted anything yet.</p></div>
      ) : null}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} authorName={member.name} authorPic={member.profile_pic} authorId={member.id} />
      ))}
    </div>
  );
}
