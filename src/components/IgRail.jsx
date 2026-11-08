// ---------------------------------------------------------------------------
// IgRail — the Instagram left rail for the Community (shared by the feed
// page and the Create page, so both show the same navigation). Only real
// features are linked: Home, Community, Special Chat, Messages (/chat),
// Create, Profile, More — no Search, Explore/Reels or Notifications
// (they don't exist). `active` marks the current page (amber).
// ---------------------------------------------------------------------------
import Link from "next/link";

export default function IgRail({ active, me }) {
  return (
    <aside className="ig-rail">
      <Link href="/" className="ig-rail-logo" aria-label="LearnChart FX — Home">
        <span className="mark">LC</span>
        <span className="name">LEARNCHART <span>FX</span></span>
      </Link>
      <Link href="/" className="ig-rail-item"><span className="ic">⌂</span><span className="lbl">Home</span></Link>
      <Link href="/community" className={`ig-rail-item ${active === "community" ? "active" : ""}`} aria-current={active === "community" ? "page" : undefined}><span className="ic">▦</span><span className="lbl">Community</span></Link>
      <Link href="/community#special-chat" className="ig-rail-item"><span className="ic">⭐</span><span className="lbl">Special Chat</span></Link>
      <Link href="/chat" className="ig-rail-item"><span className="ic">✈</span><span className="lbl">Messages</span></Link>
      <Link href="/community/create" className={`ig-rail-item ${active === "create" ? "active" : ""}`} aria-current={active === "create" ? "page" : undefined}><span className="ic">＋</span><span className="lbl">Create</span></Link>
      <Link href={`/members/${me.id}`} className="ig-rail-item">
        <span className="avatar">{me.profile_pic ? <img src={me.profile_pic} alt={me.name} /> : me.name[0]}</span>
        <span className="lbl">Profile</span>
      </Link>
      <div className="ig-rail-spacer" />
      <Link href="/profile" className="ig-rail-item"><span className="ic">☰</span><span className="lbl">More</span></Link>
    </aside>
  );
}
