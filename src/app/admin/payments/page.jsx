// ---------------------------------------------------------------------------
// admin/payments — every verified payment (BEP20 USDT + Binance Pay).
// Reference (TxHash / Order ID) is shown truncated in the list; the
// full value is on the detail page. Failed attempts (wrong amount /
// wrong recipient / not found / Binance geo-block) are listed below as
// "Needs review" — they were queued, never auto-rejected, so no money
// is silently dropped. A reviewed attempt disappears from this list.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { listPayments, listPaymentAttempts } from "../../../lib/db.js";

export const metadata = { title: "Payments — Admin — LearnChart FX" };

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const payments = listPayments();
  const attempts = listPaymentAttempts();

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Payments ({payments.length})</h1>
      <p className="muted">Verified payments only — each one created an enrollment. Replays are blocked by the unique transaction reference.</p>
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Student</th><th>Method</th><th>Amount</th><th>Reference</th><th>Status</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.user_name}</strong><br /><span className="small muted">{p.user_email}</span></td>
                <td>{p.method}</td>
                <td>{p.amount} {p.currency}</td>
                <td className="mono small">{p.tx_hash ? `${p.tx_hash.slice(0, 10)}…${p.tx_hash.slice(-6)}` : "—"}</td>
                <td><span className="badge badge-green">{p.status}</span></td>
                <td className="small muted">{new Date(p.created_at).toLocaleDateString("en-GB")}</td>
                <td><Link href={`/admin/payments/${p.id}`} className="amber">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 ? <p className="muted" style={{ padding: 12 }}>No verified payments yet.</p> : null}
      </div>

      <h2 style={{ fontSize: 24, marginTop: 32 }}>Needs review ({attempts.length})</h2>
      <p className="muted">Failed verifications — wrong amount, wrong recipient, not found, or Binance geo-block. Check the on-chain details, then enroll the student manually from Admin → Enrollments if the money did arrive.</p>
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Student</th><th>Method</th><th>Reason</th><th>Expected</th><th>On-chain detail</th><th>Reference</th><th>Date</th></tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.user_name}</strong><br /><span className="small muted">{a.user_email}</span></td>
                <td>{a.method}</td>
                <td><span className="badge badge-amber">{a.reason}</span><br /><span className="small muted">{a.course_slug}</span></td>
                <td>{a.expected_amount ? `${a.expected_amount} USDT` : "—"}</td>
                <td className="mono small">{a.detail || "—"}</td>
                <td className="mono small">{a.tx_ref ? `${a.tx_ref.slice(0, 10)}…${a.tx_ref.slice(-6)}` : "—"}</td>
                <td className="small muted">{new Date(a.created_at).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {attempts.length === 0 ? <p className="muted" style={{ padding: 12 }}>No failed payments waiting for review.</p> : null}
      </div>
    </div>
  );
}
