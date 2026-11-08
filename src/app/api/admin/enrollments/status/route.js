// ---------------------------------------------------------------------------
// api/admin/enrollments/status — cancel / reactivate one enrollment
// (admin only). Cancelling removes the student's access to that
// course's gated areas (the gates read status = 'active').
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
  if (!id || !["active", "cancelled"].includes(status)) {
    return redirectTo("/admin/enrollments");
  }
  getDb().prepare("UPDATE enrollments SET status = ? WHERE id = ?").run(status, id);
  return redirectTo(`/admin/enrollments/${id}?saved=1`);
}
