// ---------------------------------------------------------------------------
// chat/page.jsx — Member Chat, its own page (Nov 2026: Siam asked for a
// separate chat box, not a small card buried in the Community sidebar).
// Member list on one side, one-to-one conversation on the other — the
// picked member comes from ?with=<id>. Members only: the viewer must be
// logged in and enrolled (same gate as the Community); everyone else
// sees the locked preview. Gated page: noindex.
// ---------------------------------------------------------------------------
import { redirect } from "next/navigation";
import { getDb } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { canEnterCommunity } from "../../lib/access.js";
import LockedPreview from "../../components/LockedPreview.jsx";
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

  // Members only — same gate as the Community itself.
  if (!user) redirect("/login?next=/chat");
  if (!canEnterCommunity(user.id)) {
    return (
      <div className="wrap section">
        <h1 style={{ fontSize: 36 }}>Member <span className="amber">Chat</span></h1>
        <LockedPreview
          title="🔒 Members-Only Chat"
          text="Member chat is only for members who have purchased a course or a service. Enroll in any program to unlock the Community and chat one-to-one with other members."
          unlocks="Unlocks with: any enrollment (any course or service)"
          buttons={[
            { href: "/enroll/forex-premium-course", label: "Enroll — Premium Course $250", style: "btn-amber" },
            { href: "/enroll/premium-live-trade-support", label: "Join Live Trade — Free", style: "btn-dark" },
          ]}
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
      <h1 style={{ fontSize: 36 }}>Member <span className="amber">Chat</span></h1>
      <p className="muted">
        Talk one-to-one with other members. Pick a member on the left — your conversation opens on the right.
        The Mentor Special Chat stays inside the Community page.
      </p>
      <ChatRoom members={members} meId={user.id} peerId={peerId} />
    </div>
  );
}
