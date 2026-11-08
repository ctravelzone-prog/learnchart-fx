// ---------------------------------------------------------------------------
// api/admin/lessons — create / update / delete a video lesson (admin
// only). Fields: course (any course — lessons belong to a course, so a
// new video course gets its lessons here), position, title, duration,
// YouTube video ID, description. Deleting renumbers nothing — the
// admin sets the positions; the page sorts by position.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getDb } from "../../../../lib/db.js";
import { getAdminUser } from "../../../../lib/admin.js";

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const action = String(form.get("action") || "create");
  const id = Number(form.get("id") || 0);
  const db = getDb();

  if (action === "delete") {
    if (!id) return redirectTo("/admin/lessons");
    db.prepare("DELETE FROM lessons WHERE id = ?").run(id);
    return redirectTo("/admin/lessons?saved=1");
  }

  const courseId = Number(form.get("course_id") || 0);
  const title = String(form.get("title") || "").trim();
  const position = Number(form.get("position") || 1) || 1;
  const duration = String(form.get("duration") || "").trim();
  const youtubeId = String(form.get("youtube_id") || "").trim();
  const description = String(form.get("description") || "").trim();
  const course = db.prepare("SELECT id FROM courses_services WHERE id = ?").get(courseId);
  if (!course || !title) {
    return redirectTo(`/admin/lessons${id ? `/${id}` : "/new"}?error=${encodeURIComponent("A course and a lesson title are required.")}`);
  }

  if (id) {
    db.prepare(
      "UPDATE lessons SET course_id = ?, position = ?, title = ?, duration = ?, youtube_id = ?, description = ? WHERE id = ?"
    ).run(courseId, position, title, duration, youtubeId, description, id);
    return redirectTo(`/admin/lessons/${id}?saved=1`);
  }
  const newId = db
    .prepare("INSERT INTO lessons (course_id, position, title, duration, youtube_id, description) VALUES (?, ?, ?, ?, ?, ?)")
    .run(courseId, position, title, duration, youtubeId, description).lastInsertRowid;
  return redirectTo(`/admin/lessons/${newId}?saved=1`);
}
