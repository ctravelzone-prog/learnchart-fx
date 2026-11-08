// ---------------------------------------------------------------------------
// community/stories — the dedicated stories page (Nov 2026, Siam's
// order, Facebook layout). Left list panel + right viewer:
//   - "Stories" title; "Archive · Settings" links; "Your story" row
//     (own avatar + name + time + blue + button to add a story);
//     "All stories" — each member with a live story: avatar (BLUE ring
//     when they have stories you have not seen yet, grey when all seen),
//     name, "N new · time" (N = unseen count, time = age of their
//     newest story). Clicking a person loads their stories in the
//     right viewer.
//   - Right viewer: that person's stories in order — photo, progress
//     bars, prev/next, close (back to /community), author + time left
//     at the top, viewers count + avatar stack at the bottom.
//   - Archive: your own stories (live ones with time left + a delete
//     button each) + the note that stories disappear 24 hours after
//     posting. Settings: delete one of your stories / delete all of
//     them. Only real actions — no music (we have no music feature),
//     no dead links.
// Gate: PAID-ONLY Community gate (Nov 2026) — only active paid
// enrollments (Forex / unexpired PLT) can open it; Consultation-only,
// no-enrollment and signed-out users see the locked preview.
// Gated: noindex.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getSessionUser } from "../../../lib/auth.js";
import { getCommunityAccessState } from "../../../lib/access.js";
import { getStoryGroupsFor, getOwnStories } from "../../../lib/stories.js";
import { timeAgo } from "../../../lib/utils.js";
import CommunityLockedPreview from "../../../components/CommunityLockedPreview.jsx";
import IgRail from "../../../components/IgRail.jsx";
import StoryViewer from "../../../components/StoryViewer.jsx";

export const metadata = {
  title: "Stories — Community — LearnChart FX",
  description: "24-hour stories from LearnChart FX members — they disappear a day after posting.",
  robots: { index: false, follow: false },
};

// Time left on a story, server-side (stored times are UTC).
function timeLeftText(expiresAt) {
  const ms = Math.max(0, new Date(String(expiresAt).replace(" ", "T") + "Z").getTime() - Date.now());
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "less than a minute left";
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m left`;
}

export default async function StoriesPage({ searchParams }) {
  const sp = await searchParams;
  const user = await getSessionUser();

  const communityAccess = getCommunityAccessState(user?.id);
  if (!user || communityAccess.state !== "open") {
    return (
      <div className="wrap section">
        <p className="muted small">HOME › PREMIUM LIVE TRADE COMMUNITY › STORIES</p>
        <h1 style={{ fontSize: 36 }}>Stories</h1>
        <CommunityLockedPreview
          access={communityAccess}
          description="Member stories — 24-hour photos from paid members"
        />
      </div>
    );
  }

  const me = { id: user.id, name: user.name, profile_pic: user.profile_pic };
  const groups = getStoryGroupsFor(user.id).map((g) => ({
    user_id: g.user_id,
    name: g.name,
    profile_pic: g.profile_pic,
    unseen: g.unseen,
    newest_at: g.newest_at,
    stories: g.stories.map((s) => ({
      id: s.id,
      image_path: s.image_path,
      created_at: s.created_at,
      expires_at: s.expires_at,
    })),
  }));
  const myGroup = groups.find((g) => g.user_id === user.id) || null;
  const view = sp?.view === "archive" ? "archive" : sp?.view === "settings" ? "settings" : "viewer";
  const selectedUserId = Number(sp?.user) || null;
  // Default viewer: first person with unseen stories, else the first group.
  const defaultUserId = groups.find((g) => g.unseen > 0)?.user_id ?? groups[0]?.user_id ?? null;
  const activeUserId = groups.some((g) => g.user_id === selectedUserId) ? selectedUserId : defaultUserId;

  const ownStories = view === "archive" || view === "settings" ? getOwnStories(user.id) : [];

  return (
    <div className="ig-shell">
      <IgRail active="community" me={me} />
      <div className="ig-main">
        <div className="fb-stories-layout">
          {/* Left list panel. */}
          <aside className="fb-stories-list">
            <h1 style={{ fontSize: 24, marginBottom: 4 }}>Stories</h1>
            <p className="small muted" style={{ margin: "0 0 14px" }}>
              <Link href="/community/stories?view=archive" className={view === "archive" ? "amber" : ""}>Archive</Link>
              {" · "}
              <Link href="/community/stories?view=settings" className={view === "settings" ? "amber" : ""}>Settings</Link>
            </p>

            {/* Your story — avatar + name + time of your newest story
                (or "Add a story"), blue + button to add one. */}
            <div className="fb-stories-you">
              <Link href={myGroup ? `/community/stories?user=${user.id}` : "/community/create?tab=story"} aria-label="Your stories">
                <span className="avatar">
                  {me.profile_pic ? <img src={me.profile_pic} alt={me.name} /> : me.name[0]}
                </span>
              </Link>
              <div className="who">
                <Link href={myGroup ? `/community/stories?user=${user.id}` : "/community/create?tab=story"}><b>Your story</b></Link>
                <span>{myGroup ? timeAgo(myGroup.newest_at) : "Add a story"}</span>
              </div>
              <Link href="/community/create?tab=story" className="fb-story-plus-btn" aria-label="Add a story">+</Link>
            </div>

            <h2 style={{ fontSize: 16, margin: "18px 0 10px" }}>All stories</h2>
            {groups.length === 0 ? (
              <p className="small muted">No stories yet — be the first to post one.</p>
            ) : null}
            {groups.map((g) => (
              <Link
                key={g.user_id}
                href={`/community/stories?user=${g.user_id}`}
                className={`fb-stories-item ${g.user_id === activeUserId && view === "viewer" ? "active" : ""}`}
              >
                {/* Blue ring = unseen stories; grey ring = all seen. */}
                <span className={`fb-stories-ring ${g.unseen > 0 ? "unseen" : "seen"}`}>
                  <span className="avatar">
                    {g.profile_pic ? <img src={g.profile_pic} alt={g.name} /> : g.name[0]}
                  </span>
                </span>
                <span className="who">
                  <b>{g.name}</b>
                  <span>{g.unseen > 0 ? `${g.unseen} new · ${timeAgo(g.newest_at)}` : timeAgo(g.newest_at)}</span>
                </span>
              </Link>
            ))}
          </aside>

          {/* Right side — viewer, Archive, or Settings. */}
          <div className="fb-stories-view">
            {sp?.deleted ? <div className="alert alert-ok">{sp.deleted}</div> : null}
            {view === "archive" ? (
              <div>
                <h2 style={{ fontSize: 22, marginBottom: 6 }}>Story archive</h2>
                <p className="muted small" style={{ marginTop: 0 }}>
                  Your stories live for 24 hours — then they disappear from the server automatically.
                  Only your live stories are listed here.
                </p>
                {ownStories.length === 0 ? (
                  <div className="card center"><p className="muted">You have no live stories. <Link href="/community/create?tab=story" className="amber">Add one →</Link></p></div>
                ) : (
                  ownStories.map((s) => (
                    <div key={s.id} className="card fb-story-archive-row">
                      <img src={s.image_path} alt="Your story" />
                      <div className="who">
                        <b>Posted {timeAgo(s.created_at)}</b>
                        <span>{timeLeftText(s.expires_at)}</span>
                      </div>
                      <form action="/api/community/stories/delete" method="post">
                        <input type="hidden" name="story_id" value={s.id} />
                        <button type="submit" className="btn btn-dark btn-sm">Delete</button>
                      </form>
                    </div>
                  ))
                )}
              </div>
            ) : view === "settings" ? (
              <div>
                <h2 style={{ fontSize: 22, marginBottom: 6 }}>Story settings</h2>
                <p className="muted small" style={{ marginTop: 0 }}>
                  Your stories disappear 24 hours after posting. Delete one — or all of them at once.
                </p>
                {ownStories.length === 0 ? (
                  <div className="card center"><p className="muted">You have no live stories to manage.</p></div>
                ) : (
                  <>
                    {ownStories.map((s) => (
                      <div key={s.id} className="card fb-story-archive-row">
                        <img src={s.image_path} alt="Your story" />
                        <div className="who">
                          <b>Posted {timeAgo(s.created_at)}</b>
                          <span>{timeLeftText(s.expires_at)}</span>
                        </div>
                        <form action="/api/community/stories/delete" method="post">
                          <input type="hidden" name="story_id" value={s.id} />
                          <button type="submit" className="btn btn-dark btn-sm">Delete</button>
                        </form>
                      </div>
                    ))}
                    <div className="card" style={{ marginTop: 14 }}>
                      <h3>Delete all my stories</h3>
                      <p className="small muted">This removes every live story of yours, right now — they cannot be brought back.</p>
                      <form action="/api/community/stories/delete" method="post">
                        <input type="hidden" name="all" value="1" />
                        <button type="submit" className="btn btn-dark btn-sm">Delete all my stories</button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <StoryViewer groups={groups} selectedUserId={activeUserId} me={me} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
