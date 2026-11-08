// ---------------------------------------------------------------------------
// mail.js — outgoing email (Course Keys only, for now).
// Uses nodemailer + plain SMTP, configured ONLY from environment variables
// — no mail account or API key is ever hard-coded here. When SMTP is not
// configured the site still works: callers get { sent: false, reason:
// "unconfigured" } and must show the honest "email not connected yet"
// notice instead of pretending the key was sent.
//   SMTP_HOST, SMTP_PORT (587 default, 465 = SSL), SMTP_USER, SMTP_PASS,
//   SMTP_FROM (defaults to SMTP_USER when empty).
// ---------------------------------------------------------------------------
import nodemailer from "nodemailer";

// True only when the minimum SMTP settings exist. A partial config
// (host but no password, etc.) counts as NOT configured.
export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter = null;

// Lazily built (never at import time) so `next build` never touches the
// network or throws when no SMTP settings exist.
function getTransporter() {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465, // true only for implicit SSL (port 465)
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

// Email the student's own Course Key to their own Gmail address.
// Never throws: a send failure is reported, never crashes enrollment.
export async function sendCourseKeyEmail({ to, name, key }) {
  const t = getTransporter();
  if (!t) return { sent: false, reason: "unconfigured" };
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
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
