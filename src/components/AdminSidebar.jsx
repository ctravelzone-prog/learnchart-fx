// ---------------------------------------------------------------------------
// AdminSidebar.jsx — the admin panel's navigation, rebuilt minimal (Nov 2026).
// The old top bar crammed all 14 admin links into one long row and read as
// cluttered ("hibijibi"). This is a slim left sidebar on desktop: links
// grouped into quiet sections, labels only (no icon noise), the current
// page marked with amber text + a soft amber background + a left bar.
// On phones it becomes a hamburger drawer. Client component: usePathname()
// decides the active link, so it is right on direct visits and refreshes
// too, not only after clicking. The server wrapper (AdminNav.jsx) only
// decides whether an admin is logged in.
// ---------------------------------------------------------------------------
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Grouped links — same destinations as before, plus Consultations
// (Nov 2026): booking requests from Trading Consultation members.
const GROUPS = [
  {
    label: "Overview",
    links: [
      ["/admin", "Dashboard"],
      ["/admin/status", "Status"],
    ],
  },
  {
    label: "People",
    links: [["/admin/users", "Users"]],
  },
  {
    label: "Content",
    links: [
      ["/admin/courses", "Courses"],
      ["/admin/lessons", "Lessons"],
      ["/admin/faq", "FAQ"],
      ["/admin/mentors", "Mentors"],
      ["/admin/pages", "Pages"],
    ],
  },
  {
    label: "Commerce",
    links: [
      ["/admin/enrollments", "Enrollments"],
      ["/admin/payments", "Payments"],
      ["/admin/payment-settings", "Payment Settings"],
    ],
  },
  {
    label: "Community",
    links: [
      ["/admin/community", "Community"],
      ["/admin/consultations", "Consultations"],
      ["/admin/contact", "Contact Inbox"],
    ],
  },
  {
    label: "Settings",
    links: [
      ["/admin/settings", "Site Settings"],
      ["/admin/live-settings", "Live Settings"],
    ],
  },
];

export default function AdminSidebar({ email }) {
  // Current route ("/admin", "/admin/courses", ...).
  const pathname = usePathname() || "/admin";
  // Mobile drawer open/closed.
  const [open, setOpen] = useState(false);

  // True when the link's page is the one being viewed. "/admin" matches
  // exactly (every admin path starts with it); other links match their
  // page and its sub-pages, so Courses stays active on /admin/courses/123.
  const isActive = (href) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Slim top bar — phones only (hidden on desktop by CSS). */}
      <div className="admin-topbar">
        <span className="admin-topbar-brand">
          <span className="admin-mark">LC</span> Admin
        </span>
        <button
          type="button"
          className="admin-burger"
          aria-label="Open admin menu"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
      </div>

      {/* Tap the dimmed backdrop to close the drawer. */}
      {open ? (
        <button
          type="button"
          className="admin-backdrop"
          aria-label="Close admin menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside className={`admin-sidebar${open ? " open" : ""}`}>
        <div className="admin-side-brand">
          <span className="admin-mark">LC</span>
          <span>
            <strong>LearnChart FX</strong>
            <small>Admin</small>
          </span>
        </div>

        <nav className="admin-side-nav">
          {GROUPS.map((group) => (
            <div key={group.label} className="admin-side-group">
              <div className="admin-side-label">{group.label}</div>
              {group.links.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={`admin-side-link${isActive(href) ? " active" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-side-foot">
          <div className="admin-side-email" title={email}>
            {email}
          </div>
          <Link href="/admin/change-password" className="admin-side-link small">
            Change Password
          </Link>
          <div className="admin-side-actions">
            <form action="/api/admin/logout" method="post">
              <button type="submit" className="btn btn-ghost btn-sm">
                Log Out
              </button>
            </form>
            <Link href="/" className="btn btn-dark btn-sm">
              View Site →
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
