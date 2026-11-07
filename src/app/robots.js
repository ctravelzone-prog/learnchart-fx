// ---------------------------------------------------------------------------
// robots.js — allow public pages; disallow gated areas from crawling.
// (Gated pages also carry noindex metadata as a second layer.)
// ---------------------------------------------------------------------------
export default function robots() {
  const base = process.env.SITE_URL || "https://learnchart-fx.onrender.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courses", "/mentors", "/faq", "/contact"],
        disallow: ["/community", "/live-room", "/consultation", "/course-videos", "/profile", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
