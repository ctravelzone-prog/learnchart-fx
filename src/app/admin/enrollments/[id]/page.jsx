// ---------------------------------------------------------------------------
// admin/enrollments/[id] — one enrollment: student, course, status
// actions, verified payments, and (for video courses) the Course Key:
// the admin can VIEW the key (decrypted server-side, owner-only) and
// resend it to the student's own email. Keys are NEVER listed in
// tables and NEVER appear in non-admin API responses.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/admin.js";
import { getEnrollmentDetail } from "../../../../lib/db.js";
import { decryptKey } from "../../../../lib/keys.js";

export const metadata = { title: "Enrollment — Admin — LearnChart FX" };

export default async function AdminEnrollmentDetailPage({ searchParams, params }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const detail = getEnrollmentDetail(Number(id));
  if (!detail) notFound();

  // The key is decrypted server-side ONLY for this admin detail view.
  let plainKey = null;
  if (detail.keyEncrypted) {
    try {
      plainKey = decryptKey(detail.keyEncrypted);
    } catch {
      plainKey = null;
    }
  }

  return (
    <div className="wrap section">
      <p className="muted small"><Link href="/admin/enrollments" className="amber">← Enrollments</Link></p>
      <h1 style={{ fontSize: 32 }}>{detail.course_title}</h1>
      <p className="muted">
        Student: <Link href={`/admin/users/${detail.user_id}`} className="amber">{detail.user_name}</Link> ({detail.user_email})
      </p>
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}
      {sp?.saved === "key-resent" ? <div className="alert alert-ok">Course Key emailed to {detail.user_email}.</div> : null}
      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}

      <div className="grid-2">
        <div className="card">
          <h3>Enrollment</h3>
          <dl className="kv">
            <dt>Status</dt>
            <dd>{detail.status === "active" ? <span className="badge badge-green">Active</span> : <span className="badge badge-amber">{detail.status}</span>}</dd>
            <dt>Enrolled</dt><dd>{new Date(detail.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
            <dt>Payment</dt><dd>{detail.payment_status || "—"}</dd>
          </dl>
          <form action="/api/admin/enrollments/status" method="post" style={{ marginTop: 12 }}>
            <input type="hidden" name="id" value={detail.id} />
            <input type="hidden" name="status" value={detail.status === "active" ? "cancelled" : "active"} />
            <button type="submit" className="btn btn-dark">
              {detail.status === "active" ? "Cancel this enrollment" : "Reactivate this enrollment"}
            </button>
          </form>
        </div>

        <div className="card">
          <h3>Course Key</h3>
          {!detail.course_has_videos ? (
            <p className="muted">This course has no video lessons, so it has no Course Key.</p>
          ) : !detail.keyEncrypted ? (
            <p className="muted">No key stored for this enrollment yet.</p>
          ) : (
            <>
              <p>
                Key: <code style={{ fontSize: 16 }}>{plainKey || "—"}</code>
              </p>
              <p className="small muted">Owner-only: this key is decrypted server-side for this admin view only. Never share it in chat or anywhere public.</p>
              <form action="/api/admin/keys/resend" method="post">
                <input type="hidden" name="enrollment_id" value={detail.id} />
                <button type="submit" className="btn btn-amber btn-sm">Resend key to {detail.user_email}</button>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Verified Payments ({detail.payments.length})</h3>
        {detail.payments.length === 0 ? (
          <p className="muted">No verified payments for this student + course.</p>
        ) : (
          detail.payments.map((p) => (
            <p key={p.id} className="small" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <Link href={`/admin/payments/${p.id}`} className="amber"><strong>{p.method}</strong></Link>
              {" — "}{p.amount} {p.currency} · {p.status}
              <br /><span className="mono muted">{p.tx_hash}</span>
            </p>
          ))
        )}
      </div>
    </div>
  );
}
