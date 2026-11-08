// ---------------------------------------------------------------------------
// admin/faq/[id] + /new — ONE shared FAQ form (admin only).
// Fields: category (General / Enrollment), question, answer, sort order.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/admin.js";
import { getFaqById } from "../../../../lib/db.js";

export const metadata = { title: "FAQ Question — Admin — LearnChart FX" };

export default async function AdminFaqFormPage({ params, searchParams }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const faq = isNew ? null : getFaqById(Number(id));
  if (!isNew && !faq) notFound();

  const f = faq || { category: "General", question: "", answer: "", sort_order: 0 };

  return (
    <div className="wrap section">
      <p className="muted small"><Link href="/admin/faq" className="amber">← FAQ</Link></p>
      <h1 style={{ fontSize: 32 }}>{isNew ? "Add Question" : "Edit Question"}</h1>
      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}

      <form action="/api/admin/faq" method="post">
        <input type="hidden" name="action" value={isNew ? "create" : "update"} />
        {!isNew ? <input type="hidden" name="id" value={faq.id} /> : null}
        <div className="card">
          <div className="grid-2">
            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" defaultValue={f.category}>
                <option value="General">General</option>
                <option value="Enrollment">Enrollment</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="sort_order">Sort order</label>
              <input id="sort_order" name="sort_order" type="number" defaultValue={f.sort_order} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="question">Question *</label>
            <input id="question" name="question" required defaultValue={f.question} />
          </div>
          <div className="field">
            <label htmlFor="answer">Answer *</label>
            <textarea id="answer" name="answer" rows={6} required defaultValue={f.answer} />
          </div>
          <button type="submit" className="btn btn-amber">{isNew ? "Add Question" : "Save Question"}</button>
        </div>
      </form>

      {!isNew ? (
        <form action="/api/admin/faq" method="post" style={{ marginTop: 16 }}>
          <input type="hidden" name="action" value="delete" />
          <input type="hidden" name="id" value={faq.id} />
          <button type="submit" className="btn btn-dark">Delete this question</button>
        </form>
      ) : null}
    </div>
  );
}
