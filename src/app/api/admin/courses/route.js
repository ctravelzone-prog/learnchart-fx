// ---------------------------------------------------------------------------
// api/admin/courses — create / update / delete a course or service
// (admin only). The form fields are the whole course record: title,
// slug, subtitle, level, status, price label + cents, button type +
// label, features (one per line), sort order, has_videos, unlocks,
// billing (one-time / monthly), badge, and an optional card image
// upload. A new course appears on /courses and in the student's
// dashboard with zero code changes — the gates read the has_videos /
// unlocks / billing flags, not the slug.
// Deleting a course refuses while enrollments exist (the admin must
// cancel those first); lessons of a deleted course go with it.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getDb } from "../../../../lib/db.js";
import { getAdminUser } from "../../../../lib/admin.js";
import { saveAdminImage } from "../../../../lib/upload-image.js";

function cleanSlug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePriceCents(form) {
  // Admin enters dollars ("250" or "0" for free); the DB stores cents.
  const dollars = Number(String(form.get("price_dollars") || "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : 0;
}

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const action = String(form.get("action") || "create");
  const id = Number(form.get("id") || 0);
  const db = getDb();

  // --- Delete ------------------------------------------------------------
  if (action === "delete") {
    if (!id) return redirectTo("/admin/courses");
    const enrolled = db.prepare("SELECT COUNT(*) AS c FROM enrollments WHERE course_id = ?").get(id).c;
    if (enrolled > 0) {
      return redirectTo(
        `/admin/courses/${id}?error=${encodeURIComponent("This course still has enrollments — cancel them first (Enrollments page), then delete the course.")}`
      );
    }
    db.prepare("DELETE FROM lessons WHERE course_id = ?").run(id);
    db.prepare("DELETE FROM courses_services WHERE id = ?").run(id);
    return redirectTo("/admin/courses?saved=1");
  }

  // --- Create / update ---------------------------------------------------
  const title = String(form.get("title") || "").trim();
  const slug = cleanSlug(form.get("slug"));
  const subtitle = String(form.get("subtitle") || "").trim();
  const level = String(form.get("level") || "").trim() || "Beginner to Advanced";
  const status = String(form.get("status") || "").trim() || "Available";
  const priceLabel = String(form.get("price_label") || "").trim();
  const priceCents = parsePriceCents(form);
  const buttonType = ["enroll", "join_telegram", "coming_soon"].includes(String(form.get("button_type")))
    ? String(form.get("button_type"))
    : "enroll";
  const buttonLabel = String(form.get("button_label") || "").trim() || "Enroll Now";
  const features = String(form.get("features") || "")
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
  const sortOrder = Number(form.get("sort_order") || 0) || 0;
  const hasVideos = form.get("has_videos") === "1" ? 1 : 0;
  const unlocks = ["none", "live-room", "consultation"].includes(String(form.get("unlocks")))
    ? String(form.get("unlocks"))
    : "none";
  // Billing model (Nov 2026): 'one-time' = pay once, access forever;
  // 'monthly' = each payment buys 30 days (Private Live Trade).
  const billing = String(form.get("billing")) === "monthly" ? "monthly" : "one-time";
  const badge = String(form.get("badge") || "").trim();

  if (!title || !slug) {
    return redirectTo(`/admin/courses${id ? `/${id}` : "/new"}?error=${encodeURIComponent("Title and slug are required.")}`);
  }
  // Slug must stay unique (other courses only, on edit).
  const clash = db
    .prepare("SELECT id FROM courses_services WHERE slug = ? AND id != ?")
    .get(slug, id || 0);
  if (clash) {
    return redirectTo(`/admin/courses${id ? `/${id}` : "/new"}?error=${encodeURIComponent("That slug is already used by another course — pick a different one.")}`);
  }

  // Optional card image upload (same image rules as everywhere else).
  let image = String(form.get("image_current") || "");
  const file = form.get("image_file");
  if (file && typeof file !== "string" && file.size > 0) {
    const saved = await saveAdminImage(file, "courses");
    if (!saved.ok) {
      return redirectTo(`/admin/courses${id ? `/${id}` : "/new"}?error=${encodeURIComponent(saved.reason)}`);
    }
    image = saved.url;
  }

  const priceLabelFinal = priceLabel || (priceCents > 0 ? `$${priceCents / 100}` : "Free");
  if (id) {
    db.prepare(
      `UPDATE courses_services SET slug = ?, title = ?, subtitle = ?, level = ?, status = ?,
       price_label = ?, price_cents = ?, button_type = ?, button_label = ?, features_json = ?,
       sort_order = ?, has_videos = ?, unlocks = ?, image = ?, badge = ?, billing = ? WHERE id = ?`
    ).run(
      slug, title, subtitle, level, status, priceLabelFinal, priceCents, buttonType, buttonLabel,
      JSON.stringify(features), sortOrder, hasVideos, unlocks, image, badge, billing, id
    );
    return redirectTo(`/admin/courses/${id}?saved=1`);
  }
  const newId = db
    .prepare(
      `INSERT INTO courses_services (slug, title, subtitle, level, status, price_label, price_cents,
       button_type, button_label, features_json, sort_order, has_videos, unlocks, image, badge, billing)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      slug, title, subtitle, level, status, priceLabelFinal, priceCents, buttonType, buttonLabel,
      JSON.stringify(features), sortOrder, hasVideos, unlocks, image, badge, billing
    ).lastInsertRowid;
  return redirectTo(`/admin/courses/${newId}?saved=1`);
}
