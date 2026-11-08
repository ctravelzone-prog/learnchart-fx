// ---------------------------------------------------------------------------
// api/admin/pages/upload — upload one picture for a page-content image
// field (admin only). Same validation as every other image upload:
// images only (jpeg/png/webp/gif), max 5 MB. The saved URL is stored
// in the page_content table for that page + section + field, and the
// public page shows it immediately. Only fields of type "image" in
// src/lib/page-content.js PAGE_DEFAULTS are accepted.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../../lib/http.js";
import { PAGE_DEFAULTS, setPageField } from "../../../../../lib/page-content.js";
import { getAdminUser } from "../../../../../lib/admin.js";
import { saveAdminImage } from "../../../../../lib/upload-image.js";

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const page = String(form.get("page") || "");
  const section = String(form.get("section") || "");
  const field = String(form.get("field") || "");
  const back = `/admin/pages/${encodeURIComponent(page)}`;

  const def = PAGE_DEFAULTS[page]?.[section]?.[field];
  if (!def || def.type !== "image") {
    return redirectTo(`${back}?error=${encodeURIComponent("That is not an image field.")}`);
  }
  const file = form.get("image");
  const saved = await saveAdminImage(file, "pages");
  if (!saved.ok) {
    return redirectTo(`${back}?error=${encodeURIComponent(saved.reason)}`);
  }
  setPageField(page, section, field, saved.url);
  return redirectTo(`${back}?saved=1`);
}
