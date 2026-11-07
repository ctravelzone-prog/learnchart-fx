// NavBurger.jsx — the mobile menu button (client component: only this
// tiny toggle needs JavaScript; the rest of the nav is server-rendered).
"use client";
export default function NavBurger() {
  function toggle() {
    document.getElementById("nav-links")?.classList.toggle("open");
  }
  return (
    <button type="button" className="burger" onClick={toggle} aria-label="Menu">☰</button>
  );
}
