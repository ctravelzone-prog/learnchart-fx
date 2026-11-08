// ---------------------------------------------------------------------------
// community/page.jsx — Community, Premium Live Trade Everyday (Sec 16).
// ONE shared community for every member. Gate (server-side, via
// access.js): any enrollment unlocks it; everyone else sees the locked
// preview naming exactly which enrollments unlock it.
//
// LOOK (Nov 2026, Siam's screenshots of real Instagram desktop): the
// Instagram 3-column desktop layout, LearnChart dark theme + amber
// accent — left rail (icon + labels on desktop, icons-only on tablets),
// center ~470px feed column, right panel (own profile + Suggested for
// you). Below the feed: "You're all caught up" + Suggested Posts.
// STORIES (Nov 2026): real 24-hour stories at the top — one photo per
// story, deleted from the server after 24 hours. COMPOSER (Nov 2026):
// the big open Create card is gone — a small collapsed bar opens the
// dedicated Create page (/community/create) instead.
// No separate login inside the community: members reaching this page
// are already logged in — the enrollment locked preview is the only
// gate. Only real features are linked: Home, Community, Special Chat,
// Messages (/chat), Create, Profile, More — no Search, Explore/Reels
// or Notifications (they don't exist). No invented followers/following.
// Member-to-member chat lives on its own page (/chat); the Mentor
// Special Chat stays on this page, below the feed. Gated: noindex.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getDb } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { canEnterCommunity } from "../../lib/access.js";
import { getLiveStoryGroups } from "../../lib/stories.js";
import { timeAgo } from "../../lib/utils.js";
import LockedPreview from "../../components/LockedPreview.jsx";
import DrivePlayer from "../../components/DrivePlayer.jsx";
import IgRail from "../../components/IgRail.jsx";
import { SpecialChat, IgStories, IgShareButton } from "../../components/CommunityClient.jsx";

export const metadata = {
  title: "Community — Premium Live Trade Everyday — LearnChart FX",
  description: "The LearnChart FX member community — feed, posts, member chat and the Mentor Special Chat.",
  robots: { index: false, follow: false },
};

// Likes / liked-by-me / saved-by-me / comments for a list of post rows.
function enrichPosts(db, rows, userId) {
  return rows.map((p) => {
    const likes = db.prepare("SELECT COUNT(*) AS c FROM likes WHERE post_id = ?").get(p.id).c;
    const likedByMe = userId
      ? !!db.prepare("SELECT id FROM likes WHERE post_id = ? AND user_id = ?").get(p.id, userId)
      : false;
    const savedByMe = userId
      ? !!db.prepare("SELECT id FROM saved_posts WHERE post_id = ? AND user_id = ?").get(p.id, userId)
      : false;
    const comments = db
      .prepare(
        `SELECT c.*, u.name AS author_name FROM comments c
         JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at ASC`
      )
      .all(p.id);
    return { ...p, likes, likedByMe, savedByMe, comments };
  });
}

function getFeed(userId) {
  const db = getDb();
  const posts = db
    .prepare(
      `SELECT p.*, u.id AS author_id, u.name AS author_name, u.profile_pic AS author_pic
       FROM posts p JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC, p.id DESC LIMIT 50`
    )
    .all();
  return enrichPosts(db, posts, userId);
}

// Stories row — REAL 24-hour stories (src/lib/stories.js): only
// members with a live (unexpired) story appear, newest first. The old
// "members with recent posts" row is gone — a story is a photo posted
// as a story, not a feed post.

// Suggested for you — real members (newest first), with real data only:
// post count + member-since. No follow system exists, so the action is
// Message (opens a one-to-one chat), never Follow.
function getSuggestedMembers(userId) {
  const db = getDb();
  return db
    .prepare(
      `SELECT u.id, u.name, u.profile_pic, u.created_at,
       (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count
       FROM users u WHERE u.id != ? ORDER BY u.created_at DESC LIMIT 5`
    )
    .all(userId)
    .map((m) => ({ id: m.id, name: m.name, profile_pic: m.profile_pic, created_at: m.created_at, post_count: m.post_count }));
}

// Suggested Posts — real posts from OTHER members (newest first).
// Shown below "You're all caught up", like Instagram's section.
function getSuggestedPosts(userId) {
  const db = getDb();
  const posts = db
    .prepare(
      `SELECT p.*, u.id AS author_id, u.name AS author_name, u.profile_pic AS author_pic
       FROM posts p JOIN users u ON u.id = p.user_id
       WHERE p.user_id != ? ORDER BY p.created_at DESC, p.id DESC LIMIT 6`
    )
    .all(userId);
  return enrichPosts(db, posts, userId);
}

// One Instagram post card — used by the feed and by Suggested Posts.
function PostCardIG({ p }) {
  return (
    <article className="ig-post" id={`post-${p.id}`}>
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
        <form action="/api/community/like" method="post" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="hidden" name="post_id" value={p.id} />
          <button type="submit" className={`ig-icon-btn ig-like-btn ${p.likedByMe ? "liked" : ""}`} aria-label={p.likedByMe ? "Unlike" : "Like"}>
            {p.likedByMe ? "♥" : "♡"}
          </button>
          <span className="small" style={{ fontWeight: 700 }}>{p.likes}</span>
        </form>
        {/* The comment icon is a label for the add-comment box — tap focuses it. */}
        <label htmlFor={`ig-comment-${p.id}`} className="ig-icon-btn" aria-label="Comment" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          💬<span className="small" style={{ fontWeight: 700 }}>{p.comments.length}</span>
        </label>
        <IgShareButton postId={p.id} />
        {/* Bookmark (save) — a real save, listed on your own profile. */}
        <form action="/api/community/save" method="post" style={{ marginLeft: "auto" }}>
          <input type="hidden" name="post_id" value={p.id} />
          <button type="submit" className={`ig-icon-btn ig-save-btn ${p.savedByMe ? "saved" : ""}`} aria-label={p.savedByMe ? "Remove bookmark" : "Save post"}>
            🔖
          </button>
        </form>
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
  );
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
            { href: "/enroll/private-live-trade", label: "Join Private Live Trade — $200", style: "btn-dark" },
            { href: "/enroll/trading-consultation", label: "Consultation — Free", style: "btn-dark" },
          ]}
        />
      </div>
    );
  }

  const feed = getFeed(user.id);
  const storyGroups = getLiveStoryGroups();
  const suggestedMembers = getSuggestedMembers(user.id);
  const suggestedPosts = getSuggestedPosts(user.id);
  const me = { id: user.id, name: user.name, profile_pic: user.profile_pic };

  return (
    <div className="ig-shell">
      {/* Left rail — Instagram navigation, only real features. */}
      <IgRail active="community" me={me} />

      <div className="ig-main">
        {/* Center feed column. */}
        <div className="ig-feed-col">
          {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}
          {sp?.posted === "1" ? <div className="alert alert-ok">Your post is live in the feed.</div> : null}
          {sp?.story === "1" ? <div className="alert alert-ok">Your story is live for 24 hours — then it disappears automatically.</div> : null}

          {/* Stories — real 24-hour stories (tap a circle = viewer). */}
          <IgStories groups={storyGroups} me={me} />

          {/* Composer — collapsed bar (Instagram/Facebook style). The full
              composer lives on its own page (/community/create); the big
              open card at the top of the feed is gone. */}
          <Link href="/community/create" className="ig-composer-bar" aria-label="Create a post">
            <span className="avatar">
              {me.profile_pic ? <img src={me.profile_pic} alt={me.name} /> : me.name[0]}
            </span>
            <span className="ig-composer-bar-text">Create a post…</span>
            <span className="ig-composer-bar-photo" aria-hidden="true">📷</span>
          </Link>

          {/* Feed — newest first, Instagram post cards. */}
          {feed.length === 0 ? (
            <div className="card center"><p className="muted">No posts yet — be the first to share a lesson or ask for help.</p></div>
          ) : null}
          {feed.map((p) => (
            <PostCardIG key={p.id} p={p} />
          ))}

          {/* End of feed — "You're all caught up". */}
          {feed.length > 0 ? (
            <div className="ig-caughtup">
              <div className="tick">✓</div>
              <h3>You&apos;re all caught up</h3>
              <p>You&apos;ve seen all the latest posts.</p>
            </div>
          ) : null}

          {/* Suggested Posts — real posts from other members. */}
          {suggestedPosts.length > 0 ? (
            <div className="ig-suggested">
              <h2>Suggested Posts</h2>
              {suggestedPosts.map((p) => (
                <PostCardIG key={p.id} p={p} />
              ))}
            </div>
          ) : null}

          {/* Mentor Special Chat — below the feed, DM style. */}
          <div className="card" id="special-chat" style={{ marginBottom: 16, marginTop: 24 }}>
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

        {/* Right panel — own profile + Suggested for you. */}
        <aside className="ig-side">
          <div className="ig-side-card">
            <Link href={`/members/${me.id}`} aria-label="Your profile">
              <span className="avatar">
                {me.profile_pic ? <img src={me.profile_pic} alt={me.name} /> : me.name[0]}
              </span>
            </Link>
            <div className="who">
              <Link href={`/members/${me.id}`}><b>{me.name}</b></Link>
              <span>LearnChart FX member</span>
            </div>
            {/* Switch accounts from your profile (log out, log in as another). */}
            <Link href="/profile" className="ig-switch">Switch</Link>
          </div>
          <div className="ig-side-head">
            <b>Suggested for you</b>
            <Link href="/chat">See all</Link>
          </div>
          {suggestedMembers.length === 0 ? (
            <p className="small muted">No other members yet.</p>
          ) : null}
          {suggestedMembers.map((m) => (
            <div className="ig-sugg-row" key={m.id}>
              <Link href={`/members/${m.id}`} aria-label={`${m.name}'s profile`}>
                <span className="avatar">
                  {m.profile_pic ? <img src={m.profile_pic} alt={m.name} /> : m.name[0]}
                </span>
              </Link>
              <div className="who">
                <Link href={`/members/${m.id}`}><b>{m.name}</b></Link>
                <span>{m.post_count} post{m.post_count === 1 ? "" : "s"} · Member since {new Date(m.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
              </div>
              <Link href={`/chat?with=${m.id}`} className="ig-msg-btn">Message</Link>
            </div>
          ))}
          <div className="ig-side-foot">
            <Link href="/mentors">Mentors</Link> · <Link href="/courses">Courses</Link> · <Link href="/faq">FAQ</Link> · <Link href="/contact">Contact</Link>
            <br />© 2026 LearnChart FX
          </div>
        </aside>
      </div>

      {/* Floating Messages pill (desktop only). */}
      <Link href="/chat" className="ig-msg-float">
        ✈ Messages
        {suggestedMembers.slice(0, 3).map((m) => (
          <span key={m.id} className="avatar">
            {m.profile_pic ? <img src={m.profile_pic} alt={m.name} /> : m.name[0]}
          </span>
        ))}
      </Link>
    </div>
  );
}
