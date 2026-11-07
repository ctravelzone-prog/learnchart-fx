// ---------------------------------------------------------------------------
// signup/page.jsx — Sign Up (prompt Section 15). Name, email, password.
// ?next= carries the enrollment the user started, so after signup they
// are returned to it instead of losing their place.
// ---------------------------------------------------------------------------
import Link from "next/link";

export const metadata = { title: "Sign Up — LearnChart FX", description: "Create your LearnChart FX account." };

export default async function SignupPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const error = sp?.error;
  const next = sp?.next || "/profile";
  return (
    <div className="wrap section">
      <div className="card form-card">
        <h1>Create your account</h1>
        <p className="muted">Sign up to enroll in a course or service and join the community.</p>
        {error ? <div className="alert alert-error">{error}</div> : null}
        <form action="/api/auth/signup" method="post">
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label htmlFor="su-name">Full name</label>
            <input id="su-name" name="name" required placeholder="Your full name" autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="su-email">Email</label>
            <input id="su-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="su-password">Password</label>
            <input id="su-password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>Create Account</button>
        </form>
        <p className="small muted center" style={{ marginTop: 14 }}>
          Already have an account? <Link href="/login" className="amber">Log In</Link>
        </p>
      </div>
    </div>
  );
}
