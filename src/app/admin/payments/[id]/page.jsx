// ---------------------------------------------------------------------------
// admin/payments/[id] — one verified payment: student, course, method,
// amount, full transaction reference, status, date.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/admin.js";
import { getPayment } from "../../../../lib/db.js";

export const metadata = { title: "Payment — Admin — LearnChart FX" };

export default async function AdminPaymentDetailPage({ params }) {
  await requireAdmin();
  const { id } = await params;
  const payment = getPayment(Number(id));
  if (!payment) notFound();

  return (
    <div className="wrap section">
      <p className="muted small"><Link href="/admin/payments" className="amber">← Payments</Link></p>
      <h1 style={{ fontSize: 32 }}>Payment #{payment.id}</h1>
      <div className="card">
        <dl className="kv">
          <dt>Student</dt>
          <dd><Link href={`/admin/users/${payment.user_id}`} className="amber">{payment.user_name}</Link> ({payment.user_email})</dd>
          <dt>Course</dt><dd>{payment.course_slug}</dd>
          <dt>Method</dt><dd>{payment.method}</dd>
          <dt>Amount</dt><dd><strong>{payment.amount} {payment.currency}</strong></dd>
          <dt>Status</dt><dd><span className="badge badge-green">{payment.status}</span></dd>
          <dt>Date</dt><dd>{new Date(payment.created_at).toLocaleString("en-GB")}</dd>
        </dl>
        <h3 style={{ marginTop: 16 }}>Transaction reference</h3>
        <p className="mono" style={{ wordBreak: "break-all" }}>{payment.tx_hash}</p>
      </div>
    </div>
  );
}
