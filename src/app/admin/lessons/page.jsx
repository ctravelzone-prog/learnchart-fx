// ---------------------------------------------------------------------------
// admin/lessons — all video lessons, grouped by course. This is where
// the placeholder YouTube IDs finally get filled: edit a lesson, paste
// the Unlisted YouTube video ID, save — the lesson plays on the Course
// Videos page. "Add Lesson" works for any course.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { getAllLessons, getAllCourses } from "../../../lib/db.js";

export const metadata = { title: "Lessons — Admin — LearnChart FX" };

export default async function AdminLessonsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const courseFilter = Number(sp?.course || 0) || null;
  const courses = getAllCourses();
  const all = getAllLessons();
  const lessons = courseFilter ? all.filter((l) => l.course_id === courseFilter) : all;

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Lessons ({lessons.length})</h1>
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}
      <form method="get" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select name="course" defaultValue={courseFilter || ""}>
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-dark">Filter</button>
        <Link href="/admin/lessons/new" className="btn btn-amber">+ Add Lesson</Link>
      </form>
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>#</th><th>Lesson</th><th>Course</th><th>Duration</th><th>YouTube ID</th><th></th></tr>
          </thead>
          <tbody>
            {lessons.map((l) => (
              <tr key={l.id}>
                <td>{l.position}</td>
                <td><strong>{l.title}</strong></td>
                <td className="small">{l.course_title}</td>
                <td className="small">{l.duration || "—"}</td>
                <td>{l.youtube_id ? <span className="mono small">{l.youtube_id}</span> : <span className="badge badge-amber">No video yet</span>}</td>
                <td><Link href={`/admin/lessons/${l.id}`} className="amber">Edit →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {lessons.length === 0 ? <p className="muted" style={{ padding: 12 }}>No lessons yet — add one for a video course.</p> : null}
      </div>
    </div>
  );
}
