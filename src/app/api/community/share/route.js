// ---------------------------------------------------------------------------
// api/community/share — record a post share (Nov 2026, Facebook feed).
// POST { post_id } as JSON. The Share button records the share AND
// copies the post link; the counts row under a post shows the real
// total from this table. One row per share action (a member sharing
// twice counts twice — like Facebook). Paid Community members only.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { canEnterCommunity } from "../../../../lib/access.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }
  let postId = null;
  try {
    const body = await request.json();
    postId = Number(body?.post_id);
  } catch {
    const form = await request.formData();
    postId = Number(form.get("post_id"));
  }
  if (!postId) return NextResponse.json({ error: "Missing post_id." }, { status: 400 });
  const post = getDb().prepare("SELECT id FROM posts WHERE id = ?").get(postId);
  if (!post) return NextResponse.json({ error: "No such post." }, { status: 404 });
  getDb().prepare("INSERT INTO post_shares (post_id, user_id) VALUES (?, ?)").run(postId, user.id);
  const count = getDb().prepare("SELECT COUNT(*) AS c FROM post_shares WHERE post_id = ?").get(postId).c;
  return NextResponse.json({ ok: true, count });
}
