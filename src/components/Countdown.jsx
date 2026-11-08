// ---------------------------------------------------------------------------
// Countdown.jsx — the "Next Batch" countdown on the home hero.
// Client component: ticks every second toward the next-batch date.
// Renders the design's flip-number boxes: two yellow digit tiles per
// unit (Days / Hours / Mins / Secs) — no card or box around them.
// The `label` prop is only the timer's aria-label (the design shows
// no label text above the digits).
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
  // One flip-digit group: two yellow tiles (tens + ones) + the unit label.
  const group = (n, word) => {
    const [a, b] = String(n).padStart(2, "0").split("");
    return (
      <div className="dgroup">
        <div className="drow"><span className="digit">{a}</span><span className="digit">{b}</span></div>
        <span className="dlab">{word}</span>
      </div>
    );
  };
  return (
    <div className="digits" role="timer" aria-label={label || "Countdown to the next batch"}>
      {group(t.d, "DAYS")}{group(t.h, "HOURS")}{group(t.m, "MINS")}{group(t.s, "SECS")}
    </div>
  );
}
