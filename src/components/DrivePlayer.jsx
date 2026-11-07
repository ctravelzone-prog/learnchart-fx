// ---------------------------------------------------------------------------
// DrivePlayer.jsx — the Google Drive video player inside a post.
// Lazy-loaded: the Drive iframe is created ONLY after the reader presses
// play, so a feed full of videos stays fast. The video streams from
// Google Drive — nothing is downloaded to this hosting. An "Open in
// Drive" link sits under the player as a fallback.
// ---------------------------------------------------------------------------
"use client";
import { useState } from "react";
import { driveEmbedUrl, driveViewUrl } from "../lib/drive.js";

export default function DrivePlayer({ fileId }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <div>
        <div className="video-wrap">
          <iframe
            src={driveEmbedUrl(fileId)}
            title="Google Drive video"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="small" style={{ marginTop: 6 }}>
          <a href={driveViewUrl(fileId)} target="_blank" rel="noopener noreferrer" className="amber">
            Open in Drive ↗
          </a>{" "}
          <span className="muted">· streamed from Google Drive</span>
        </p>
      </div>
    );
  }
  return (
    <div>
      <button
        type="button"
        className="btn btn-dark"
        style={{ width: "100%", padding: "34px 12px" }}
        onClick={() => setPlaying(true)}
      >
        ▶ Play Drive video
      </button>
      <p className="small" style={{ marginTop: 6 }}>
        <a href={driveViewUrl(fileId)} target="_blank" rel="noopener noreferrer" className="amber">
          Open in Drive ↗
        </a>{" "}
        <span className="muted">· streamed from Google Drive</span>
      </p>
    </div>
  );
}
