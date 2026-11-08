// ---------------------------------------------------------------------------
// api/community/posts — create a post (prompt Sections 16–17).
// Rules enforced HERE on the server (and in the UI): text allowed;
// picture upload allowed (images only, 5 MB, compressed with sharp);
// VIDEO UPLOAD IS NOT ALLOWED ANYWHERE — no video field exists, and any
// video file is rejected. A Google Drive link is validated (must be a
// real Drive link) and stored as a file id only — the video streams from
// Drive, never from this hosting.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { canEnterCommunity } from "../../../../lib/access.js";
import { parseDriveFileId } from "../../../../lib/drive.js";
import { isBgColorKey } from "../../../../lib/post-colors.js";

const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

// Where the post returns to after publishing: only the two real
// origins are allowed (the Community feed, or the profile page when
// the post started from the profile composer) — anything else falls
// back to /community. Never an open redirect.
function safeReturnTo(value) {
  return value === "/profile" ? "/profile" : "/community";
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return redirectTo("/community");
  }
  const form = await request.formData();
  const text = String(form.get("text") || "").trim();
  const driveUrl = String(form.get("drive_url") || "").trim();
  const file = form.get("image");
  const returnTo = safeReturnTo(String(form.get("return_to") || ""));
  // Background color (Facebook "Aa" palette, from the Create Post
  // modal): only a key from the palette is stored, and only for
  // TEXT-ONLY posts — a photo or Drive video clears it.
  const bgColorRaw = String(form.get("bg_color") || "").trim();

  // A post needs text, a picture, or a Drive video — not an empty post.
  if (!text && (!file || typeof file === "string" || file.size === 0) && !driveUrl) {
    return redirectTo(`${returnTo}?error=` + encodeURIComponent("Write something, add a picture, or paste a Drive video link."));
  }
  if (text.length > 5000) {
    return redirectTo(`${returnTo}?error=` + encodeURIComponent("Post text is too long (max 5000 characters)."));
  }

  // Drive link: must be a real Google Drive link, or the post is refused.
  let driveFileId = null;
  if (driveUrl) {
    driveFileId = parseDriveFileId(driveUrl);
    if (!driveFileId) {
      return redirectTo(`${returnTo}?error=` + encodeURIComponent("That is not a valid Google Drive video link. Paste a link to a video in your own Google Drive, and set its sharing to 'Anyone with the link can view'."));
    }
  }

  // Picture: images only, size limit. Video files are rejected outright.
  let imagePath = null;
  if (file && typeof file !== "string" && file.size > 0) {
    if (!ALLOWED_IMAGE.has(file.type) || file.size > MAX_BYTES) {
      return redirectTo(`${returnTo}?error=` + encodeURIComponent("Pictures only (JPG, PNG, WebP, GIF up to 5 MB). Video upload is not allowed — paste a Google Drive link instead."));
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = `${user.id}-${crypto.randomBytes(8).toString("hex")}.jpg`;
    const dir = path.join(process.cwd(), "public", "uploads", "posts");
    fs.mkdirSync(dir, { recursive: true });
    // Compress to max 1200px wide JPEG so the feed stays fast.
    await sharp(buffer).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(path.join(dir, name));
    imagePath = `/uploads/posts/${name}`;
  }

  // Background color: only a palette key, and only when the post has
  // no photo and no Drive video (text-only posts).
  const bgColor = !imagePath && !driveFileId && isBgColorKey(bgColorRaw) ? bgColorRaw : "";

  getDb()
    .prepare("INSERT INTO posts (user_id, text, image_path, drive_file_id, drive_url, bg_color) VALUES (?, ?, ?, ?, ?, ?)")
    .run(user.id, text, imagePath, driveFileId, driveUrl || null, bgColor);
  return redirectTo(`${returnTo}?posted=1`);
}
