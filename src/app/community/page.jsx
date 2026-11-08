// ---------------------------------------------------------------------------
// community/page.jsx — Community, Premium Live Trade Everyday (Sec 16).
// ONE shared community for every member. Gate (server-side, via
// access.js): any enrollment unlocks it; everyone else sees the locked
// preview naming exactly which enrollments unlock it.
//
// LOOK (Nov 2026, Siam's order): EXACTLY like Instagram — single centered
// ~470px feed column, a stories row of members with recent posts on top,
// Instagram-style post cards (header, big media, heart/comment/share
// icons, likes, caption, comments, add-a-comment), photo-first composer.
// No separate login inside the community: members reaching this page are
// already logged in — the enrollment locked preview is the only gate.
// Member-to-member chat lives on its own page (/chat); the Mentor Special
// Chat stays on this page, below the feed. Gated: noindex.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getDb } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { canEnterCommunity } from "../../lib/access.js";
import { timeAgo } from "../../lib/utils.js";
import LockedPreview from "../../components/LockedPreview.jsx";
import DrivePlayer from "../../components/DrivePlayer.jsx";
import { SpecialChat, IgComposer, IgShareButton } from "../../components/CommunityClient.jsx";

export const metadata = {
  title: "Community — Premium Live Trade Everyday — LearnChart FX",
  description: "The LearnChart FX member community — feed, posts, member chat and the Mentor Special Chat.",
  robots: { index: false, follow: false },
};

function getFeed(userId) {
  const db = getDb();
  const posts = db
    .prepare(
      `SELECT p.*, u.id AS author_id, u.name AS author_name, u.profile_pic AS author_pic
       FROM posts p JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC, p.id DESC LIMIT 50`
    )
    .all();
  return posts.map((p) => {
    const likes = db.prepare("SELECT COUNT(*) AS c FROM likes WHERE post_id = ?").get(p.id).c;
    const likedByMe = userId
      ? !!db.prepare("SELECT id FROM likes WHERE post_id = ? AND user_id = ?").get(p.id, userId)
      : false;
    const comments = db
      .prepare(
        `SELECT c.*, u.name AS author_name FROM comments c
         JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at ASC`
      )
      .all(p.id);
    return { ...p, likes, likedByMe, comments };
  });
}

// Stories row — real members with recent posts only (latest post first).
// Tap opens that member's profile. Never invented: only members who
// actually posted appear here.
function getStories() {
  const db = getDb();
  return db
    .prepare(
      `SELECT u.id, u.name, u.profile_pic, MAX(p.created_at) AS last_post
       FROM posts p JOIN users u ON u.id = p.user_id
       GROUP BY u.id, u.name, u.profile_pic
       ORDER BY last_post DESC LIMIT 12`
    )
    .all()
    .map((m) => ({ id: m.id, name: m.name, profile_pic: m.profile_pic }));
}

export default async function CommunityPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const user = await getSessionUser();

  // Gate: any enrollment unlocks the Community (access.js).
  if (!user || !canEnterCommunity(user.id)) {
    return (
      <div className="wrap section">
        <p className="muted small">HOME › PREMIUM LIVE TRADE COMMUNITY</p>
        <h1 style={{ fontSize: 36 }}>Premium Live Trade <span className="amber">Everyday — Community</span></h1>
        <LockedPreview
          title="🔒 Members-Only Community"
          text="The Premium Live Trade community — feed, posts, likes, comments, member chat and the Mentor Special Chat — is only for members who have purchased a course or a service. Enroll in any program to unlock it."
          unlocks="Unlocks with: any enrollment (any course or service)"
          buttons={[
            { href: "/enroll/forex-premium-course", label: "Enroll — Premium Course $250", style: "btn-amber" },
            { href: "/enroll/premium-live-trade-support", label: "Join Live Trade — Free", style: "btn-dark" },
            { href: "/enroll/trading-consultation", label: "Consultation — Free", style: "btn-dark" },
          ]}
        />
      </div>
    );
  }

  const feed = getFeed(user.id);
  const stories = getStories();
  const me = { name: user.name, profile_pic: user.profile_pic };

  return (
    <div className="wrap section">
      <p className="muted small">HOME › PREMIUM LIVE TRADE COMMUNITY</p>

      {/* Instagram: one centered ~470px column — stories, composer, feed. */}
      <div className="ig-feed">
        <div className="ig-top">
          <h1>Community</h1>
          <span className="badge badge-green">🔓 Unlocked</span>
        </div>

        {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}
        {sp?.posted === "1" ? <div className="alert alert-ok">Your post is live in the feed.</div> : null}

        {/* Stories — members with recent posts; tap opens their profile. */}
        {stories.length > 0 ? (
          <div className="ig-stories">
            {stories.map((m) => (
              <Link key={m.id} href={`/members/${m.id}`} className="ig-story" aria-label={`${m.name}'s profile`}>
                <span className="ig-story-ring">
                  <span className="avatar">
                    {m.profile_pic ? <img src={m.profile_pic} alt={m.name} /> : m.name[0]}
                  </span>
                </span>
                <span>{m.name}</span>
              </Link>
            ))}
          </div>
        ) : null}

        {/* Composer — photo first, Instagram Create style. */}
        <IgComposer me={me} />

        {/* Feed — newest first, Instagram post cards. */}
        {feed.length === 0 ? (
          <div className="card center"><p className="muted">No posts yet — be the first to share a lesson or ask for help.</p></div>
        ) : null}
        {feed.map((p) => (
          <article className="ig-post" id={`post-${p.id}`} key={p.id}>
            <div className="ig-post-head">
              {/* Author name + picture link to their profile page. */}
              <Link href={`/members/${p.author_id}`} aria-label={`${p.author_name}'s profile`}>
                <span className="avatar">
                  {p.author_pic ? <img src={p.author_pic} alt={p.author_name} /> : p.author_name[0]}
                </span>
              </Link>
              <div className="who">
                <Link href={`/members/${p.author_id}`}><b>{p.author_name}</b></Link>
                <span>{timeAgo(p.created_at)}</span>
              </div>
              <span className="ig-dots" aria-hidden="true">•••</span>
            </div>
            {/* Media — big photo, Drive video, or a styled text card. */}
            {p.image_path ? (
              <div className="ig-media"><img src={p.image_path} alt="Post picture" loading="lazy" /></div>
            ) : p.drive_file_id ? (
              <div className="ig-media"><DrivePlayer fileId={p.drive_file_id} /></div>
            ) : p.text ? (
              <div className="ig-text-media"><p>{p.text}</p></div>
            ) : null}
            <div className="ig-actions">
              <form action="/api/community/like" method="post">
                <input type="hidden" name="post_id" value={p.id} />
                <button type="submit" className={`ig-icon-btn ig-like-btn ${p.likedByMe ? "liked" : ""}`} aria-label={p.likedByMe ? "Unlike" : "Like"}>
                  {p.likedByMe ? "♥" : "♡"}
                </button>
              </form>
              {/* The comment icon is a label for the add-comment box — tap focuses it. */}
              <label htmlFor={`ig-comment-${p.id}`} className="ig-icon-btn" aria-label="Comment" style={{ cursor: "pointer" }}>💬</label>
              <IgShareButton postId={p.id} />
            </div>
            <div className="ig-likes">{p.likes} like{p.likes === 1 ? "" : "s"}</div>
            {p.text && (p.image_path || p.drive_file_id) ? (
              <div className="ig-caption"><b>{p.author_name}</b>{p.text}</div>
            ) : null}
            {p.comments.length > 0 ? (
              <div className="ig-comments">
                {p.comments.map((c) => (
                  <div className="ig-comment" key={c.id}>
                    <b>{c.author_name}</b>
                    {c.text} <span className="muted">{timeAgo(c.created_at)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <form action="/api/community/comment" method="post" className="ig-add-comment">
              <input type="hidden" name="post_id" value={p.id} />
              <input id={`ig-comment-${p.id}`} name="text" placeholder="Add a comment…" maxLength={2000} required />
              <button type="submit">Post</button>
            </form>
          </article>
        ))}

        {/* Mentor Special Chat — below the feed, DM style. */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>⭐ Mentor Special Chat</h3>
          <SpecialChat />
        </div>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>💬 Member Chat</h3>
          <p className="small muted">
            Chat one-to-one with other members in a separate chat box — pick a member and talk.
          </p>
          <Link href="/chat" className="btn btn-amber btn-sm">Open Chat →</Link>
        </div>
        <div className="card">
          <h3>Quick links</h3>
          <p><Link href="/live-room" className="amber">🔴 Live Room →</Link></p>
          <p><Link href="/consultation" className="amber">🎧 My Consultations →</Link></p>
          <p><Link href="/course-videos" className="amber">🎓 My Course Videos →</Link></p>
        </div>
      </div>
    </div>
  );
}
