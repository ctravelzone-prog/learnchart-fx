// ---------------------------------------------------------------------------
// api/admin/users/status — deactivate / reactivate one student (admin
// only). Deactivation blocks login immediately and kills existing
// sessions (see src/lib/auth.js). Reactivation restores the account.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../../lib/http.js";
import { getDb } from "../../../../../lib/db.js";
import { getAdminUser } from "../../../../../lib/admin.js";

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const id = Number(form.get("id") || 0);
  const status = String(form.get("status") || "");
  if (!id || !["active", "deactivated"].includes(status)) {
    return redirectTo("/admin/users");
  }
  getDb().prepare("UPDATE users SET status = ? WHERE id = ?").run(status, id);
  // Deactivation kills sessions right away; reactivation needs none.
  if (status === "deactivated") {
    getDb().prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
  }
  return redirectTo(`/admin/users/${id}?saved=1`);
}
