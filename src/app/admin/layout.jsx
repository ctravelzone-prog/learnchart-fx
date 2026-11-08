// ---------------------------------------------------------------------------
// admin/layout.jsx — wrapper for every /admin page. The admin panel is
// never indexed (robots noindex on every admin page). The sidebar (via
// AdminNav) shows only when an admin session exists — the login page
// itself shows without it, and the shell still lays out cleanly then
// because the main column simply takes the full width.
// ---------------------------------------------------------------------------
import "./admin.css";
import AdminNav from "../../components/AdminNav.jsx";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <div className="admin-shell">
      <AdminNav />
      <div className="admin-main">{children}</div>
    </div>
  );
}
