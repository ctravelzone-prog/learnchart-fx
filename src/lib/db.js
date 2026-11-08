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
import crypto from "node:crypto";
// Seed sources for the admin-managed content. These two modules import
// nothing from db.js, so there is no import cycle.
import { FAQ_GENERAL, FAQ_ENROLLMENT } from "./faq-data.js";
import {
  SITE,
  MENTORS,
  STATS,
  TESTIMONIALS,
  SOCIALS,
  BROKERS,
  INSIDE_VIDEO_ID,
  LIVE_STREAM_PROVIDER,
  CONSULT_PROVIDER,
  CONTACT_INFO,
} from "./config.js";
// (Admin password hashing uses node:crypto scrypt directly here —
// db.js must not import auth.js, which itself imports db.js.)


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
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Added with the master admin panel (Nov 2026): a course added from
  -- /admin can have video lessons + a Course Key (has_videos = 1) and
  -- can unlock an area (unlocks = 'none' | 'live-room' |
  -- 'consultation'). Community stays "any enrollment" for every
  -- course, so it needs no flag here. "image" is the card banner
  -- (uploaded from the admin course form); "badge" is the small ribbon
  -- on the card (e.g. "★ BESTSELLER", empty = none).
  has_videos INTEGER NOT NULL DEFAULT 0,
  unlocks TEXT NOT NULL DEFAULT 'none',
  image TEXT NOT NULL DEFAULT '',
  badge TEXT NOT NULL DEFAULT '',
  -- Billing model (Nov 2026): 'one-time' = pay once, access forever;
  -- 'monthly' = each payment buys 30 days (Private Live Trade).
  -- The gates + enrollment code read this flag, never the slug.
  billing TEXT NOT NULL DEFAULT 'one-time'
);

CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses_services(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  payment_status TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- Monthly expiry (Nov 2026): NULL = never expires (one-time courses).
  -- A monthly enrollment is active only while expires_at > now; the
  -- access checks in src/lib/access.js enforce that, not the status.
  expires_at TEXT,
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

-- Saved posts (Instagram bookmark): one save per user per post; tapping
-- again removes it. Same toggle pattern as likes.
CREATE TABLE IF NOT EXISTS saved_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(post_id, user_id)
);

-- 24-hour stories (Nov 2026): one row per story photo. expires_at is
-- created_at + 24 hours. Every read filters expires_at > now, so an
-- expired story is never visible even before cleanup runs; the read
-- path also deletes expired rows AND their files (src/lib/stories.js),
-- so no cron is needed. A member can post many stories at once.
CREATE TABLE IF NOT EXISTS stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);

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

-- MASTER ADMIN PANEL (Nov 2026) — the admin area is a separate login
-- with its own sessions, never the user session. Admins are the site
-- owner only; there is no public admin registration.
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_changed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

-- FAQ questions as DATABASE records (were a static file before the
-- admin panel). The public FAQ page reads this table; the static file
-- stays only as the seed source + fallback.
CREATE TABLE IF NOT EXISTS faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Mentors as DATABASE records (were config constants before). The
-- public Mentors page reads this table; config.js stays as the seed
-- source + fallback.
CREATE TABLE IF NOT EXISTS mentors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  badge TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT NOT NULL,
  focus_tags_json TEXT NOT NULL DEFAULT '[]',
  points_json TEXT NOT NULL DEFAULT '[]',
  photo TEXT NOT NULL
);

-- Admin-editable site settings (stats, testimonials, socials, brokers,
-- providers, contact info). One row per key; values are plain text or
-- JSON. The public pages read these with config.js as the fallback, so
-- the site keeps working on a fresh database before anything is edited.
-- NOTE: Render's free tier wipes this SQLite file on every redeploy,
-- so admin edits reset on redeploy until the site moves to real hosting.
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Admin-editable PAGE CONTENT (Home / Contact / Mentors). One row per
-- page + section + field, e.g. ("home", "hero", "title", "...").
-- The pages read these through src/lib/page-content.js, which merges
-- them over the config defaults — so nothing changes visually until
-- the owner edits a field in /admin/pages. Images are stored as URLs
-- ("/uploads/pages/...") in the same table; the files themselves are
-- uploaded through the admin panel. Same redeploy-wipe note as above.
CREATE TABLE IF NOT EXISTS page_content (
  page TEXT NOT NULL,
  section TEXT NOT NULL,
  field TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (page, section, field)
);
`; 

// --- Seed: the three offers from prompt Section 10 ------------------------
// Courses/services are DATABASE records (not hard-coded blocks) so the
// later master admin can add/edit them without a rebuild.
function seed(handle) {
  const count = handle.prepare("SELECT COUNT(*) AS c FROM courses_services").get().c;
  if (count > 0) return; // already seeded — never re-seed over live data

  const insertCourse = handle.prepare(
    "INSERT INTO courses_services (slug, title, subtitle, level, status, price_label, price_cents, button_type, button_label, features_json, sort_order, has_videos, unlocks, image, badge, billing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
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
    1,
    1,
    "none",
    "/images/mentor-desk.webp",
    "★ BESTSELLER",
    "one-time"
  ).lastInsertRowid;

  insertCourse.run(
    "private-live-trade",
    "Private Live Trade",
    "Private Live Market Analysis & Trade Guidance",
    "Advanced",
    "Ongoing",
    "$200",
    20000,
    "enroll",
    "Enroll Now",
    JSON.stringify([
      "Telegram-Based Live Trade Updates",
      "Real-Time Forex and Gold Market Analysis",
      "Clear Entry, Stop-Loss, and Take-Profit Levels",
      "Smart Risk Management Guidance",
      "Technical, Fundamental and Sentiment Insights",
      "Daily Trade Setups and Market Reviews",
      "Live Support for Trade Planning",
    ]),
    2,
    0,
    "live-room",
    "/images/mentor-studio.webp",
    "",
    // Private Live Trade is a MONTHLY subscription (Nov 2026): $200
    // buys 30 days; when it ends the student loses access and renews
    // by paying again. Forex + Consultation stay one-time / free.
    "monthly"
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
    3,
    0,
    "consultation",
    "/images/consultation-call.webp",
    "",
    "one-time"
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
// --- Admin seed: preview-default login ---------------------------------
// Used ONLY when ADMIN_EMAIL / ADMIN_PASSWORD env vars are not set.
// Only the HASH + SALT are in this file — the plain password is never
// committed anywhere; it was generated once and handed to the site owner
// separately. Change it in the admin panel (change-password) or set the
// env vars. Same scrypt parameters as src/lib/auth.js (64-byte hash).
// ROTATED Nov 8: the first generated password was lost when the build
// session compacted (the summary redacted it), so this is a fresh
// password + hash. The previous hash never worked anywhere live — the
// live database is wiped on every Render redeploy, so the new seed
// takes effect on the next deploy.
const DEFAULT_ADMIN_EMAIL = "admin@learnchart.test";
const DEFAULT_ADMIN_SALT = "22f25ce802d08913a9593ca129562254";
const DEFAULT_ADMIN_HASH =
  "cfe3e3f8643685817b604b6c6dc58523f273716eda2f0de26957bc7641d6afc814d091f7a3fbaee33d17e290dbdeb977af2ca58dba40dc47e1da977476ca6eec";

function scryptHash(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

// --- Column migrations (for databases created before the admin panel) ---
// SQLite has no "ADD COLUMN IF NOT EXISTS", so check PRAGMA first.
function migrateColumns(handle) {
  const userCols = handle.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
  if (!userCols.includes("status")) {
    handle.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
  }
  const contactCols = handle.prepare("PRAGMA table_info(contact_messages)").all().map((c) => c.name);
  if (!contactCols.includes("status")) {
    handle.exec("ALTER TABLE contact_messages ADD COLUMN status TEXT NOT NULL DEFAULT 'new'");
  }
  // Course flags added with the admin panel (Nov 2026): video lessons +
  // Course Key (has_videos), area unlocked (unlocks), card image + badge.
  // The backfill below runs ONLY in the boot where a column is first
  // added to an old database — never again after that. (If it ran on
  // every boot, an admin edit such as turning a flag off would be
  // silently reverted.) Admin-added courses are never touched.
  const courseCols = handle.prepare("PRAGMA table_info(courses_services)").all().map((c) => c.name);
  let courseFlagsAdded = false;
  if (!courseCols.includes("has_videos")) {
    handle.exec("ALTER TABLE courses_services ADD COLUMN has_videos INTEGER NOT NULL DEFAULT 0");
    courseFlagsAdded = true;
  }
  if (!courseCols.includes("unlocks")) {
    handle.exec("ALTER TABLE courses_services ADD COLUMN unlocks TEXT NOT NULL DEFAULT 'none'");
    courseFlagsAdded = true;
  }
  if (!courseCols.includes("image")) {
    handle.exec("ALTER TABLE courses_services ADD COLUMN image TEXT NOT NULL DEFAULT ''");
    courseFlagsAdded = true;
  }
  if (!courseCols.includes("badge")) {
    handle.exec("ALTER TABLE courses_services ADD COLUMN badge TEXT NOT NULL DEFAULT ''");
    courseFlagsAdded = true;
  }
  if (courseFlagsAdded) {
    handle.prepare("UPDATE courses_services SET has_videos = 1, unlocks = 'none' WHERE slug = 'forex-premium-course'").run();
    handle.prepare("UPDATE courses_services SET has_videos = 0, unlocks = 'live-room' WHERE slug = 'private-live-trade'").run();
    handle.prepare("UPDATE courses_services SET has_videos = 0, unlocks = 'consultation' WHERE slug = 'trading-consultation'").run();
    handle.prepare("UPDATE courses_services SET badge = '★ BESTSELLER' WHERE slug = 'forex-premium-course' AND (badge IS NULL OR badge = '')").run();
    // Original course card images (the design's photos) — set only
    // when empty, so an admin-chosen image is never overwritten.
    handle.prepare("UPDATE courses_services SET image = '/images/mentor-desk.webp' WHERE slug = 'forex-premium-course' AND (image IS NULL OR image = '')").run();
    handle.prepare("UPDATE courses_services SET image = '/images/mentor-studio.webp' WHERE slug = 'private-live-trade' AND (image IS NULL OR image = '')").run();
    handle.prepare("UPDATE courses_services SET image = '/images/consultation-call.webp' WHERE slug = 'trading-consultation' AND (image IS NULL OR image = '')").run();
  }

  // Monthly billing (Nov 2026): 'one-time' by default; Private Live
  // Trade is monthly. Runs only in the boot where the column is first
  // added to an old database — never again after that, so an admin
  // change to a course's billing is never reverted.
  if (!courseCols.includes("billing")) {
    handle.exec("ALTER TABLE courses_services ADD COLUMN billing TEXT NOT NULL DEFAULT 'one-time'");
    handle.prepare("UPDATE courses_services SET billing = 'monthly' WHERE slug = 'private-live-trade'").run();
  }

  // Monthly expiry on enrollments (Nov 2026). Backfill: any EXISTING
  // Private Live Trade enrollment gets 30 days from when it was
  // created (its original payment bought one month). One-time courses
  // keep expires_at NULL = never expires. Runs only in the boot where
  // the column is first added.
  const enrollmentCols = handle.prepare("PRAGMA table_info(enrollments)").all().map((c) => c.name);
  if (!enrollmentCols.includes("expires_at")) {
    handle.exec("ALTER TABLE enrollments ADD COLUMN expires_at TEXT");
    handle
      .prepare(
        `UPDATE enrollments SET expires_at = datetime(created_at, '+30 days')
         WHERE course_id IN (SELECT id FROM courses_services WHERE slug = 'private-live-trade')`
      )
      .run();
  }
}

// --- Seed the admin-managed content (idempotent, guarded by counts) -----
// Runs on every init but only inserts when the table is still empty, so
// it never overwrites live admin edits. Runs AFTER seed() — courses must
// exist first only for the lesson seed, not for this one.
function seedAdminDefaults(handle) {
  // FAQ: static file is the seed source; the table is the live source.
  if (handle.prepare("SELECT COUNT(*) AS c FROM faqs").get().c === 0) {
    const insertFaq = handle.prepare(
      "INSERT INTO faqs (category, question, answer, sort_order) VALUES (?, ?, ?, ?)"
    );
    FAQ_GENERAL.forEach((f, i) => insertFaq.run("General", f.q, f.a, i + 1));
    FAQ_ENROLLMENT.forEach((f, i) => insertFaq.run("Enrollment", f.q, f.a, i + 1));
  }

  // Mentors: config.js is the seed source; the table is the live source.
  if (handle.prepare("SELECT COUNT(*) AS c FROM mentors").get().c === 0) {
    const insertMentor = handle.prepare(
      "INSERT INTO mentors (id, name, role, badge, title, bio, focus_tags_json, points_json, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    for (const m of MENTORS) {
      insertMentor.run(
        m.id, m.name, m.role, m.badge, m.title, m.bio,
        JSON.stringify(m.focusTags || []), JSON.stringify(m.points || []), m.photo
      );
    }
  }

  // Settings: one row per key, config.js values as the first seed.
  // INSERT OR IGNORE keeps admin edits safe on later boots.
  const settingDefaults = {
    stats: JSON.stringify(STATS),
    testimonials: JSON.stringify(TESTIMONIALS),
    socials: JSON.stringify(SOCIALS),
    brokers: JSON.stringify(BROKERS),
    inside_video_id: INSIDE_VIDEO_ID,
    live_stream_provider: LIVE_STREAM_PROVIDER,
    consult_provider: CONSULT_PROVIDER,
    contact_email: CONTACT_INFO.email,
    contact_phone: CONTACT_INFO.phone,
    contact_address: CONTACT_INFO.address,
    next_batch_date: SITE.nextBatchDate || "",
    site_mission: SITE.mission || "",
  };
  const insertSetting = handle.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  for (const [key, value] of Object.entries(settingDefaults)) {
    insertSetting.run(key, value);
  }

  // Admin account. Env vars win when set (upsert = the env password is
  // authoritative, so rotating it is just changing the env var).
  // Otherwise, seed the preview-default admin once (password_changed=0
  // so the panel shows the "please change your password" notice).
  const envEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD || "";
  if (envEmail && envPassword) {
    const salt = crypto.randomBytes(16).toString("hex");
    handle
      .prepare(
        `INSERT INTO admins (email, password_hash, password_salt, password_changed) VALUES (?, ?, ?, 1)
         ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, password_salt = excluded.password_salt, password_changed = 1`
      )
      .run(envEmail, scryptHash(envPassword, salt), salt);
  } else if (handle.prepare("SELECT COUNT(*) AS c FROM admins").get().c === 0) {
    handle
      .prepare("INSERT INTO admins (email, password_hash, password_salt, password_changed) VALUES (?, ?, ?, 0)")
      .run(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_HASH, DEFAULT_ADMIN_SALT);
  }
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
      migrateColumns(handle);
      seed(handle);
      seedAdminDefaults(handle);
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
      `SELECT e.*, c.slug AS course_slug, c.title AS course_title,
              c.has_videos AS course_has_videos, c.unlocks AS course_unlocks,
              c.billing AS course_billing, c.price_label AS course_price_label
       FROM enrollments e JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? ORDER BY e.created_at ASC`
    )
    .all(userId);
}

// One enrollment for one course (any status, any expiry) — used by the
// enroll page (renewal banner) and the success page (expiry line).
export function getEnrollmentForCourse(userId, courseSlug) {
  return (
    getDb()
      .prepare(
        `SELECT e.*, c.slug AS course_slug, c.title AS course_title,
                c.billing AS course_billing
         FROM enrollments e JOIN courses_services c ON c.id = e.course_id
         WHERE e.user_id = ? AND c.slug = ?`
      )
      .get(userId, courseSlug) || null
  );
}

// An enrollment counts as ACTIVE only while its status is 'active' AND
// its monthly expiry (when set) is still in the future. Every gate in
// src/lib/access.js and every "already enrolled" check reads through
// this — a monthly subscription that ran out is treated as NOT enrolled,
// so the student can renew and the locked pages say so.
export function hasEnrollment(userId, courseSlug) {
  if (!userId) return false;
  const row = getDb()
    .prepare(
      `SELECT e.id FROM enrollments e
       JOIN courses_services c ON c.id = e.course_id
       WHERE e.user_id = ? AND c.slug = ? AND e.status = 'active'
         AND (e.expires_at IS NULL OR e.expires_at > datetime('now'))`
    )
    .get(userId, courseSlug);
  return !!row;
}

// Is one enrollment row (as returned by getEnrollments /
// getEnrollmentForCourse) currently active? Same rule as
// hasEnrollment, for rendering (profile, admin) — never a gate on its
// own. expires_at is stored as UTC "YYYY-MM-DD HH:MM:SS", so parse it
// as UTC before comparing.
export function isEnrollmentActive(e) {
  if (!e || e.status !== "active") return false;
  if (!e.expires_at) return true;
  const ms = new Date(String(e.expires_at).replace(" ", "T") + "Z").getTime();
  return Number.isFinite(ms) && ms > Date.now();
}

// Expiry timestamp for a fresh monthly payment: now + 30 days, in the
// same UTC "YYYY-MM-DD HH:MM:SS" shape SQLite datetime('now') uses.
export function monthlyExpiresAt() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

// Display price for a course card / enroll page: monthly courses show
// "$200/month" so the subscription is obvious everywhere the price is.
export function displayPrice(course) {
  if (!course) return "";
  return course.billing === "monthly" ? `${course.price_label}/month` : course.price_label;
}

// --- Admin helpers (master admin panel only) ---------------------------
// Every admin page and /api/admin route reads through these; nothing in
// the admin area opens its own queries.

export function getAdminByEmail(email) {
  return getDb().prepare("SELECT * FROM admins WHERE email = ?").get(String(email).toLowerCase()) || null;
}

export function getAdminById(id) {
  return getDb().prepare("SELECT id, email, password_changed, created_at FROM admins WHERE id = ?").get(id) || null;
}

export function getFaqs() {
  return getDb()
    .prepare("SELECT * FROM faqs ORDER BY CASE category WHEN 'General' THEN 0 ELSE 1 END, sort_order ASC, id ASC")
    .all();
}

export function getFaqById(id) {
  return getDb().prepare("SELECT * FROM faqs WHERE id = ?").get(id) || null;
}

export function getMentors() {
  return getDb()
    .prepare("SELECT * FROM mentors ORDER BY id ASC")
    .all()
    .map((row) => ({
      ...row,
      focusTags: JSON.parse(row.focus_tags_json || "[]"),
      points: JSON.parse(row.points_json || "[]"),
    }));
}

export function getMentorById(id) {
  const row = getDb().prepare("SELECT * FROM mentors WHERE id = ?").get(id);
  if (!row) return null;
  return { ...row, focusTags: JSON.parse(row.focus_tags_json || "[]"), points: JSON.parse(row.points_json || "[]") };
}

export function getSetting(key) {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : null;
}

export function setSetting(key, value) {
  getDb()
    .prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .run(key, value);
}

// --- Page content (admin-editable Home / Contact / Mentors copy) --------
// One row per page + section + field. lib/page-content.js merges these
// over the code defaults; these two helpers are the only DB access.
export function getPageContentRows(page) {
  return getDb()
    .prepare("SELECT section, field, value FROM page_content WHERE page = ?")
    .all(page);
}

export function setPageContent(page, section, field, value) {
  getDb()
    .prepare(
      `INSERT INTO page_content (page, section, field, value, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(page, section, field) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    )
    .run(page, section, field, value);
}

// Dashboard numbers, each a single cheap query.
export function getAdminStats() {
  const db = getDb();
  const users = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  const enrollmentsByCourse = db
    .prepare(
      `SELECT c.slug, c.title, COUNT(e.id) AS count FROM courses_services c
       LEFT JOIN enrollments e ON e.course_id = c.id GROUP BY c.id ORDER BY c.sort_order ASC`
    )
    .all();
  const paymentsByMethod = db
    .prepare("SELECT method, status, COUNT(*) AS count FROM payments GROUP BY method, status ORDER BY method ASC")
    .all();
  const posts = db.prepare("SELECT COUNT(*) AS c FROM posts").get().c;
  const unreadContact = db.prepare("SELECT COUNT(*) AS c FROM contact_messages WHERE status = 'new'").get().c;
  return { users, enrollmentsByCourse, paymentsByMethod, posts, unreadContact };
}

export function listUsers(search) {
  const db = getDb();
  const q = `%${String(search || "").trim()}%`;
  const rows = search
    ? db
        .prepare(
          `SELECT u.id, u.name, u.email, u.status, u.created_at,
                  (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS enrollments
           FROM users u WHERE u.name LIKE ? OR u.email LIKE ? ORDER BY u.created_at DESC`
        )
        .all(q, q)
    : db
        .prepare(
          `SELECT u.id, u.name, u.email, u.status, u.created_at,
                  (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS enrollments
           FROM users u ORDER BY u.created_at DESC`
        )
        .all();
  return rows;
}

export function getAdminUserDetail(id) {
  const db = getDb();
  const user = db
    .prepare("SELECT id, name, email, profile_pic, status, created_at FROM users WHERE id = ?")
    .get(id);
  if (!user) return null;
  const enrollments = getEnrollments(id);
  const posts = db
    .prepare("SELECT id, text, image_path, drive_file_id, created_at FROM posts WHERE user_id = ? ORDER BY created_at DESC")
    .all(id);
  return { ...user, enrollments, posts };
}

export function listEnrollments(filterSlug) {
  const db = getDb();
  if (filterSlug) {
    return db
      .prepare(
        `SELECT e.*, c.slug AS course_slug, c.title AS course_title, u.name AS user_name, u.email AS user_email
         FROM enrollments e JOIN courses_services c ON c.id = e.course_id
         JOIN users u ON u.id = e.user_id
         WHERE c.slug = ? ORDER BY e.created_at DESC`
      )
      .all(filterSlug);
  }
  return db
    .prepare(
      `SELECT e.*, c.slug AS course_slug, c.title AS course_title, u.name AS user_name, u.email AS user_email
       FROM enrollments e JOIN courses_services c ON c.id = e.course_id
       JOIN users u ON u.id = e.user_id ORDER BY e.created_at DESC`
    )
    .all();
}

// One enrollment with its student, course, Course Key (encrypted) and
// any verified payments for that student + course.
export function getEnrollmentDetail(id) {
  const db = getDb();
  const e = db
    .prepare(
      `SELECT e.*, c.slug AS course_slug, c.title AS course_title,
              c.has_videos AS course_has_videos, c.billing AS course_billing,
              u.name AS user_name, u.email AS user_email
       FROM enrollments e JOIN courses_services c ON c.id = e.course_id
       JOIN users u ON u.id = e.user_id WHERE e.id = ?`
    )
    .get(id);
  if (!e) return null;
  const key = db.prepare("SELECT key_encrypted FROM course_keys WHERE enrollment_id = ?").get(id);
  const payments = db
    .prepare("SELECT * FROM payments WHERE user_id = ? AND course_slug = ? ORDER BY created_at DESC")
    .all(e.user_id, e.course_slug);
  return { ...e, keyEncrypted: key ? key.key_encrypted : null, payments };
}

export function listPayments() {
  return getDb()
    .prepare(
      `SELECT p.*, u.name AS user_name, u.email AS user_email
       FROM payments p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC`
    )
    .all();
}

export function getPayment(id) {
  const row = getDb()
    .prepare(
      `SELECT p.*, u.name AS user_name, u.email AS user_email
       FROM payments p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
    )
    .get(id);
  return row || null;
}

export function listPostsAdmin() {
  return getDb()
    .prepare(
      `SELECT p.*, u.name AS author_name, u.email AS author_email,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
              (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count
       FROM posts p JOIN users u ON u.id = p.user_id ORDER BY p.created_at DESC`
    )
    .all();
}

export function getPostComments(postId) {
  return getDb()
    .prepare(
      `SELECT c.*, u.name AS author_name FROM comments c
       JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at ASC`
    )
    .all(postId);
}

export function listContactMessages() {
  return getDb().prepare("SELECT * FROM contact_messages ORDER BY created_at DESC").all();
}

export function getContactMessage(id) {
  return getDb().prepare("SELECT * FROM contact_messages WHERE id = ?").get(id) || null;
}

export function getAllLessons() {
  return getDb()
    .prepare(
      `SELECT l.*, c.title AS course_title FROM lessons l
       JOIN courses_services c ON c.id = l.course_id ORDER BY c.sort_order ASC, l.position ASC`
    )
    .all();
}

export function getLesson(id) {
  return getDb().prepare("SELECT * FROM lessons WHERE id = ?").get(id) || null;
}

export function getCourseById(id) {
  const row = getDb().prepare("SELECT * FROM courses_services WHERE id = ?").get(id);
  if (!row) return null;
  return { ...row, features: JSON.parse(row.features_json || "[]") };
}
