// ---------------------------------------------------------------------------
// AdminNav.jsx — the admin panel's own navigation. Server component: shows
// only when an admin session exists (the login page itself shows without
// it). It only decides logged-in state and passes the admin's email down;
// the sidebar itself (AdminSidebar.jsx) decides which link is current.
// SECURITY does not live here: every /admin page calls requireAdmin() and
// every /api/admin route calls getAdminUser().
// ---------------------------------------------------------------------------
import { getAdminUser } from "../lib/admin.js";
import AdminSidebar from "./AdminSidebar.jsx";

export default async function AdminNav() {
  const admin = await getAdminUser();
  if (!admin) return null;
  return <AdminSidebar email={admin.email} />;
}
