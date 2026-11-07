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
