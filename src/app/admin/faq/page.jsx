// ---------------------------------------------------------------------------
// admin/faq — all FAQ questions, grouped by category. The public FAQ
// page and the home preview read this table, so edits show immediately.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { getFaqs } from "../../../lib/db.js";

export const metadata = { title: "FAQ — Admin — LearnChart FX" };

export default async function AdminFaqPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const faqs = getFaqs();

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>FAQ ({faqs.length})</h1>
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}
      <p><Link href="/admin/faq/new" className="btn btn-amber">+ Add Question</Link></p>
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Category</th><th>Question</th><th>Answer</th><th></th></tr>
          </thead>
          <tbody>
            {faqs.map((f) => (
              <tr key={f.id}>
                <td><span className="badge badge-amber">{f.category}</span></td>
                <td><strong>{f.question}</strong></td>
                <td className="small muted">{f.answer.slice(0, 120)}{f.answer.length > 120 ? "…" : ""}</td>
                <td><Link href={`/admin/faq/${f.id}`} className="amber">Edit →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
