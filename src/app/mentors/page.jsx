// ---------------------------------------------------------------------------
// mentors/page.jsx — Mentors (prompt Section 12). FULLY OPEN: any visitor
// sees both mentors before any purchase, with no login wall. No gate is
// checked here on purpose. Photos/bios/tags are [Placeholder]; no profit
// claims, earnings figures or win-rate numbers for either mentor.
// ---------------------------------------------------------------------------
import { MENTORS } from "../../lib/config.js";

export const metadata = {
  title: "Mentors — LearnChart FX",
  description: "Meet your mentors — Siam Chowdhury and Rex Mizan of LearnChart FX.",
};

export default function MentorsPage() {
  return (
    <div className="wrap section">
      <p className="muted small">HOME › MENTORS</p>
      <h1 style={{ fontSize: 40 }}>
        Meet Your <span className="amber">Mentors</span>
      </h1>
      <p className="muted">The two traders who teach the course, run the live room and answer you in the community.</p>
      <p><span className="badge badge-green">🔓 Open to everyone</span></p>
      <p className="muted small">
        This Mentors section is public — any visitor can read it, with no purchase, enrollment or login needed.
      </p>

      <div className="grid-2" style={{ marginTop: 24 }}>
        {MENTORS.map((m) => (
          <div className="card" key={m.id}>
            <span className="badge badge-amber">{m.badge}</span>
            <div style={{ display: "flex", gap: 14, marginTop: 14, alignItems: "center" }}>
              <span className="avatar" style={{ width: 72, height: 72, fontSize: 26 }}>
                {m.name.split(" ").map((w) => w[0]).join("")}
              </span>
              <div>
                <h2>{m.name}</h2>
                <p className="muted small" style={{ margin: 0 }}>{m.title}</p>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 14 }}>{m.bio}</p>
            <div>
              {m.focusTags.map((t) => (<span className="chip" key={t}>{t}</span>))}
            </div>
            <ul className="check-list">
              {m.points.map((p) => (<li key={p}>{p}</li>))}
            </ul>
            <p className="small muted">[Placeholder — mentor photo]</p>
          </div>
        ))}
      </div>
    </div>
  );
}
