// ---------------------------------------------------------------------------
// admin/mentors — the two mentors. The public Mentors page reads this
// table, so edits show immediately with no code change.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { getMentors } from "../../../lib/db.js";

export const metadata = { title: "Mentors — Admin — LearnChart FX" };

export default async function AdminMentorsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const mentors = getMentors();

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Mentors</h1>
      <p className="muted">Name, role, bio, focus tags and photo for each mentor — shown on the public Mentors page.</p>
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}
      <div className="grid-2">
        {mentors.map((m) => (
          <div className="card" key={m.id}>
            {m.photo ? <p><img src={m.photo} alt={m.name} style={{ maxWidth: 160, borderRadius: 10 }} /></p> : null}
            <h3>{m.name}</h3>
            <p className="muted small">{m.title}</p>
            <p className="small muted">{m.bio.slice(0, 160)}{m.bio.length > 160 ? "…" : ""}</p>
            <Link href={`/admin/mentors/${m.id}`} className="btn btn-amber btn-sm">Edit Mentor →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
