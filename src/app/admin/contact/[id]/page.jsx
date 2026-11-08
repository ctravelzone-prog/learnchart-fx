// ---------------------------------------------------------------------------
// admin/contact/[id] — one contact message with read / replied actions.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/admin.js";
import { getContactMessage } from "../../../../lib/db.js";

export const metadata = { title: "Contact Message — Admin — LearnChart FX" };

export default async function AdminContactDetailPage({ params, searchParams }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const message = getContactMessage(Number(id));
  if (!message) notFound();

  return (
    <div className="wrap section">
      <p className="muted small"><Link href="/admin/contact" className="amber">← Contact Inbox</Link></p>
      <h1 style={{ fontSize: 32 }}>{message.subject}</h1>
      <p className="muted">
        From <strong>{message.name}</strong> ({message.email}) · {new Date(message.created_at).toLocaleString("en-GB")}
      </p>
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}
      <div className="card">
        <p style={{ whiteSpace: "pre-wrap" }}>{message.message}</p>
      </div>
      <form action="/api/admin/contact/status" method="post" style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input type="hidden" name="id" value={message.id} />
        <button type="submit" name="status" value="read" className="btn btn-dark">Mark read</button>
        <button type="submit" name="status" value="replied" className="btn btn-amber">Mark replied</button>
        <button type="submit" name="status" value="new" className="btn btn-ghost">Mark unread</button>
      </form>
      <p className="small muted" style={{ marginTop: 10 }}>
        Reply from your own email ({message.email}) — the site sends no email replies itself.
      </p>
    </div>
  );
}
