// ---------------------------------------------------------------------------
// LiveChat.jsx — the live classroom chat inside the Live Room. Client
// component: polls the server every 4 seconds (short polling — the
// simplest reliable realtime on this Next.js + Render free-tier setup;
// no WebSocket server). Only Private Live Trade members ever see this
// panel (the /live-room page only renders it for them); the API refuses
// everyone else server-side. Nothing here ever goes to YouTube or any
// outside service — it is a private, on-site chat.
//
// Mentor messages (Siam Chowdhury / Rex Mizan, or an admin session)
// get the ★ MENTOR badge, like Special Chat. Admins see a delete
// button on every message.
// ---------------------------------------------------------------------------
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_MS = 4000;
const MAX_LEN = 500;

export default function LiveChat({ userName, userId, isAdmin, canSend = true }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);
  const loadedRef = useRef(false);

  // Keep the list pinned to the bottom only when the member was already
  // near the bottom (so reading old messages is never yanked away).
  const nearBottom = () => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const load = useCallback(async () => {
    const wasNearBottom = nearBottom();
    try {
      const res = await fetch("/api/live-chat", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const next = Array.isArray(data.messages) ? data.messages : [];
      setMessages((prev) => {
        // Only touch state when something actually changed (avoids a
        // re-render + scroll jump on every poll).
        if (prev.length === next.length && prev.every((m, i) => m.id === next[i].id)) return prev;
        return next;
      });
      // Scroll to the bottom on first load, or when new messages arrive
      // while the member is already at the bottom.
      requestAnimationFrame(() => {
        const el = listRef.current;
        if (el && (!loadedRef.current || wasNearBottom)) el.scrollTop = el.scrollHeight;
        loadedRef.current = true;
      });
    } catch {
      // Poll failure is not fatal — the next poll retries. Never crash
      // the page for a chat hiccup.
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function send(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/live-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send — try again.");
        return;
      }
      setText("");
      await load();
      requestAnimationFrame(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    } catch {
      setError("Could not send — check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this message?")) return;
    try {
      const res = await fetch("/api/live-chat/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await load();
    } catch {
      // Ignore — the next poll refreshes the list anyway.
    }
  }

  return (
    <div>
      <div className="live-chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            No messages yet — say hello when the live starts. This chat is private: only Private Live Trade members can see it.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`chat-msg ${m.user_id === userId ? "mine" : ""} ${m.is_mentor ? "mentor-msg" : ""}`}>
              <div className="small" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>
                  <strong>{m.author_name || "Member"}</strong>
                  {m.is_mentor ? <span className="mentor-tag"> ★ MENTOR</span> : null}
                </span>
                <span className="muted">
                  {new Date(String(m.created_at).replace(" ", "T") + "Z").toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  {isAdmin ? (
                    <button type="button" className="live-chat-del" onClick={() => remove(m.id)} title="Delete this message">
                      ✕
                    </button>
                  ) : null}
                </span>
              </div>
              <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.message}</div>
            </div>
          ))
        )}
      </div>

      {canSend ? (
        <>
          <form className="chat-input" onSubmit={send}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
              placeholder={`Chat as ${userName}…`}
              aria-label="Live chat message"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-amber" disabled={sending || !text.trim()}>
              Send
            </button>
          </form>
          <div className="small muted" style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span>{error || "Private — only Private Live Trade members see this chat."}</span>
            <span>
              {text.length}/{MAX_LEN}
            </span>
          </div>
        </>
      ) : (
        <p className="small muted" style={{ marginTop: 12 }}>
          You are viewing as admin — sign in as a member to send messages. You can still read the chat and delete messages.
        </p>
      )}
    </div>
  );
}
