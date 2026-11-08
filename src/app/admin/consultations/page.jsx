// ---------------------------------------------------------------------------
// admin/consultations — consultation booking requests from members.
// Before this page existed, requests were saved to the database but the
// admin had NO view for them at all — a member could book and nothing
// ever arrived in the panel. Every request is listed here, newest first,
// with the member, topic, mode, preferred slot, notes and status.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { listConsultationRequests } from "../../../lib/db.js";

export const metadata = { title: "Consultations — Admin — LearnChart FX" };

const FILTERS = [
  ["", "All"],
  ["pending", "Pending"],
  ["confirmed", "Confirmed"],
  ["rejected", "Rejected"],
];

function statusBadge(status) {
  if (status === "confirmed") return <span className="badge badge-green">Confirmed</span>;
  if (status === "rejected") return <span className="badge">Rejected</span>;
  return <span className="badge badge-amber">Pending</span>;
}

export default async function AdminConsultationsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  // Only the three real statuses filter; anything else shows all.
  const status = ["pending", "confirmed", "rejected"].includes(sp?.status) ? sp.status : "";
  const requests = listConsultationRequests(status);

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Consultations ({requests.length})</h1>
      <p className="muted">Booking requests from Trading Consultation members. Confirm a slot with a meeting link, or reject it.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {FILTERS.map(([value, label]) => (
          <Link
            key={value || "all"}
            href={value ? `/admin/consultations?status=${value}` : "/admin/consultations"}
            className={`btn btn-sm${status === value ? " btn-amber" : " btn-dark"}`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="card tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Status</th><th>Member</th><th>Topic</th><th>Mode</th><th>Preferred slot (Dhaka)</th><th>Submitted</th><th></th></tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{statusBadge(r.status)}</td>
                <td><strong>{r.user_name}</strong><br /><span className="small muted">{r.user_email}</span></td>
                <td>{r.topic}</td>
                <td>{r.mode}</td>
                <td>{r.preferred_date}<br /><span className="small muted">{r.preferred_time}</span></td>
                <td className="small muted">{new Date(r.created_at).toLocaleString("en-GB")}</td>
                <td><Link href={`/admin/consultations/${r.id}`} className="amber">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 ? <p className="muted" style={{ padding: 12 }}>No consultation requests yet.</p> : null}
      </div>
    </div>
  );
}
