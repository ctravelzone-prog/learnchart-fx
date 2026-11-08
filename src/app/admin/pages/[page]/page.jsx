// ---------------------------------------------------------------------------
// admin/pages/[page] — the per-page editor (admin only). One section
// per card, one field per row: text inputs for short text, textareas
// for paragraphs, and for image fields the current picture + an upload
// (images only, up to 5 MB — same rules as profile pictures). Text
// saves with one form per page; each image uploads with its own form.
// "Reset to default" is just clearing a field back to the value shown
// as the placeholder — the public page falls back to the default when
// the stored value is empty.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/admin.js";
import { PAGE_LIST, getPageFields } from "../../../../lib/page-content.js";

export const metadata = { title: "Edit Page — Admin — LearnChart FX" };

export default async function AdminPageEditor({ params, searchParams }) {
  await requireAdmin();
  const { page } = await params;
  const sp = await searchParams;
  const entry = PAGE_LIST.find((p) => p.id === page);
  if (!entry) notFound();
  const sections = getPageFields(page);

  return (
    <div className="wrap section">
      <p className="muted small"><Link href="/admin/pages" className="amber">← Pages / Content</Link></p>
      <h1 style={{ fontSize: 32 }}>Edit — {entry.title}</h1>
      <p className="muted">{entry.note}</p>
      {sp?.saved ? <div className="alert alert-ok">Saved.</div> : null}
      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}

      <form action="/api/admin/pages" method="post">
        <input type="hidden" name="page" value={page} />
        {Object.entries(sections).map(([section, fields]) => (
          <div className="card" key={section} style={{ marginBottom: 20 }}>
            <h3 style={{ textTransform: "capitalize" }}>{section}</h3>
            {fields
              .filter((f) => f.type !== "image")
              .map((f) => (
                <div className="field" key={f.field}>
                  <label htmlFor={`content__${section}__${f.field}`}>{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea
                      id={`content__${section}__${f.field}`}
                      name={`content__${section}__${f.field}`}
                      rows={3}
                      defaultValue={f.value}
                      placeholder={f.defaultValue}
                    />
                  ) : (
                    <input
                      id={`content__${section}__${f.field}`}
                      name={`content__${section}__${f.field}`}
                      defaultValue={f.value}
                      placeholder={f.defaultValue}
                    />
                  )}
                </div>
              ))}
            {fields.filter((f) => f.type === "image").length === 0 ? null : (
              <p className="small muted">Pictures for this section are uploaded below (one form per picture).</p>
            )}
          </div>
        ))}
        <button type="submit" className="btn btn-amber">Save All Text</button>
      </form>

      {/* Image fields: one upload form each. */}
      {Object.entries(sections).map(([section, fields]) =>
        fields
          .filter((f) => f.type === "image")
          .map((f) => (
            <div className="card" key={`${section}-${f.field}`} style={{ marginTop: 20 }}>
              <h3>{f.label} <span className="muted small">({section})</span></h3>
              {f.value ? <p><img src={f.value} alt={f.label} style={{ maxWidth: 300, borderRadius: 10 }} /></p> : null}
              <p className="small muted">Current: <span className="mono">{f.value || "—"}</span></p>
              <form action="/api/admin/pages/upload" method="post" encType="multipart/form-data">
                <input type="hidden" name="page" value={page} />
                <input type="hidden" name="section" value={section} />
                <input type="hidden" name="field" value={f.field} />
                <div className="field">
                  <label htmlFor={`img-${section}-${f.field}`}>Upload a new picture (image only, up to 5 MB)</label>
                  <input id={`img-${section}-${f.field}`} name="image" type="file" accept="image/*" required />
                </div>
                <button type="submit" className="btn btn-dark">Upload Picture</button>
              </form>
            </div>
          ))
      )}
    </div>
  );
}
