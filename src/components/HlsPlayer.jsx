// ---------------------------------------------------------------------------
// HlsPlayer.jsx — plays the own-server live stream (Owncast HLS) in the
// Live Room. Client component: hls.js is loaded only when this renders.
//
// Behaviour: tries the HLS manifest; while it loads, and whenever the
// manifest cannot be fetched (mentors are offline), it shows the offline
// state (stage image + "Not live right now") and retries automatically
// every 30s for a while, so a member who opens the page just before the
// mentors go live sees the stream appear. A manual Retry button is
// there too. Safari plays HLS natively (no hls.js needed there).
// The video is muted autoplay + controls: browsers block autoplay with
// sound, the member unmutes with the control bar.
// ---------------------------------------------------------------------------
"use client";
import { useEffect, useRef, useState } from "react";

const RETRY_MS = 30000;
const MAX_AUTO_RETRIES = 20;

export default function HlsPlayer({ src, poster }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const retryTimerRef = useRef(null);
  const safariCleanupRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | live | offline
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const video = videoRef.current;
      if (!video || !src) return;
      // Tear down any previous attempt.
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (safariCleanupRef.current) {
        safariCleanupRef.current();
        safariCleanupRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      // Safari / iOS: native HLS.
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        const onMeta = () => {
          if (!cancelled) setStatus("live");
        };
        const onErr = () => {
          if (!cancelled) setStatus("offline");
        };
        video.addEventListener("loadedmetadata", onMeta);
        video.addEventListener("error", onErr);
        safariCleanupRef.current = () => {
          video.removeEventListener("loadedmetadata", onMeta);
          video.removeEventListener("error", onErr);
        };
        try {
          await video.play().catch(() => {});
        } catch {}
        return;
      }

      // Everywhere else: hls.js (loaded on demand, not in the main bundle).
      const Hls = (await import("hls.js")).default;
      if (cancelled) return;
      if (!Hls.isSupported()) {
        setStatus("offline");
        return;
      }
      const hls = new Hls({
        // Live HLS: keep the buffer short so the member is close to live
        // (Owncast HLS delay is roughly 10–30 seconds already).
        maxBufferLength: 10,
        liveSyncDurationCount: 3,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (cancelled) return;
        setStatus("live");
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (cancelled || !data.fatal) return;
        hls.destroy();
        hlsRef.current = null;
        setStatus("offline");
      });
    }

    start();
    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (safariCleanupRef.current) {
        safariCleanupRef.current();
        safariCleanupRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, tries]);

  // Offline: retry automatically for a while (a member who opened the
  // page just before the mentors go live sees the stream appear).
  useEffect(() => {
    if (status !== "offline" || tries >= MAX_AUTO_RETRIES) return;
    retryTimerRef.current = setTimeout(() => setTries((t) => t + 1), RETRY_MS);
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, [status, tries]);

  function retryNow() {
    setStatus("loading");
    setTries((t) => t + 1);
  }

  if (status === "offline") {
    return (
      <div className="stage-img">
        <img src={poster || "/images/mentor-studio.webp"} alt="Trading studio — stream is offline right now" />
        <span className="badge badge-amber stage-badge">NOT LIVE NOW</span>
        <div className="stage-foot">
          <div>
            <b>Not live right now</b>
            <div className="small muted">The mentors are offline. Check the schedule below — the player appears here when they go live.</div>
          </div>
          <button type="button" className="btn btn-dark btn-sm" onClick={retryNow}>
            Retry →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="live-player">
      <video ref={videoRef} controls muted autoPlay playsInline preload="auto" />
      {status === "live" ? (
        <span className="badge badge-red live-badge">🔴 LIVE NOW</span>
      ) : (
        <span className="badge badge-amber live-badge">Connecting…</span>
      )}
    </div>
  );
}
