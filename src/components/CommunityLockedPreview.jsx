// ---------------------------------------------------------------------------
// CommunityLockedPreview.jsx — the locked preview for EVERY Community
// surface (feed, Special Chat, Create, Member Chat, member profiles).
// PAID-ONLY (Nov 2026, Siam's order): only an active PAID enrollment
// (Forex Trading Premium $250 or Private Live Trade $200/month) opens
// the Community. A free Trading Consultation enrollment alone does NOT
// open it — it opens only the Consultation area.
//
// The preview is NEVER blank and NEVER a silent redirect. It always
// says exactly which paid programs unlock the area, and:
//   - 'none' (never had a paid enrollment — e.g. Consultation-only or
//     no enrollment): the paid-member lock with enroll buttons.
//   - 'expired' (the student's Private Live Trade subscription ran
//     out): the expiry date is named and a Renew button goes straight
//     to the enroll page — in addition to the paid-member wording.
// The pill-nav Community link stays visible for everyone; clicking it
// lands here, so the student is told why, not shut out silently.
// ---------------------------------------------------------------------------
import LockedPreview from "./LockedPreview.jsx";

// SQLite stores datetimes as UTC "YYYY-MM-DD HH:MM:SS" — parse as UTC
// so the expiry day shown is the real one, not a day off.
function fmtSqlite(s) {
  return new Date(String(s).replace(" ", "T") + "Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// access: the object from getCommunityAccessState(userId) —
// { state: "open" } | { state: "expired", expiredAt, courseSlug, courseTitle }
// | { state: "none" }. description: what this area is, e.g. "The Premium
// Live Trade community — feed, posts, likes, comments, member chat and
// the Mentor Special Chat".
export default function CommunityLockedPreview({ access, description }) {
  const unlocks = "Unlocks with: Forex Trading Premium ($250) or Private Live Trade ($200/month)";
  if (access?.state === "expired") {
    return (
      <LockedPreview
        title="🔒 Your Private Live Trade subscription expired"
        text={`Your ${access.courseTitle || "Private Live Trade"} subscription expired on ${fmtSqlite(access.expiredAt)} — your Community access stopped with it. ${description} is only for paid members: renew your subscription (or enroll in Forex Trading Premium) to get back in.`}
        unlocks={unlocks}
        buttons={[
          { href: "/enroll/private-live-trade", label: "Renew — Private Live Trade $200/month", style: "btn-amber" },
          { href: "/enroll/forex-premium-course", label: "Enroll — Premium Course $250", style: "btn-dark" },
        ]}
      />
    );
  }
  return (
    <LockedPreview
      title="🔒 Members-Only Community"
      text={`${description} is only for paid members: Forex Trading Premium ($250) or Private Live Trade ($200/month). A Trading Consultation enrollment does not open the Community — it opens only the Consultation area.`}
      unlocks={unlocks}
      buttons={[
        { href: "/enroll/forex-premium-course", label: "Enroll — Premium Course $250", style: "btn-amber" },
        { href: "/enroll/private-live-trade", label: "Join Private Live Trade — $200/month", style: "btn-dark" },
      ]}
    />
  );
}
