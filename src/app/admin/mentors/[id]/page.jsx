// ---------------------------------------------------------------------------
// admin/mentors/[id] — edit one mentor (admin only). Fields: name,
// role, badge, title, bio, focus tags (one per line), points (one per
// line), photo upload. The public Mentors page reads this table.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/admin.js";
import { getMentorById } from "../../../../lib/db.js";

export const metadata = { title: "Mentor — Admin — LearnChart FX" };

export default async function AdminMentorEditPage({ params, searchParams }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const mentor = getMentorById(id);
  if (!mentor) notFound();

  return (
    <div className="wrap section">
      <p className="muted small"><Link href="/admin/mentors" className="amber">← Mentors</Link></p>
      <h1 style={{ fontSize: 32 }}>Edit — {mentor.name}</h1>
      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}

      <form action="/api/admin/mentors" method="post" encType="multipart/form-data">
        <input type="hidden" name="id" value={mentor.id} />
        <div className="card">
          <div className="grid-2">
            <div className="field">
              <label htmlFor="name">Name *</label>
              <input id="name" name="name" required defaultValue={mentor.name} />
            </div>
            <div className="field">
              <label htmlFor="role">Role</label>
              <input id="role" name="role" defaultValue={mentor.role} placeholder="Head Mentor" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="badge">Badge</label>
              <input id="badge" name="badge" defaultValue={mentor.badge} placeholder="Head Mentor" />
            </div>
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" defaultValue={mentor.title} placeholder="Forex Mentor & Founder" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="bio">Bio *</label>
            <textarea id="bio" name="bio" rows={5} required defaultValue={mentor.bio} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="focus_tags">Focus tags — one per line</label>
              <textarea id="focus_tags" name="focus_tags" rows={4} defaultValue={mentor.focusTags.join("\n")} />
            </div>
            <div className="field">
              <label htmlFor="points">Points — one per line</label>
              <textarea id="points" name="points" rows={4} defaultValue={mentor.points.join("\n")} />
            </div>
          </div>

          <h3 style={{ marginTop: 8 }}>Photo</h3>
          {mentor.photo ? (
            <p><img src={mentor.photo} alt={mentor.name} style={{ maxWidth: 200, borderRadius: 10 }} /></p>
          ) : null}
          <input type="hidden" name="photo_current" value={mentor.photo || ""} />
          <div className="field">
            <label htmlFor="photo_file">Upload a new photo (image only, up to 5 MB — empty = keep current)</label>
            <input id="photo_file" name="photo_file" type="file" accept="image/*" />
          </div>

          <button type="submit" className="btn btn-amber">Save Mentor</button>
        </div>
      </form>
    </div>
  );
}
