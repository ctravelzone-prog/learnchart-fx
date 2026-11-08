// ---------------------------------------------------------------------------
// admin/payments — every verified payment (BEP20 USDT + Binance Pay).
// Reference (TxHash / Order ID) is shown truncated in the list; the
// full value is on the detail page. Failed / duplicate attempts are
// NOT stored — only verified payments reach this table.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { listPayments } from "../../../lib/db.js";

export const metadata = { title: "Payments — Admin — LearnChart FX" };

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const payments = listPayments();

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
    </div>
  );
}
