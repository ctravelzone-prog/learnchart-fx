// ---------------------------------------------------------------------------
// admin/change-password — the logged-in admin changes their own
// password (admin only). Old password must verify; the new one must
// be 8+ characters and typed twice. Sets password_changed = 1, which
// clears the dashboard's "please change your password" notice.
// ---------------------------------------------------------------------------
import { requireAdmin } from "../../../lib/admin.js";

export const metadata = { title: "Change Admin Password — LearnChart FX" };

export default async function AdminChangePasswordPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;

  return (
    <div className="wrap section">
      <div className="card form-card">
        <p className="muted small">MASTER ADMIN</p>
        <h1 style={{ fontSize: 32 }}>Change Admin Password</h1>
        {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}
        <form action="/api/admin/change-password" method="post">
          <div className="field">
            <label htmlFor="current">Current password</label>
            <input id="current" name="current" type="password" required autoComplete="current-password" />
          </div>
          <div className="field">
            <label htmlFor="next">New password (8+ characters)</label>
            <input id="next" name="next" type="password" required autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="confirm">New password again</label>
            <input id="confirm" name="confirm" type="password" required autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
