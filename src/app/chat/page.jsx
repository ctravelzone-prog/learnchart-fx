// ---------------------------------------------------------------------------
// chat/page.jsx — Member Chat, its own page (Nov 2026: Siam asked for a
// separate chat box, not a small card buried in the Community sidebar).
// Member list on one side, one-to-one conversation on the other — the
// picked member comes from ?with=<id>. Paid members only: the viewer
// must be logged in with an ACTIVE PAID enrollment (same gate as the
// Community — Nov 2026, Siam's order); everyone else sees the locked
// preview. Gated page: noindex.
// ---------------------------------------------------------------------------
import { redirect } from "next/navigation";
import { getDb } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { getCommunityAccessState } from "../../lib/access.js";
import CommunityLockedPreview from "../../components/CommunityLockedPreview.jsx";
import ChatRoom from "../../components/ChatRoom.jsx";

export const metadata = {
  title: "Member Chat — LearnChart FX",
  description: "Chat one-to-one with other LearnChart FX members.",
  robots: { index: false, follow: false },
};

export default async function ChatPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const user = await getSessionUser();

  // Paid members only — same gate as the Community itself.
  if (!user) redirect("/login?next=/chat");
  const communityAccess = getCommunityAccessState(user.id);
  if (communityAccess.state !== "open") {
    return (
      <div className="wrap section">
        <h1 style={{ fontSize: 36 }}>Member <span className="amber">Chat</span></h1>
        <CommunityLockedPreview
          access={communityAccess}
          description="Member chat — chatting one-to-one with other members"
        />
      </div>
    );
  }

  // node:sqlite returns rows as null-prototype objects, and React's
  // flight serializer refuses those as props for a Client Component
  // (ChatRoom below) — so map them to plain objects first.
  const members = getDb()
    .prepare("SELECT id, name, profile_pic FROM users WHERE id != ? ORDER BY created_at ASC LIMIT 50")
    .all(user.id)
    .map((m) => ({ id: m.id, name: m.name, profile_pic: m.profile_pic }));

  // The picked member (?with=) must be a real member; anything else
  // means "none picked yet" and the conversation pane invites a pick.
  const wanted = Number(sp?.with);
  const peerId = members.some((m) => m.id === wanted) ? wanted : null;

  return (
    <div className="wrap section">
      <p className="muted small">HOME › MEMBER CHAT</p>
      <h1 style={{ fontSize: 36 }}>Messages</h1>
      <p className="muted">
        Talk one-to-one with other members. Pick a member on the left — your conversation opens on the right.
        The Mentor Special Chat lives on its own page — <Link href="/community/special-chat" className="amber">Special Chat →</Link>
      </p>
      <ChatRoom members={members} meId={user.id} peerId={peerId} />
    </div>
  );
}
