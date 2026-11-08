// ---------------------------------------------------------------------------
// mentors/page.jsx — Mentors (prompt Section 12). FULLY OPEN: any visitor
// sees both mentors before any purchase, with no login wall. No gate is
// checked here on purpose. Photos/bios/tags are [Placeholder]; no profit
// claims, earnings figures or win-rate numbers for either mentor.
// ---------------------------------------------------------------------------
import { getMentorsList } from "../../lib/settings.js";
import { getPageContent } from "../../lib/page-content.js";

export const metadata = {
  title: "Mentors — LearnChart FX",
  description: "Meet your mentors — Siam Chowdhury and Rex Mizan of LearnChart FX.",
};

export default function MentorsPage() {
  // Mentor content is admin-editable (database first, config fallback).
  const mentors = getMentorsList();
  // Page heading + intro: /admin/pages, merged over the defaults.
  const pc = getPageContent("mentors");
  return (
    <div className="wrap section">
      <p className="muted small">HOME › MENTORS</p>
      <h1 style={{ fontSize: 40 }}>
        {pc.main.heading_start} <span className="amber">{pc.main.heading_highlight}</span>
      </h1>
      <p className="muted">{pc.main.intro}</p>
      <p><span className="badge badge-green">{pc.main.open_badge}</span></p>
      <p className="muted small">
        {pc.main.open_note}
      </p>

      <div className="grid-2" style={{ marginTop: 24 }}>
        {mentors.map((m) => (
          <div className="card" key={m.id}>
            <span className="badge badge-amber">{m.badge}</span>
            {/* Mentor photo: a DESIGN STAND-IN from the UI/UX design file
                (AI-generated stand-in portrait), NOT a real photo of the
                mentor — replace with the real photo when Siam provides it. */}
            {m.photo ? (
              <div className="mentor-photo" style={{ marginTop: 14 }}>
                <img src={m.photo} alt={`${m.name}, mentor at LearnChart FX`} />
              </div>
            ) : null}
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
          </div>
        ))}
      </div>
    </div>
  );
}
