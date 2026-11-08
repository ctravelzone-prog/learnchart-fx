// ---------------------------------------------------------------------------
// admin — the master admin dashboard. Counts only; every section has its
// own page linked from the admin nav. Guarded by requireAdmin() — a
// student session (or no session) is sent to the admin login page.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../lib/admin.js";
import { getAdminStats } from "../../lib/db.js";

export const metadata = {
  title: "Admin Dashboard — LearnChart FX",
  description: "Master admin panel — site overview.",
};

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const stats = getAdminStats();

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Admin Dashboard</h1>
      <p className="muted">Welcome, {admin.email} — full control of LearnChart FX.</p>

      {/* Until the preview-default password is changed, say so loudly. */}
      {!admin.password_changed ? (
        <div className="alert alert-error">
          <strong>Please change your admin password.</strong> You are still using the
          preview-default password.{" "}
          <Link href="/admin/change-password" className="amber">Change it now →</Link>
        </div>
      ) : null}

      <div className="stat-strip">
        <div className="card stat-card"><b>{stats.users}</b><span className="muted">Total Users</span></div>
        <div className="card stat-card"><b>{stats.posts}</b><span className="muted">Community Posts</span></div>
        <div className="card stat-card"><b>{stats.unreadContact}</b><span className="muted">Unread Contact Messages</span></div>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3>Enrollments by Offer</h3>
          {stats.enrollmentsByCourse.map((c) => (
            <p key={c.slug} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{c.title}</span><strong>{c.count}</strong>
            </p>
          ))}
          <Link href="/admin/enrollments" className="btn btn-dark btn-sm">All Enrollments →</Link>
        </div>
        <div className="card">
          <h3>Payments by Method</h3>
          {stats.paymentsByMethod.length === 0 ? (
            <p className="muted">No verified payments yet.</p>
          ) : (
            stats.paymentsByMethod.map((p) => (
              <p key={`${p.method}-${p.status}`} style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{p.method} · {p.status}</span><strong>{p.count}</strong>
              </p>
            ))
          )}
          <Link href="/admin/payments" className="btn btn-dark btn-sm">All Payments →</Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Quick Links</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin/lessons" className="btn btn-dark btn-sm">Lessons — set YouTube IDs</Link>
          <Link href="/admin/payment-settings" className="btn btn-dark btn-sm">Payment Settings</Link>
          <Link href="/admin/settings" className="btn btn-dark btn-sm">Site Settings</Link>
          <Link href="/admin/contact" className="btn btn-dark btn-sm">Contact Inbox ({stats.unreadContact} new)</Link>
          <Link href="/admin/status" className="btn btn-dark btn-sm">Payment &amp; Email Status</Link>
        </div>
      </div>
    </div>
  );
}
