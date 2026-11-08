// ---------------------------------------------------------------------------
// admin/consultations/[id] — one consultation request with the approve /
// reject decision. Approving confirms the slot (date + time, prefilled
// with what the member asked for) and pastes the MEETING LINK — a plain
// text field, any provider the admin creates (Google Meet / Zoom / any
// link). The site creates no links itself and has no built-in AV
// provider. On confirm the member sees Confirmed + a "Join live session"
// button with this exact link; on reject they see Rejected. A decision
// can be changed later — the forms stay available, prefilled with the
// current decision.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "../../../../lib/admin.js";
import { getConsultationRequest } from "../../../../lib/db.js";

export const metadata = { title: "Consultation Request — Admin — LearnChart FX" };

export default async function AdminConsultationDetailPage({ params, searchParams }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const r = getConsultationRequest(Number(id));
  if (!r) notFound();

  return (
    <div className="wrap section">
      <p className="muted small"><Link href="/admin/consultations" className="amber">← Consultations</Link></p>
      <h1 style={{ fontSize: 32 }}>{r.topic}</h1>
      <p className="muted">
        From <strong>{r.user_name}</strong> ({r.user_email}) · submitted {new Date(r.created_at).toLocaleString("en-GB")}
      </p>
      {sp?.saved === "1" ? <div className="alert alert-ok">Saved — the member sees the new status on their Consultation page.</div> : null}
      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}

      <div className="card" style={{ marginBottom: 16 }}>
        <p><strong>Status: </strong>
          {r.status === "confirmed" ? <span className="badge badge-green">Confirmed</span>
            : r.status === "rejected" ? <span className="badge">Rejected</span>
            : <span className="badge badge-amber">Pending</span>}
        </p>
        <p><strong>Member&apos;s name on the request:</strong> {r.name}</p>
        <p><strong>Session mode:</strong> {r.mode}</p>
        <p><strong>Preferred slot (Dhaka):</strong> {r.preferred_date} at {r.preferred_time}</p>
        <p><strong>Note from the member:</strong> {r.note ? <span style={{ whiteSpace: "pre-wrap" }}>{r.note}</span> : "—"}</p>
        {r.status !== "pending" ? (
          <>
            <p><strong>Confirmed slot:</strong> {r.confirmed_date ? `${r.confirmed_date} at ${r.confirmed_time}` : "—"}</p>
            <p><strong>Meeting link:</strong> {r.meeting_link ? <a href={r.meeting_link} target="_blank" rel="noopener noreferrer">{r.meeting_link}</a> : "—"}</p>
            <p><strong>Your note to the member:</strong> {r.admin_note ? <span style={{ whiteSpace: "pre-wrap" }}>{r.admin_note}</span> : "—"}</p>
            <p className="small muted">Decided {r.decided_at ? new Date(r.decided_at).toLocaleString("en-GB") : "—"}. You can change the decision below — the member sees the latest one.</p>
          </>
        ) : null}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>Confirm this slot</h3>
          <p className="small muted">Paste the meeting link you created (Google Meet, Zoom, or any link). The member gets a &ldquo;Join live session&rdquo; button with this exact link.</p>
          <form action="/api/admin/consultations/decide" method="post">
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="action" value="confirm" />
            <div className="field">
              <label htmlFor="cq-confirmed-date">Confirmed date</label>
              <input id="cq-confirmed-date" name="confirmed_date" type="date" required defaultValue={r.confirmed_date || r.preferred_date} />
            </div>
            <div className="field">
              <label htmlFor="cq-confirmed-time">Confirmed time (Dhaka)</label>
              <input id="cq-confirmed-time" name="confirmed_time" type="text" required placeholder="e.g. 3:30 PM" defaultValue={r.confirmed_time || r.preferred_time} />
            </div>
            <div className="field">
              <label htmlFor="cq-meeting-link">Meeting link</label>
              <input id="cq-meeting-link" name="meeting_link" type="url" required placeholder="https://meet.google.com/xxx-yyyy-zzz" defaultValue={r.meeting_link} />
            </div>
            <div className="field">
              <label htmlFor="cq-admin-note">Note to the member (optional)</label>
              <textarea id="cq-admin-note" name="admin_note" rows={2} placeholder="Anything the member should know before the session." defaultValue={r.admin_note} />
            </div>
            <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>Confirm &amp; Send Join Link</button>
          </form>
        </div>

        <div className="card">
          <h3>Reject this request</h3>
          <p className="small muted">The member sees Rejected on their Consultation page, with your note if you leave one.</p>
          <form action="/api/admin/consultations/decide" method="post">
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="action" value="reject" />
            <div className="field">
              <label htmlFor="cq-reject-note">Note to the member (optional)</label>
              <textarea id="cq-reject-note" name="admin_note" rows={2} placeholder="e.g. Please pick another slot — the mentor is away that week." />
            </div>
            <button type="submit" className="btn btn-dark" style={{ width: "100%" }}>Reject Request</button>
          </form>
        </div>
      </div>
    </div>
  );
}
