// ---------------------------------------------------------------------------
// community/create — the dedicated Create page (Nov 2026, Siam's order).
// The big open Create card at the top of the feed looked bad, so the
// feed now shows only a small collapsed bar — tapping it (or the rail's
// Create) opens THIS page, Instagram/Facebook style, with the full
// composer, nicely laid out. Two tabs: Post (photo + caption + optional
// Drive video link) and Story (one or many photos, live for 24 hours
// then deleted from the server). Posting a post redirects back to the
// feed; posting stories does the same.
// Gate: community members only (any enrollment) — everyone else sees
// the same locked preview as the feed page. Gated: noindex.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getSessionUser } from "../../../lib/auth.js";
import { canEnterCommunity } from "../../../lib/access.js";
import LockedPreview from "../../../components/LockedPreview.jsx";
import IgRail from "../../../components/IgRail.jsx";
import { IgComposer, StoryPicker } from "../../../components/CommunityClient.jsx";

export const metadata = {
  title: "Create — Community — LearnChart FX",
  description: "Create a post or a 24-hour story in the LearnChart FX member community.",
  robots: { index: false, follow: false },
};

export default async function CommunityCreatePage({ searchParams }) {
  const sp = await searchParams;
  const user = await getSessionUser();
  const tab = sp?.tab === "story" ? "story" : "post";

  if (!user || !canEnterCommunity(user.id)) {
    return (
      <div className="wrap section">
        <p className="muted small">HOME › PREMIUM LIVE TRADE COMMUNITY › CREATE</p>
        <h1 style={{ fontSize: 36 }}>Create <span className="amber">a post</span></h1>
        <LockedPreview
          title="🔒 Members-Only Community"
          text="Creating posts and stories is only for members who have purchased a course or a service. Enroll in any program to unlock it."
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

  const me = { id: user.id, name: user.name, profile_pic: user.profile_pic };

  return (
    <div className="ig-shell">
      <IgRail active="create" me={me} />
      <div className="ig-main">
        <div className="ig-feed-col">
          <p className="muted small" style={{ marginBottom: 4 }}>
            <Link href="/community" className="amber">← Back to Community</Link>
          </p>
          <h1 style={{ fontSize: 26, marginBottom: 16 }}>Create</h1>
          {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}

          {/* Tabs — Post or Story. */}
          <div className="tabs" style={{ marginTop: 0 }}>
            <Link href="/community/create" className={`tab ${tab === "post" ? "active" : ""}`}>📝 Post</Link>
            <Link href="/community/create?tab=story" className={`tab ${tab === "story" ? "active" : ""}`}>⭕ Story — 24 hours</Link>
          </div>

          {tab === "post" ? (
            <IgComposer me={me} />
          ) : (
            <div className="card ig-composer">
              <div className="ig-composer-head">
                <span className="avatar">
                  {me.profile_pic ? <img src={me.profile_pic} alt={me.name} /> : me.name[0]}
                </span>
                <b>Add to your story</b>
              </div>
              <form action="/api/community/stories" method="post" encType="multipart/form-data">
                <StoryPicker />
                <p className="small muted" style={{ marginTop: 4 }}>
                  Your story is visible for 24 hours — then it is deleted from the server automatically and
                  disappears. You can add many photos at once; each one becomes its own story.
                </p>
                <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>Add to story</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
