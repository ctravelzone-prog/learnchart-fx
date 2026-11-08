// ---------------------------------------------------------------------------
// community/special-chat — the dedicated Special Chat page (Nov 2026,
// Siam's order). The three cards that used to sit stacked under the
// feed (Mentor Special Chat + Member Chat + Quick links) live here now,
// all together — the feed column ends cleanly after "You're all caught
// up" / Suggested Posts. All three cards work exactly as before:
// mentor-marked messages + Send, Open Chat → /chat, quick links to
// Live Room / Consultations / Course Videos.
// Gate: community members only (PAID — Nov 2026, Siam's order: an
// active paid enrollment, Forex $250 or unexpired Private Live Trade
// $200/month) — everyone else sees the same locked preview as the
// feed page. Gated: noindex.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getSessionUser } from "../../../lib/auth.js";
import { getCommunityAccessState } from "../../../lib/access.js";
import CommunityLockedPreview from "../../../components/CommunityLockedPreview.jsx";
import IgRail from "../../../components/IgRail.jsx";
import { SpecialChat } from "../../../components/CommunityClient.jsx";

export const metadata = {
  title: "Special Chat — Community — LearnChart FX",
  description: "The Mentor Special Chat, member chat and quick links for LearnChart FX members.",
  robots: { index: false, follow: false },
};

export default async function SpecialChatPage() {
  const user = await getSessionUser();

  const communityAccess = getCommunityAccessState(user?.id);
  if (!user || communityAccess.state !== "open") {
    return (
      <div className="wrap section">
        <p className="muted small">HOME › PREMIUM LIVE TRADE COMMUNITY › SPECIAL CHAT</p>
        <h1 style={{ fontSize: 36 }}>Special <span className="amber">Chat</span></h1>
        <CommunityLockedPreview
          access={communityAccess}
          description="The Mentor Special Chat, member chat and quick links"
        />
      </div>
    );
  }

  const me = { id: user.id, name: user.name, profile_pic: user.profile_pic };

  return (
    <div className="ig-shell">
      <IgRail active="special-chat" me={me} />
      <div className="ig-main">
        <div className="ig-feed-col">
          <p className="muted small" style={{ marginBottom: 4 }}>
            <Link href="/community" className="amber">← Back to Community</Link>
          </p>
          <h1 style={{ fontSize: 26, marginBottom: 16 }}>Special Chat</h1>

          {/* Mentor Special Chat — mentor messages are marked, @Mentor
              gets answered live during sessions. */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>⭐ Mentor Special Chat</h3>
            <SpecialChat />
          </div>

          {/* Member Chat — one-to-one chat lives on its own page. */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>💬 Member Chat</h3>
            <p className="small muted">
              Chat one-to-one with other members in a separate chat box — pick a member and talk.
            </p>
            <Link href="/chat" className="btn btn-amber btn-sm">Open Chat →</Link>
          </div>

          {/* Quick links. */}
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
