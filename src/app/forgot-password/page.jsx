// ---------------------------------------------------------------------------
// forgot-password/page.jsx — request a password reset. Standard flow:
// enter email, get a single-use 24h reset link. There is no email service
// yet, so the link is shown on screen in this phase (see the API route).
// ---------------------------------------------------------------------------
import Link from "next/link";

export const metadata = { title: "Forgot Password — LearnChart FX", description: "Reset your LearnChart FX password." };

export default async function ForgotPasswordPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const sent = sp?.sent === "1";
  const link = sp?.link;
  return (
    <div className="wrap section">
      <div className="card form-card">
        <h1>Forgot your password?</h1>
        <p className="muted">Enter your account email and we&apos;ll give you a reset link (valid 24 hours, single use).</p>
        {sent ? (
          <div className="alert alert-ok">
            If an account exists for that email, a reset link was created.
            {link ? (
              <>
                <br />
                <span>Your reset link (shown here because email is not connected yet): </span>
                <Link href={link} className="amber">{link}</Link>
              </>
            ) : null}
          </div>
        ) : null}
        <form action="/api/auth/forgot" method="post">
          <div className="field">
            <label htmlFor="fp-email">Email</label>
            <input id="fp-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
          </div>
          <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>Send Reset Link</button>
        </form>
        <p className="small muted center" style={{ marginTop: 14 }}>
          <Link href="/login" className="amber">Back to Log In</Link>
        </p>
      </div>
    </div>
  );
}
