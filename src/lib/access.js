// ---------------------------------------------------------------------------
// access.js — the SINGLE place for every lock rule (prompt Section 8).
// Pages and API routes call these helpers; they never re-implement the
// matrix. Every check reads the enrollments table on the server —
// hiding a button is not security, and a direct URL is blocked too.
// ---------------------------------------------------------------------------
import { getDb, hasEnrollment } from "./db.js";

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

// Course Videos: Forex course enrollment AND a valid Course Key unlock
// (the unlock is remembered per enrollment, checked server-side).
export function canWatchCourseVideos(userId) {
  if (!hasEnrollment(userId, SLUGS.FOREX)) return false;
  const row = getDb()
    .prepare(
      `SELECT vu.id FROM video_unlocks vu
       JOIN enrollments e ON e.id = vu.enrollment_id
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND c.slug = ? AND e.status = 'active'`
    )
    .get(userId, SLUGS.FOREX);
  return !!row;
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
