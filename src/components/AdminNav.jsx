// ---------------------------------------------------------------------------
// AdminNav.jsx — the admin panel's own nav bar. Server component: shows
// the logged-in admin's email and links to every admin section. This is
// NOT in the public nav (Nav.jsx) — the admin area is only reachable at
// /admin, and only with an admin session. Rendered by the admin layout.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getAdminUser } from "../lib/admin.js";

const LINKS = [
  ["/admin", "Dashboard"],
  ["/admin/users", "Users"],
  ["/admin/courses", "Courses"],
  ["/admin/enrollments", "Enrollments"],
  ["/admin/payments", "Payments"],
  ["/admin/lessons", "Lessons"],
  ["/admin/community", "Community"],
  ["/admin/faq", "FAQ"],
  ["/admin/contact", "Contact Inbox"],
  ["/admin/mentors", "Mentors"],
  ["/admin/pages", "Pages"],
  ["/admin/settings", "Site Settings"],
  ["/admin/payment-settings", "Payment Settings"],
  ["/admin/status", "Status"],
];

export default async function AdminNav({ active }) {
  const admin = await getAdminUser();
  if (!admin) return null;
  return (
    <div className="admin-nav">
      <div className="wrap admin-nav-inner">
        <span className="admin-brand">🛠 ADMIN</span>
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className={active === href ? "active" : ""}>
            {label}
          </Link>
        ))}
        <span className="admin-user">
          {admin.email} ·{" "}
          <Link href="/admin/change-password">Change Password</Link>
        </span>
        <form action="/api/admin/logout" method="post" style={{ display: "inline" }}>
          <button type="submit" className="btn btn-ghost btn-sm">Log Out</button>
        </form>
        <Link href="/" className="btn btn-dark btn-sm">View Site →</Link>
      </div>
    </div>
  );
}
