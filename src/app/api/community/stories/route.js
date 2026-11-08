// ---------------------------------------------------------------------------
// api/community/stories — 24-hour stories (Nov 2026).
// POST: add one or more story photos (images only, max 5 MB each, max
// 10 per submit — same rules as profile pictures). Each photo becomes
// one story row expiring 24 hours after upload; the file is saved under
// public/uploads/stories/ so the existing /api/files serving + /uploads
// rewrite displays it. Only PAID community members (an active paid
// enrollment — Nov 2026, Siam's order) can post. VIDEO UPLOAD IS NOT
// GET: live stories grouped by author as JSON (for the story viewer).
// Every read filters expires_at > now AND deletes expired rows + files
// first (src/lib/stories.js), so an expired story is never visible.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { redirectTo } from "../../../../lib/http.js";
import { getDb } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { canEnterCommunity } from "../../../../lib/access.js";
import { getLiveStoryGroups } from "../../../../lib/stories.js";

const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PER_SUBMIT = 10;

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return redirectTo("/community");
  }
  const form = await request.formData();
  // Many stories at once: every chosen file becomes one story.
  const files = form.getAll("image").filter((f) => f && typeof f !== "string" && f.size > 0);
  if (files.length === 0) {
    return redirectTo("/community/create?tab=story&error=" + encodeURIComponent("Choose a photo for your story."));
  }
  if (files.length > MAX_PER_SUBMIT) {
    return redirectTo("/community/create?tab=story&error=" + encodeURIComponent(`Add up to ${MAX_PER_SUBMIT} stories at a time.`));
  }
  for (const file of files) {
    if (!ALLOWED_IMAGE.has(file.type) || file.size > MAX_BYTES) {
      return redirectTo("/community/create?tab=story&error=" + encodeURIComponent("Stories are photos only (JPG, PNG, WebP, GIF up to 5 MB each)."));
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads", "stories");
  fs.mkdirSync(dir, { recursive: true });
  const db = getDb();
  const insert = db.prepare(
    "INSERT INTO stories (user_id, image_path, expires_at) VALUES (?, ?, datetime('now', '+24 hours'))"
  );
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const name = `${user.id}-${crypto.randomBytes(8).toString("hex")}.jpg`;
    // Portrait-friendly cap (stories are 9:16) so the viewer stays fast.
    await sharp(buffer).resize(1080, 1920, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(path.join(dir, name));
    insert.run(user.id, `/uploads/stories/${name}`);
  }
  return redirectTo("/community?story=1");
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }
  return NextResponse.json({ groups: getLiveStoryGroups() });
}
