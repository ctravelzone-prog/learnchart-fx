// ---------------------------------------------------------------------------
// live-room/page.jsx — Live Room (prompt Section 18). Gate (server-side):
// Private Live Trade enrollment ONLY. Forex course alone does NOT
// open it; Consultation alone does NOT open it. The locked preview says
// exactly that. Streaming provider is [Placeholder — Siam to confirm].
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getSessionUser } from "../../lib/auth.js";
import { getLiveRoomAccessState } from "../../lib/access.js";
import { LIVE_STREAM_PROVIDER } from "../../lib/config.js";
import { getSingleSetting } from "../../lib/settings.js";
import LockedPreview from "../../components/LockedPreview.jsx";

export const metadata = {
  title: "Live Room — LearnChart FX",
  description: "Watch Siam Chowdhury and Rex Mizan analyse and trade the live market.",
  robots: { index: false, follow: false },
};

export default async function LiveRoomPage() {
  const user = await getSessionUser();
  const access = getLiveRoomAccessState(user?.id);

  if (access.state === "expired") {
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

  if (access.state !== "open") {
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

  return (
    <div className="wrap section">
      <p className="muted small">HOME › LIVE ROOM</p>
      <h1 style={{ fontSize: 36 }}>Live <span className="amber">Room</span></h1>
      <p className="muted">
        Watch Siam Chowdhury and Rex Mizan analyse and trade the live market — entries, stop loss and targets explained as they happen.
      </p>
      <p><span className="badge badge-green">🔓 Live Room unlocked</span> <span className="muted small">Your Private Live Trade enrollment gives you full access to every live session below.</span></p>
      {access.expiresAt ? (
        <p className="small muted">
          Monthly subscription — your access runs until{" "}
          <strong>{new Date(String(access.expiresAt).replace(" ", "T") + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</strong>.
          {" "}<Link href="/enroll/private-live-trade" className="amber">Renew →</Link>
        </p>
      ) : null}

      <div className="card">
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
          Live stream provider: <strong>{getSingleSetting("live_stream_provider", LIVE_STREAM_PROVIDER)}</strong> — the live player will appear here once Siam confirms the streaming provider.
        </div>
        <p>✅ You are in the live room. Ask your questions in the Mentor Special Chat and use @Mentor so they get picked up live.</p>
        <Link href="/community/special-chat" className="btn btn-amber">Open Mentor Special Chat →</Link>
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
