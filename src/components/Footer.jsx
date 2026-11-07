// ---------------------------------------------------------------------------
// Footer.jsx — shared footer (prompt Section 9, item 12). Links to the
// gated areas go through the normal pages, so lock rules apply there.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { SITE } from "../lib/config.js";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: 12 }}>
              <span className="mark">LC</span>
              <span className="name">LEARNCHART <span>FX</span></span>
            </div>
            <p className="muted small" style={{ maxWidth: 420 }}>{SITE.mission}</p>
            <p className="muted small">
              YouTube · Instagram · TikTok · Telegram · Facebook — [Placeholder handles]
            </p>
          </div>
          <div>
            <h4>About Us</h4>
            <Link href="/mentors">Mentors</Link>
            <Link href="/courses">Courses &amp; Services</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact Us</Link>
          </div>
          <div>
            <h4>Terms &amp; Policies</h4>
            <Link href="/course-videos">Course Videos</Link>
            <Link href="/community">Community</Link>
            <Link href="/live-room">Live Room</Link>
            <p className="muted small" style={{ marginTop: 12 }}>
              Trading involves risk. No profit is guaranteed.
            </p>
          </div>
        </div>
        <p className="muted small center" style={{ marginTop: 28 }}>
          © {new Date().getFullYear()} LearnChart FX — Mentors: Siam Chowdhury &amp; Rex Mizan
        </p>
      </div>
    </footer>
  );
}
