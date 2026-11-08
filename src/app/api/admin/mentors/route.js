// ---------------------------------------------------------------------------
// api/admin/mentors — update one mentor (admin only). Fields: name,
// role, badge, title, bio, focus tags (one per line), points (one per
// line), and an optional photo upload. The public Mentors page reads
// this table, so edits show immediately with no code change.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getDb } from "../../../../lib/db.js";
import { getAdminUser } from "../../../../lib/admin.js";
import { saveAdminImage } from "../../../../lib/upload-image.js";

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const id = String(form.get("id") || "");
  const db = getDb();
  const mentor = db.prepare("SELECT * FROM mentors WHERE id = ?").get(id);
  if (!mentor) return redirectTo("/admin/mentors");

  const name = String(form.get("name") || "").trim();
  const role = String(form.get("role") || "").trim();
  const badge = String(form.get("badge") || "").trim();
  const title = String(form.get("title") || "").trim();
  const bio = String(form.get("bio") || "").trim();
  const focusTags = String(form.get("focus_tags") || "").split("\n").map((t) => t.trim()).filter(Boolean);
  const points = String(form.get("points") || "").split("\n").map((t) => t.trim()).filter(Boolean);
  if (!name || !bio) {
    return redirectTo(`/admin/mentors/${id}?error=${encodeURIComponent("Name and bio are required.")}`);
  }

  // Optional photo upload (same image rules as everywhere else).
  let photo = String(form.get("photo_current") || mentor.photo || "");
  const file = form.get("photo_file");
  if (file && typeof file !== "string" && file.size > 0) {
    const saved = await saveAdminImage(file, "mentors");
    if (!saved.ok) {
      return redirectTo(`/admin/mentors/${id}?error=${encodeURIComponent(saved.reason)}`);
    }
    photo = saved.url;
  }

  db.prepare(
    `UPDATE mentors SET name = ?, role = ?, badge = ?, title = ?, bio = ?,
     focus_tags_json = ?, points_json = ?, photo = ? WHERE id = ?`
  ).run(name, role, badge, title, bio, JSON.stringify(focusTags), JSON.stringify(points), photo, id);
  return redirectTo(`/admin/mentors/${id}?saved=1`);
}
