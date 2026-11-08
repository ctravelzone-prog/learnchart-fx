// ---------------------------------------------------------------------------
// api/admin/login — check admin email + password, then create an ADMIN
// session (its own cookie). Wrong credentials give one generic error.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getAdminByEmail } from "../../../../lib/db.js";
import { verifyAdminPassword, createAdminSession } from "../../../../lib/admin.js";

export async function POST(request) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");

  const admin = getAdminByEmail(email);
  const ok = admin && verifyAdminPassword(password, admin.password_hash, admin.password_salt);
  if (!ok) {
    return redirectTo(`/admin/login?error=${encodeURIComponent("Invalid admin email or password.")}`);
  }

  await createAdminSession(admin.id);
  return redirectTo("/admin");
}
