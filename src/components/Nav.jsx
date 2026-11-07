// ---------------------------------------------------------------------------
// Nav.jsx — the floating pill nav, shared by every page (prompt Section 6).
// Server component: reads the session so logged-in state shows on every
// page (profile access + Log Out), without any client JavaScript.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getSessionUser } from "../lib/auth.js";
import NavBurger from "./NavBurger.jsx";

export default async function Nav({ active }) {
  // Who is logged in right now (null for visitors).
  const user = await getSessionUser();
  const link = (href, label) => (
    <Link href={href} className={active === href ? "active" : ""}>{label}</Link>
  );
  return (
    <div className="nav-shell">
      <nav className="pill-nav">
        <Link href="/" className="brand">
          <span className="mark">LC</span>
          <span className="name">LEARNCHART <span>FX</span></span>
        </Link>
        <div className="nav-links" id="nav-links">
          {link("/", "Home")}
          {link("/courses", "Courses & Services")}
          {link("/contact", "Contact Us")}
        </div>
        <div className="nav-right">
          {user ? (
            <>
              <Link href="/profile" className="btn btn-dark btn-sm hide-mobile">My Profile</Link>
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
    </div>
  );
}
