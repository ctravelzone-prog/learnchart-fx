// ---------------------------------------------------------------------------
// contact/page.jsx — Contact Us (prompt Section 14). The form saves the
// message to the database and shows a success confirmation. Delivery to
// an admin inbox belongs to the later master admin phase — no admin inbox
// or admin UI is built here; messages wait in the contact_messages table.
// ---------------------------------------------------------------------------
import Link from "next/link";

export const metadata = {
  title: "Contact Us — LearnChart FX",
  description: "Questions about the course, live trade support or consultation? Reach the LearnChart FX team.",
};

export default async function ContactPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const sent = sp?.sent === "1";
  return (
    <div className="wrap section">
      <p className="muted small">HOME › CONTACT US</p>
      <h1 style={{ fontSize: 40 }}>
        Contact <span className="amber">Us</span>
      </h1>
      <p className="muted">
        Questions about the course, live trade support or consultation? Reach the LearnChart FX team on any
        channel below — mentors Siam Chowdhury and Rex Mizan reply inside the member community.
      </p>

      <div className="grid-2" style={{ marginTop: 24 }}>
        <div>
          <div className="grid-2">
            <div className="card"><h3>✈️ Telegram</h3><p className="muted small">Join our community — fastest replies and daily live trade updates. [Placeholder link]</p></div>
            <div className="card"><h3>▶️ YouTube</h3><p className="muted small">Subscribe to our official channel for lessons and market breakdowns. [Placeholder link]</p></div>
            <div className="card"><h3>👍 Facebook</h3><p className="muted small">Follow us on Facebook for batch news and student results. [Placeholder link]</p></div>
            <div className="card"><h3>🎵 TikTok</h3><p className="muted small">Short trading lessons and live-session clips on our official channel. [Placeholder link]</p></div>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Before You Write — Quick Answers</h3>
            <p className="muted small">Most common questions are answered in the FAQ on the Home page. Community, Live Room and Consultation unlock after enrollment. Mentors are introduced on the open Mentors page.</p>
            <Link href="/faq" className="btn btn-dark btn-sm">Read the FAQ →</Link>
          </div>
        </div>

        <div className="card">
          <h3>Send a message</h3>
          {sent ? (
            <div className="alert alert-ok">
              Thank you — your message has been received. Our support team is available 24/7 and will reply as soon as possible (target: within 24 hours).
            </div>
          ) : null}
          <form action="/api/contact" method="post">
            <div className="field">
              <label htmlFor="cf-name">Name</label>
              <input id="cf-name" name="name" required placeholder="Your name" />
            </div>
            <div className="field">
              <label htmlFor="cf-email">Email</label>
              <input id="cf-email" name="email" type="email" required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label htmlFor="cf-subject">Subject</label>
              <input id="cf-subject" name="subject" required placeholder="What is this about?" />
            </div>
            <div className="field">
              <label htmlFor="cf-message">Message</label>
              <textarea id="cf-message" name="message" rows={5} required placeholder="Write your message…" />
            </div>
            <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>Send Message</button>
          </form>
          <p className="small muted" style={{ marginTop: 12 }}>
            Support promise: 24/7 availability, response within &lt;24h as a support target — not a guarantee of any trading outcome.
          </p>
        </div>
      </div>
    </div>
  );
}
