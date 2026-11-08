// ---------------------------------------------------------------------------
// ChatRoom.jsx — the dedicated member chat box (/chat page). Member list
// on one side, the one-to-one conversation with the picked member on the
// other. Polling every 5 seconds keeps it near-real-time with no external
// push service (same /api/chat/member endpoints as the old sidebar chat).
// The picked member comes from the page URL (?with=<id>), so a chat can
// be linked to (e.g. from a member's profile page).
// ---------------------------------------------------------------------------
"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function ChatRoom({ members, meId, peerId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const peer = members.find((m) => m.id === peerId) || null;

  // Poll the conversation with the picked member (nothing to poll yet
  // when no member is picked).
  useEffect(() => {
    if (!peerId) return;
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`/api/chat/member?with=${peerId}`);
        if (res.ok) {
          const json = await res.json();
          if (alive) setMessages(json.messages || []);
        }
      } catch { /* offline moment — next poll retries */ }
    };
    load();
    const id = setInterval(load, 5000);
    return () => { alive = false; clearInterval(id); };
  }, [peerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

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

  return (
    <div className="chat-layout">
      {/* Member list — one side. */}
      <div className="card">
        <h3 style={{ marginBottom: 14 }}>👥 Members</h3>
        {members.length === 0 ? (
          <p className="muted small">No other members yet — member chat opens when another member joins.</p>
        ) : null}
        {members.map((m) => (
          <Link key={m.id} href={`/chat?with=${m.id}`} className={`chat-peer ${m.id === peerId ? "active" : ""}`}>
            <span className="avatar">
              {m.profile_pic ? <img src={m.profile_pic} alt={m.name} /> : m.name[0]}
            </span>
            {m.name}
          </Link>
        ))}
      </div>

      {/* Conversation — the other side. */}
      <div className="card">
        {!peer ? (
          <>
            <h3>💬 Member Chat</h3>
            <p className="muted">Pick a member on the left to start talking one-to-one.</p>
          </>
        ) : (
          <>
            <h3 style={{ marginBottom: 4 }}>💬 {peer.name}</h3>
            <p className="small muted" style={{ marginTop: 0 }}>
              One-to-one chat · <Link href={`/members/${peer.id}`} className="amber">View {peer.name}&apos;s profile →</Link>
            </p>
            <div className="chat-box" style={{ maxHeight: 420, overflowY: "auto" }}>
              {messages.length === 0 ? <p className="muted small">No messages with {peer.name} yet — say hello.</p> : null}
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
    </div>
  );
}
