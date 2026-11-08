// ---------------------------------------------------------------------------
// db.js — the ONLY module that talks to the database. Every other file
// (pages, API routes, helpers) imports from here and never opens its own
// connection. That is what makes a later switch to Postgres a one-file
// change instead of a rebuild.
//
// Engine: SQLite through Node's built-in node:sqlite (Node 22+). Zero
// extra setup — `npm install && npm start` just works, no database
// server to install. The file lives in ./data/learnchart.db.
// ---------------------------------------------------------------------------
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "learnchart.db");

// --- Lazy database handle ----------------------------------------------
// The database is opened on FIRST USE, never at import time. That
// matters because `next build` imports every page/API module in
// parallel workers to collect page data — if each import opened the
// same SQLite file and ran schema/seed writes, the workers locked
// each other out ("database is locked", which failed the Render
// deploy). During a build (NEXT_PHASE = phase-production-build) we
// open a throwaway in-memory database instead: build-time rendering
// only needs the seed data, and each worker gets its own copy, so no
// file contention is possible at all. At runtime (dev / `next start`)
// the real file on disk is used, exactly as before.
let db = null;

function openDatabase() {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  const file = isBuild ? ":memory:" : DB_PATH;
  if (!isBuild) {
    // Make sure the data folder exists before opening the file.
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  const handle = new DatabaseSync(file);
  handle.exec("PRAGMA journal_mode = WAL;");
  handle.exec("PRAGMA busy_timeout = 10000;");
  handle.exec("PRAGMA synchronous = NORMAL;");
  handle.exec("PRAGMA foreign_keys = ON;");
  return handle;
}

// --- Schema ---------------------------------------------------------------
// One table per prompt Section 20. Every gated check reads `enrollments`;
// no gate may depend on a front-end flag alone.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  profile_pic TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  level TEXT NOT NULL,
  status TEXT NOT NULL,
  price_label TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  button_type TEXT NOT NULL,
  button_label TEXT NOT NULL,
  features_json TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses_services(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  payment_status TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, course_id)
);

-- One unique key per Forex enrollment. Only a SHA-256 hash and an
-- encrypted copy (decryptable for the owner only) are stored — never
-- the plain key, and never one shared key for all students.
CREATE TABLE IF NOT EXISTS course_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrollment_id INTEGER NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_encrypted TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Remembering that a student unlocked the videos page, so they do not
-- re-enter the key on every visit. Checked server-side every time.
-- (UNUSED since the Nov 2026 per-visit key rule: the key must be entered
-- on EVERY visit, so no unlock is remembered. The table stays so old
-- databases keep working, but nothing reads it anymore.)
CREATE TABLE IF NOT EXISTS video_unlocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrollment_id INTEGER NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One single-visit unlock for the Course Videos page (Nov 2026 rule:
-- the key is asked on EVERY visit). When a student enters a correct key,
-- the server creates one random visit token here; opening
-- /course-videos?visit=<token> consumes it (used = 1) and shows the
-- lessons for that visit only. Leaving and coming back needs a fresh
-- key entry. Only a SHA-256 hash of the token is stored — the plain
-- token is never in the database.
CREATE TABLE IF NOT EXISTS key_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses_services(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  duration TEXT NOT NULL,
  youtube_id TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_path TEXT,
  drive_file_id TEXT,
  drive_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS member_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS special_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- NULL = the seeded mentor welcome (no user row exists yet)
  text TEXT NOT NULL,
  is_mentor INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consultation_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  mode TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  name TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS password_resets (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);

-- Verified Binance payments (Nov 2026 payment automation). One row per
-- accepted payment. tx_hash is UNIQUE across ALL methods (a BEP20 TxHash
-- or a Binance Pay Order ID) so the same transaction can never pay twice
-- — this is the double-spend guard; the verification functions also
-- check it before accepting anything.
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  method TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  status TEXT NOT NULL DEFAULT 'verified',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Binance Pay merchant orders (created via the Create Order API v3).
-- The webhook looks an order up by merchant_trade_no when Binance
-- reports PAY_SUCCESS, so the enrollment can be completed then.
CREATE TABLE IF NOT EXISTS binance_pay_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_trade_no TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_slug TEXT NOT NULL,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDT',
  status TEXT NOT NULL DEFAULT 'created',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`; 

// --- Seed: the three offers from prompt Section 10 ------------------------
// Courses/services are DATABASE records (not hard-coded blocks) so the
// later master admin can add/edit them without a rebuild.
function seed(handle) {
  const count = handle.prepare("SELECT COUNT(*) AS c FROM courses_services").get().c;
  if (count > 0) return; // already seeded — never re-seed over live data

  const insertCourse = handle.prepare(
    "INSERT INTO courses_services (slug, title, subtitle, level, status, price_label, price_cents, button_type, button_label, features_json, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );

  const forexId = insertCourse.run(
    "forex-premium-course",
    "Forex Trading Premium Course",
    "Beginner to Advanced Trading Masterclass",
    "Beginner to Advanced",
    "Available",
    "$250",
    25000,
    "enroll",
    "Enroll Now",
    JSON.stringify([
      "Beginner to Advanced Forex Training",
      "Live Chart Analysis with Entry & Exit Planning",
      "SMC, ICT, Price Action & Market Structure",
      "Backtesting & Strategy Building",
      "Trade Feedback & Performance Review",
      "Risk & Capital Management",
      "24/7 Market Updates & Learning Support",
    ]),
    1
  ).lastInsertRowid;

  insertCourse.run(
    "premium-live-trade-support",
    "Premium Live Trade Support",
    "Live Market Analysis & Trade Guidance",
    "Advanced",
    "Ongoing",
    "Free",
    0,
    "join_telegram",
    "Join Telegram",
    JSON.stringify([
      "Telegram-Based Live Trade Updates",
      "Real-Time Forex and Gold Market Analysis",
      "Clear Entry, Stop-Loss, and Take-Profit Levels",
      "Smart Risk Management Guidance",
      "Technical, Fundamental and Sentiment Insights",
      "Daily Trade Setups and Market Reviews",
      "Live Support for Trade Planning",
    ]),
    2
  );

  insertCourse.run(
    "trading-consultation",
    "Trading Consultation",
    "Personalized Forex & Stock Trading Support",
    "Pro",
    "Developing / Coming Soon",
    "Free",
    0,
    "coming_soon",
    "Coming Soon",
    JSON.stringify([
      "Trading and Investment Roadmap & Guidance",
      "Personalized Trading Consultation",
      "Forex & Stock Investment Roadmap",
      "Strategy Review & Improvement",
      "Risk and Capital Management Plan",
      "One-on-One Mentorship with Siam Chowdhury and Rex Mizan",
      "Live Audio / Video Discussion",
    ]),
    3
  );

  // 10 lessons, matching the "10 Lessons / 1.5 hrs" course shape.
  // Only the two named titles are real; the rest are [Placeholder].
  // YouTube video IDs are [Placeholder] until Siam provides them.
  const lessons = [
    ["Starting Your Trading Journey", "9 min", "How the course works, how to follow the sessions in order, and how to set up your charts and journal before your first lesson."],
    ["Mastering Trading Psychology", "9 min", "Master trading psychology. Manage emotions & discipline. Build mindset, get results."],
    ["[Placeholder — lesson title]", "9 min", ""],
    ["[Placeholder — lesson title]", "9 min", ""],
    ["[Placeholder — lesson title]", "9 min", ""],
    ["[Placeholder — lesson title]", "9 min", ""],
    ["[Placeholder — lesson title]", "9 min", ""],
    ["[Placeholder — lesson title]", "9 min", ""],
    ["[Placeholder — lesson title]", "9 min", ""],
    ["[Placeholder — lesson title]", "9 min", ""],
  ];
  const insertLesson = handle.prepare(
    "INSERT INTO lessons (course_id, position, title, duration, youtube_id, description) VALUES (?, ?, ?, ?, '', ?)"
  );
  lessons.forEach(([title, duration, description], i) => {
    insertLesson.run(forexId, i + 1, title, duration, description);
  });

  // A welcome message in the Mentor Special Chat so the room is not
  // empty on first open. Marked as a mentor message.
  handle.prepare(
    "INSERT INTO special_chat_messages (user_id, text, is_mentor) VALUES (NULL, ?, 1)"
  ).run(
    "Welcome to the Mentor Special Chat — Siam Chowdhury & Rex Mizan answer here during live sessions. Mention @Mentor and your question gets picked up live."
  );
}
// --- Init (schema + seed) with a lock retry ---------------------------
// Next.js evaluates many route/page modules in parallel during `next
// build`, so several connections can try to create the schema at the
// same moment. busy_timeout (above) makes each one wait for the lock;
// this retry loop covers the rare case where the lock is still held.
function sleepMs(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
function initDatabase(handle) {
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      handle.exec(SCHEMA);
      seed(handle);
      return;
    } catch (err) {
      const busy = err && (err.errcode === 5 || /locked|busy/i.test(err.message || ""));
      if (busy && attempt < 30) {
        sleepMs(200);
        continue;
      }
      throw err;
    }
  }
}

// --- Tiny query helpers (keeps SQL in this file) --------------------------
export function getDb() {
  // First use opens the connection (real file at runtime, in-memory
  // during `next build`) and creates/seeds the schema if needed.
  if (!db) {
    db = openDatabase();
    initDatabase(db);
  }
  return db;
}

export function getCourseBySlug(slug) {
  const row = getDb().prepare("SELECT * FROM courses_services WHERE slug = ?").get(slug);
  if (!row) return null;
  return { ...row, features: JSON.parse(row.features_json || "[]") };
}

export function getAllCourses() {
  return getDb()
    .prepare("SELECT * FROM courses_services ORDER BY sort_order ASC")
    .all()
    .map((row) => ({ ...row, features: JSON.parse(row.features_json || "[]") }));
}

export function getLessons(courseId) {
  return getDb()
    .prepare("SELECT * FROM lessons WHERE course_id = ? ORDER BY position ASC")
    .all(courseId);
}

export function getUserById(id) {
  return getDb().prepare("SELECT id, name, email, profile_pic, created_at FROM users WHERE id = ?").get(id) || null;
}

export function getUserByEmail(email) {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) || null;
}

export function getEnrollments(userId) {
  return getDb()
    .prepare(
      `SELECT e.*, c.slug AS course_slug, c.title AS course_title
       FROM enrollments e JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? ORDER BY e.created_at ASC`
    )
    .all(userId);
}

export function hasEnrollment(userId, courseSlug) {
  if (!userId) return false;
  const row = getDb()
    .prepare(
      `SELECT e.id FROM enrollments e
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND c.slug = ? AND e.status = 'active'`
    )
    .get(userId, courseSlug);
  return !!row;
}
