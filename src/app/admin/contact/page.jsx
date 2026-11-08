// ---------------------------------------------------------------------------
// admin/contact — the contact inbox. All messages from the Contact Us
// form, newest first. "new" = unread (counted on the dashboard).
// Each row links to the detail page (read / replied actions).
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { listContactMessages } from "../../../lib/db.js";

export const metadata = { title: "Contact Inbox — Admin — LearnChart FX" };

export default async function AdminContactPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const messages = listContactMessages();

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Contact Inbox ({messages.length})</h1>
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved.</div> : null}
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Status</th><th>From</th><th>Subject</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id}>
                <td>
                  {m.status === "new" ? <span className="badge badge-amber">New</span>
                    : m.status === "replied" ? <span className="badge badge-green">Replied</span>
                    : <span className="badge">Read</span>}
                </td>
                <td><strong>{m.name}</strong><br /><span className="small muted">{m.email}</span></td>
                <td>{m.subject}</td>
                <td className="small muted">{new Date(m.created_at).toLocaleDateString("en-GB")}</td>
                <td><Link href={`/admin/contact/${m.id}`} className="amber">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {messages.length === 0 ? <p className="muted" style={{ padding: 12 }}>No contact messages yet.</p> : null}
      </div>
    </div>
  );
}
