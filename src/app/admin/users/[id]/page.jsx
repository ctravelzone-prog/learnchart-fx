// ---------------------------------------------------------------------------
// admin/users/[id] — one student's detail: profile, enrollments, posts.
// Deactivate blocks the account immediately (login refused, existing
// sessions killed — see src/lib/auth.js); reactivate restores it.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/admin.js";
import { getAdminUserDetail } from "../../../../lib/db.js";

export const metadata = { title: "User Detail — Admin — LearnChart FX" };

export default async function AdminUserDetailPage({ params, searchParams }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const detail = getAdminUserDetail(Number(id));
  if (!detail) notFound();

  return (
    <div className="wrap section">
      <p className="muted small"><Link href="/admin/users" className="amber">← Users</Link></p>
      <h1 style={{ fontSize: 32 }}>{detail.name}</h1>
      <p className="muted">{detail.email} · Member since {new Date(detail.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}
      <p>
        Status:{" "}
        {detail.status === "active" ? (
          <span className="badge badge-green">Active</span>
        ) : (
          <span className="badge badge-amber">Deactivated</span>
        )}
      </p>

      <form action="/api/admin/users/status" method="post" style={{ marginBottom: 20 }}>
        <input type="hidden" name="id" value={detail.id} />
        <input type="hidden" name="status" value={detail.status === "active" ? "deactivated" : "active"} />
        <button type="submit" className="btn btn-dark">
          {detail.status === "active" ? "Deactivate this account" : "Reactivate this account"}
        </button>
        {detail.status === "active" ? (
          <span className="small muted" style={{ marginLeft: 10 }}>Deactivation blocks login immediately.</span>
        ) : null}
      </form>

      <div className="grid-2">
        <div className="card">
          <h3>Enrollments ({detail.enrollments.length})</h3>
          {detail.enrollments.length === 0 ? (
            <p className="muted">No enrollments yet.</p>
          ) : (
            detail.enrollments.map((e) => (
              <p key={e.id} style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <Link href={`/admin/enrollments/${e.id}`} className="amber"><strong>{e.course_title}</strong></Link>
                <br /><span className="small muted">Status: {e.status} · {new Date(e.created_at).toLocaleDateString("en-GB")}</span>
              </p>
            ))
          )}
        </div>
        <div className="card">
          <h3>Community Posts ({detail.posts.length})</h3>
          {detail.posts.length === 0 ? (
            <p className="muted">No posts yet.</p>
          ) : (
            detail.posts.slice(0, 10).map((p) => (
              <p key={p.id} className="small" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                {p.text.slice(0, 120)}{p.text.length > 120 ? "…" : ""}
                <br /><span className="muted">{new Date(p.created_at).toLocaleDateString("en-GB")}</span>
              </p>
            ))
          )}
          <Link href="/admin/community" className="btn btn-dark btn-sm">Moderate Community →</Link>
        </div>
      </div>
    </div>
  );
}
