// ---------------------------------------------------------------------------
// consultation/page.jsx — Trading Consultation (prompt Section 18).
// Gate (server-side): Trading Consultation enrollment ONLY. No other
// course or service opens it. The service is marked Coming Soon /
// Developing, so the page says so honestly — it is not presented as
// instantly available. Provider is [Placeholder — Siam to confirm].
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getDb } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { canEnterConsultation } from "../../lib/access.js";
import { CONSULT_PROVIDER } from "../../lib/config.js";
import { getSingleSetting } from "../../lib/settings.js";
import LockedPreview from "../../components/LockedPreview.jsx";
import CopyRequest from "../../components/CopyRequest.jsx";

export const metadata = {
  title: "Trading Consultation — LearnChart FX",
  description: "A private space to discuss your trading and investing directly with a mentor, live on audio or video.",
  robots: { index: false, follow: false },
};

export default async function ConsultationPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const user = await getSessionUser();

  if (!user || !canEnterConsultation(user.id)) {
    return (
      <div className="wrap section">
        <p className="muted small">HOME › TRADING CONSULTATION</p>
        <h1 style={{ fontSize: 36 }}>Trading &amp; Investing <span className="amber">Consultation</span></h1>
        <LockedPreview
          title="🔒 Consultation — Trading Consultation Members Only"
          text="This section is visible only to members who purchased / enrolled in Trading Consultation."
          unlocks="⚠️ Buying only the Forex Premium Course or only Private Live Trade does not unlock Consultation."
          buttons={[
            { href: "/enroll/trading-consultation", label: "Enroll in Trading Consultation — Free", style: "btn-amber" },
            { href: "/courses", label: "See All Programs", style: "btn-dark" },
          ]}
        />
      </div>
    );
  }

  const myRequests = getDb()
    .prepare("SELECT * FROM consultation_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 5")
    .all(user.id);

  return (
    <div className="wrap section">
      <p className="muted small">HOME › TRADING CONSULTATION</p>
      <h1 style={{ fontSize: 36 }}>Trading &amp; Investing <span className="amber">Consultation</span></h1>
      <p className="muted">
        A private space to discuss your trading and investing directly with a mentor, live on audio or video.
      </p>
      <p>
        <span className="badge badge-green">🔓 Consultation unlocked</span>{" "}
        <span className="badge">Status: Developing / Coming Soon</span>
      </p>
      <div className="alert alert-info">
        This service is still <strong>Developing / Coming Soon</strong>. Your booking request below is saved and the
        mentor team will confirm your live audio/video slot. Audio/video provider: <strong>{getSingleSetting("consult_provider", CONSULT_PROVIDER)}</strong>
      </div>

      {sp?.booked === "1" ? (
        <div className="alert alert-ok">
          Your consultation request is ready. Copy it and send it to the mentor team — they will confirm your live audio/video slot.
        </div>
      ) : null}
      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}

      <div className="grid-2">
        <div className="card">
          <h3>Book your consultation</h3>
          <form action="/api/consultation" method="post">
            <div className="field">
              <label htmlFor="cq-topic">What do you want to discuss?</label>
              <select id="cq-topic" name="topic" required>
                <option value="">Choose a topic…</option>
                <option>Trade journal &amp; chart review</option>
                <option>Building my trading plan</option>
                <option>Risk management &amp; psychology</option>
                <option>Investing &amp; portfolio basics</option>
              </select>
            </div>
            <div className="field">
              <label>Session mode</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <label className="chip" style={{ cursor: "pointer" }}>
                  <input type="radio" name="mode" value="Video call" required style={{ width: "auto" }} /> 🎥 Video call — camera on · screen sharing for charts
                </label>
                <label className="chip" style={{ cursor: "pointer" }}>
                  <input type="radio" name="mode" value="Audio call" required style={{ width: "auto" }} /> 🎧 Audio call — voice only · charts shared in chat
                </label>
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="cq-date">Preferred date</label>
                <input id="cq-date" name="date" type="date" required />
              </div>
              <div className="field">
                <label htmlFor="cq-time">Preferred time (Dhaka)</label>
                <select id="cq-time" name="time" required>
                  <option value="">Choose…</option>
                  <option>12:30 PM</option>
                  <option>3:30 PM</option>
                  <option>6:30 PM</option>
                  <option>9:30 PM</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="cq-name">Your name</label>
              <input id="cq-name" name="name" required defaultValue={user.name} />
            </div>
            <div className="field">
              <label htmlFor="cq-note">Anything we should know? (optional)</label>
              <textarea id="cq-note" name="note" rows={3} placeholder="Your charts, your journal — anything that helps the mentor prepare." />
            </div>
            <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>Prepare My Consultation Request</button>
          </form>
        </div>

        <div>
          <div className="consult-media">
            <img src="/images/consultation-call.webp" alt="A student in a one-on-one video consultation with the mentor, charts open beside the laptop" loading="lazy" />
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>What you get</h3>
            <ul className="check-list">
              <li><strong>Your charts, your journal.</strong> Screen-share your trades and get a line-by-line review.</li>
              <li><strong>A plan you can follow.</strong> Leave with a written action plan — risk rules, session times and exact setups.</li>
              <li><strong>Investing questions welcome.</strong> Portfolio basics, position sizing and long-term planning.</li>
            </ul>
          </div>
          {myRequests.length > 0 ? (
            <div className="card">
              <h3>Your requests</h3>
              {myRequests.map((r) => {
                const details = `LearnChart FX consultation request — ${r.name}: ${r.topic} (${r.mode}) on ${r.preferred_date} at ${r.preferred_time} Dhaka. Note: ${r.note || "-"}`;
                return (
                  <div key={r.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 10 }}>
                    <strong>{r.topic}</strong> · {r.mode}
                    <div className="small muted">{r.preferred_date} at {r.preferred_time} (Dhaka)</div>
                    <div style={{ marginTop: 8 }}><CopyRequest details={details} /></div>
                  </div>
                );
              })}
            </div>
          ) : null}
          <p style={{ marginTop: 16 }}>
            <Link href="/community" className="btn btn-dark btn-sm">Ask in the Community →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
