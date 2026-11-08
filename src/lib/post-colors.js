// ---------------------------------------------------------------------------
// post-colors.js — the "Aa" background palette for TEXT-ONLY posts
// (Nov 2026, Facebook Create Post modal). The modal offers these colors;
// the post card renders a text-only post on the chosen background.
// The key is what the posts table stores (bg_color); the css is what
// renders. The API route validates every submitted key against this
// list — a value not here is never stored. '' / 'none' = no background.
// Only text-only posts (no photo, no Drive video) ever show a color.
// ---------------------------------------------------------------------------
export const BG_COLORS = [
  { key: "none", label: "No background", css: "" },
  { key: "midnight", label: "Midnight blue", css: "linear-gradient(135deg,#1e3a8a,#3b82f6)" },
  { key: "plum", label: "Plum", css: "linear-gradient(135deg,#581c87,#a855f7)" },
  { key: "crimson", label: "Crimson", css: "linear-gradient(135deg,#7f1d1d,#ef4444)" },
  { key: "forest", label: "Forest", css: "linear-gradient(135deg,#14532d,#22c55e)" },
  { key: "sunset", label: "Sunset", css: "linear-gradient(135deg,#7c2d12,#f97316)" },
  { key: "rose", label: "Rose", css: "linear-gradient(135deg,#881337,#f472b6)" },
  { key: "teal", label: "Teal", css: "linear-gradient(135deg,#134e4a,#14b8a6)" },
];

// A key is a real background only when it is in the list and not 'none'.
export function isBgColorKey(key) {
  return BG_COLORS.some((c) => c.key === key && c.key !== "none");
}

// The CSS background for a stored key ('' for 'none' / unknown keys).
export function bgCssFor(key) {
  const found = BG_COLORS.find((c) => c.key === key);
  return found ? found.css : "";
}
