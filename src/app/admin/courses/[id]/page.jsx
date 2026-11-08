// ---------------------------------------------------------------------------
// admin/courses/[id] + /new — ONE shared course form (admin only).
// The same file renders both: /new has no course (empty defaults),
// /[id] loads the course. Fields: title, slug, subtitle, level,
// status, price (dollars), price label, button type + label, features
// (one per line), sort order, has_videos, unlocks, badge, card image.
// has_videos = this course has video lessons + a unique Course Key per
// student (emailed on enroll). unlocks = which area it opens, if any:
// none / live-room / consultation. Community stays "any enrollment".
// ---------------------------------------------------------------------------
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/admin.js";
import { getCourseById } from "../../../../lib/db.js";

export const metadata = { title: "Course — Admin — LearnChart FX" };

export default async function AdminCourseFormPage({ params, searchParams }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const course = isNew ? null : getCourseById(Number(id));
  if (!isNew && !course) notFound();

  const c = course || {
    slug: "", title: "", subtitle: "", level: "", status: "Available",
    price_label: "", price_cents: 0, button_type: "enroll", button_label: "Enroll Now",
    features: [], sort_order: 0, has_videos: 0, unlocks: "none", image: "", badge: "", billing: "one-time",
  };

  return (
    <div className="wrap section">
      <p className="muted small"><Link href="/admin/courses" className="amber">← Courses</Link></p>
      <h1 style={{ fontSize: 32 }}>{isNew ? "Add Course" : `Edit — ${course.title}`}</h1>
      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}

      <form action="/api/admin/courses" method="post" encType="multipart/form-data">
        <input type="hidden" name="action" value={isNew ? "create" : "update"} />
        {!isNew ? <input type="hidden" name="id" value={course.id} /> : null}
        <div className="card">
          <div className="grid-2">
            <div className="field">
              <label htmlFor="title">Title *</label>
              <input id="title" name="title" required defaultValue={c.title} placeholder="e.g. Advanced Gold Trading Course" />
            </div>
            <div className="field">
              <label htmlFor="slug">Slug * (URL — lowercase, dashes only)</label>
              <input id="slug" name="slug" required defaultValue={c.slug} placeholder="e.g. advanced-gold-course" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="subtitle">Subtitle</label>
            <input id="subtitle" name="subtitle" defaultValue={c.subtitle} placeholder="Short one-line description" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="level">Level</label>
              <input id="level" name="level" defaultValue={c.level} placeholder="Beginner to Advanced" />
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <input id="status" name="status" defaultValue={c.status} placeholder="Available / Ongoing / Developing" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="price_dollars">Price in dollars (0 = free)</label>
              <input id="price_dollars" name="price_dollars" type="number" min="0" step="0.01" defaultValue={c.price_cents / 100} />
              <p className="small muted">Paid courses are paid in USDT on Binance at this amount (the USDT amount in Payment Settings must match — it defaults to the course price).</p>
            </div>
            <div className="field">
              <label htmlFor="price_label">Price label (shown on the card)</label>
              <input id="price_label" name="price_label" defaultValue={c.price_label} placeholder="$250 or Free" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="button_type">Button type</label>
              <select id="button_type" name="button_type" defaultValue={c.button_type}>
                <option value="enroll">Enroll (normal enroll button)</option>
                <option value="join_telegram">Join Telegram (shows Telegram note)</option>
                <option value="coming_soon">Coming Soon (button disabled)</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="button_label">Button label</label>
              <input id="button_label" name="button_label" defaultValue={c.button_label} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="features">Features — one per line</label>
            <textarea id="features" name="features" rows={7} defaultValue={c.features.join("\n")} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="sort_order">Sort order (lower shows first)</label>
              <input id="sort_order" name="sort_order" type="number" defaultValue={c.sort_order} />
            </div>
            <div className="field">
              <label htmlFor="badge">Card badge (empty = none)</label>
              <input id="badge" name="badge" defaultValue={c.badge} placeholder="★ BESTSELLER" />
            </div>
          </div>

          <h3 style={{ marginTop: 8 }}>Video lessons &amp; access</h3>
          <div className="field">
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" name="has_videos" value="1" defaultChecked={Boolean(c.has_videos)} style={{ width: "auto" }} />
              This course has video lessons + a Course Key (students get lessons + a unique emailed key)
            </label>
          </div>
          <div className="field">
            <label htmlFor="unlocks">Unlocks (which gated area this course opens)</label>
            <select id="unlocks" name="unlocks" defaultValue={c.unlocks}>
              <option value="none">None (Community only — every enrollment opens Community)</option>
              <option value="live-room">Live Room</option>
              <option value="consultation">Consultation</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="billing">Billing (how long one payment lasts)</label>
            <select id="billing" name="billing" defaultValue={c.billing || "one-time"}>
              <option value="one-time">One-time — pay once, access forever</option>
              <option value="monthly">Monthly — each payment buys 30 days, then access stops until renewed</option>
            </select>
          </div>

          <h3 style={{ marginTop: 8 }}>Card image</h3>
          {c.image ? (
            <p><img src={c.image} alt="Current card" style={{ maxWidth: 220, borderRadius: 10 }} /></p>
          ) : null}
          <input type="hidden" name="image_current" value={c.image || ""} />
          <div className="field">
            <label htmlFor="image_file">Upload a new card image (image only, up to 5 MB — empty = keep current)</label>
            <input id="image_file" name="image_file" type="file" accept="image/*" />
          </div>

          <button type="submit" className="btn btn-amber">{isNew ? "Add Course" : "Save Course"}</button>
        </div>
      </form>

      {!isNew ? (
        <form action="/api/admin/courses" method="post" style={{ marginTop: 16 }}>
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="id" value={course.id} />
          <button type="submit" className="btn btn-dark">Delete this course</button>
          <span className="small muted" style={{ marginLeft: 10 }}>Lessons are deleted too. Enrollments must be cancelled first.</span>
        </form>
      ) : null}
    </div>
  );
}
