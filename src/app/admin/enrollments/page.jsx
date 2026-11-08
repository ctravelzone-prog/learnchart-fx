// ---------------------------------------------------------------------------
// admin/enrollments — all enrollments, newest first, filterable by
// offer. Each row links to the detail page (status actions, Course Key
// view + resend, payments for that student + course).
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { listEnrollments, getAllCourses, isEnrollmentActive } from "../../../lib/db.js";

export const metadata = { title: "Enrollments — Admin — LearnChart FX" };

export default async function AdminEnrollmentsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = String(sp?.course || "");
  const courses = getAllCourses();
  const enrollments = listEnrollments(filter || null);

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Enrollments ({enrollments.length})</h1>
      <form method="get" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select name="course" defaultValue={filter}>
          <option value="">All offers</option>
          {courses.map((c) => (
            <option key={c.slug} value={c.slug}>{c.title}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-dark">Filter</button>
      </form>
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Student</th><th>Course</th><th>Status</th><th>Expires</th><th>Payment</th><th>Enrolled</th><th></th></tr>
          </thead>
          <tbody>
            {enrollments.map((e) => {
              // Monthly expiry governs access: an 'active' row whose 30
              // days ran out shows Expired (red) here, not Active.
              const expired = e.status === "active" && e.expires_at && !isEnrollmentActive(e);
              return (
              <tr key={e.id}>
                <td><strong>{e.user_name}</strong><br /><span className="small muted">{e.user_email}</span></td>
                <td>{e.course_title}</td>
                <td>
                  {expired ? (
                    <span className="badge" style={{ background: "#fde8e8", color: "#b42318" }}>Expired</span>
                  ) : e.status === "active" ? (
                    <span className="badge badge-green">Active</span>
                  ) : (
                    <span className="badge badge-amber">{e.status}</span>
                  )}
                </td>
                <td className="small muted">
                  {e.expires_at
                    ? new Date(String(e.expires_at).replace(" ", "T") + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </td>
                <td className="small muted">{e.payment_status || "—"}</td>
                <td className="small muted">{new Date(e.created_at).toLocaleDateString("en-GB")}</td>
                <td><Link href={`/admin/enrollments/${e.id}`} className="amber">View →</Link></td>
              </tr>
              );
            })}
          </tbody>
        </table>
        {enrollments.length === 0 ? <p className="muted" style={{ padding: 12 }}>No enrollments found.</p> : null}
      </div>
    </div>
  );
}
