// ---------------------------------------------------------------------------
// LockedPreview.jsx — the locked state for gated areas (prompt Section 6).
// A locked area is NEVER a blank page or a silent redirect: the user sees
// what the area is, exactly which enrollment unlocks it, and a button to
// that course/service. The server block happens in the page itself —
// this component is only the visible explanation.
// ---------------------------------------------------------------------------
import Link from "next/link";

export default function LockedPreview({ title, text, unlocks, buttons }) {
  return (
    <div className="locked">
      <div className="lock-icon">🔒</div>
      <h2>{title}</h2>
      <p>{text}</p>
      {unlocks ? <p><strong className="amber">{unlocks}</strong></p> : null}
      <div className="actions">
        {(buttons || [{ href: "/courses", label: "See All Programs", style: "btn-dark" }]).map((b) => (
          <Link key={b.href + b.label} href={b.href} className={`btn ${b.style || "btn-amber"}`}>{b.label}</Link>
        ))}
      </div>
    </div>
  );
}
