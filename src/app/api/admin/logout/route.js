// ---------------------------------------------------------------------------
// api/admin/logout — end the admin session and clear the admin cookie.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { destroyAdminSession } from "../../../../lib/admin.js";

export async function POST() {
  await destroyAdminSession();
  return redirectTo("/admin/login");
}
