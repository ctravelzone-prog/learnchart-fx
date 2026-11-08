// ---------------------------------------------------------------------------
// community/page.jsx — Community, Premium Live Trade Everyday (Sec 16).
// ONE shared community for every member. Gate (server-side, via
// access.js): an ACTIVE PAID enrollment unlocks it (Forex $250 or
// unexpired Private Live Trade $200/month — Nov 2026, Siam's order);
// everyone else sees the locked preview naming exactly which paid
// programs unlock it. A free Consultation enrollment alone does NOT
// open the Community.
//
// LOOK (Nov 2026, Siam's Facebook screenshots — supersedes the earlier
// Instagram direction for the feed): the Facebook home-feed layout in
// the LearnChart dark theme + amber accent — rectangular story CARDS
// on top (not circles), a Facebook composer bar ("What's on your
// mind, <FirstName>?" + Live video / Photo/video / Reel buttons),
// Facebook post cards (header with time · globe, caption, full-width
// photo, counts row, Like / Comment / Share action row, Save in the
// "..." menu), left rail navigation and the right panel (own profile
// + Suggested for you). No fake Sponsored ads or Birthdays — we have
// neither ads nor birthdays stored. Below the feed: "You're all
// caught up" + Suggested Posts. STORIES (Nov 2026): real 24-hour
// stories — tapping a story card opens the dedicated stories page
// (/community/stories?user=<id>). COMPOSER (Nov 2026): clicking the
// text field opens the Create Post modal; the full composer lives on
// its own page (/community/create).
// No separate login inside the community: members reaching this page
// are already logged in — the enrollment locked preview is the only
// gate. Only real features are linked: Home, Community, Special Chat,
// Messages (/chat), Create, Profile, More — no Search, Explore/Reels
// or Notifications (they don't exist). No invented followers/following.
// Member-to-member chat lives on its own page (/chat); the Mentor
// Special Chat, Member Chat and Quick links live on their own page
// (/community/special-chat) — the feed ends after "You're all caught
// up" / Suggested Posts. Gated: noindex.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getDb } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { getCommunityAccessState } from "../../lib/access.js";
import { getStoryGroupsFor } from "../../lib/stories.js";
import { timeAgo } from "../../lib/utils.js";
import { bgCssFor } from "../../lib/post-colors.js";
import CommunityLockedPreview from "../../components/CommunityLockedPreview.jsx";
import DrivePlayer from "../../components/DrivePlayer.jsx";
import IgRail from "../../components/IgRail.jsx";
import FbComposer from "../../components/FbComposer.jsx";
import { IgShareButton } from "../../components/CommunityClient.jsx";

export const metadata = {
  title: "Community — Premium Live Trade Everyday — LearnChart FX",
  description: "The LearnChart FX member community — feed, posts, member chat and the Mentor Special Chat.",
  robots: { index: false, follow: false },
};

// Likes / liked-by-me / saved-by-me / shares / comments for a list of post rows.
function enrichPosts(db, rows, userId) {
  return rows.map((p) => {
    const likes = db.prepare("SELECT COUNT(*) AS c FROM likes WHERE post_id = ?").get(p.id).c;
    const shares = db.prepare("SELECT COUNT(*) AS c FROM post_shares WHERE post_id = ?").get(p.id).c;
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
    return { ...p, likes, shares, likedByMe, savedByMe, comments };
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

// One Facebook post card — used by the feed and by Suggested Posts
// (Nov 2026, Siam's Facebook screenshots — supersedes the Instagram
// card). Header: avatar, name, time · audience globe (no location —
// we don't store one). Caption, then full-width photo (or Drive
// video, or — for a text-only post with a background color from the
// Create Post modal's "Aa" palette — the text on that colored
// background). Then a counts row (real like / comment / share totals,
// shown only when a count is above zero), then the action row: Like
// (thumbs-up, fills blue when liked), Comment (bubble — focuses the
// add-comment box), Share (arrow — records one real share AND copies
// the post link, "Link copied" feedback). Save lives in the top-right
// "..." menu (a real, working save — listed on your own profile).
// All like/comment/share/save behavior is unchanged; only the
// presentation changed.
function PostCardFB({ p }) {
  const hasBg = p.bg_color && !p.image_path && !p.drive_file_id;
  return (
    <article className="fb-post" id={`post-${p.id}`}>
      <div className="fb-post-head">
        {/* Author name + picture link to their profile page. */}
        <Link href={`/members/${p.author_id}`} aria-label={`${p.author_name}'s profile`}>
          <span className="avatar">
            {p.author_pic ? <img src={p.author_pic} alt={p.author_name} /> : p.author_name[0]}
          </span>
        </Link>
        <div className="who">
          <Link href={`/members/${p.author_id}`}><b>{p.author_name}</b></Link>
          <span>
            {timeAgo(p.created_at)} ·{" "}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ verticalAlign: "-1px" }}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.9 6h-3.4a15.6 15.6 0 0 0-1.2-3.5A8.03 8.03 0 0 1 19.9 8zM12 4.1c.8 1 1.5 2.4 1.9 3.9h-3.8c.4-1.5 1.1-2.9 1.9-3.9zM4.1 8a8.03 8.03 0 0 1 4.6-3.5A15.6 15.6 0 0 0 7.5 8H4.1zM4.1 10h3.7c.1 1.4.4 2.7.9 3.9A8.1 8.1 0 0 1 4.1 10zm4.9 0h6c-.1 1.3-.5 2.7-1 3.9h-4c-.5-1.2-.9-2.6-1-3.9zm7.2 0h3.7a8.1 8.1 0 0 1-4.6 3.9c.5-1.2.8-2.5.9-3.9zM12 19.9c-.8-1-1.5-2.4-1.9-3.9h3.8c-.4-1.5-1.1-2.9-1.9-3.9zm-3.3-1.4a15.6 15.6 0 0 0 1.2 3.5 8.03 8.03 0 0 1-4.6-3.5h3.4zm7.9 0a8.03 8.03 0 0 1-4.6 3.5c.5-1.1.9-2.3 1.2-3.5h3.4z" /></svg>
          </span>
        </div>
        {/* "..." menu — Save lives here (real and working). */}
        <details className="fb-menu">
          <summary aria-label="More options">•••</summary>
          <div className="fb-menu-list">
            <form action="/api/community/save" method="post">
              <input type="hidden" name="post_id" value={p.id} />
              <button type="submit">{p.savedByMe ? "Remove bookmark" : "Save post"}</button>
            </form>
          </div>
        </details>
      </div>
      {/* Caption — above the media, Facebook style. A text-only post
          with a background color renders on that color. */}
      {p.text && !hasBg ? (
        <div className="fb-caption"><p>{p.text}</p></div>
      ) : null}
      {/* Media — big photo, Drive video, or a colored text block. */}
      {p.image_path ? (
        <div className="fb-media"><img src={p.image_path} alt="Post picture" loading="lazy" /></div>
      ) : p.drive_file_id ? (
        <div className="fb-media"><DrivePlayer fileId={p.drive_file_id} /></div>
      ) : hasBg ? (
        <div className="fb-bg-text" style={{ background: bgCssFor(p.bg_color) }}><p>{p.text}</p></div>
      ) : null}
      {/* Counts row — real totals, only when above zero. */}
      {p.likes > 0 || p.comments.length > 0 || p.shares > 0 ? (
        <div className="fb-counts">
          <span>
            {p.likes > 0 ? (
              <>
                <span className="fb-count-like">👍</span> {p.likes}
              </>
            ) : null}
          </span>
          <span>
            {p.comments.length > 0 ? `${p.comments.length} comment${p.comments.length === 1 ? "" : "s"}` : ""}
            {p.comments.length > 0 && p.shares > 0 ? " · " : ""}
            {p.shares > 0 ? `${p.shares} share${p.shares === 1 ? "" : "s"}` : ""}
          </span>
        </div>
      ) : null}
      {/* Action row — Like / Comment / Share. */}
      <div className="fb-actions">
        <form action="/api/community/like" method="post" className="fb-action-form">
          <input type="hidden" name="post_id" value={p.id} />
          <button type="submit" className={`fb-action-btn ${p.likedByMe ? "liked" : ""}`} aria-label={p.likedByMe ? "Unlike" : "Like"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={p.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
            Like
          </button>
        </form>
        {/* The comment button is a label for the add-comment box — tap focuses it. */}
        <label htmlFor={`fb-comment-${p.id}`} className="fb-action-btn" aria-label="Comment" style={{ cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
          Comment
        </label>
        <IgShareButton postId={p.id} />
      </div>
      {p.comments.length > 0 ? (
        <div className="fb-comments">
          {p.comments.map((c) => (
            <div className="fb-comment" key={c.id}>
              <b>{c.author_name}</b>
              {c.text} <span className="muted">{timeAgo(c.created_at)}</span>
            </div>
          ))}
        </div>
      ) : null}
      <form action="/api/community/comment" method="post" className="fb-add-comment">
        <input type="hidden" name="post_id" value={p.id} />
        <input id={`fb-comment-${p.id}`} name="text" placeholder="Write a comment…" maxLength={2000} required />
        <button type="submit">Post</button>
      </form>
    </article>
  );
}

export default async function CommunityPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const user = await getSessionUser();

  // Gate: PAID-ONLY (Nov 2026, Siam's order) — an active paid
  // enrollment (Forex $250 or unexpired Private Live Trade $200/month).
  // Consultation-only and non-enrolled visitors see the locked preview
  // naming the paid programs (and Renew, when a subscription lapsed).
  const communityAccess = getCommunityAccessState(user?.id);
  if (!user || communityAccess.state !== "open") {
    return (
      <div className="wrap section">
        <p className="muted small">HOME › PREMIUM LIVE TRADE COMMUNITY</p>
        <h1 style={{ fontSize: 36 }}>Premium Live Trade <span className="amber">Everyday — Community</span></h1>
        <CommunityLockedPreview
          access={communityAccess}
          description="The Premium Live Trade community — feed, posts, likes, comments, member chat and the Mentor Special Chat"
        />
      </div>
    );
  }

  const feed = getFeed(user.id);
  const storyGroups = getStoryGroupsFor(user.id);
  const suggestedMembers = getSuggestedMembers(user.id);
  const suggestedPosts = getSuggestedPosts(user.id);
  const me = { id: user.id, name: user.name, profile_pic: user.profile_pic };
  // Story cards need the viewer's own group (latest story photo) + the
  // others, in the same order as the stories page list.
  const myStoryGroup = storyGroups.find((g) => g.user_id === me.id) || null;
  const otherStoryGroups = storyGroups.filter((g) => g.user_id !== me.id);

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

          {/* Stories — rectangular Facebook story CARDS (Nov 2026,
              supersedes the Instagram circles). First card: "Create
              story" (your photo + big + button → the Story tab).
              Then "Your story" (your latest story photo, or your
              photo when you have none). Then one card per member with
              a live story: their story photo as the card image, avatar
              with a BLUE ring (unseen stories) or GREY ring (all seen)
              at the top, name at the bottom. Tapping a card opens the
              dedicated stories page for that person. */}
          <div className="fb-stories-row">
            <Link href="/community/create?tab=story" className="fb-story-card fb-story-create" aria-label="Create a story">
              <span className="fb-story-card-img">
                {me.profile_pic ? <img src={me.profile_pic} alt="" /> : <span className="fb-story-card-blank" />}
              </span>
              <span className="fb-story-create-plus">+</span>
              <span className="fb-story-card-name">Create story</span>
            </Link>
            <Link
              href={myStoryGroup ? `/community/stories?user=${me.id}` : "/community/create?tab=story"}
              className="fb-story-card"
              aria-label="Your story"
            >
              <span className="fb-story-card-img">
                {myStoryGroup ? (
                  <img src={myStoryGroup.stories[myStoryGroup.stories.length - 1].image_path} alt="" />
                ) : me.profile_pic ? (
                  <img src={me.profile_pic} alt="" />
                ) : (
                  <span className="fb-story-card-blank" />
                )}
              </span>
              <span className={`fb-story-card-avatar ${myStoryGroup ? "seen" : ""}`}>
                <span className="avatar">
                  {me.profile_pic ? <img src={me.profile_pic} alt={me.name} /> : me.name[0]}
                </span>
              </span>
              <span className="fb-story-card-name">Your story</span>
            </Link>
            {otherStoryGroups.map((g) => (
              <Link key={g.user_id} href={`/community/stories?user=${g.user_id}`} className="fb-story-card" aria-label={`${g.name}'s stories`}>
                <span className="fb-story-card-img">
                  <img src={g.stories[g.stories.length - 1].image_path} alt="" />
                </span>
                {/* Blue ring = unseen stories; grey ring = all seen. */}
                <span className={`fb-story-card-avatar ${g.unseen > 0 ? "unseen" : "seen"}`}>
                  <span className="avatar">
                    {g.profile_pic ? <img src={g.profile_pic} alt={g.name} /> : g.name[0]}
                  </span>
                </span>
                <span className="fb-story-card-name">{g.name}</span>
              </Link>
            ))}
          </div>

          {/* Composer — Facebook bar + Create Post modal (Nov 2026).
              The text field opens the modal; Live video / Photo/video /
              Reel go to their real destinations. */}
          <FbComposer me={me} returnTo="/community" />

          {/* Feed — newest first, Facebook post cards. */}
          {feed.length === 0 ? (
            <div className="card center"><p className="muted">No posts yet — be the first to share a lesson or ask for help.</p></div>
          ) : null}
          {feed.map((p) => (
            <PostCardFB key={p.id} p={p} />
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
                <PostCardFB key={p.id} p={p} />
              ))}
            </div>
          ) : null}

          {/* Feed ends here — "You're all caught up" / Suggested Posts
              are the last sections. The Mentor Special Chat, Member Chat
              and Quick links moved to their own page
              (/community/special-chat, Nov 2026). */}
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
