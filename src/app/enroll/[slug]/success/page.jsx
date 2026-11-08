// ---------------------------------------------------------------------------
// enroll/[slug]/success — enrollment confirmation screen (prompt Sec 15).
// Shows what was unlocked. For the Forex course the student's unique
// Course Key is EMAILED to their Gmail (Nov 2026 key rule) — the key is
// NEVER shown on this page, on the profile, or anywhere else on the
// site. If email is not connected yet, the page says so honestly.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCourseBySlug, hasEnrollment, getEnrollmentForCourse } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { isMailConfigured } from "../../../../lib/mail.js";

export const metadata = { title: "Enrollment Confirmed — LearnChart FX", description: "Your LearnChart FX enrollment is confirmed." };

export default async function EnrollSuccessPage({ params, searchParams }) {
  // Next.js 15: params + searchParams are Promises — await them first.
  const { slug } = await params;
  const sp = await searchParams;
  const course = getCourseBySlug(slug);
  if (!course) redirect("/courses");

  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/enroll/${slug}`);
  if (!hasEnrollment(user.id, slug)) redirect(`/enroll/${slug}`);

  // Monthly expiry for the confirmation (Nov 2026): the student sees
  // exactly how long this payment lasts.
  const enrollment = getEnrollmentForCourse(user.id, slug);
  const expiresAt = enrollment?.expires_at || null;
  const expiresLabel = expiresAt
    ? new Date(String(expiresAt).replace(" ", "T") + "Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const unlocked = [];
  unlocked.push("Community — Premium Live Trade Everyday");
  if (course.unlocks === "live-room") unlocked.push("Live Room");
  if (course.unlocks === "consultation") unlocked.push("Trading Consultation area");
  if (course.has_videos) unlocked.push("Course Videos (after you enter your Course Key — emailed to your Gmail)");

  // How the key email went (set by /api/enroll; absent on a direct visit).
  // "sent" = emailed. "failed" = SMTP tried and failed. "unconfigured" =
  // no email service connected yet. No param = fall back to config state.
  const keymail = sp?.keymail || (course.has_videos ? (isMailConfigured() ? "sent" : "unconfigured") : null);

  return (
    <div className="wrap section">
      <div className="card form-card">
        <span className="badge badge-green">✓ ENROLLMENT CONFIRMED</span>
        <h1 style={{ marginTop: 12 }}>Welcome aboard, {user.name}!</h1>
        <p className="muted">
          You are now enrolled in <strong>{course.title}</strong>.
        </p>
        {course.billing === "monthly" && expiresLabel ? (
          <div className="alert alert-info">
            <strong>Monthly subscription — your access runs until {expiresLabel}.</strong> When it ends, your access
            stops and you renew by paying again — nothing is ever charged automatically.
          </div>
        ) : null}
        <h3>What unlocked for you</h3>
        <ul className="check-list">
          {unlocked.map((u) => (<li key={u}>{u}</li>))}
        </ul>

        {course.has_videos && keymail === "sent" ? (
          <div className="alert alert-ok">
            <strong>Your Course Key was emailed to {user.email}.</strong> Check your Gmail inbox (and Spam folder)
            — enter that key on the Course Videos page to watch the lessons. You will be asked for the key every
            time you open the page, so keep the email safe. Every student&apos;s key is different. Never share it.
          </div>
        ) : null}
        {course.has_videos && keymail === "failed" ? (
          <div className="alert alert-error">
            <strong>We could not send your Course Key email right now.</strong> Your enrollment is complete — use
            &ldquo;Resend my key&rdquo; on your profile to have the key emailed to {user.email} again.
          </div>
        ) : null}
        {course.has_videos && keymail === "unconfigured" ? (
          <div className="alert alert-info">
            <strong>Email service is not connected yet.</strong> Your Course Key will be emailed to {user.email} once
            the site owner connects email. Your enrollment is complete — the Course Videos page will stay locked until
            then.
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <Link href="/community" className="btn btn-amber">Go to Community</Link>
          {course.unlocks === "live-room" ? (
            <Link href="/live-room" className="btn btn-dark">Live Room</Link>
          ) : null}
          {course.has_videos ? (
            <Link href={`/course-videos?course=${course.slug}`} className="btn btn-dark">Course Videos</Link>
          ) : null}
          <Link href="/profile" className="btn btn-dark">My Profile</Link>
        </div>
      </div>
    </div>
  );
}
