// ---------------------------------------------------------------------------
// admin/live-settings — Live Room Settings (admin only). Picks which live
// source the Live Room shows, and holds the credentials for it.
//
// TWO SOURCES, admin picks one at a time:
//   (A) Own private server (Owncast) — OBS → RTMP ingest → HLS out.
//       Truly private: nothing on YouTube, 100+ students. The admin
//       streams from OBS; the site only PLAYS the HLS stream.
//   (B) YouTube Live Unlisted embed — admin goes live on YouTube Studio
//       / OBS, pastes the video ID here. Hidden from search / channel /
//       recommendations, but NOT locked: anyone with the link can watch.
//
// SECRET RULES (same as Payment Settings): the Owncast stream key is
// AES-encrypted at rest and this page NEVER shows the full key — only
// "Set — ends with XXXX" or "Not set". A key input left empty keeps the
// current value; a typed value replaces it; the "clear" checkbox
// deletes it. The key NEVER reaches the student-facing site.
// ---------------------------------------------------------------------------
import { requireAdmin } from "../../../lib/admin.js";
import { getLiveSettings, getOwncastStreamKey, maskSecret } from "../../../lib/settings.js";

export const metadata = { title: "Live Settings — Admin — LearnChart FX" };

// One secret field: masked state + password input + clear checkbox.
// The input is deliberately EMPTY on load — a browser must never hold
// the real value, and an empty submit means "keep current".
function SecretField({ name, label, hint, value, placeholder }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <p className="small muted" style={{ margin: "0 0 6px" }}>
        Current: <strong>{maskSecret(value)}</strong>
        {hint ? <> — {hint}</> : null}
      </p>
      <input
        id={name}
        name={name}
        type="password"
        autoComplete="off"
        placeholder={placeholder || "Leave empty to keep the current value"}
      />
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, fontSize: 13 }}>
        <input type="checkbox" name={`clear_${name}`} value="1" style={{ width: "auto" }} />
        Clear this value
      </label>
    </div>
  );
}

export default async function AdminLiveSettingsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const saved = sp?.saved || null;
  const error = sp?.error || null;
  const live = getLiveSettings();
  const streamKey = getOwncastStreamKey();
  // OBS ingest details for the own-server source. Owncast defaults:
  // RTMP ingest on port 1935, app path /live, HLS playlist /hls/stream.m3u8.
  const rtmpUrl = live.owncastUrl ? `${live.owncastUrl.replace(/^https?:\/\//, "rtmp://")}:1935/live` : "";

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Live Room Settings</h1>
      <p className="muted">
        Pick which live source the Live Room shows. Only one is live at a time — switch the
        source here and the player changes for every Private Live Trade member immediately.
        Students never see this page or the stream key.
      </p>
      {saved ? <div className="alert alert-ok">Saved — {saved} settings updated.</div> : null}
      {error === "bad-youtube" ? (
        <div className="alert">That YouTube link / ID was not recognised — paste a full watch URL (youtube.com/watch?v=…) or the 11-character video ID.</div>
      ) : null}
      {error === "bad-owncast" ? (
        <div className="alert">That Owncast server URL was not recognised — it must start with http:// or https://, e.g. https://live.learnchartfx.com</div>
      ) : null}

      {/* --- Live source + YouTube ID + Owncast URL --- */}
      <form action="/api/admin/live-settings" method="post">
        <input type="hidden" name="section" value="source" />
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>📺 Live source</h3>
          <div className="field">
            <label htmlFor="live-source">Which source is live in the Live Room?</label>
            <select id="live-source" name="source" defaultValue={live.source}>
              <option value="off">Off — no live right now (schedule + offline note)</option>
              <option value="own">
                {live.owncastUrl
                  ? "Own private server (Owncast) — truly private, 100+ students"
                  : "Own private server (Owncast) — needs the live server URL (separate server, buy later)"}
              </option>
              <option value="youtube">YouTube Live Unlisted — hidden, but not locked</option>
            </select>
          </div>

          <h3 style={{ marginTop: 20 }}>▶️ YouTube Live Unlisted</h3>
          <p className="muted small">
            Go live from YouTube Studio (or OBS → YouTube) as <strong>Unlisted</strong>, then paste the
            live link or video ID here. The stream will NOT appear in search, on the channel, or in
            recommendations — only the Live Room player shows it. Honest limit: anyone who gets the
            link can watch it, so this is hidden, not locked. For a truly private live, use the
            own-server source below.
          </p>
          <div className="field">
            <label htmlFor="youtube-id">YouTube live link or video ID</label>
            <input
              id="youtube-id"
              name="youtube_id"
              defaultValue={live.youtubeLiveId}
              placeholder="https://www.youtube.com/watch?v=… or 11-character ID"
              style={{ fontFamily: "monospace" }}
            />
          </div>
          <p className="small muted">
            Current: <strong>{live.youtubeLiveId ? live.youtubeLiveId : "Not set"}</strong>
          </p>

          <h3 style={{ marginTop: 20 }}>🖥️ Own private server (Owncast)</h3>
          <p className="muted small">
            The Owncast server runs on a <strong>separate live server you will buy later</strong> —
            it is NOT live now. The <code>live-server/</code> deploy pack in the repo has the install
            steps for that future server. When it is up, paste its public URL here and this source
            works with no code change. Students watch the HLS stream on the site; nothing ever
            goes to YouTube.
          </p>
          <div className="field">
            <label htmlFor="owncast-url">Owncast server URL</label>
            <input
              id="owncast-url"
              name="owncast_url"
              defaultValue={live.owncastUrl}
              placeholder="https://live.learnchartfx.com"
              style={{ fontFamily: "monospace" }}
            />
          </div>
          <p className="small muted">
            Current: <strong>{live.owncastUrl ? live.owncastUrl : "Not set"}</strong>
          </p>
          <button type="submit" className="btn btn-amber">Save Live Source</button>
        </div>
      </form>

      {/* --- Owncast stream key + OBS details --- */}
      <form action="/api/admin/live-settings" method="post">
        <input type="hidden" name="section" value="key" />
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>🔑 Owncast stream key (admin only)</h3>
          <p className="muted small">
            The key the Owncast server expects from OBS. Set the SAME key on the Owncast server
            first (its admin panel → Stream Keys), then paste it here. This key is encrypted at
            rest and never leaves the admin panel — students never see it.
          </p>
          <SecretField
            name="stream_key"
            label="Owncast stream key"
            hint="same key as on the Owncast server"
            value={streamKey}
            placeholder="Paste the Owncast stream key"
          />
          <button type="submit" className="btn btn-amber">Save Stream Key</button>
        </div>
      </form>

      {/* --- OBS ingest details (read-only, no secret) --- */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>🎥 OBS setup — own private server</h3>
        {rtmpUrl ? (
          <>
            <p className="muted small">In OBS → Settings → Stream → Service: Custom, then:</p>
            <div className="field">
              <label>Server (RTMP ingest)</label>
              <input readOnly value={rtmpUrl} style={{ fontFamily: "monospace" }} />
            </div>
            <p className="muted small">
              Stream key: the key saved above (it lives on the Owncast server — paste the same one
              in OBS). Video: 1920×1080, 30 fps, H.264, 2500–4500 Kbps, keyframe every 2 seconds,
              audio AAC 160 Kbps. When OBS is streaming, switch the source above to “Own private
              server” and the Live Room shows it (HLS delay is roughly 10–30 seconds).
            </p>
          </>
        ) : (
          <p className="muted small">
            Set the Owncast server URL above first — the OBS ingest address is built from it.
          </p>
        )}
        <h3 style={{ marginTop: 20 }}>▶️ OBS setup — YouTube Live Unlisted</h3>
        <p className="muted small">
          In YouTube Studio → Go Live → Stream: copy the Stream URL + Stream key into OBS
          (Settings → Stream → Service: YouTube), set the stream to <strong>Unlisted</strong>, start
          streaming, then paste the live link above and switch the source to “YouTube Live Unlisted”.
        </p>
      </div>
    </div>
  );
}
