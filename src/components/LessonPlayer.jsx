// ---------------------------------------------------------------------------
// LessonPlayer.jsx — the course-videos player (design's .yt-player).
// Shows the design's lesson cover photo with the lesson title, a
// "YouTube · Unlisted" badge and a play button. Clicking play:
//   - locked (not unlocked)  -> shows "locked — enter your Course Key" note
//   - unlocked + real video ID -> loads the real YouTube Unlisted embed
//   - unlocked + no video ID  -> shows the placeholder note (ID pending)
// It NEVER plays a fake video and NEVER embeds any other video.
// ---------------------------------------------------------------------------
"use client";
import { useState } from "react";

export default function LessonPlayer({ title, position, youtubeId, unlocked }) {
  // "cover" = photo + play button; "playing" = real embed; "note" = placeholder/locked message.
  const [state, setState] = useState("cover");

  function onPlay() {
    if (!unlocked) {
      setState("note");
      return;
    }
    if (youtubeId) {
      setState("playing");
      return;
    }
    setState("note");
  }

  if (state === "playing" && youtubeId) {
    return (
      <div className="video-wrap" style={{ marginBottom: 20 }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div>
      <div className="yt-player">
        <img src="/images/mentor-desk.webp" alt={`Lesson ${position} — ${title}`} />
        <div className="yt-shade" />
        <div className="yt-top">
          <b>Lesson {position} · {title}</b>
          <span className="badge">▶ YouTube · Unlisted</span>
        </div>
        <button type="button" className="play-btn" aria-label="Play the selected lesson video" onClick={onPlay}>
          ▶
        </button>
        <div className="yt-note">
          YouTube embed player — this lesson is hosted on YouTube (Unlisted) and plays inside this player.
        </div>
      </div>
      {state === "note" && !unlocked ? (
        <p className="muted small" style={{ marginTop: -8, marginBottom: 20 }}>
          🔒 Locked — enroll in the Forex Trading Premium Course and enter your Course Key to watch.
        </p>
      ) : null}
      {state === "note" && unlocked && !youtubeId ? (
        <p className="muted small" style={{ marginTop: -8, marginBottom: 20 }}>
          ▶ YouTube embed player — video ID is [Placeholder — Siam to provide the Unlisted YouTube ID for this lesson].
        </p>
      ) : null}
    </div>
  );
}
