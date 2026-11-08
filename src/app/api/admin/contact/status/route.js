// ---------------------------------------------------------------------------
// api/admin/contact/status — mark a contact message read / replied
// (admin only). "new" = unread, "read" = seen, "replied" = answered.
// The dashboard's unread count reads status = 'new'.
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
  if (!id || !["new", "read", "replied"].includes(status)) {
    return redirectTo("/admin/contact");
  }
  getDb().prepare("UPDATE contact_messages SET status = ? WHERE id = ?").run(status, id);
  return redirectTo(`/admin/contact/${id}?saved=1`);
}
