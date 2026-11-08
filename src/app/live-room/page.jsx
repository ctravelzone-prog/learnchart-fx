// ---------------------------------------------------------------------------
// live-room/page.jsx — Live Room (prompt Section 18). Gate (server-side):
// Private Live Trade enrollment ONLY. Forex course alone does NOT
// open it; Consultation alone does NOT open it. The locked preview says
// exactly that. An ADMIN session may also view the room (moderation
// preview — admins see the chat and can delete messages).
//
// DUAL-SOURCE LIVE (Nov 2026): the admin picks ONE live source in
// Admin → Live Settings — the own private server (Owncast HLS, truly
// private, 100+ students) or YouTube Live Unlisted (hidden, not locked).
// The player below is rendered ONLY for members who passed the gate,
// so a locked-out visitor never receives a video ID, stream URL or key.
// The live chat panel is private the same way (PLT members only).
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getSessionUser } from "../../lib/auth.js";
import { getAdminUser } from "../../lib/admin.js";
import { getLiveRoomAccessState } from "../../lib/access.js";
import { getLiveSettings } from "../../lib/settings.js";
import LockedPreview from "../../components/LockedPreview.jsx";
import HlsPlayer from "../../components/HlsPlayer.jsx";
import LiveChat from "../../components/LiveChat.jsx";

export const metadata = {
  title: "Live Room — LearnChart FX",
  description: "Watch Siam Chowdhury and Rex Mizan analyse and trade the live market.",
  robots: { index: false, follow: false },
};

export default async function LiveRoomPage() {
  const user = await getSessionUser();
  const access = getLiveRoomAccessState(user?.id);
  // Admin preview: an admin session may view the room (and moderate the
  // live chat) without a PLT enrollment. The gate itself is untouched —
  // this is a page-level preview, not a new way in for members.
  const admin = await getAdminUser();
  const isAdminView = !!admin && access.state !== "open";

  if (access.state === "expired" && !isAdminView) {
    // MONTHLY SUBSCRIPTION LAPSED (Nov 2026): the student HAD Private
    // Live Trade, but the 30 days ran out. Say so with the exact date
    // and offer Renew — not the generic "you never enrolled" lock.
    const expiredOn = new Date(String(access.expiredAt).replace(" ", "T") + "Z").toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
    return (
      <div className="wrap section">
        <p className="muted small">HOME › LIVE ROOM</p>
        <h1 style={{ fontSize: 36 }}>Live <span className="amber">Room</span></h1>
        <LockedPreview
          title="⏰ Your Private Live Trade subscription expired"
          text={`Your Private Live Trade subscription expired on ${expiredOn} and your Live Room access stopped. Renew to get back in — each payment gives you another 30 days.`}
          unlocks="Renewal is manual: pay again below. Nothing is ever charged automatically."
          buttons={[
            { href: `/enroll/${access.courseSlug || "private-live-trade"}`, label: "Renew Private Live Trade — $200/month", style: "btn-amber" },
            { href: "/courses", label: "See All Programs", style: "btn-dark" },
          ]}
        />
      </div>
    );
  }

  if (access.state !== "open" && !isAdminView) {
    return (
      <div className="wrap section">
        <p className="muted small">HOME › LIVE ROOM</p>
        <h1 style={{ fontSize: 36 }}>Live <span className="amber">Room</span></h1>
        <LockedPreview
          title="🔒 Live Room — Private Live Trade Only"
          text="The Live Room is part of Private Live Trade. You can only join it after you purchase / enroll in Private Live Trade."
          unlocks="⚠️ Buying only the Forex Trading Premium Course does not unlock the Live Room."
          buttons={[
            { href: "/enroll/private-live-trade", label: "Enroll in Private Live Trade — $200/month", style: "btn-amber" },
            { href: "/courses", label: "See All Programs", style: "btn-dark" },
          ]}
        />
      </div>
    );
  }

  // Dual-source live (Nov 2026): the admin picks ONE source in
  // Admin → Live Settings. Only the chosen source's player is rendered,
  // and only for members who passed the gate above.
  const live = getLiveSettings();
  const hlsUrl = live.source === "own" && live.owncastUrl ? `${live.owncastUrl}/hls/stream.m3u8` : "";
  const youtubeId = live.source === "youtube" ? live.youtubeLiveId : "";

  return (
    <div className="wrap section">
      <p className="muted small">HOME › LIVE ROOM</p>
      <h1 style={{ fontSize: 36 }}>Live <span className="amber">Room</span></h1>
      <p className="muted">
        Watch Siam Chowdhury and Rex Mizan analyse and trade the live market — entries, stop loss and targets explained as they happen.
      </p>
      <p><span className="badge badge-green">🔓 Live Room unlocked</span> <span className="muted small">Your Private Live Trade enrollment gives you full access to every live session below.</span></p>
      {isAdminView ? (
        <p className="small muted">👁️ Viewing as admin — members see this same room.</p>
      ) : null}
      {access.expiresAt ? (
        <p className="small muted">
          Monthly subscription — your access runs until{" "}
          <strong>{new Date(String(access.expiresAt).replace(" ", "T") + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>.
          {" "}<Link href="/enroll/private-live-trade" className="amber">Renew →</Link>
        </p>
      ) : null}

      <div className="card">
        {hlsUrl ? (
          <>
            <HlsPlayer src={hlsUrl} />
            <h2 style={{ marginTop: 16 }}>Private Live Trade — Daily Sessions</h2>
            <p className="muted">Siam Chowdhury &amp; Rex Mizan · live market analysis</p>
            <p className="small muted">Private live server — only members of this site can watch. HLS delay is roughly 10–30 seconds.</p>
          </>
        ) : youtubeId ? (
          <>
            <div className="live-player">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=0&rel=0`}
                title="Live Room — YouTube Live"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
              />
              <span className="badge badge-red live-badge">🔴 LIVE NOW</span>
            </div>
            <h2 style={{ marginTop: 16 }}>Private Live Trade — Daily Sessions</h2>
            <p className="muted">Siam Chowdhury &amp; Rex Mizan · live market analysis</p>
            <p className="small muted">YouTube Live (Unlisted) — hidden from search and the channel, shown here for members only.</p>
          </>
        ) : (
          <>
            <div className="stage-img">
              <img src="/images/mentor-studio.webp" alt="Mentor broadcasting live from the trading studio with a large candlestick chart behind him" />
              <span className="badge badge-amber stage-badge">NEXT LIVE</span>
              <div className="stage-foot">
                <div>
                  <b>Private Live Trade — Daily Sessions</b>
                  <div className="small muted">Siam Chowdhury &amp; Rex Mizan · live market analysis</div>
                </div>
              </div>
            </div>
            <h2 style={{ marginTop: 16 }}>Private Live Trade — Daily Sessions</h2>
            <p className="muted">Siam Chowdhury &amp; Rex Mizan · live market analysis</p>
            <div className="alert alert-info">
              No live right now — the mentors are offline. Check the schedule below for the next session.
            </div>
          </>
        )}
        <p>✅ You are in the live room. Ask your questions in the Mentor Special Chat and use @Mentor so they get picked up live.</p>
        <Link href="/community/special-chat" className="btn btn-amber">Open Mentor Special Chat →</Link>
      </div>

      {/* Live classroom chat — private, PLT members only, during the live. */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>💬 Live Chat</h3>
        <p className="muted small">Chat with the mentors and other members while the live is on. Private — only Private Live Trade members can see this chat.</p>
        <LiveChat userName={user?.name || "Admin"} userId={user?.id || 0} isAdmin={!!admin} canSend={!!user} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>📅 Regular live schedule (Dhaka time)</h3>
        <ul className="check-list">
          <li><strong>MON – FRI · London session live</strong> — daily bias &amp; gold plan · 3:30 PM – 5:30 PM · market open analysis</li>
          <li><strong>MON – FRI · New York session live</strong> — private live trade · 7:30 PM – 10:30 PM · live entries, management and Q&amp;A</li>
          <li><strong>SUNDAY · Weekly planning session</strong> — 9:00 PM · week-ahead levels and member chart reviews</li>
        </ul>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Inside the Live Room</h3>
        <ul className="check-list">
          <li>Real-time gold &amp; forex analysis with clear entry, stop-loss and take-profit levels.</li>
          <li>Daily trade setups and end-of-day market reviews with both mentors.</li>
          <li>Telegram live updates alongside the room, plus replays for members who miss a session.</li>
        </ul>
      </div>
    </div>
  );
}
