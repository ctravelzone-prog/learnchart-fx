// ---------------------------------------------------------------------------
// access.js — the SINGLE place for every lock rule (prompt Section 8).
// Pages and API routes call these helpers; they never re-implement the
// matrix. Every check reads the enrollments table on the server —
// hiding a button is not security, and a direct URL is blocked too.
//
// GENERALIZED (Nov 2026): the gates are driven by COURSE FLAGS, not by
// hard-coded slugs. A course added from the admin panel works the same
// way with zero code changes:
//   - Community: PAID-ONLY (Nov 2026, Siam's order — supersedes the
//     original "any enrollment" rule): an ACTIVE enrollment whose
//     course costs money (price_cents > 0) — Forex $250 one-time or
//     Private Live Trade $200/month (unexpired). A FREE Trading
//     Consultation enrollment alone does NOT open the Community,
//     Special Chat or Member Chat; it opens only the Consultation area.
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
  LIVE: "private-live-trade",
  CONSULT: "trading-consultation",
};

// MONTHLY EXPIRY (Nov 2026): an enrollment counts only while it is
// unexpired. expires_at is NULL for one-time courses (never expires);
// a monthly enrollment (Private Live Trade) is live only while
// expires_at is in the future. Every gate below carries this fragment,
// so an expired subscription loses Community, Live Room, Consultation
// and Course Videos access at the same moment — the student is told to
// renew instead of seeing a generic lock.
const NOT_EXPIRED = "AND (e.expires_at IS NULL OR e.expires_at > datetime('now'))";

// Community: PAID-ONLY (Nov 2026, Siam's order). An ACTIVE enrollment
// whose course costs money (price_cents > 0) — Forex $250 one-time or
// an unexpired Private Live Trade $200/month subscription. A free
// Trading Consultation enrollment alone does NOT open the Community:
// the check joins the course and requires a price, so any future paid
// course added from admin opens it too with zero code changes, while a
// future free service never does. The same helper gates every
// Community surface (feed, Special Chat, Create, Member Chat, member
// profiles) and every community/chat API route — change it here and
// all of them follow.
export function canEnterCommunity(userId) {
  if (!userId) return false;
  const row = getDb()
    .prepare(
      `SELECT e.id FROM enrollments e
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND e.status = 'active' AND c.price_cents > 0 ${NOT_EXPIRED} LIMIT 1`
    )
    .get(userId);
  return !!row;
}

// Community access state, for the locked preview: 'open' (an active
// paid enrollment), 'expired' (the student HAD a paid monthly
// subscription — Private Live Trade — that ran out, so the preview
// says so and offers Renew), or 'none' (never had a paid enrollment —
// e.g. Consultation-only or no enrollment at all — the generic
// paid-member lock). A cancelled enrollment is 'none', not 'expired':
// only a lapsed paid subscription gets the Renew message.
export function getCommunityAccessState(userId) {
  if (!userId) return { state: "none" };
  const open = getDb()
    .prepare(
      `SELECT e.id FROM enrollments e
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND e.status = 'active' AND c.price_cents > 0 ${NOT_EXPIRED} LIMIT 1`
    )
    .get(userId);
  if (open) return { state: "open" };
  const expired = getDb()
    .prepare(
      `SELECT e.expires_at, c.slug AS course_slug, c.title AS course_title FROM enrollments e
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND e.status = 'active' AND c.price_cents > 0
         AND e.expires_at IS NOT NULL AND e.expires_at <= datetime('now')
       ORDER BY e.expires_at DESC LIMIT 1`
    )
    .get(userId);
  if (expired) {
    return { state: "expired", expiredAt: expired.expires_at, courseSlug: expired.course_slug, courseTitle: expired.course_title };
  }
  return { state: "none" };
}

// Live Room: ANY enrollment whose course unlocks it (unlocks =
// 'live-room'). The Private Live Trade course carries this flag; any
// course added from admin with the same flag opens it too.
export function canEnterLiveRoom(userId) {
  if (!userId) return false;
  const row = getDb()
    .prepare(
      `SELECT e.id FROM enrollments e
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND e.status = 'active' AND c.unlocks = 'live-room' ${NOT_EXPIRED} LIMIT 1`
    )
    .get(userId);
  return !!row;
}

// Live Room access state, for the locked preview: 'open' (active
// enrollment — expiresAt is the monthly expiry when set), 'expired'
// (the student HAD a live-room enrollment but its monthly subscription
// ran out — the page says so and offers Renew), or 'none' (never
// enrolled — the generic lock). A cancelled enrollment is 'none', not
// 'expired': only a lapsed paid subscription gets the Renew message.
export function getLiveRoomAccessState(userId) {
  if (!userId) return { state: "none" };
  const open = getDb()
    .prepare(
      `SELECT e.expires_at FROM enrollments e
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND e.status = 'active' AND c.unlocks = 'live-room' ${NOT_EXPIRED} LIMIT 1`
    )
    .get(userId);
  if (open) return { state: "open", expiresAt: open.expires_at || null };
  const expired = getDb()
    .prepare(
      `SELECT e.expires_at, c.slug AS course_slug, c.title AS course_title FROM enrollments e
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND e.status = 'active' AND c.unlocks = 'live-room'
         AND e.expires_at IS NOT NULL AND e.expires_at <= datetime('now')
       ORDER BY e.expires_at DESC LIMIT 1`
    )
    .get(userId);
  if (expired) {
    return { state: "expired", expiredAt: expired.expires_at, courseSlug: expired.course_slug, courseTitle: expired.course_title };
  }
  return { state: "none" };
}

// Consultation: ANY enrollment whose course unlocks it (unlocks =
// 'consultation'). Same rule as the Live Room, different flag.
export function canEnterConsultation(userId) {
  if (!userId) return false;
  const row = getDb()
    .prepare(
      `SELECT e.id FROM enrollments e
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND e.status = 'active' AND c.unlocks = 'consultation' ${NOT_EXPIRED} LIMIT 1`
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
       WHERE e.user_id = ? AND e.status = 'active' AND c.has_videos = 1 ${NOT_EXPIRED}
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
         WHERE e.user_id = ? AND c.slug = ? AND e.status = 'active' AND c.has_videos = 1 ${NOT_EXPIRED}`
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
       WHERE e.id = ? AND e.user_id = ? AND e.status = 'active' AND c.has_videos = 1 ${NOT_EXPIRED}`
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
    .prepare("SELECT id FROM enrollments WHERE id = ? AND user_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > datetime('now'))")
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
