// ---------------------------------------------------------------------------
// CommunityClient.jsx — the live chat areas inside the Community:
// the Mentor Special Chat (separate from the feed) and member-to-member
// chat. Polling every 5 seconds keeps both near-real-time with no
// external push service. Mentor messages carry the mentor mark.
// ---------------------------------------------------------------------------
"use client";
import { useEffect, useRef, useState } from "react";

function usePoll(url, intervalMs = 5000) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!url) return;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (alive) setData(json);
        }
      } catch { /* offline moment — next poll retries */ }
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => { alive = false; clearInterval(id); };
  }, [url, intervalMs]);
  return data;
}

export function SpecialChat() {
  const data = usePoll("/api/chat/special");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [data]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch("/api/chat/special", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setText("");
    setSending(false);
  }

  const messages = data?.messages || [];
  return (
    <div>
      <div className="chat-box" style={{ maxHeight: 320, overflowY: "auto" }}>
        {messages.length === 0 ? <p className="muted small">No messages yet — say hello, or mention @Mentor during a live session.</p> : null}
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.is_mentor ? "mentor-msg" : ""}`}>
            <div className="small">
              <strong>{m.author_name}</strong>{" "}
              {m.is_mentor ? <span className="mentor-tag">★ MENTOR</span> : null}
              <span className="muted"> · {new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div>{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="chat-input">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the special chat — @Mentor and the mentor answers live" maxLength={2000} />
        <button type="submit" className="btn btn-amber btn-sm" disabled={sending}>Send</button>
      </form>
      <p className="small muted">Mention @Mentor and the mentor answers live in this chat.</p>
    </div>
  );
}

export function MemberChat({ members, meId }) {
  const [peerId, setPeerId] = useState(members[0]?.id || null);
  const data = usePoll(peerId ? `/api/chat/member?with=${peerId}` : null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [data]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || sending || !peerId) return;
    setSending(true);
    await fetch("/api/chat/member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_user_id: peerId, text }),
    });
    setText("");
    setSending(false);
  }

  const peer = members.find((m) => m.id === peerId);
  const messages = data?.messages || [];
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`tab ${m.id === peerId ? "active" : ""}`}
            onClick={() => setPeerId(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>
      {!peer ? (
        <p className="muted small">No other members yet — member chat opens when another member joins.</p>
      ) : (
        <>
          <div className="chat-box" style={{ maxHeight: 260, overflowY: "auto" }}>
            {messages.length === 0 ? <p className="muted small">No messages with {peer.name} yet.</p> : null}
            {messages.map((m) => (
              <div key={m.id} className={`chat-msg ${m.from_user_id === meId ? "mine" : ""}`}>
                <div className="small muted">{m.from_name} · {new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                <div>{m.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="chat-input">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message ${peer.name}…`} maxLength={2000} />
            <button type="submit" className="btn btn-amber btn-sm" disabled={sending}>Send</button>
          </form>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// IgShareButton — Instagram-style share (paper-plane SVG outline).
// Copies a link to the post to the clipboard; no DM is sent anywhere.
// Client-side only. Feedback is plain text ("Link copied") — no emoji.
// ---------------------------------------------------------------------------
export function IgShareButton({ postId }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/community#post-${postId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — nothing to do */ }
  }
  return copied ? (
    <span className="ig-share-done">Link copied</span>
  ) : (
    <button type="button" className="ig-icon-btn" onClick={share} aria-label="Share post">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// IgStories — the real 24-hour stories row + viewer (Nov 2026).
// "Your story" first (tap = add a story), then one circle per member
// WITH a live story (gradient ring). Members with no live story get no
// circle — Instagram behavior. Tapping a member's circle opens the
// full-screen viewer: that author's stories in order, auto-advancing
// every 6 seconds, with prev/next, progress bars, time left, and close.
// Your own live stories open in the viewer too, with an "Add to story"
// link so you can add more.
// ---------------------------------------------------------------------------
function timeLeft(expiresAt) {
  // SQLite stores UTC "YYYY-MM-DD HH:MM:SS" — parse it as UTC.
  const end = new Date(String(expiresAt).replace(" ", "T") + "Z").getTime();
  const ms = Math.max(0, end - Date.now());
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "less than a minute left";
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m left`;
}

export function IgStories({ groups, me }) {
  const [open, setOpen] = useState(null); // { groupIdx, storyIdx }
  const myGroupIdx = groups.findIndex((g) => g.user_id === me.id);
  const others = groups.filter((g) => g.user_id !== me.id);

  // Auto-advance: 6 seconds per story, then the next story (or the
  // next author's first story); closes at the end of the last one.
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      const group = groups[open.groupIdx];
      if (open.storyIdx + 1 < group.stories.length) {
        setOpen({ groupIdx: open.groupIdx, storyIdx: open.storyIdx + 1 });
      } else if (open.groupIdx + 1 < groups.length) {
        setOpen({ groupIdx: open.groupIdx + 1, storyIdx: 0 });
      } else {
        setOpen(null);
      }
    }, 6000);
    return () => clearTimeout(id);
  }, [open, groups]);

  // Close on Escape; lock the page scroll while the viewer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  function next() {
    if (!open) return;
    const group = groups[open.groupIdx];
    if (open.storyIdx + 1 < group.stories.length) setOpen({ groupIdx: open.groupIdx, storyIdx: open.storyIdx + 1 });
    else if (open.groupIdx + 1 < groups.length) setOpen({ groupIdx: open.groupIdx + 1, storyIdx: 0 });
    else setOpen(null);
  }
  function prev() {
    if (!open) return;
    if (open.storyIdx > 0) setOpen({ groupIdx: open.groupIdx, storyIdx: open.storyIdx - 1 });
    else if (open.groupIdx > 0) {
      const g = groups[open.groupIdx - 1];
      setOpen({ groupIdx: open.groupIdx - 1, storyIdx: g.stories.length - 1 });
    }
  }

  const openGroup = open ? groups[open.groupIdx] : null;
  const openStory = openGroup ? openGroup.stories[open.storyIdx] : null;
  const isMine = openGroup ? openGroup.user_id === me.id : false;

  return (
    <>
      <div className="ig-stories">
        {/* "Your story" — gradient ring when you have a live story (tap
            opens your viewer); plain ring + plus when you don't (tap
            opens the story creator). */}
        {myGroupIdx >= 0 ? (
          <button type="button" className="ig-story" onClick={() => setOpen({ groupIdx: myGroupIdx, storyIdx: 0 })} aria-label="Your stories">
            <span className="ig-story-ring">
              <span className="avatar">
                {me.profile_pic ? <img src={me.profile_pic} alt={me.name} /> : me.name[0]}
              </span>
            </span>
            <span>Your story</span>
          </button>
        ) : (
          <a href="/community/create?tab=story" className="ig-story ig-story-own" aria-label="Your story — add a story">
            <span className="ig-story-ring">
              <span className="avatar">
                {me.profile_pic ? <img src={me.profile_pic} alt={me.name} /> : me.name[0]}
              </span>
              <span className="ig-story-plus">+</span>
            </span>
            <span>Your story</span>
          </a>
        )}
        {others.map((g) => (
          <button
            key={g.user_id}
            type="button"
            className="ig-story"
            onClick={() => setOpen({ groupIdx: groups.indexOf(g), storyIdx: 0 })}
            aria-label={`${g.name}'s stories`}
          >
            <span className="ig-story-ring">
              <span className="avatar">
                {g.profile_pic ? <img src={g.profile_pic} alt={g.name} /> : g.name[0]}
              </span>
            </span>
            <span>{g.name}</span>
          </button>
        ))}
      </div>

      {/* Full-screen story viewer. */}
      {open && openGroup && openStory ? (
        <div className="ig-viewer" role="dialog" aria-label={`${openGroup.name}'s story`}>
          <div className="ig-viewer-box">
            <div className="ig-viewer-progress">
              {openGroup.stories.map((s, i) => (
                <span key={s.id} className={`ig-viewer-bar ${i < open.storyIdx ? "seen" : ""} ${i === open.storyIdx ? "now" : ""}`} />
              ))}
            </div>
            <div className="ig-viewer-head">
              <span className="avatar">
                {openGroup.profile_pic ? <img src={openGroup.profile_pic} alt={openGroup.name} /> : openGroup.name[0]}
              </span>
              <b>{openGroup.name}</b>
              <span className="muted">{timeLeft(openStory.expires_at)}</span>
              <button type="button" className="ig-viewer-close" onClick={() => setOpen(null)} aria-label="Close stories">✕</button>
            </div>
            <div className="ig-viewer-media">
              <button type="button" className="ig-viewer-zone ig-viewer-zone-left" onClick={prev} aria-label="Previous story" />
              <img src={openStory.image_path} alt={`${openGroup.name}'s story`} />
              <button type="button" className="ig-viewer-zone ig-viewer-zone-right" onClick={next} aria-label="Next story" />
            </div>
            <div className="ig-viewer-foot">
              {isMine ? (
                <a href="/community/create?tab=story" className="btn btn-amber btn-sm">＋ Add to story</a>
              ) : (
                <span className="small muted">{open.storyIdx + 1} of {openGroup.stories.length}</span>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

// ---------------------------------------------------------------------------
// StoryPicker — the story photo picker on the Create page. Choose up to
// 10 photos at once; each becomes one 24-hour story. Shows small live
// previews of the chosen files before posting.
// ---------------------------------------------------------------------------
export function StoryPicker() {
  const [previews, setPreviews] = useState([]);
  function onPick(e) {
    const files = [...(e.target.files || [])].slice(0, 10);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }
  return (
    <div>
      <label className="ig-photo-pick" htmlFor="story-images">
        <b>📷 Add photos</b>
        Images only, up to 5 MB each — tap to choose from your device. You can add many at once.
        <input id="story-images" name="image" type="file" accept="image/*" multiple onChange={onPick} style={{ display: "none" }} />
      </label>
      {previews.length > 0 ? (
        <div className="ig-story-previews">
          {previews.map((src, i) => (
            <img key={i} src={src} alt={`Story photo ${i + 1}`} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// IgComposer — Instagram-style Create post. Photo FIRST (a big pick area
// with a live preview), then caption, then the optional Drive video link.
// Submits as a plain form POST to /api/community/posts — the server
// enforces all post rules there (images only, 5 MB, no video upload,
// Drive link must be valid). No separate login: the page gate already
// made sure the member is logged in and enrolled.
// ---------------------------------------------------------------------------
export function IgComposer({ me }) {
  const [preview, setPreview] = useState(null);
  function onPick(e) {
    const f = e.target.files && e.target.files[0];
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }
  return (
    <div className="card ig-composer">
      <div className="ig-composer-head">
        <span className="avatar">
          {me.profile_pic ? <img src={me.profile_pic} alt={me.name} /> : me.name[0]}
        </span>
        <b>Create post</b>
      </div>
      <form action="/api/community/posts" method="post" encType="multipart/form-data">
        <label className="ig-photo-pick" htmlFor="cp-image">
          <b>📷 Add a photo</b>
          Images only, up to 5 MB — tap to choose from your device
          <input id="cp-image" name="image" type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
        </label>
        {preview ? (
          <div className="ig-photo-preview"><img src={preview} alt="Photo preview" /></div>
        ) : null}
        <div className="field">
          <textarea name="text" rows={3} placeholder="Write a caption… share a lesson, ask for help, post your analysis" maxLength={5000} />
        </div>
        <div className="field">
          <label htmlFor="cp-drive">Google Drive video link (optional)</label>
          <input id="cp-drive" name="drive_url" type="url" placeholder="https://drive.google.com/file/d/…/view" />
          <p className="small muted">
            Videos: no direct upload — paste a Drive link instead and it plays inside your post, streamed from your
            Drive. In Google Drive, set the video&apos;s sharing to “Anyone with the link can view”.
          </p>
        </div>
        <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>Post</button>
      </form>
    </div>
  );
}
