// ---------------------------------------------------------------------------
// live-room/page.jsx — Live Room (prompt Section 18). Gate (server-side):
// Premium Live Trade Support enrollment ONLY. Forex course alone does NOT
// open it; Consultation alone does NOT open it. The locked preview says
// exactly that. Streaming provider is [Placeholder — Siam to confirm].
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getSessionUser } from "../../lib/auth.js";
import { canEnterLiveRoom } from "../../lib/access.js";
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

  if (!user || !canEnterLiveRoom(user.id)) {
    return (
      <div className="wrap section">
        <p className="muted small">HOME › LIVE ROOM</p>
        <h1 style={{ fontSize: 36 }}>Live <span className="amber">Room</span></h1>
        <LockedPreview
          title="🔒 Live Room — Premium Live Trade Support Only"
          text="The Live Room is part of Premium Live Trade Support. You can only join it after you purchase / enroll in Premium Live Trade Support."
          unlocks="⚠️ Buying only the Forex Trading Premium Course does not unlock the Live Room."
          buttons={[
            { href: "/enroll/premium-live-trade-support", label: "Enroll in Premium Live Trade Support — Free", style: "btn-amber" },
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
      <p><span className="badge badge-green">🔓 Live Room unlocked</span> <span className="muted small">Your Premium Live Trade Support enrollment gives you full access to every live session below.</span></p>

      <div className="card">
        <div className="stage-img">
          <img src="/images/mentor-studio.webp" alt="Mentor broadcasting live from the trading studio with a large candlestick chart behind him" />
          <span className="badge badge-amber stage-badge">NEXT LIVE</span>
          <div className="stage-foot">
            <div>
              <b>Premium Live Trade — Daily Sessions</b>
              <div className="small muted">Siam Chowdhury &amp; Rex Mizan · live market analysis</div>
            </div>
          </div>
        </div>
        <h2 style={{ marginTop: 16 }}>Premium Live Trade — Daily Sessions</h2>
        <p className="muted">Siam Chowdhury &amp; Rex Mizan · live market analysis</p>
        <div className="alert alert-info">
          Live stream provider: <strong>{getSingleSetting("live_stream_provider", LIVE_STREAM_PROVIDER)}</strong> — the live player will appear here once Siam confirms the streaming provider.
        </div>
        <p>✅ You are in the live room. Ask your questions in the Mentor Special Chat inside the Community and use @Mentor so they get picked up live.</p>
        <Link href="/community" className="btn btn-amber">Open Mentor Special Chat →</Link>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>📅 Regular live schedule (Dhaka time)</h3>
        <ul className="check-list">
          <li><strong>MON – FRI · London session live</strong> — daily bias &amp; gold plan · 3:30 PM – 5:30 PM · market open analysis</li>
          <li><strong>MON – FRI · New York session live</strong> — premium live trade · 7:30 PM – 10:30 PM · live entries, management and Q&amp;A</li>
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
