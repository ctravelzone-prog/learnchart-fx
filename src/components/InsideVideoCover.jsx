// ---------------------------------------------------------------------------
// InsideVideoCover.jsx — "Inside LearnChart FX" video cover (home, Section 9).
// Shows the design's studio cover photo with a play button. Clicking the
// play button NEVER plays a fake video and NEVER embeds any other
// channel's video — it only reveals the placeholder state (the real
// YouTube video ID is still pending from Siam). When the ID is provided,
// the parent swaps this cover for the real YouTube embed.
// ---------------------------------------------------------------------------
"use client";
import { useState } from "react";

export default function InsideVideoCover() {
  // false = cover + play button; true = placeholder note shown instead.
  const [showNote, setShowNote] = useState(false);

  return (
    <div>
      <div className="inside-cover">
        <img src="/images/mentor-studio.webp" alt="Inside LearnChart FX — mentor recording a lesson in the studio" loading="lazy" />
        <div className="cover-shade" />
        {!showNote ? (
          <button type="button" className="play-btn" aria-label="Play the Inside LearnChart FX video" onClick={() => setShowNote(true)}>
            ▶
          </button>
        ) : null}
      </div>
      {showNote ? (
        <p className="muted center" style={{ marginTop: 14 }}>
          [Placeholder — the Inside LearnChart FX video is not uploaded yet. Add the Unlisted YouTube video ID and it will play here.]
        </p>
      ) : null}
    </div>
  );
}
