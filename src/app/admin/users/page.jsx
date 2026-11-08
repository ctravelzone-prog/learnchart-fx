// ---------------------------------------------------------------------------
// admin/users — all students, newest first, searchable by name or email.
// Each row links to the student's detail page (enrollments + posts).
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { listUsers } from "../../../lib/db.js";

export const metadata = { title: "Users — Admin — LearnChart FX" };

export default async function AdminUsersPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const q = String(sp?.q || "");
  const users = listUsers(q);

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Users ({users.length})</h1>
      <form method="get" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input name="q" defaultValue={q} placeholder="Search name or email…" style={{ flex: 1 }} />
        <button type="submit" className="btn btn-dark">Search</button>
        {q ? <Link href="/admin/users" className="btn btn-ghost btn-sm">Clear</Link> : null}
      </form>
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Status</th><th>Enrollments</th><th>Joined</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td>{u.status === "active" ? <span className="badge badge-green">Active</span> : <span className="badge badge-amber">Deactivated</span>}</td>
                <td>{u.enrollments}</td>
                <td className="muted small">{new Date(u.created_at).toLocaleDateString("en-GB")}</td>
                <td><Link href={`/admin/users/${u.id}`} className="amber">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 ? <p className="muted" style={{ padding: 12 }}>No users found.</p> : null}
      </div>
    </div>
  );
}
