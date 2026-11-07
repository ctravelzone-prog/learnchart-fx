// ---------------------------------------------------------------------------
// Countdown.jsx — the "Next Batch" countdown on the home hero.
// Client component: ticks every second toward SITE.nextBatchDate.
// ---------------------------------------------------------------------------
"use client";
import { useEffect, useState } from "react";

function parts(target) {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

export default function Countdown({ target, label }) {
  const [t, setT] = useState(() => parts(target));
  useEffect(() => {
    const id = setInterval(() => setT(parts(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  const box = (n, word) => (
    <div className="cd-box"><b>{String(n).padStart(2, "0")}</b><span>{word}</span></div>
  );
  return (
    <div>
      <p className="small" style={{ marginBottom: 6 }}><strong>{label}</strong></p>
      <div className="countdown">
        {box(t.d, "Days")}{box(t.h, "Hours")}{box(t.m, "Mins")}{box(t.s, "Secs")}
      </div>
    </div>
  );
}
