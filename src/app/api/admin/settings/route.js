// ---------------------------------------------------------------------------
// api/admin/settings — save the Site Settings form (admin only).
// The form posts JSON textareas for stats / testimonials / socials /
// brokers (one item per line, fields separated by " | ") plus single
// values (inside video ID, providers, contact info, next-batch date,
// footer mission). Invalid JSON lines are ignored rather than wiping
// the list — the page re-renders with what it understood.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { setSetting } from "../../../../lib/db.js";
import { getAdminUser } from "../../../../lib/admin.js";

function parsePipeList(text, mapLine) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(mapLine)
    .filter(Boolean);
}

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();

  // Stats: "value | label" per line.
  const stats = parsePipeList(form.get("stats"), (line) => {
    const [value, label] = line.split("|").map((s) => s.trim());
    return value && label ? { value, label } : null;
  });
  if (stats.length > 0) setSetting("stats", JSON.stringify(stats));

  // Testimonials: "name | role | quote" per line.
  const testimonials = parsePipeList(form.get("testimonials"), (line) => {
    const [name, role, quote] = line.split("|").map((s) => s.trim());
    return name && quote ? { name, role: role || "", quote } : null;
  });
  if (testimonials.length > 0) setSetting("testimonials", JSON.stringify(testimonials));

  // Socials: "platform | handle | description | cta" per line.
  const socials = parsePipeList(form.get("socials"), (line) => {
    const [platform, handle, desc, cta] = line.split("|").map((s) => s.trim());
    return platform ? { platform, handle: handle || "", desc: desc || "", cta: cta || "Visit" } : null;
  });
  if (socials.length > 0) setSetting("socials", JSON.stringify(socials));

  // Brokers: "name | link" per line (link may be empty = placeholder).
  const brokers = parsePipeList(form.get("brokers"), (line) => {
    const [name, link] = line.split("|").map((s) => s.trim());
    return name ? { name, link: link || "" } : null;
  });
  if (brokers.length > 0) setSetting("brokers", JSON.stringify(brokers));

  // Single values (empty = keep the previous value, except the
  // inside-video ID which may be cleared back to the placeholder).
  const singles = ["consult_provider", "contact_email", "contact_phone", "contact_address", "next_batch_date", "site_mission"];
  for (const key of singles) {
    const value = String(form.get(key) || "").trim();
    if (value) setSetting(key, value);
  }
  const insideVideo = String(form.get("inside_video_id") || "").trim();
  if (insideVideo) setSetting("inside_video_id", insideVideo);

  return redirectTo("/admin/settings?saved=1");
}
