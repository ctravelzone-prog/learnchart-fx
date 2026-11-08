// ---------------------------------------------------------------------------
// access.js — the SINGLE place for every lock rule (prompt Section 8).
// Pages and API routes call these helpers; they never re-implement the
// matrix. Every check reads the enrollments table on the server —
// hiding a button is not security, and a direct URL is blocked too.
//
// GENERALIZED (Nov 2026): the gates are driven by COURSE FLAGS, not by
// hard-coded slugs. A course added from the admin panel works the same
// way with zero code changes:
//   - Community: ANY enrollment unlocks it (any course or service).
//   - Live Room: any enrollment whose course has unlocks = 'live-room'.
//   - Consultation: any enrollment whose course has unlocks =
//     'consultation'.
//   - Course Videos: any enrollment whose course has has_videos = 1,
//     plus the per-visit Course Key for THAT course.
// The original three offers keep their exact behavior through their
// flags (Forex: has_videos, Live: unlocks live-room, Consultation:
// unlocks consultation). SLUGS below is kept only as the fallback
// default for the Course Videos page (?course= defaults to Forex).
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

// Live Room: ANY enrollment whose course unlocks it (unlocks =
// 'live-room'). The original Live Trade Support course carries this
// flag; any course added from admin with the same flag opens it too.
export function canEnterLiveRoom(userId) {
  if (!userId) return false;
  const row = getDb()
    .prepare(
      `SELECT e.id FROM enrollments e
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND e.status = 'active' AND c.unlocks = 'live-room' LIMIT 1`
    )
    .get(userId);
  return !!row;
}

// Consultation: ANY enrollment whose course unlocks it (unlocks =
// 'consultation'). Same rule as the Live Room, different flag.
export function canEnterConsultation(userId) {
  if (!userId) return false;
  const row = getDb()
    .prepare(
      `SELECT e.id FROM enrollments e
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND e.status = 'active' AND c.unlocks = 'consultation' LIMIT 1`
    )
    .get(userId);
  return !!row;
}

// All video courses (has_videos = 1) this user is enrolled in, in
// course order. The Course Videos page offers these as a switcher.
export function getVideoEnrollments(userId) {
  if (!userId) return [];
  return getDb()
    .prepare(
      `SELECT e.*, c.slug AS course_slug, c.title AS course_title
       FROM enrollments e JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND e.status = 'active' AND c.has_videos = 1
       ORDER BY c.sort_order ASC`
    )
    .all(userId);
}

// The active enrollment for ONE video course (by slug), or null.
export function getVideoEnrollment(userId, courseSlug) {
  if (!userId || !courseSlug) return null;
  return (
    getDb()
      .prepare(
        `SELECT e.*, c.slug AS course_slug, c.title AS course_title
         FROM enrollments e JOIN courses_services c ON c.id = e.course_id
         WHERE e.user_id = ? AND c.slug = ? AND e.status = 'active' AND c.has_videos = 1`
      )
      .get(userId, courseSlug) || null
  );
}

// Back-compat alias: the Forex course is the default video course.
// (Kept so older callers keep working; new code uses
// getVideoEnrollment(userId, slug) with the requested course.)
export function getForexEnrollment(userId) {
  return getVideoEnrollment(userId, SLUGS.FOREX);
}

// Course Videos: a video-course enrollment AND a key verified for THIS
// visit. Since Nov 2026 the unlock is NOT remembered: the student enters
// their key on every visit, the server mints one single-use visit token,
// and opening /course-videos?course=<slug>&visit=<token> consumes it.
// Navigating away and coming back asks for the key again. The old
// video_unlocks table is never read anymore.
// The token is tied to ONE enrollment, so it can only ever open that
// enrollment's course — a token for course A never opens course B.
export function consumeKeyVisit(userId, token) {
  if (!userId || !token) return null;
  const row = getDb()
    .prepare(
      `SELECT kv.enrollment_id FROM key_visits kv
       WHERE kv.token_hash = ? AND kv.user_id = ? AND kv.used = 0
         AND kv.expires_at > datetime('now')`
    )
    .get(hashVisitToken(token), userId);
  if (!row) return null;
  const enrollment = getDb()
    .prepare(
      `SELECT e.*, c.slug AS course_slug, c.title AS course_title
       FROM enrollments e JOIN courses_services c ON c.id = e.course_id
       WHERE e.id = ? AND e.user_id = ? AND e.status = 'active' AND c.has_videos = 1`
    )
    .get(row.enrollment_id, userId);
  if (!enrollment) return null;
  // Single use: mark consumed so the same URL can never unlock again.
  getDb().prepare("UPDATE key_visits SET used = 1 WHERE token_hash = ?").run(hashVisitToken(token));
  return enrollment;
}

// Mint one single-visit token for a specific enrollment.
// Returns the plain token (shown only in the redirect URL, once).
export function createKeyVisit(userId, enrollmentId) {
  if (!userId || !enrollmentId) return null;
  const enrollment = getDb()
    .prepare("SELECT id FROM enrollments WHERE id = ? AND user_id = ? AND status = 'active'")
    .get(enrollmentId, userId);
  if (!enrollment) return null;
  const token = generateVisitToken();
  getDb()
    .prepare(
      `INSERT INTO key_visits (token_hash, user_id, enrollment_id, expires_at)
       VALUES (?, ?, ?, datetime('now', '+15 minutes'))`
    )
    .run(hashVisitToken(token), userId, enrollmentId);
  return token;
}
