// ---------------------------------------------------------------------------
// admin/lessons/[id] + /new — ONE shared lesson form (admin only).
// Fields: course, position, title, duration, YouTube video ID,
// description. The YouTube ID is the Unlisted video ID from YouTube
// Studio (the part after v= in the video URL). Empty = the lesson
// shows the "[Placeholder]" player note on the Course Videos page.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/admin.js";
import { getLesson, getAllCourses } from "../../../../lib/db.js";

export const metadata = { title: "Lesson — Admin — LearnChart FX" };

export default async function AdminLessonFormPage({ params, searchParams }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const lesson = isNew ? null : getLesson(Number(id));
  if (!isNew && !lesson) notFound();
  const courses = getAllCourses();

  const l = lesson || { course_id: courses[0]?.id || 0, position: 1, title: "", duration: "", youtube_id: "", description: "" };

  return (
    <div className="wrap section">
      <p className="muted small"><Link href="/admin/lessons" className="amber">← Lessons</Link></p>
      <h1 style={{ fontSize: 32 }}>{isNew ? "Add Lesson" : `Edit Lesson ${lesson.position} — ${lesson.title}`}</h1>
      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}

      <form action="/api/admin/lessons" method="post">
        <input type="hidden" name="action" value={isNew ? "create" : "update"} />
        {!isNew ? <input type="hidden" name="id" value={lesson.id} /> : null}
        <div className="card">
          <div className="grid-2">
            <div className="field">
              <label htmlFor="course_id">Course *</label>
              <select id="course_id" name="course_id" defaultValue={l.course_id}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="position">Position (lesson number)</label>
              <input id="position" name="position" type="number" min="1" defaultValue={l.position} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="title">Lesson title *</label>
            <input id="title" name="title" required defaultValue={l.title} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="duration">Duration</label>
              <input id="duration" name="duration" defaultValue={l.duration} placeholder="9 min" />
            </div>
            <div className="field">
              <label htmlFor="youtube_id">YouTube video ID (Unlisted)</label>
              <input id="youtube_id" name="youtube_id" defaultValue={l.youtube_id} placeholder="e.g. dQw4w9WgXcQ" style={{ fontFamily: "monospace" }} />
              <p className="small muted">From YouTube Studio — the video must be Unlisted (not Private), or it will not play in the embed.</p>
            </div>
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={3} defaultValue={l.description} />
          </div>
          <button type="submit" className="btn btn-amber">{isNew ? "Add Lesson" : "Save Lesson"}</button>
        </div>
      </form>

      {!isNew ? (
        <form action="/api/admin/lessons" method="post" style={{ marginTop: 16 }}>
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="id" value={lesson.id} />
          <button type="submit" className="btn btn-dark">Delete this lesson</button>
        </form>
      ) : null}
    </div>
  );
}
