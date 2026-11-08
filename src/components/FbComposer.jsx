// ---------------------------------------------------------------------------
// FbComposer.jsx — the Facebook composer (Nov 2026, Siam's screenshots).
// The bar: own avatar + "What's on your mind, <FirstName>?" + three
// buttons below a divider — Live video (red camera → /live-room, the
// site's live video area, gated as usual), Photo/video (green image →
// /community/create Post tab), Reel (pink reel → /community/create with
// the Drive video link focused — a video post via Drive link; we have
// no short-video Reels feed, so this is the honest mapping). No dead
// buttons: no Live-video/Feeling/Location buttons exist beyond these
// three, and each one goes to a real destination.
// Clicking the text field opens the Create Post MODAL (Facebook style):
// header "Create post" + X; author row (avatar + name + audience pill
// "Community" with a globe — our posts are visible to paid Community
// members only, never mislabelled "Public"); textarea "What's on your
// mind?"; "Aa" palette (background colors for TEXT-ONLY posts —
// stored with the post, rendered only when the post has no photo);
// emoji picker (inserts into the text); "Add to your post" row with
// only real actions — Photo/video (attach a photo), Video (reveals
// the Drive video link field), "..." (the full /community/create
// page). No tag-people, feeling, location or video-call buttons, and
// no AI label pill — we have none of those features. Bottom button:
// "Next" is greyed out while the post is empty (no text, no photo,
// no Drive link); with content it goes to a confirm step — "Posting
// to Community (paid members)" + a Post button that publishes.
// Posting returns to where the user came from (returnTo: /community
// or /profile) with the new post at the top. Used on /community and
// on /profile with identical behavior. Both steps live inside ONE
// form (the edit step is hidden, not unmounted, on confirm — so the
// chosen photo and text are still in the form when Post submits).
// THE GATE LIVES IN THE MODAL (Nov 2026 fix): the composer bar shows
// on /profile for EVERY signed-in user — Siam ordered it there with
// no exception for free users — but the modal enforces the paid-only
// Community gate at post time. canPost=false (no active paid
// enrollment — Forex $250 or unexpired Private Live Trade $200/month)
// shows the paid-member lock inside the modal instead of the compose
// form: "Posting to the Community is for paid members" + buttons to
// Courses (and Renew, when a subscription lapsed) + Close. Posting is
// refused server-side too (/api/community/posts — canEnterCommunity),
// so the modal lock is never the only check. On /community the
// composer only renders for paid users, so canPost defaults to true
// and that call site needs no change.
// ---------------------------------------------------------------------------
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BG_COLORS, bgCssFor } from "../lib/post-colors.js";

// Small real emoji picker — a fixed set of common emojis; tapping one
// inserts it at the cursor in the text area.
const EMOJIS = [
  "😀", "😂", "😍", "😎", "🤔", "😢", "😡", "👍", "👏", "🙏",
  "🔥", "💪", "🎯", "📈", "📉", "💰", "💵", "🚀", "⭐", "✅",
  "❤️", "💛", "💚", "💙", "🎉", "🙌", "👀", "💡",
];

// SQLite stores datetimes as UTC "YYYY-MM-DD HH:MM:SS" — parse as UTC
// so the expiry day shown is the real one, not a day off.
function fmtSqlite(s) {
  return new Date(String(s).replace(" ", "T") + "Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function FbComposer({ me, returnTo, canPost = true, accessState = { state: "open" } }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("edit"); // 'edit' | 'confirm'
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(null); // File
  const [photoPreview, setPhotoPreview] = useState(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [showDrive, setShowDrive] = useState(false);
  const [bgColor, setBgColor] = useState("none");
  const [showPalette, setShowPalette] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const textRef = useRef(null);

  const firstName = String(me.name || "there").split(" ")[0];
  const hasPhoto = !!photo;
  const hasDrive = driveUrl.trim().length > 0;
  const hasContent = text.trim().length > 0 || hasPhoto || hasDrive;
  // Background colors only make sense for text-only posts — a photo
  // or Drive video clears the choice (the server ignores it too).
  const bgDisabled = hasPhoto || hasDrive;

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // The create-page links carry return_to so posting from the profile
  // composer comes back to /profile; from the community it is /community.
  const createHref = returnTo === "/profile" ? "/community/create?return_to=/profile" : "/community/create";
  const reelHref =
    returnTo === "/profile"
      ? "/community/create?return_to=/profile&focus=drive"
      : "/community/create?focus=drive";

  function onPickPhoto(e) {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setPhoto(f);
      setPhotoPreview(URL.createObjectURL(f));
      setBgColor("none");
      setShowPalette(false);
    } else {
      setPhoto(null);
      setPhotoPreview(null);
    }
  }

  function insertEmoji(emoji) {
    const el = textRef.current;
    if (!el) { setText((t) => t + emoji); return; }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    // Put the cursor back right after the inserted emoji.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  function pickColor(key) {
    setBgColor(key);
    setShowPalette(false);
    if (textRef.current) textRef.current.focus();
  }

  function closeModal() {
    setOpen(false);
    setStep("edit");
    setShowPalette(false);
    setShowEmoji(false);
  }

  return (
    <>
      {/* The composer bar — Facebook style. */}
      <div className="fb-composer">
        <div className="fb-composer-top">
          <span className="avatar">
            {me.profile_pic ? <img src={me.profile_pic} alt={me.name} /> : me.name[0]}
          </span>
          <button type="button" className="fb-composer-prompt" onClick={() => setOpen(true)}>
            What&apos;s on your mind, {firstName}?
          </button>
        </div>
        <div className="fb-composer-btns">
          <Link href="/live-room" className="fb-composer-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#f02849" aria-hidden="true"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" /></svg>
            Live video
          </Link>
          <Link href={createHref} className="fb-composer-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#45bd62" aria-hidden="true"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-9 14-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
            Photo/video
          </Link>
          <Link href={reelHref} className="fb-composer-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#f5533d" aria-hidden="true"><path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-3 14-4-3 4-3v6z" /></svg>
            Reel
          </Link>
        </div>
      </div>

      {/* The Create Post modal. */}
      {open ? (
        <div className="fb-modal-overlay" onClick={closeModal}>
          <div className="fb-modal" role="dialog" aria-label="Create post" onClick={(e) => e.stopPropagation()}>
            <div className="fb-modal-head">
              <h2>Create post</h2>
              <button type="button" className="fb-modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            {/* PAID-MEMBER LOCK (the gate at post time): the composer bar
                shows for every signed-in user, but a user with no active
                paid enrollment gets this lock inside the modal instead of
                the compose form — "Posting to the Community is for paid
                members" + Courses/Renew + Close. A lapsed subscription
                names its expiry date and offers Renew, like every other
                Community locked preview. The server refuses the post
                too, so this is never the only check. */}
            {!canPost ? (
              <div className="fb-modal-lock" style={{ textAlign: "center", padding: "8px 4px 4px" }}>
                <p style={{ fontSize: 40, margin: "4px 0" }}>🔒</p>
                <h3 style={{ margin: "0 0 8px" }}>Posting to the Community is for paid members</h3>
                {accessState?.state === "expired" ? (
                  <p className="muted">
                    Your {accessState.courseTitle || "Private Live Trade"} subscription expired on{" "}
                    <strong>{fmtSqlite(accessState.expiredAt)}</strong> — your Community access stopped with it.
                    Renew to post again.
                  </p>
                ) : (
                  <p className="muted">
                    Only paid members can post in the Community: Forex Trading Premium ($250) or Private Live
                    Trade ($200/month). A Trading Consultation enrollment opens only the Consultation area.
                  </p>
                )}
                <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
                  {accessState?.state === "expired" ? (
                    <Link href={`/enroll/${accessState.courseSlug || "private-live-trade"}`} className="btn btn-amber">
                      Renew — Private Live Trade $200/month →
                    </Link>
                  ) : null}
                  <Link href="/courses" className="btn btn-amber">Explore plans →</Link>
                  <button type="button" className="btn btn-dark" onClick={closeModal}>Close</button>
                </div>
              </div>
            ) : (
            <form action="/api/community/posts" method="post" encType="multipart/form-data">
              <input type="hidden" name="bg_color" value={bgColor === "none" ? "" : bgColor} />
              <input type="hidden" name="return_to" value={returnTo === "/profile" ? "/profile" : "/community"} />

              {/* EDIT STEP — hidden (not unmounted) on the confirm step,
                  so the photo + text stay in the form when Post submits. */}
              <div style={{ display: step === "edit" ? "block" : "none" }}>
                {/* Author row + audience pill (single real audience). */}
                <div className="fb-modal-author">
                  <span className="avatar">
                    {me.profile_pic ? <img src={me.profile_pic} alt={me.name} /> : me.name[0]}
                  </span>
                  <div>
                    <b>{me.name}</b>
                    <span className="fb-audience-pill" title="Visible to paid Community members only">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm7.9 6h-3.4a15.6 15.6 0 0 0-1.2-3.5A8.03 8.03 0 0 1 19.9 8zM12 4.1c.8 1 1.5 2.4 1.9 3.9h-3.8c.4-1.5 1.1-2.9 1.9-3.9zM4.1 8a8.03 8.03 0 0 1 4.6-3.5A15.6 15.6 0 0 0 7.5 8H4.1zM4.1 10h3.7c.1 1.4.4 2.7.9 3.9A8.1 8.1 0 0 1 4.1 10zm4.9 0h6c-.1 1.3-.5 2.7-1 3.9h-4c-.5-1.2-.9-2.6-1-3.9zm7.2 0h3.7a8.1 8.1 0 0 1-4.6 3.9c.5-1.2.8-2.5.9-3.9zM12 19.9c-.8-1-1.5-2.4-1.9-3.9h3.8c-.4-1.5-1.1-2.9-1.9-3.9zm-3.3-1.4a15.6 15.6 0 0 0 1.2 3.5 8.03 8.03 0 0 1-4.6-3.5h3.4zm7.9 0a8.03 8.03 0 0 1-4.6 3.5c.5-1.1.9-2.3 1.2-3.5h3.4z" /></svg>
                      Community
                    </span>
                  </div>
                </div>

                <textarea
                  ref={textRef}
                  name="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={5}
                  maxLength={5000}
                  className="fb-modal-textarea"
                  style={bgColor !== "none" ? { background: bgCssFor(bgColor), color: "#fff" } : undefined}
                />

                {/* Aa palette + emoji picker (toggled below the text). */}
                <div className="fb-modal-tools">
                  <button
                    type="button"
                    className="fb-tool-btn"
                    onClick={() => { setShowPalette((v) => !v); setShowEmoji(false); }}
                    disabled={bgDisabled}
                    title={bgDisabled ? "Backgrounds are for text-only posts" : "Add a background"}
                    aria-label="Add a background"
                  >
                    Aa
                  </button>
                  <button
                    type="button"
                    className="fb-tool-btn"
                    onClick={() => { setShowEmoji((v) => !v); setShowPalette(false); }}
                    aria-label="Add an emoji"
                  >
                    😊
                  </button>
                </div>
                {showPalette ? (
                  <div className="fb-palette">
                    {BG_COLORS.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        className={`fb-palette-swatch ${bgColor === c.key ? "selected" : ""}`}
                        style={c.css ? { background: c.css } : { background: "#262626" }}
                        onClick={() => pickColor(c.key)}
                        aria-label={c.label}
                        title={c.label}
                      />
                    ))}
                  </div>
                ) : null}
                {showEmoji ? (
                  <div className="fb-emoji-grid">
                    {EMOJIS.map((e) => (
                      <button key={e} type="button" onClick={() => insertEmoji(e)} aria-label={`Insert ${e}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                ) : null}

                {/* Attached photo preview. */}
                {photoPreview ? (
                  <div className="fb-modal-photo">
                    <img src={photoPreview} alt="Photo preview" />
                    <button type="button" className="fb-modal-photo-remove" onClick={() => { setPhoto(null); setPhotoPreview(null); }} aria-label="Remove photo">✕</button>
                  </div>
                ) : null}

                {/* Drive video link — revealed by the Video button. */}
                {showDrive ? (
                  <div className="field">
                    <label htmlFor="fb-drive">Google Drive video link</label>
                    <input
                      id="fb-drive"
                      name="drive_url"
                      type="url"
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/d/…/view"
                    />
                    <p className="small muted">
                      Videos: no direct upload — paste a Drive link and it plays inside your post.
                      Set the sharing to “Anyone with the link can view”.
                    </p>
                  </div>
                ) : null}

                {/* Add to your post — only real actions. */}
                <div className="fb-add-row">
                  <span>Add to your post</span>
                  <label className="fb-add-btn" htmlFor="fb-photo" title="Add a photo">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#45bd62" aria-hidden="true"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-9 14-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                    Photo/video
                    <input id="fb-photo" name="image" type="file" accept="image/*" onChange={onPickPhoto} style={{ display: "none" }} />
                  </label>
                  <button
                    type="button"
                    className="fb-add-btn"
                    onClick={() => setShowDrive((v) => !v)}
                    title="Add a Drive video link"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#f5533d" aria-hidden="true"><path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-3 14-4-3 4-3v6z" /></svg>
                    Video
                  </button>
                  <Link href={createHref} className="fb-add-btn" title="Open the full composer">
                    •••
                  </Link>
                </div>

                <button
                  type="button"
                  className="btn btn-amber fb-modal-next"
                  disabled={!hasContent}
                  onClick={() => setStep("confirm")}
                >
                  Next
                </button>
              </div>

              {/* CONFIRM STEP — "Posting to Community (paid members)". */}
              <div style={{ display: step === "confirm" ? "block" : "none" }}>
                <p>
                  <strong>Posting to Community</strong> <span className="muted">(paid members)</span>
                </p>
                {text.trim() ? <p className="fb-confirm-text">{text.trim().slice(0, 300)}{text.trim().length > 300 ? "…" : ""}</p> : null}
                {photoPreview ? <div className="fb-modal-photo"><img src={photoPreview} alt="Photo preview" /></div> : null}
                {hasDrive ? <p className="small muted">Video: Drive link attached.</p> : null}
                {bgColor !== "none" && !hasPhoto && !hasDrive ? (
                  <p className="small muted">Background: {BG_COLORS.find((c) => c.key === bgColor)?.label}.</p>
                ) : null}
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button type="button" className="btn btn-dark" onClick={() => setStep("edit")}>Back</button>
                  <button type="submit" className="btn btn-amber" style={{ flex: 1 }}>Post</button>
                </div>
              </div>
            </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
