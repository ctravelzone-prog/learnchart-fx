// ---------------------------------------------------------------------------
// CommunityClient.jsx — the live chat areas inside the Community:
// the Mentor Special Chat (separate from the feed) and member-to-member
// chat. Polling every 5 seconds keeps both near-real-time with no
// external push service. Mentor messages carry the mentor mark.
// ---------------------------------------------------------------------------
"use client";
import { useRouter } from "next/navigation";
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
// Share — Facebook style: records one real share (POST
// /api/community/share — the counts row under the post shows the real
// total) AND copies the post link, with "Link copied" feedback. The
// counts row refreshes after sharing so the new total shows.
export function IgShareButton({ postId }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  async function share() {
    try {
      await fetch("/api/community/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      });
    } catch { /* share not recorded — the link still copies */ }
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/community#post-${postId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — nothing to do */ }
    router.refresh();
  }
  return copied ? (
    <span className="ig-share-done">Link copied</span>
  ) : (
    <button type="button" className="fb-action-btn" onClick={share} aria-label="Share post">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z" /></svg>
      Share
    </button>
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
// made sure the member is logged in and enrolled. returnTo ("/community"
// | "/profile") is where the post returns to after publishing; focusDrive
// focuses the Drive video link field (the composer's Reel button).
// ---------------------------------------------------------------------------
export function IgComposer({ me, returnTo, focusDrive }) {
  const [preview, setPreview] = useState(null);
  const driveRef = useRef(null);
  // The composer's Reel button links here with focus=drive — focus the
  // Drive video link field on load, so a video post starts right there.
  useEffect(() => {
    if (focusDrive && driveRef.current) driveRef.current.focus();
  }, [focusDrive]);
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
        {/* Where the post returns to: /profile when it started from the
            profile composer, /community otherwise. */}
        <input type="hidden" name="return_to" value={returnTo === "/profile" ? "/profile" : "/community"} />
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
          <input ref={driveRef} id="cp-drive" name="drive_url" type="url" placeholder="https://drive.google.com/file/d/…/view" />
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
