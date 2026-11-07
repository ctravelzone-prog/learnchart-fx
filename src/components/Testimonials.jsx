// ---------------------------------------------------------------------------
// Testimonials.jsx — "See More" loads more testimonial cards (client
// component: only the show-more toggle needs JavaScript). All names and
// texts are [Placeholder] until Siam provides real student reviews.
// ---------------------------------------------------------------------------
"use client";
import { useState } from "react";

export default function Testimonials({ items }) {
  // Show 3 cards first; See More reveals the rest.
  const [shown, setShown] = useState(3);
  const visible = items.slice(0, shown);
  return (
    <div>
      <div className="grid-3">
        {visible.map((t, i) => (
          <div className="card" key={i}>
            <div className="post-head">
              <span className="avatar">{(t.name || "S").replace(/[^A-Za-z]/g, "").slice(0, 1) || "S"}</span>
              <div>
                <strong>{t.name}</strong>
                <div className="small muted">✓ Verified</div>
                <div className="small muted">STUDENT AT · {t.program}</div>
              </div>
            </div>
            <p className="muted">“{t.text}”</p>
            <div className="amber">★★★★★</div>
          </div>
        ))}
      </div>
      {shown < items.length ? (
        <div className="center" style={{ marginTop: 20 }}>
          <button type="button" className="btn btn-dark" onClick={() => setShown(items.length)}>
            See More
          </button>
        </div>
      ) : null}
    </div>
  );
}
