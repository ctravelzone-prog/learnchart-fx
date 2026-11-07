// ---------------------------------------------------------------------------
// api/chat/special — the Mentor Special Chat (prompt Section 18).
// A separate room from the feed and from member-to-member chat. Mentor
// messages (Siam Chowdhury, Rex Mizan) are flagged is_mentor so the UI
// marks them visually. During a live text session every community member
// can send text here. Polling keeps it near-real-time.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { canEnterCommunity } from "../../../../lib/access.js";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return NextResponse.json({ error: "Community members only." }, { status: 403 });
  }
  const rows = getDb()
    .prepare(
      `SELECT s.*, u.name AS author_name, u.profile_pic AS author_pic
       FROM special_chat_messages s LEFT JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at ASC LIMIT 100`
    )
    .all();
  // Seeded mentor welcome (user_id NULL) has no user row — name it properly.
  return NextResponse.json({
    messages: rows.map((r) => ({
      ...r,
      author_name: r.user_id == null ? "Siam Chowdhury" : r.author_name,
    })),
  });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return NextResponse.json({ error: "Community members only." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const text = String(body.text || "").trim();
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "Message text is required (max 2000 characters)." }, { status: 400 });
  }
  // Mentor flag: only the two mentor accounts are mentors. (Mentor
  // accounts are identified by name in this phase; the later admin
  // phase will own a proper role system.)
  const isMentor = user.name === "Siam Chowdhury" || user.name === "Rex Mizan" ? 1 : 0;
  getDb().prepare("INSERT INTO special_chat_messages (user_id, text, is_mentor) VALUES (?, ?, ?)").run(user.id, text, isMentor);
  return NextResponse.json({ ok: true });
}
