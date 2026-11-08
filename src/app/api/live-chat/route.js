// ---------------------------------------------------------------------------
// api/live-chat — the private Live Room chat (prompt: live classroom chat
// DURING the live). Mirrors the Special Chat API pattern: short polling
// keeps it near-real-time, no WebSocket server.
//
// PRIVATE, server-enforced: only Private Live Trade members (same gate
// as the stream) can read or send. An admin session may also read, so
// the admin can moderate. This is NOT YouTube chat and NOT public —
// nothing here ever goes to YouTube or any outside service.
// Anti-spam: 500-character cap + a 5-second cooldown per user.
// Mentor flag: the two mentor accounts, or any admin session.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db.js";
import { getSessionUser } from "../../../lib/auth.js";
import { getAdminUser } from "../../../lib/admin.js";
import { getLiveRoomAccessState } from "../../../lib/access.js";

const MAX_LEN = 500;
const COOLDOWN_MS = 5000;
const MENTOR_NAMES = ["Siam Chowdhury", "Rex Mizan"];

// Who may read the chat: a PLT member, or an admin (moderation view).
async function canRead() {
  const admin = await getAdminUser();
  if (admin) return { allowed: true, admin: true };
  const user = await getSessionUser();
  if (user && getLiveRoomAccessState(user.id).state === "open") {
    return { allowed: true, admin: false, user };
  }
  return { allowed: false };
}

export async function GET() {
  const check = await canRead();
  if (!check.allowed) {
    return NextResponse.json({ error: "Private Live Trade members only." }, { status: 403 });
  }
  const rows = getDb()
    .prepare(
      `SELECT m.*, u.name AS author_name
       FROM live_chat_messages m LEFT JOIN users u ON u.id = m.user_id
       ORDER BY m.created_at ASC, m.id ASC LIMIT 100`
    )
    .all();
  return NextResponse.json({ messages: rows.map((r) => ({ ...r })) });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || getLiveRoomAccessState(user.id).state !== "open") {
    return NextResponse.json({ error: "Private Live Trade members only." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const message = String(body.message || "").trim();
  if (!message || message.length > MAX_LEN) {
    return NextResponse.json({ error: `Message is required (max ${MAX_LEN} characters).` }, { status: 400 });
  }
  // Cooldown: one message per user per 5 seconds.
  const last = getDb()
    .prepare("SELECT created_at FROM live_chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT 1")
    .get(user.id);
  if (last) {
    const lastMs = new Date(String(last.created_at).replace(" ", "T") + "Z").getTime();
    if (Number.isFinite(lastMs) && Date.now() - lastMs < COOLDOWN_MS) {
      return NextResponse.json({ error: "Slow down — wait a few seconds between messages." }, { status: 429 });
    }
  }
  // Mentor flag: the two mentor accounts, or an admin session posting
  // from a user account (admins moderate + teach as mentors).
  const admin = await getAdminUser();
  const isMentor = MENTOR_NAMES.includes(user.name) || !!admin ? 1 : 0;
  const info = getDb()
    .prepare("INSERT INTO live_chat_messages (user_id, message, is_mentor) VALUES (?, ?, ?)")
    .run(user.id, message, isMentor);
  return NextResponse.json({ ok: true, id: Number(info.lastInsertRowid) });
}
