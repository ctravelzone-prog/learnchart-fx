// ---------------------------------------------------------------------------
// settings.js — admin-editable site settings, DB-first with fallbacks.
//
// - Public content (stats / testimonials / socials / brokers, mentors,
//   FAQs): the database tables first, config.js / faq-data.js as the
//   fallback, so the site keeps working on a fresh database.
// - Payment + SMTP config: the `settings` table first, ENV VARS as the
//   fallback when a DB value is empty or absent. The owner can therefore
//   fill everything in from the admin panel and never touch env vars —
//   but env vars still work as a fallback (and survive a DB wipe, which
//   matters because Render's free tier wipes the SQLite file on every
//   redeploy: admin-entered settings reset on redeploy until the site
//   moves to real hosting).
// - Secrets (API keys, BscScan key, SMTP password): AES-encrypted at
//   rest with the lib/keys.js helpers, stored with an "enc:" prefix.
//   The admin UI only ever shows the last 4 characters. Getters in this
//   file return REAL values and must only be used server-side. Pages
//   that DISPLAY a payment rail use getPublicPaymentConfig(), which
//   returns booleans + non-secret values only — never a secret.
// ---------------------------------------------------------------------------
import { getDb, getSetting, setSetting, getMentors, getFaqs } from "./db.js";
import { encryptKey, decryptKey } from "./keys.js";
import { MENTORS, STATS, TESTIMONIALS, SOCIALS, BROKERS } from "./config.js";
import { FAQ_GENERAL, FAQ_ENROLLMENT } from "./faq-data.js";

// --- Raw settings (plain values) ------------------------------------------
export function getRawSetting(key, fallback = null) {
  const value = getSetting(key);
  return value === null || value === undefined ? fallback : value;
}

// --- Secrets (encrypted at rest) ------------------------------------------
// Stored as "enc:<base64>" (AES-256-GCM, lib/keys.js). A value without
// the prefix is returned as-is (back-compat for anything stored plain).
export function getSecretSetting(key) {
  const value = getSetting(key);
  if (!value) return "";
  if (!value.startsWith("enc:")) return value;
  try {
    return decryptKey(value.slice(4));
  } catch {
    // Corrupt / undecryptable value: treat as not set, never crash.
    return "";
  }
}

// Store a secret encrypted; an empty string clears it (stores "").
export function setSecretSetting(key, plaintext) {
  const value = String(plaintext || "").trim();
  setSetting(key, value ? `enc:${encryptKey(value)}` : "");
}

// What the UI shows for a secret: never the value, only the last 4.
export function maskSecret(value) {
  if (!value) return "Not set";
  return `••••${String(value).slice(-4)}`;
}

// --- Public content (DB first, config fallback) ---------------------------
function parseJsonSetting(key, fallback) {
  const raw = getSetting(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getStats() {
  return parseJsonSetting("stats", STATS);
}

export function getTestimonials() {
  return parseJsonSetting("testimonials", TESTIMONIALS);
}

export function getSocials() {
  return parseJsonSetting("socials", SOCIALS);
}

export function getBrokers() {
  return parseJsonSetting("brokers", BROKERS);
}

export function getMentorsList() {
  const rows = getMentors();
  return rows.length > 0 ? rows : MENTORS;
}

export function getFaqsList() {
  const rows = getFaqs();
  // Spread into plain objects: node:sqlite rows are null-prototype and
  // React refuses them as client-component props (FaqList is a client
  // component). Same reason getMentors() spreads its rows.
  if (rows.length > 0) return rows.map((r) => ({ ...r }));
  return [
    ...FAQ_GENERAL.map((f, i) => ({ id: `g${i}`, category: "General", question: f.q, answer: f.a })),
    ...FAQ_ENROLLMENT.map((f, i) => ({ id: `e${i}`, category: "Enrollment", question: f.q, answer: f.a })),
  ];
}

export function getSingleSetting(key, fallback) {
  const value = getSetting(key);
  return value === null || value === undefined || value === "" ? fallback : value;
}

// --- Payment settings (DB first, env fallback) ----------------------------
// Toggle semantics: a DB row wins when it exists ("1" = enabled,
// "0" = disabled). When the owner never touched the panel, there is no
// row and the rail defaults to ENABLED, so env-only setups keep working
// exactly as before. Turning a rail off in the panel beats env vars.
function isToggleOn(key) {
  const row = getSetting(key);
  if (row === null || row === undefined || row === "") return true;
  return row === "1";
}

function dbOrEnv(dbValue, envValue) {
  const v = String(dbValue || "").trim();
  return v !== "" ? v : String(envValue || "").trim();
}

// BEP20 USDT rail. address is NOT a secret (it is shown to students).
export function getBep20Settings() {
  return {
    enabled: isToggleOn("pay_bep20_enabled"),
    address: dbOrEnv(getSetting("pay_bep20_address"), process.env.BINANCE_BSC_ADDRESS),
    bscscanKey: getSecretSetting("pay_bep20_bscscan_key") || String(process.env.BSCSCAN_API_KEY || "").trim(),
  };
}

// Binance Pay TxID-check rail (PRIMARY, free, no merchant application).
export function getBinancePaySettings() {
  return {
    enabled: isToggleOn("pay_binance_pay_enabled"),
    payId: dbOrEnv(getSetting("pay_binance_pay_id"), process.env.BINANCE_PAY_ID),
    apiKey: getSecretSetting("pay_binance_api_key") || String(process.env.BINANCE_API_KEY || "").trim(),
    apiSecret: getSecretSetting("pay_binance_api_secret") || String(process.env.BINANCE_API_SECRET || "").trim(),
  };
}

// Binance Pay merchant checkout (future-optional only).
export function getMerchantSettings() {
  return {
    enabled: isToggleOn("pay_merchant_enabled"),
    apiKey: getSecretSetting("pay_merchant_api_key") || String(process.env.BINANCE_PAY_API_KEY || "").trim(),
    apiSecret: getSecretSetting("pay_merchant_api_secret") || String(process.env.BINANCE_PAY_SECRET_KEY || "").trim(),
  };
}

// The USDT amount a student must send. Admin value wins when set and
// numeric; otherwise the course price passed in as the fallback.
export function getUsdtAmount(fallbackUsdt) {
  const raw = getSetting("pay_usdt_amount");
  const n = Number(raw);
  if (raw !== null && raw !== "" && Number.isFinite(n) && n > 0) return n;
  return fallbackUsdt;
}

// What the enroll page may DISPLAY: booleans + non-secret values only.
// Never a secret — the page source must never contain one.
export function getPublicPaymentConfig() {
  const bep20 = getBep20Settings();
  const pay = getBinancePaySettings();
  const merchant = getMerchantSettings();
  return {
    bep20: { enabled: bep20.enabled, configured: bep20.enabled && Boolean(bep20.address), address: bep20.enabled ? bep20.address : "" },
    binancePay: {
      enabled: pay.enabled,
      configured: pay.enabled && Boolean(pay.payId && pay.apiKey && pay.apiSecret),
      payId: pay.enabled ? pay.payId : "",
    },
    merchant: { enabled: merchant.enabled, configured: merchant.enabled && Boolean(merchant.apiKey && merchant.apiSecret) },
  };
}

// --- Live Room (dual-source streaming, Nov 2026) ----------------------
// The Live Room shows ONE live source at a time, picked by the admin in
// Admin → Live Settings:
//   source "off"     = no live right now (schedule + offline note)
//   source "own"     = own private server (Owncast: OBS → RTMP ingest
//                      → HLS out). Truly private — nothing on YouTube.
//   source "youtube" = YouTube Live Unlisted embed. Hidden from search /
//                      channel / recommendations, but NOT locked —
//                      anyone with the link can watch.
// The stream KEY is a secret (enc: prefix, admin-only, never sent to
// the browser). The Owncast URL and YouTube ID are public-by-design
// (they appear in the player) but are only ever rendered for
// Private-Live-Trade members — the /live-room gate decides that.

// Parse a YouTube live video ID from a full URL or a bare ID.
// Accepts watch?v=, youtu.be/, /live/, /embed/, /shorts/ and bare IDs.
// Returns the 11-char ID or "" when the input is not recognisable.
export function parseYouTubeLiveId(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  // Bare 11-char ID.
  if (/^[\w-]{11}$/.test(raw)) return raw;
  // Full URL — try the usual shapes.
  let url = null;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return "";
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] || "";
    return /^[\w-]{11}$/.test(id) ? id : "";
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    const v = url.searchParams.get("v") || "";
    if (/^[\w-]{11}$/.test(v)) return v;
    const parts = url.pathname.split("/").filter(Boolean);
    if ((parts[0] === "live" || parts[0] === "embed" || parts[0] === "shorts") && /^[\w-]{11}$/.test(parts[1] || "")) {
      return parts[1];
    }
  }
  return "";
}

// Owncast server base URL, e.g. https://live.learnchartfx.com.
// Trailing slash stripped; must be http(s) or it is treated as unset.
export function normalizeOwncastUrl(input) {
  const raw = String(input || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\/.+/.test(raw)) return "";
  return raw;
}

// Public-safe live settings (NO stream key — see getOwncastStreamKey).
// DB first, OWNCAST_URL env as fallback for the server URL (env vars
// survive a DB wipe; the source + YouTube ID are admin-panel only).
export function getLiveSettings() {
  const source = String(getSetting("live_source") || "off").trim();
  return {
    source: ["off", "own", "youtube"].includes(source) ? source : "off",
    youtubeLiveId: String(getSetting("live_youtube_id") || "").trim(),
    owncastUrl: normalizeOwncastUrl(getSetting("live_owncast_url")) || normalizeOwncastUrl(process.env.OWNCAST_URL),
  };
}

// The Owncast stream key — server-side ONLY. Never pass it to a page
// or component; it only goes to the admin settings UI masked (last 4).
export function getOwncastStreamKey() {
  return getSecretSetting("live_owncast_key");
}

// --- SMTP / email settings (DB first, env fallback) -----------------------
// Same rule as payments: fill them in the admin panel and email works;
// leave them empty and the env vars are used instead.
export function getSmtpSettings() {
  return {
    host: dbOrEnv(getSetting("smtp_host"), process.env.SMTP_HOST),
    port: Number(dbOrEnv(getSetting("smtp_port"), process.env.SMTP_PORT || "587")) || 587,
    user: dbOrEnv(getSetting("smtp_user"), process.env.SMTP_USER),
    pass: getSecretSetting("smtp_pass") || String(process.env.SMTP_PASS || "").trim(),
    from: dbOrEnv(getSetting("smtp_from"), process.env.SMTP_FROM),
  };
}

export function isSmtpConfigured() {
  const s = getSmtpSettings();
  return Boolean(s.host && s.user && s.pass);
}
