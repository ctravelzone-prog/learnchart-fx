// ---------------------------------------------------------------------------
// api/admin/change-password — the logged-in admin changes their own
// password. Old password must verify first; the new one must be 8+
// characters. Sets password_changed=1, which clears the dashboard's
// "please change your password" notice.
// ---------------------------------------------------------------------------
import crypto from "node:crypto";
import { redirectTo } from "../../../../lib/http.js";
import { getDb } from "../../../../lib/db.js";
import { getAdminUser, verifyAdminPassword } from "../../../../lib/admin.js";

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const current = String(form.get("current") || "");
  const next = String(form.get("next") || "");
  const confirm = String(form.get("confirm") || "");

  const full = getDb().prepare("SELECT * FROM admins WHERE id = ?").get(admin.id);
  const fail = (msg) =>
    redirectTo(`/admin/change-password?error=${encodeURIComponent(msg)}`);
  if (!full || !verifyAdminPassword(current, full.password_hash, full.password_salt)) {
    return fail("Your current password is wrong.");
  }
  if (next.length < 8) {
    return fail("The new password must be at least 8 characters.");
  }
  if (next !== confirm) {
    return fail("The new passwords do not match.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(next, salt, 64).toString("hex");
  getDb()
    .prepare("UPDATE admins SET password_hash = ?, password_salt = ?, password_changed = 1 WHERE id = ?")
    .run(hash, salt, admin.id);
  return redirectTo("/admin?saved=1");
}
