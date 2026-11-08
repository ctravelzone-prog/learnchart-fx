// ---------------------------------------------------------------------------
// admin/layout.jsx — wrapper for every /admin page. The admin panel is
// never indexed (robots noindex on every admin page). The admin nav bar
// shows only when an admin session exists — the login page itself shows
// without it. SECURITY does not live here: every /admin page calls
// requireAdmin() and every /api/admin route calls getAdminUser(); this
// layout only decides whether to display the nav.
// ---------------------------------------------------------------------------
import AdminNav from "../../components/AdminNav.jsx";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
