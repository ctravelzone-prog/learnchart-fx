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

// Live story groups for ONE viewer (Facebook stories page + the
// Facebook story cards row): the same groups as getLiveStoryGroups,
// plus per group how many stories this viewer has NOT seen yet
// (`unseen`) and the newest story's age (`newest_at`). The blue
// (unseen > 0) / grey (all seen) rings and the "N new" labels read
// from this — never from a guess.
export function getStoryGroupsFor(viewerId) {
  const groups = getLiveStoryGroups();
  const db = getDb();
  for (const g of groups) {
    const ids = g.stories.map((s) => s.id);
    const seen = db
      .prepare(`SELECT story_id FROM story_views WHERE user_id = ? AND story_id IN (${ids.map(() => "?").join(",")})`)
      .all(viewerId, ...ids)
      .map((r) => r.story_id);
    g.unseen = g.stories.filter((s) => !seen.includes(s.id)).length;
    g.newest_at = g.stories[g.stories.length - 1].created_at;
  }
  return groups;
}

// Record that a user viewed a story — one row per user per story
// (INSERT OR IGNORE), so re-watching never inflates the count.
export function recordStoryView(storyId, userId) {
  if (!storyId || !userId) return false;
  const story = getDb()
    .prepare("SELECT id FROM stories WHERE id = ? AND expires_at > datetime('now')")
    .get(storyId);
  if (!story) return false;
  getDb()
    .prepare("INSERT OR IGNORE INTO story_views (story_id, user_id) VALUES (?, ?)")
    .run(storyId, userId);
  return true;
}

// Who viewed one story: total count + up to 5 viewers (newest first)
// for the avatar stack under the viewer. Viewers are real members only.
export function getStoryViewers(storyId) {
  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS c FROM story_views WHERE story_id = ?").get(storyId).c;
  const viewers = db
    .prepare(
      `SELECT u.id, u.name, u.profile_pic FROM story_views v
       JOIN users u ON u.id = v.user_id
       WHERE v.story_id = ? ORDER BY v.viewed_at DESC LIMIT 5`
    )
    .all(storyId)
    .map((v) => ({ id: v.id, name: v.name, profile_pic: v.profile_pic }));
  return { count, viewers };
}

// The viewer's OWN live stories (Archive): newest first, with time
// left on each — the Archive lists these with a delete button each.
export function getOwnStories(userId) {
  cleanupExpiredStories();
  return getDb()
    .prepare(
      `SELECT id, image_path, created_at, expires_at FROM stories
       WHERE user_id = ? AND expires_at > datetime('now')
       ORDER BY created_at DESC`
    )
    .all(userId);
}

// Delete ONE of the viewer's own stories (row + file). Returns false
// when the story is not theirs — nobody deletes another member's story.
export function deleteStory(storyId, userId) {
  const db = getDb();
  const row = db.prepare("SELECT id, image_path FROM stories WHERE id = ? AND user_id = ?").get(storyId, userId);
  if (!row) return false;
  const name = path.basename(String(row.image_path || ""));
  if (name) {
    try {
      fs.unlinkSync(path.join(STORIES_DIR, name));
    } catch { /* file already gone — the row still gets deleted */ }
  }
  db.prepare("DELETE FROM stories WHERE id = ?").run(storyId);
  return true;
}

// Delete ALL of the viewer's own stories (rows + files). Returns how
// many were deleted.
export function deleteAllMyStories(userId) {
  const db = getDb();
  const rows = db.prepare("SELECT id, image_path FROM stories WHERE user_id = ?").all(userId);
  for (const r of rows) {
    const name = path.basename(String(r.image_path || ""));
    if (!name) continue;
    try {
      fs.unlinkSync(path.join(STORIES_DIR, name));
    } catch { /* already gone */ }
  }
  db.prepare("DELETE FROM stories WHERE user_id = ?").run(userId);
  return rows.length;
}
