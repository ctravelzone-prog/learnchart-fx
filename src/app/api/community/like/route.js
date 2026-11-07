// ---------------------------------------------------------------------------
// api/community/like — toggle a like on a post (community members only).
// One like per user per post (UNIQUE in the DB); tapping again removes it.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { canEnterCommunity } from "../../../../lib/access.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return NextResponse.redirect(new URL("/community", request.url), 303);
  }
  const form = await request.formData();
  const postId = Number(form.get("post_id"));
  if (!postId) return NextResponse.redirect(new URL("/community", request.url), 303);

  const db = getDb();
  const existing = db.prepare("SELECT id FROM likes WHERE post_id = ? AND user_id = ?").get(postId, user.id);
  if (existing) {
    db.prepare("DELETE FROM likes WHERE id = ?").run(existing.id);
  } else {
    db.prepare("INSERT INTO likes (post_id, user_id) VALUES (?, ?)").run(postId, user.id);
  }
  return NextResponse.redirect(new URL("/community", request.url), 303);
}
