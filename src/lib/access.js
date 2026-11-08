// ---------------------------------------------------------------------------
// access.js — the SINGLE place for every lock rule (prompt Section 8).
// Pages and API routes call these helpers; they never re-implement the
// matrix. Every check reads the enrollments table on the server —
// hiding a button is not security, and a direct URL is blocked too.
// ---------------------------------------------------------------------------
import { getDb, hasEnrollment } from "./db.js";
import { generateVisitToken, hashVisitToken } from "./keys.js";

export const SLUGS = {
  FOREX: "forex-premium-course",
  LIVE: "premium-live-trade-support",
  CONSULT: "trading-consultation",
};

// Community: ANY enrollment unlocks it (any one course or service).
export function canEnterCommunity(userId) {
  if (!userId) return false;
  const row = getDb()
    .prepare("SELECT id FROM enrollments WHERE user_id = ? AND status = 'active' LIMIT 1")
    .get(userId);
  return !!row;
}

// Live Room: ONLY Premium Live Trade Support enrollment. Buying the
// Forex course alone does NOT open it.
export function canEnterLiveRoom(userId) {
  return hasEnrollment(userId, SLUGS.LIVE);
}

// Consultation: ONLY Trading Consultation enrollment. No other
// course or service opens it.
export function canEnterConsultation(userId) {
  return hasEnrollment(userId, SLUGS.CONSULT);
}

// Course Videos: Forex course enrollment AND a key verified for THIS
// visit. Since Nov 2026 the unlock is NOT remembered: the student enters
// their key on every visit, the server mints one single-use visit token,
// and opening /course-videos?visit=<token> consumes it. Navigating away
// and coming back asks for the key again. The old video_unlocks table
// is never read anymore.
export function consumeKeyVisit(userId, token) {
  if (!userId || !token) return null;
  const enrollment = getForexEnrollment(userId);
  if (!enrollment) return null;
  const row = getDb()
    .prepare(
      `SELECT id FROM key_visits
       WHERE token_hash = ? AND user_id = ? AND enrollment_id = ?
         AND used = 0 AND expires_at > datetime('now')`
    )
    .get(hashVisitToken(token), userId, enrollment.id);
  if (!row) return null;
  // Single use: mark consumed so the same URL can never unlock again.
  getDb().prepare("UPDATE key_visits SET used = 1 WHERE id = ?").run(row.id);
  return enrollment;
}

// Mint one single-visit token for this user's Forex enrollment.
// Returns the plain token (shown only in the redirect URL, once).
export function createKeyVisit(userId) {
  const enrollment = getForexEnrollment(userId);
  if (!enrollment) return null;
  const token = generateVisitToken();
  getDb()
    .prepare(
      `INSERT INTO key_visits (token_hash, user_id, enrollment_id, expires_at)
       VALUES (?, ?, ?, datetime('now', '+15 minutes'))`
    )
    .run(hashVisitToken(token), userId, enrollment.id);
  return token;
}

// Return the active Forex enrollment for a user (or null).
export function getForexEnrollment(userId) {
  if (!userId) return null;
  return (
    getDb()
      .prepare(
        `SELECT e.* FROM enrollments e
         JOIN courses_services c ON c.id = e.course_id
         WHERE e.user_id = ? AND c.slug = ? AND e.status = 'active'`
      )
      .get(userId, SLUGS.FOREX) || null
  );
}
