// ---------------------------------------------------------------------------
// stories.js — 24-hour stories (Nov 2026, Siam's order).
// A story is one photo, visible for 24 hours, then DELETED from the
// server (row + file) and gone. A member can post many stories at once.
//
// Two guarantees, both server-side:
//   1. Every read filters expires_at > datetime('now'), so an expired
//      story is never visible even before cleanup runs.
//   2. The read path also deletes expired rows AND their image files
//      (lazy cleanup — no cron dependency, since Render's free tier has
//      no guaranteed cron). All times are SQLite UTC (datetime('now')),
//      the same clock as created_at everywhere else in the app.
// ---------------------------------------------------------------------------
import fs from "node:fs";
import path from "node:path";
import { getDb } from "./db.js";

const STORIES_DIR = path.join(process.cwd(), "public", "uploads", "stories");

// Delete expired stories (rows + their image files). Runs on every
// stories read, so expiry is enforced within one page load of the
// deadline even though no background job exists.
export function cleanupExpiredStories() {
  const db = getDb();
  const expired = db
    .prepare("SELECT id, image_path FROM stories WHERE expires_at <= datetime('now')")
    .all();
  if (expired.length === 0) return 0;
  const ids = expired.map((s) => s.id);
  // Only delete files inside the stories folder — stored paths are
  // server-generated, but never trust a path blindly.
  for (const s of expired) {
    const name = path.basename(String(s.image_path || ""));
    if (!name) continue;
    try {
      fs.unlinkSync(path.join(STORIES_DIR, name));
    } catch { /* file already gone — the row still gets deleted */ }
  }
  db.prepare(`DELETE FROM stories WHERE id IN (${ids.map(() => "?").join(",")})`).run(...ids);
  return expired.length;
}

// Live stories grouped by author, newest story first per group.
// Each group: { user_id, name, profile_pic, stories: [{ id, image_path,
// created_at, expires_at }] } with that author's stories in
// chronological order (oldest first, like Instagram's story steps).
// Expired rows are cleaned up first (see above).
export function getLiveStoryGroups() {
  cleanupExpiredStories();
  const rows = getDb()
    .prepare(
      `SELECT s.id, s.user_id, s.image_path, s.created_at, s.expires_at,
              u.name AS author_name, u.profile_pic AS author_pic
       FROM stories s JOIN users u ON u.id = s.user_id
       WHERE s.expires_at > datetime('now')
       ORDER BY s.created_at ASC`
    )
    .all();
  const byUser = new Map();
  for (const r of rows) {
    if (!byUser.has(r.user_id)) {
      byUser.set(r.user_id, {
        user_id: r.user_id,
        name: r.author_name,
        profile_pic: r.author_pic,
        stories: [],
      });
    }
    byUser.get(r.user_id).stories.push({
      id: r.id,
      image_path: r.image_path,
      created_at: r.created_at,
      expires_at: r.expires_at,
    });
  }
  // Most recently active author first (like Instagram's row order).
  return [...byUser.values()].sort((a, b) => {
    const la = a.stories[a.stories.length - 1].created_at;
    const lb = b.stories[b.stories.length - 1].created_at;
    return lb < la ? -1 : lb > la ? 1 : 0;
  });
}
