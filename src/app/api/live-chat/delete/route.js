// ---------------------------------------------------------------------------
// api/live-chat/delete — delete one live-chat message (admin only).
// The Live Room chat panel shows a delete button on every message when
// the viewer is an admin session. JSON in, JSON out (the panel is a
// client component polling the chat API).
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db.js";
import { getAdminUser } from "../../../../lib/admin.js";

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin only." }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const id = Number(body.id || 0);
  if (!id) return NextResponse.json({ error: "Message id is required." }, { status: 400 });
  getDb().prepare("DELETE FROM live_chat_messages WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
