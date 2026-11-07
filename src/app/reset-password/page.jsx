// ---------------------------------------------------------------------------
// reset-password/page.jsx — set a new password with a reset token.
// ---------------------------------------------------------------------------
import Link from "next/link";

export const metadata = { title: "Reset Password — LearnChart FX", description: "Set a new password for your LearnChart FX account." };

export default async function ResetPasswordPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const token = sp?.token || "";
  const error = sp?.error;
  return (
    <div className="wrap section">
      <div className="card form-card">
        <h1>Set a new password</h1>
        {error ? <div className="alert alert-error">{error}</div> : null}
        <form action="/api/auth/reset" method="post">
          <input type="hidden" name="token" value={token} />
          <div className="field">
            <label htmlFor="rp-password">New password</label>
            <input id="rp-password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>Change Password</button>
        </form>
        <p className="small muted center" style={{ marginTop: 14 }}>
          <Link href="/login" className="amber">Back to Log In</Link>
        </p>
      </div>
    </div>
  );
}
