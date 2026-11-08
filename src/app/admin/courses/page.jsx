// ---------------------------------------------------------------------------
// admin/courses — all courses & services. Shows the flags that drive
// the gates (video lessons + key, unlocks area) so the owner can see
// at a glance what each course does. "Add Course" opens the full form
// — a course added here works end-to-end with zero code changes.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { getAllCourses } from "../../../lib/db.js";

export const metadata = { title: "Courses — Admin — LearnChart FX" };

export default async function AdminCoursesPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const courses = getAllCourses();

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Courses &amp; Services ({courses.length})</h1>
      <p className="muted">
        A course added here appears on the Courses page and in the student dashboard immediately.
        <strong> Video lessons + key</strong> gives its students lessons and a unique emailed Course Key.
        <strong> Unlocks</strong> opens the Live Room or Consultation for its students (Community is any enrollment).
      </p>
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}
      <p><Link href="/admin/courses/new" className="btn btn-amber">+ Add Course</Link></p>
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Course</th><th>Price</th><th>Videos + Key</th><th>Unlocks</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.title}</strong><br /><span className="small muted">{c.slug}</span></td>
                <td>{c.price_label}</td>
                <td>{c.has_videos ? <span className="badge badge-green">Yes</span> : <span className="muted small">No</span>}</td>
                <td>{c.unlocks === "none" ? <span className="muted small">—</span> : <span className="badge badge-amber">{c.unlocks}</span>}</td>
                <td className="small">{c.status}</td>
                <td>
                  <Link href={`/admin/courses/${c.id}`} className="amber">Edit →</Link>
                  {" · "}
                  <Link href={`/admin/lessons?course=${c.id}`} className="amber">Lessons</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
