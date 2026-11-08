// ---------------------------------------------------------------------------
// mail.js — outgoing email (Course Keys only, for now).
// Uses nodemailer + plain SMTP. Settings come from the ADMIN PANEL first
// (Payment Settings → Email), with ENV VARS as the fallback when a DB
// value is empty — the owner fills them in from the panel and never
// touches env vars; env vars still work and survive a DB wipe. When
// SMTP is not configured anywhere the site still works: callers get
// { sent: false, reason: "unconfigured" } and must show the honest
// "email not connected yet" notice instead of pretending the key was
// sent. See src/lib/settings.js for the DB-first rules.
//   SMTP_HOST, SMTP_PORT (587 default, 465 = SSL), SMTP_USER, SMTP_PASS,
//   SMTP_FROM (defaults to SMTP_USER when empty).
// ---------------------------------------------------------------------------
import nodemailer from "nodemailer";
import { getSmtpSettings, isSmtpConfigured } from "./settings.js";

// True only when the minimum SMTP settings exist (DB or env). A partial
// config (host but no password, etc.) counts as NOT configured.
// Kept under the old name so existing callers do not change.
export { isSmtpConfigured as isMailConfigured };

let transporter = null;
let transporterKey = null;

// Lazily built (never at import time) so `next build` never touches the
// network or throws when no SMTP settings exist. The transporter is
// rebuilt whenever the settings change, so saving new SMTP values in
// the admin panel takes effect without a server restart.
function getTransporter() {
  const s = getSmtpSettings();
  if (!s.host || !s.user || !s.pass) return null;
  const key = JSON.stringify(s);
  if (!transporter || transporterKey !== key) {
    transporter = nodemailer.createTransport({
      host: s.host,
      port: s.port,
      secure: s.port === 465, // true only for implicit SSL (port 465)
      auth: { user: s.user, pass: s.pass },
    });
    transporterKey = key;
  }
  return transporter;
}

// Email the student's own Course Key to their own Gmail address.
// Never throws: a send failure is reported, never crashes enrollment.
export async function sendCourseKeyEmail({ to, name, key }) {
  const t = getTransporter();
  if (!t) return { sent: false, reason: "unconfigured" };
  const s = getSmtpSettings();
  try {
    await t.sendMail({
      from: s.from || s.user,
      to,
      subject: "Your LearnChart FX Course Key",
      text:
        `Hi ${name},\n\n` +
        `Welcome to the Forex Trading Premium Course!\n\n` +
        `Your personal Course Key is:\n\n${key}\n\n` +
        `Enter this key on the Course Videos page (https://learnchart-fx.onrender.com/course-videos) ` +
        `to watch all 10 lessons. You will be asked for the key every time you open the page — ` +
        `so keep this email safe.\n\n` +
        `Every student's key is different. Never share yours with anyone.\n\n` +
        `— LearnChart FX (Siam Chowdhury & Rex Mizan)`,
    });
    return { sent: true };
  } catch (err) {
    console.error("[mail] course key email failed:", err?.message || err);
    return { sent: false, reason: "failed" };
  }
}
