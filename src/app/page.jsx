// ---------------------------------------------------------------------------
// page.jsx — HOME. Exactly the 12 sections of prompt Section 9, in this
// exact order. Nothing added, nothing removed. (Section 1 = the pill nav
// in layout.jsx; Section 12 = the footer in layout.jsx.)
// Courses come from the database; stats/testimonials/socials/brokers are
// [Placeholder] from config.js — never invented, never copied.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getAllCourses } from "../lib/db.js";
import { SITE, STATS, SOCIALS, BROKERS, TESTIMONIALS, INSIDE_VIDEO_ID } from "../lib/config.js";
import { FAQ_HOME_PREVIEW } from "../lib/faq-data.js";
import Countdown from "../components/Countdown.jsx";
import Testimonials from "../components/Testimonials.jsx";
import InsideVideoCover from "../components/InsideVideoCover.jsx";

// Course card banner photos — the design's course images, by course slug.
// (Design file: forex card = mentor at desk, live-trade card = studio
// broadcast, consultation card = one-on-one video call.)
const COURSE_IMAGES = {
  "forex-premium-course": { src: "/images/mentor-desk.webp", alt: "Forex Trading Premium Course with mentor Siam Chowdhury" },
  "premium-live-trade-support": { src: "/images/mentor-studio.webp", alt: "Premium Live Trade Support — mentor live in the trading studio" },
  "trading-consultation": { src: "/images/consultation-call.webp", alt: "Trading Consultation — one-on-one session with the mentor" },
};

export const metadata = {
  title: "LearnChart FX — Mastering Trading With Experts",
  description:
    "LearnChart FX — forex trading premium course, premium live trade support every day and trading consultation. Mentors Siam Chowdhury and Rex Mizan.",
};

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 32 }}>{children}</h2>
      {sub ? <p className="muted" style={{ marginTop: 8 }}>{sub}</p> : null}
    </div>
  );
}

export default async function HomePage() {
  const courses = getAllCourses();
  const forex = courses.find((c) => c.slug === "forex-premium-course");

  return (
    <div>
      {/* 2 — Hero + Next Batch countdown */}
      <section className="wrap hero">
        <div>
          <h1>
            The Asia&apos;s First All-in-One Platform For <span className="amber">Professional</span> Trading Education.
          </h1>
          <p>
            Learn forex trading with a trusted mentor, manage risk with a clear plan,
            and trade with confidence — step by step, from basics to live markets.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <Link href="/courses" className="btn btn-amber">Enroll Now</Link>
            <Link href="/mentors" className="btn btn-dark">Meet Your Mentors</Link>
          </div>
        </div>
        <div className="card">
          <span className="badge badge-amber">NEXT BATCH</span>
          <h3 style={{ marginTop: 12 }}>Starting on January 10</h3>
          <p className="muted small">The next batch of the Forex Trading Premium Course begins soon. Reserve your seat.</p>
          <Countdown target={SITE.nextBatchDate} label="Countdown to the next batch" />
        </div>
      </section>

      <div className="dots" />

      {/* 3 — Featured course showcase (design: feat-card + info panel) */}
      <section className="wrap section">
        <div className="grid-2">
          <div className="card">
            <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 14, alignItems: "center" }}>
              <div>
                <span className="badge badge-amber">Featured</span>
                <h2 style={{ marginTop: 12 }}>LEARNCHART FX #01</h2>
                <p className="muted">
                  Boost your trading skills with LearnChart FX. Learn trading strategies,
                  expert market analysis, and risk management with a clear plan, every day.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link href="/courses" className="btn btn-amber">▶ Join Course</Link>
                  <Link href="/faq" className="btn btn-dark">Learn more</Link>
                </div>
              </div>
              <div className="feat-photo">
                <img src="/images/mentor-desk.webp" alt="Mentor Siam Chowdhury at his trading desk with candlestick charts on the monitors" />
              </div>
            </div>
            <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <div className="sc-img">
                <img src="/images/mentor-studio.webp" alt="Trading mindset lesson — mentor teaching trading psychology" loading="lazy" />
                <span className="dur">1.5 hrs</span>
              </div>
              <span className="chip">9. TRADING MINDSET</span>
              <p style={{ margin: "8px 0 0" }}>
                <strong>Master trading psychology.</strong>{" "}
                <span className="muted">Manage emotions &amp; discipline. Build mindset, get results.</span>
              </p>
            </div>
            <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <span className="badge">PDF</span>
              <p style={{ margin: "8px 0" }}><strong>PREMIUM COURSE CURRICULUM</strong></p>
              <a href="/api/curriculum" className="btn btn-dark btn-sm">DOWNLOAD PDF ⬇</a>
            </div>
            <div className="feat-strip">
              <div className="fthumb"><img src="/images/mentor-desk.webp" alt="Lesson 1 — starting your trading journey" loading="lazy" /><b>1</b></div>
              <div className="fthumb"><img src="/images/mentor-rex.webp" alt="Lesson 2 — market structure basics" loading="lazy" /><b>2</b></div>
              <div className="fthumb"><img src="/images/mentor-studio.webp" alt="Lesson 3 — live trade analysis" loading="lazy" /><b>3</b></div>
              <div className="fthumb"><img src="/images/consultation-call.webp" alt="Lesson 4 — trading psychology" loading="lazy" /><b>4</b></div>
            </div>
          </div>
          <div className="card">
            <h3>LEARNCHART FX</h3>
            <p className="muted">Trading made simple for every learner. Step-by-step lessons with clear guidance. Build confidence and master the market.</p>
            <div>
              <span className="chip">10 Lessons</span>
              <span className="chip">1.5 hrs</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <div className="lesson-row">
                <img src="/images/mentor-desk.webp" alt="" loading="lazy" />
                <b>Starting Your Trading Journey</b>
                <span className="num">1</span>
              </div>
              <div className="lesson-row">
                <img src="/images/consultation-call.webp" alt="" loading="lazy" />
                <b>Mastering Trading Psychology</b>
                <span className="num">2</span>
              </div>
            </div>
            <p className="small muted">90% — of learners follow the lessons in order, one lesson at a time.</p>
          </div>
        </div>
      </section>

      <div className="dots" />

      {/* 4 — Stats strip (all [Placeholder]) */}
      <section className="wrap section">
        <div className="stat-strip">
          {STATS.map((s) => (
            <div className="card stat-card" key={s.label}>
              <b>{s.value}</b>
              <span className="muted">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="dots" />

      {/* 5 — Our services (same three cards as the Courses page) */}
      <section className="wrap section">
        <SectionTitle>Our services</SectionTitle>
        <div className="grid-3">
          {courses.map((c) => (
            <div className="card" key={c.slug}>
              {COURSE_IMAGES[c.slug] ? (
                <div className="course-thumb">
                  <img src={COURSE_IMAGES[c.slug].src} alt={COURSE_IMAGES[c.slug].alt} loading="lazy" />
                  {c.slug === "forex-premium-course" ? <span className="badge badge-amber thumb-badge">★ BESTSELLER</span> : null}
                </div>
              ) : null}
              <h3>{c.title}</h3>
              <p className="muted small">{c.subtitle}</p>
              <ul className="check-list">
                {c.features.slice(0, 4).map((f) => (<li key={f}>{f}</li>))}
              </ul>
              <p className="price">{c.price_label}</p>
              <Link href="/courses" className="btn btn-amber">{c.button_label}</Link>
            </div>
          ))}
        </div>
      </section>

      <div className="dots" />

      {/* 6 — Build a Successful Trading Career (mentors, open to all) */}
      <section className="wrap section">
        <div className="grid-2">
          <div className="career-photo">
            <img src="/images/mentor-desk.webp" alt="Siam Chowdhury, head mentor of LearnChart FX" loading="lazy" />
            <div className="career-bar">
              <div><b>Siam Chowdhury</b> <span className="muted">&amp; Rex Mizan — your mentors</span></div>
              <div style={{ marginTop: 10 }}>
                <span className="chip">FOREX</span><span className="chip">FUTURES</span>
                <span className="chip">STOCKS</span><span className="chip">OPTIONS</span>
              </div>
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: 32 }}>Build a Successful Trading Career</h2>
            <p style={{ fontSize: 20, marginTop: 16 }}>
              “Consistency is the key to success in trading. Stay disciplined — results will follow.”
            </p>
            <p className="muted">— LearnChart FX</p>
            <p className="muted">Start your journey to becoming a professional trader today.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/courses" className="btn btn-amber">Enroll Now</Link>
              <Link href="/mentors" className="btn btn-dark">Meet the Mentors</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="dots" />

      {/* 7 — Create Your Trading Account With Confidence (brokers) */}
      <section className="wrap section">
        <SectionTitle sub="LearnChart FX helps beginners learn forex account setup, broker selection, KYC verification, MetaTrader setup, funding, withdrawals, risk management, and trading psychology step by step. Trading involves risk, so choose regulated brokers and trade with proper risk management.">
          Create Your Trading Account With Confidence
        </SectionTitle>
        <Link href="/contact" className="btn btn-amber" style={{ marginBottom: 20 }}>Open an Account</Link>
        <div className="grid-4">
          {BROKERS.map((b, i) => (
            <div className="card center" key={i}>
              <div className="avatar" style={{ margin: "0 auto 10px" }}>B{i + 1}</div>
              <strong>{b.name}</strong>
              <div style={{ marginTop: 12 }}>
                <span className="btn btn-dark btn-sm">[Placeholder — sign-up link]</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="dots" />

      {/* 8 — Connect With Us */}
      <section className="wrap section">
        <SectionTitle>CONNECT WITH US</SectionTitle>
        <div className="grid-6">
          {SOCIALS.map((s) => (
            <div className="card" key={s.platform}>
              <h3 style={{ fontSize: 18 }}>{s.platform}</h3>
              <p className="muted small">{s.handle}</p>
              <p className="small">{s.desc}</p>
              <span className="btn btn-dark btn-sm">{s.cta} →</span>
              <p className="small muted">[Placeholder link]</p>
            </div>
          ))}
        </div>
      </section>

      <div className="dots" />

      {/* 9 — Inside LearnChart FX */}
      <section className="wrap section">
        <SectionTitle>&ldquo;Inside LearnChart FX&rdquo;</SectionTitle>
        <div className="card">
          {INSIDE_VIDEO_ID === "[Placeholder]" ? (
            <InsideVideoCover />
          ) : (
            <div className="video-wrap">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${INSIDE_VIDEO_ID}`}
                title="Inside LearnChart FX"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="chip">✓ Personalised Experience</span>
            <span className="chip">✓ Multiple Topics &amp; Classes</span>
            <span className="chip">✓ Proven Profitable Strategies</span>
          </div>
        </div>
      </section>

      <div className="dots" />

      {/* 10 — Trusted By Successful Students */}
      <section className="wrap section">
        <SectionTitle sub="99% — Of Students Were Served Successfully">
          Trusted By Successful Students
        </SectionTitle>
        <Testimonials items={TESTIMONIALS} />
      </section>

      <div className="dots" />

      {/* 11 — FAQ preview (exactly the 7 questions of Section 13) */}
      <section className="wrap section">
        <SectionTitle>Frequently Asked Questions</SectionTitle>
        {FAQ_HOME_PREVIEW.map((f) => (
          <details className="accordion" key={f.q}>
            <summary>{f.q} <span>+</span></summary>
            <div className="answer">{f.a}</div>
          </details>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <Link href="/faq" className="btn btn-dark">All FAQs →</Link>
          <Link href="/courses" className="btn btn-amber">Enroll Now →</Link>
        </div>
      </section>
      {/* 12 — Footer lives in layout.jsx */}
    </div>
  );
}
