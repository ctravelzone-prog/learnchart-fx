// ---------------------------------------------------------------------------
// admin/pages — Pages / Content (admin only). Every heading, sub-line,
// paragraph, button label and picture on the Home, Contact and Mentors
// pages is editable here — the owner never touches code to change
// words or pictures. Stats, testimonials, socials and brokers live in
// Site Settings; mentors live in Mentors; lessons live in Lessons.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { PAGE_LIST } from "../../../lib/page-content.js";

export const metadata = { title: "Pages / Content — Admin — LearnChart FX" };

export default async function AdminPagesIndex() {
  await requireAdmin();

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Pages / Content</h1>
      <p className="muted">
        Edit the words and pictures of the Home, Contact and Mentors pages. Changes show on the site immediately.
        Nothing changes visually until you edit — every field falls back to the current text when untouched.
      </p>
      <div className="grid-3">
        {PAGE_LIST.map((p) => (
          <div className="card" key={p.id}>
            <h3>{p.title}</h3>
            <p className="muted small">{p.note}</p>
            <Link href={`/admin/pages/${p.id}`} className="btn btn-amber btn-sm">Edit {p.title} →</Link>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <h3>Related editors</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/settings" className="btn btn-dark btn-sm">Site Settings — stats, testimonials, socials, brokers</Link>
          <Link href="/admin/mentors" className="btn btn-dark btn-sm">Mentors — name, bio, tags, photo</Link>
          <Link href="/admin/lessons" className="btn btn-dark btn-sm">Lessons — titles, YouTube IDs</Link>
        </div>
      </div>
    </div>
  );
}
