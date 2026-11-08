// ---------------------------------------------------------------------------
// upload-image.js — shared image upload for the ADMIN panel (page pictures,
// mentor photos, course card images). Same validation as the student
// profile picture: images only (jpeg/png/webp/gif), max 5 MB — video
// and any other file type are rejected server-side. Files are resized
// with sharp (max 1200px wide, aspect kept) and saved as WebP under
// /public/uploads/<folder>/. Returns { ok: true, url } or
// { ok: false, reason }. NOTE: on Render's free tier the uploads folder
// is wiped on redeploy, like the database — the same hosting caveat.
// ---------------------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function saveAdminImage(file, folder) {
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, reason: "No image file was chosen." };
  }
  if (!ALLOWED.has(file.type) || file.size > MAX_BYTES) {
    return { ok: false, reason: "Only image files (JPG, PNG, WebP, GIF) up to 5 MB are allowed." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = `${folder}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.webp`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  fs.mkdirSync(dir, { recursive: true });
  await sharp(buffer).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toFile(path.join(dir, name));
  return { ok: true, url: `/uploads/${folder}/${name}` };
}
