// ---------------------------------------------------------------------------
// Nav.jsx — the floating pill nav, shared by every page (prompt Section 6).
// Server component: reads the session so logged-in state shows on every
// page (profile access + Log Out), without any client JavaScript of its own.
// The links themselves live in NavClient, which uses the current route to
// mark the active page (amber + underline, the design file's active style).
// ---------------------------------------------------------------------------
import { getSessionUser } from "../lib/auth.js";
import NavClient from "./NavClient.jsx";

export default async function Nav() {
  // Who is logged in right now (null for visitors).
  const user = await getSessionUser();
  return (
    <div className="nav-shell">
      <NavClient loggedIn={!!user} />
    </div>
  );
}
