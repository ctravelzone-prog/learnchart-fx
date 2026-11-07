// ---------------------------------------------------------------------------
// login/page.jsx — Log In (prompt Section 15). ?next= returns the user to
// the enrollment they started after a successful login.
// ---------------------------------------------------------------------------
import Link from "next/link";

export const metadata = { title: "Log In — LearnChart FX", description: "Log in to your LearnChart FX account." };

export default async function LoginPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const error = sp?.error;
  const reset = sp?.reset === "1";
  const next = sp?.next || "/profile";
  return (
    <div className="wrap section">
      <div className="card form-card">
        <h1>Log In</h1>
        <p className="muted">Welcome back to LearnChart FX.</p>
        {error ? <div className="alert alert-error">{error}</div> : null}
        {reset ? <div className="alert alert-ok">Password changed. Please log in with your new password.</div> : null}
        <form action="/api/auth/login" method="post">
          <input type="hidden" name="next" value={next} />
          <div className="field">
            <label htmlFor="li-email">Email</label>
            <input id="li-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="li-password">Password</label>
            <input id="li-password" name="password" type="password" required placeholder="Your password" autoComplete="current-password" />
          </div>
          <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>Log In</button>
        </form>
        <p className="small muted center" style={{ marginTop: 14 }}>
          <Link href="/forgot-password" className="amber">Forgot your password?</Link>
          {" · "}
          No account? <Link href="/signup" className="amber">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
