// ---------------------------------------------------------------------------
// api/admin/pages — save the Pages editor form (admin only). The form
// posts one page's text fields as `content[section][field]` pairs
// (field names are "section__field"). Only fields defined in
// src/lib/page-content.js PAGE_DEFAULTS are accepted — an unknown
// field is ignored, never written. Image fields are NOT saved here;
// they go through /api/admin/pages/upload.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { setPageField } from "../../../../lib/page-content.js";
import { getAdminUser } from "../../../../lib/admin.js";

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const page = String(form.get("page") || "");
  let saved = 0;
  for (const [name, value] of form.entries()) {
    if (!name.startsWith("content__")) continue;
    const rest = name.slice("content__".length);
    const sep = rest.indexOf("__");
    if (sep < 1) continue;
    const section = rest.slice(0, sep);
    const field = rest.slice(sep + 2);
    if (setPageField(page, section, field, String(value))) saved += 1;
  }
  return redirectTo(`/admin/pages/${encodeURIComponent(page)}?saved=${saved}`);
}
