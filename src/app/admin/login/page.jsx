// ---------------------------------------------------------------------------
// admin/login — the master admin login page. Separate from the student
// login: this checks the `admins` table and creates an ADMIN session
// (its own cookie). No registration link exists anywhere — admins are
// created only by seed/env, never from a public form.
// ---------------------------------------------------------------------------
import { redirect } from "next/navigation";
import { getAdminUser } from "../../../lib/admin.js";

export const metadata = {
  title: "Admin Login — LearnChart FX",
  description: "Master admin panel login.",
};

export default async function AdminLoginPage({ searchParams }) {
  const sp = await searchParams;
  // Already logged in as admin? Straight to the dashboard.
  const admin = await getAdminUser();
  if (admin) redirect("/admin");

  return (
    <div className="wrap section">
      <div className="card form-card">
        <p className="muted small">LEARNCHART FX · MASTER ADMIN</p>
        <h1 style={{ fontSize: 32 }}>Admin Login</h1>
        <p className="muted">
          This is the site owner&apos;s panel — students log in on the normal Log In page.
        </p>
        {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}
        <form action="/api/admin/login" method="post">
          <div className="field">
            <label htmlFor="email">Admin email</label>
            <input id="email" name="email" type="email" required autoComplete="username" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>
            Log In to Admin Panel
          </button>
        </form>
      </div>
    </div>
  );
}
