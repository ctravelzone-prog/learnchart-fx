// ---------------------------------------------------------------------------
// api/chat/member — member-to-member chat (prompt Section 16).
// GET: the conversation between the logged-in user and ?with=<userId>.
// POST: send a message (members only, text only, max 2000 chars).
// Polling (near-real-time) — no external push service is used.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { canEnterCommunity } from "../../../../lib/access.js";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return NextResponse.json({ error: "Community members only." }, { status: 403 });
  }
  const withId = Number(new URL(request.url).searchParams.get("with"));
  if (!withId) return NextResponse.json({ messages: [] });
  const rows = getDb()
    .prepare(
      `SELECT m.*, u.name AS from_name FROM member_messages m
       JOIN users u ON u.id = m.from_user_id
       WHERE (m.from_user_id = ? AND m.to_user_id = ?) OR (m.from_user_id = ? AND m.to_user_id = ?)
       ORDER BY m.created_at ASC LIMIT 100`
    )
    .all(user.id, withId, withId, user.id);
  return NextResponse.json({ messages: rows });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return NextResponse.json({ error: "Community members only." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const toUserId = Number(body.to_user_id);
  const text = String(body.text || "").trim();
  if (!toUserId || !text || text.length > 2000) {
    return NextResponse.json({ error: "Message text is required (max 2000 characters)." }, { status: 400 });
  }
  getDb().prepare("INSERT INTO member_messages (from_user_id, to_user_id, text) VALUES (?, ?, ?)").run(user.id, toUserId, text);
  return NextResponse.json({ ok: true });
}
