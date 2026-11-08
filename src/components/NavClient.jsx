// ---------------------------------------------------------------------------
// NavClient.jsx — the floating pill nav's inner content (client component).
// Uses usePathname() so the link for the page the visitor is on is marked
// active — the design file's active-nav style (amber text + underline).
// The server wrapper (Nav.jsx) only decides logged-in state; this component
// decides which link is current, so it is right on direct visits and
// refreshes too, not only after clicking.
// ---------------------------------------------------------------------------
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavBurger from "./NavBurger.jsx";

export default function NavClient({ loggedIn }) {
  // Current route ("/", "/courses", "/contact", ...).
  const pathname = usePathname() || "/";

  // True when the link's page is the one being viewed. "/" matches exactly
  // (every path starts with "/"); other links match their page and its
  // sub-pages, so /courses stays active on /courses/... and /enroll/...
  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };
  // The Enroll flow lives under /enroll/<slug>, not under /courses — but it
  // is part of Courses & Services, so it keeps that link active too.
  const coursesActive =
    isActive("/courses") || pathname.startsWith("/enroll");

  const link = (href, label, active) => (
    <Link href={href} className={active ? "active" : ""}>{label}</Link>
  );

  return (
    <nav className="pill-nav">
      <Link href="/" className="brand">
        <span className="mark">LC</span>
        <span className="name">LEARNCHART <span>FX</span></span>
      </Link>
      <div className="nav-links" id="nav-links">
        {link("/", "Home", isActive("/"))}
        {link("/courses", "Courses & Services", coursesActive)}
        {link("/contact", "Contact Us", isActive("/contact"))}
        {loggedIn ? link("/chat", "Chat", isActive("/chat")) : null}
      </div>
      <div className="nav-right">
        {loggedIn ? (
          <>
            <Link href="/profile" className={`btn btn-dark btn-sm hide-mobile${isActive("/profile") ? " active" : ""}`}>My Profile</Link>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="btn btn-ghost btn-sm">Log Out</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-dark btn-sm hide-mobile">Log In</Link>
            <Link href="/courses" className="btn btn-amber btn-sm">Enroll Now</Link>
          </>
        )}
        <NavBurger />
      </div>
    </nav>
  );
}
