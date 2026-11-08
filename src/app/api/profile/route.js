// ---------------------------------------------------------------------------
// api/profile — profile picture upload (prompt Section 15). Image files
// only (jpeg/png/webp/gif), max 5 MB. The picture is resized with sharp
// so uploads stay small, and saved under /public/uploads/profiles/.
// Any other file type (including video) is rejected server-side.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../lib/http.js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { getDb } from "../../../lib/db.js";
import { getSessionUser } from "../../../lib/auth.js";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return redirectTo("/login?next=/profile");

  const form = await request.formData();
  const file = form.get("picture");
  if (!file || typeof file === "string" || file.size === 0) {
    return redirectTo("/profile?error=" + encodeURIComponent("Please choose an image file."));
  }
  // Server-side validation: images only, size limit. Video is rejected.
  if (!ALLOWED.has(file.type) || file.size > MAX_BYTES) {
    return redirectTo("/profile?error=" + encodeURIComponent("Only image files (JPG, PNG, WebP, GIF) up to 5 MB are allowed."));
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
  const name = `${user.id}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "profiles");
  fs.mkdirSync(dir, { recursive: true });
  // Compress + resize to a 256px square so profile pictures stay small.
  await sharp(buffer).resize(256, 256, { fit: "cover" }).toFile(path.join(dir, name));
  const url = `/uploads/profiles/${name}`;
  getDb().prepare("UPDATE users SET profile_pic = ? WHERE id = ?").run(url, user.id);
  return redirectTo("/profile?saved=1");
}
