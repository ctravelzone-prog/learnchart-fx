// ---------------------------------------------------------------------------
// community/page.jsx — Community, Premium Live Trade Everyday (Sec 16).
// ONE shared community for every member. Gate (server-side, via
// access.js): any enrollment unlocks it; everyone else sees the locked
// preview naming exactly which enrollments unlock it.
// Inside: Facebook-style feed (newest first), composer, and the separate
// Mentor Special Chat. Member-to-member chat lives on its own page
// (/chat) — linked from here, not buried in the sidebar. Author names
// and pictures link to member profile pages (/members/[id]).
// Layout: feed is the main column on desktop; one column on phones.
// Gated: noindex.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getDb } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { canEnterCommunity } from "../../lib/access.js";
import { timeAgo } from "../../lib/utils.js";
import LockedPreview from "../../components/LockedPreview.jsx";
import DrivePlayer from "../../components/DrivePlayer.jsx";
import { SpecialChat } from "../../components/CommunityClient.jsx";

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

  return (
    <div className="wrap section">
      <p className="muted small">HOME › PREMIUM LIVE TRADE COMMUNITY</p>
      <h1 style={{ fontSize: 36 }}>Premium Live Trade <span className="amber">Everyday — Community</span></h1>
      <p className="muted">
        Members join with their own account and profile: post trading problems and ask for help, share lessons,
        like and comment, chat one-to-one with members, and talk to the mentors in the Special Chat.
      </p>
      <p><span className="badge badge-green">🔓 Community unlocked</span> <span className="muted small">You are enrolled — the feed, posts, member chat and Mentor Special Chat below are fully open to you.</span></p>

      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}
      {sp?.posted === "1" ? <div className="alert alert-ok">Your post is live in the feed.</div> : null}

      {/* Facebook-style layout: the feed is the main column; the sidebar
          stacks BELOW it on phones (one column) so no card is ever
          squeezed into a one-word-per-line strip. The old inline
          gridTemplateColumns overrode the mobile media query — that was
          the squeeze bug in Siam's screenshot. */}
      <div className="community-layout">
        <div>
          {/* Composer — post rules (Section 17) explained before posting. */}
          <div className="card composer">
            <h3>Write a post</h3>
            <form action="/api/community/posts" method="post" encType="multipart/form-data">
              <div className="field">
                <textarea name="text" rows={3} placeholder="Share a lesson, ask for help, post your analysis…" maxLength={5000} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span className="chip">📚 Lesson post</span>
                <span className="chip">🆘 I need help</span>
                <span className="chip">📊 My analysis</span>
              </div>
              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="cp-image">🖼 Add Picture (images only, up to 5 MB)</label>
                <input id="cp-image" name="image" type="file" accept="image/*" />
                <p className="small muted">
                  Pictures: upload allowed · Videos: no direct upload — paste a Google Drive link instead, and the
                  video plays right here inside your post, streamed from your own Drive. Nothing is uploaded to this
                  site, so it uses none of the site&apos;s hosting space and the page stays fast.
                </p>
              </div>
              <div className="field">
                <label htmlFor="cp-drive">Google Drive video link (optional)</label>
                <input id="cp-drive" name="drive_url" type="url" placeholder="https://drive.google.com/file/d/…/view" />
                <p className="small muted">
                  In Google Drive, set the video&apos;s sharing to “Anyone with the link can view” — otherwise members
                  can&apos;t watch it here.
                </p>
              </div>
              <button type="submit" className="btn btn-amber">Post to Feed</button>
            </form>
          </div>

          {/* Feed — newest first */}
          <h2>📰 Community Feed</h2>
          {feed.length === 0 ? (
            <div className="card"><p className="muted">No posts yet — be the first to share a lesson or ask for help.</p></div>
          ) : null}
          {feed.map((p) => (
            <article className="card post" key={p.id}>
              <div className="post-head">
                {/* Author name + picture link to their profile page, where
                    their own posts/uploads live. */}
                <Link href={`/members/${p.author_id}`} aria-label={`${p.author_name}'s profile`}>
                  <span className="avatar">
                    {p.author_pic ? <img src={p.author_pic} alt={p.author_name} /> : p.author_name[0]}
                  </span>
                </Link>
                <div>
                  <Link href={`/members/${p.author_id}`}><strong>{p.author_name}</strong></Link>
                  <div className="small muted">{timeAgo(p.created_at)}</div>
                </div>
              </div>
              {p.text ? <p style={{ whiteSpace: "pre-wrap" }}>{p.text}</p> : null}
              {p.image_path ? <img src={p.image_path} alt="Post picture" loading="lazy" style={{ borderRadius: 12, marginTop: 8 }} /> : null}
              {p.drive_file_id ? (
                <div style={{ marginTop: 10 }}>
                  <DrivePlayer fileId={p.drive_file_id} />
                </div>
              ) : null}
              <div className="post-actions">
                <form action="/api/community/like" method="post">
                  <input type="hidden" name="post_id" value={p.id} />
                  <button type="submit">{p.likedByMe ? "♥ Liked" : "♡ Like"} ({p.likes})</button>
                </form>
                <span>💬 {p.comments.length} comments</span>
              </div>
              {p.comments.map((c) => (
                <div className="comment" key={c.id}>
                  <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{c.author_name[0]}</span>
                  <div className="body">
                    <strong>{c.author_name}</strong> <span className="muted small">{timeAgo(c.created_at)}</span>
                    <div>{c.text}</div>
                  </div>
                </div>
              ))}
              <form action="/api/community/comment" method="post" style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input type="hidden" name="post_id" value={p.id} />
                <input name="text" placeholder="Add a comment…" maxLength={2000} required />
                <button type="submit" className="btn btn-dark btn-sm">Comment</button>
              </form>
            </article>
          ))}
        </div>

        <div>
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
    </div>
  );
}
