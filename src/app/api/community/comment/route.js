// ---------------------------------------------------------------------------
// api/community/comment — add a comment to a post (community members only).
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { canEnterCommunity } from "../../../../lib/access.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return redirectTo("/community");
  }
  const form = await request.formData();
  const postId = Number(form.get("post_id"));
  const text = String(form.get("text") || "").trim();
  if (!postId || !text || text.length > 2000) {
    return redirectTo("/community");
  }
  getDb().prepare("INSERT INTO comments (post_id, user_id, text) VALUES (?, ?, ?)").run(postId, user.id, text);
  return redirectTo("/community");
}
