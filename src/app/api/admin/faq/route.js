// ---------------------------------------------------------------------------
// api/admin/faq — create / update / delete an FAQ question (admin only).
// Fields: category (General / Enrollment), question, answer, sort order.
// The public FAQ page + home preview read this table, so edits show
// immediately with no code change.
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
    if (!id) return redirectTo("/admin/faq");
    db.prepare("DELETE FROM faqs WHERE id = ?").run(id);
    return redirectTo("/admin/faq?saved=1");
  }

  const category = String(form.get("category") || "General");
  const question = String(form.get("question") || "").trim();
  const answer = String(form.get("answer") || "").trim();
  const sortOrder = Number(form.get("sort_order") || 0) || 0;
  if (!["General", "Enrollment"].includes(category) || !question || !answer) {
    return redirectTo(`/admin/faq${id ? `/${id}` : "/new"}?error=${encodeURIComponent("Category, question and answer are all required.")}`);
  }

  if (id) {
    db.prepare("UPDATE faqs SET category = ?, question = ?, answer = ?, sort_order = ? WHERE id = ?")
      .run(category, question, answer, sortOrder, id);
    return redirectTo(`/admin/faq/${id}?saved=1`);
  }
  const newId = db
    .prepare("INSERT INTO faqs (category, question, answer, sort_order) VALUES (?, ?, ?, ?)")
    .run(category, question, answer, sortOrder).lastInsertRowid;
  return redirectTo(`/admin/faq/${newId}?saved=1`);
}
