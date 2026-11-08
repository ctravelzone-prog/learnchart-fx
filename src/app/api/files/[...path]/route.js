// ---------------------------------------------------------------------------
// api/files — serves runtime-uploaded images stored under /public/uploads/.
// Why this exists: files written to public/uploads/ at runtime (profile
// pictures, community post pictures, admin page images) are NOT served by
// `next start` on this deployment — the URL 404s even though the file is
// on disk. A route handler reads the file from disk directly, so uploads
// work regardless of how Next serves public/. next.config.mjs rewrites
// /uploads/:path* here, so every already-stored /uploads/... URL keeps
// working without changing stored DB values.
// Path traversal is blocked: the resolved file must stay under the
// uploads directory, and only image extensions are served.
// ---------------------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(_request, { params }) {
  // Next.js 15: params is a Promise — await it first.
  const { path: segments } = await params;
  const parts = Array.isArray(segments) ? segments : [];
  // Only image files inside uploads/ are served; anything else is a 404.
  const last = parts[parts.length - 1] || "";
  const contentType = CONTENT_TYPES[path.extname(last).toLowerCase()];
  if (!contentType || parts.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }
  // Resolve the requested path and make sure it cannot escape uploads/
  // (".." segments would resolve outside the folder).
  const resolved = path.resolve(UPLOADS_DIR, ...parts);
  if (resolved !== UPLOADS_DIR && !resolved.startsWith(UPLOADS_DIR + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }
  const file = fs.readFileSync(resolved);
  return new NextResponse(file, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
