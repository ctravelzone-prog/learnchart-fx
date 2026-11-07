// ---------------------------------------------------------------------------
// sitemap.js — SEO sitemap. Public pages only; gated pages (Community,
// Live Room, Consultation, Course Videos, Profile) are noindex and are
// deliberately NOT listed here.
// ---------------------------------------------------------------------------
export default function sitemap() {
  const base = process.env.SITE_URL || "https://learnchart-fx.onrender.com";
  const pages = ["", "/courses", "/mentors", "/faq", "/contact", "/signup", "/login"];
  return pages.map((p) => ({
    url: `${base}${p || "/"}`,
    lastModified: new Date(),
    changeFrequency: p === "" ? "weekly" : "monthly",
    priority: p === "" ? 1 : 0.8,
  }));
}
