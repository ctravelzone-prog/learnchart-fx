// ---------------------------------------------------------------------------
// faq/page.jsx — FAQ page (prompt Section 13). Separate page reached from
// Home "Learn more", Home FAQ "All FAQs" and footer links. Stats strip
// reads the real counts from the database (admin-editable questions).
// ---------------------------------------------------------------------------
import Link from "next/link";
import FaqList from "../../components/FaqList.jsx";
import { getFaqsList } from "../../lib/settings.js";

export const metadata = {
  title: "Frequently Asked Questions — LearnChart FX",
  description: "Answers about the LearnChart FX premium course, private live trade and consultation.",
};

export default function FaqPage() {
  const faqs = getFaqsList();
  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 40 }}>Frequently Asked Questions</h1>
      <p className="muted">
        Find answers to common questions about our platform, courses, and services.
        Can&apos;t find what you&apos;re looking for?{" "}
        <Link href="/contact" className="amber">Contact our support team</Link>
      </p>

      <FaqList items={faqs} />

      <div className="card" style={{ marginTop: 28, textAlign: "center" }}>
        <h3>✓ Verified — Still Have Questions?</h3>
        <p className="muted">
          Our support team is here to help 24/7. Contact us and we&apos;ll get back to you as soon as possible.
        </p>
        <Link href="/contact" className="btn btn-amber">Contact Support</Link>
      </div>

      <div className="stat-strip" style={{ marginTop: 20 }}>
        <div className="card stat-card"><b>{faqs.length}</b><span className="muted">Total FAQs</span></div>
        <div className="card stat-card"><b>2</b><span className="muted">Total Categories</span></div>
        <div className="card stat-card"><b>24/7</b><span className="muted">Support Availability</span></div>
        <div className="card stat-card"><b>&lt;24h</b><span className="muted">Response Time</span></div>
      </div>
    </div>
  );
}
