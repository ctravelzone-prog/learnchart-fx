// ---------------------------------------------------------------------------
// api/admin/community/delete — delete one community post or one comment
// (admin only). Deleting a post removes its comments + likes too.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../../lib/http.js";
import { getDb } from "../../../../../lib/db.js";
import { getAdminUser } from "../../../../../lib/admin.js";

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const kind = String(form.get("kind") || "");
  const id = Number(form.get("id") || 0);
  const db = getDb();
  if (kind === "post" && id) {
    db.prepare("DELETE FROM comments WHERE post_id = ?").run(id);
    db.prepare("DELETE FROM likes WHERE post_id = ?").run(id);
    db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  } else if (kind === "comment" && id) {
    db.prepare("DELETE FROM comments WHERE id = ?").run(id);
  }
  return redirectTo("/admin/community?saved=1");
}
