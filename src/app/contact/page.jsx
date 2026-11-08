// ---------------------------------------------------------------------------
// contact/page.jsx — Contact Us (prompt Section 14). The form saves the
// message to the database and shows a success confirmation. The admin
// reads + replies from the Contact Inbox in the master admin panel.
// All copy on this page is editable from /admin/pages (Contact) —
// headings, intro, channel cards, quick answers, form labels and the
// support promise. The page has no picture slots in the design.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getPageContent } from "../../lib/page-content.js";

export const metadata = {
  title: "Contact Us — LearnChart FX",
  description: "Questions about the course, private live trade or consultation? Reach the LearnChart FX team.",
};

export default async function ContactPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const sent = sp?.sent === "1";
  // Page copy: /admin/pages, merged over the defaults.
  const pc = getPageContent("contact");
  const channels = [
    { title: pc.channels.telegram_title, desc: pc.channels.telegram_desc },
    { title: pc.channels.youtube_title, desc: pc.channels.youtube_desc },
    { title: pc.channels.facebook_title, desc: pc.channels.facebook_desc },
    { title: pc.channels.tiktok_title, desc: pc.channels.tiktok_desc },
  ];
  return (
    <div className="wrap section">
      <p className="muted small">HOME › CONTACT US</p>
      <h1 style={{ fontSize: 40 }}>
        {pc.main.heading_start} <span className="amber">{pc.main.heading_highlight}</span>
      </h1>
      <p className="muted">
        {pc.main.intro}
      </p>

      <div className="grid-2" style={{ marginTop: 24 }}>
        <div>
          <div className="grid-2">
            {channels.map((ch) => (
              <div className="card" key={ch.title}><h3>{ch.title}</h3><p className="muted small">{ch.desc}</p></div>
            ))}
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h3>{pc.quick.heading}</h3>
            <p className="muted small">{pc.quick.text}</p>
            <Link href="/faq" className="btn btn-dark btn-sm">{pc.quick.cta}</Link>
          </div>
        </div>

        <div className="card">
          <h3>{pc.form.heading}</h3>
          {sent ? (
            <div className="alert alert-ok">
              {pc.form.success}
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
            <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>{pc.form.button}</button>
          </form>
          <p className="small muted" style={{ marginTop: 12 }}>
            {pc.form.promise}
          </p>
        </div>
      </div>
    </div>
  );
}
