// ---------------------------------------------------------------------------
// page.jsx — HOME. Exactly the 12 sections of prompt Section 9, in this
// exact order. Nothing added, nothing removed. (Section 1 = the pill nav
// in layout.jsx; Section 12 = the footer in layout.jsx.)
// Courses, stats, testimonials, socials, brokers and FAQs come from
// the database (admin-editable in the master admin panel); config.js is
// only the seed + fallback — never invented, never copied. Page copy
// (hero, featured, career, brokers, inside, testimonials, FAQ) comes
// from the page_content table via src/lib/page-content.js (/admin/pages).
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getAllCourses } from "../lib/db.js";
import { SITE, INSIDE_VIDEO_ID } from "../lib/config.js";
import {
  getStats,
  getSocials,
  getBrokers,
  getTestimonials,
  getFaqsList,
  getSingleSetting,
} from "../lib/settings.js";
import { getPageContent } from "../lib/page-content.js";
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
  // Admin-editable content: database first, config.js as the fallback.
  // (The admin panel edits these; on a fresh database the placeholders
  // from config.js show until the owner fills in real values.)
  const stats = getStats();
  const socials = getSocials();
  const brokers = getBrokers();
  const testimonials = getTestimonials();
  const insideVideoId = getSingleSetting("inside_video_id", INSIDE_VIDEO_ID);
  // Page copy + pictures: /admin/pages, merged over the defaults.
  const pc = getPageContent("home");
  // Next-batch date: editable in Site Settings (default from config).
  const nextBatchDate = getSingleSetting("next_batch_date", SITE.nextBatchDate);
  // Home FAQ preview: exactly 7 — General 1–2 + Enrollment 1–5.
  const faqs = getFaqsList();
  const faqPreview = [
    ...faqs.filter((f) => f.category === "General").slice(0, 2),
    ...faqs.filter((f) => f.category === "Enrollment").slice(0, 5),
  ].map((f) => ({ q: f.question, a: f.answer }));

  return (
    <div>
      {/* 2 — Hero + Next Batch countdown (design: centered .hero-c) */}
      <section className="wrap hero hero-c">
        <h1>
          {pc.hero.title_start} <span className="amber">{pc.hero.title_highlight}</span> {pc.hero.title_end}
        </h1>
        <p className="lede">
          {pc.hero.sub}
        </p>
        <div className="hero-row">
          <Link href="/courses" className="btn btn-amber btn-lg">{pc.hero.cta_enroll} →</Link>
          <div className="batch2">
            <div className="batch2-head"><b>{pc.hero.batch_badge}</b><span>{pc.hero.batch_title}</span></div>
            <Countdown target={nextBatchDate} label={pc.hero.countdown_label} />
          </div>
        </div>
      </section>

      <div className="dots" />

      {/* 3 — Featured course showcase (design: one wide 3-column
          composition — left side cards, center featured card, right
          info panel; NOT two separate columns) */}
      <section className="wrap" style={{ padding: "6px 0 8px" }}>
        <div className="showcase">
          {/* Left: stacked small cards — mindset lesson + curriculum PDF */}
          <div className="side-col">
            <div className="side-card">
              <div className="sc-img">
                <img src={pc.featured.sc_image} alt="Trading mindset lesson — mentor teaching trading psychology" loading="lazy" />
                <span className="dur">{pc.featured.sc_duration}</span>
              </div>
              <div className="sc-body">
                <h4>{pc.featured.sc_chip}</h4>
                <p><strong>{pc.featured.sc_title}</strong> {pc.featured.sc_text}</p>
              </div>
            </div>
            <div className="side-card pdf-card">
              <div className="pdf-ic">PDF</div>
              <div className="pdf-name">{pc.featured.curriculum_label}</div>
              <a href="/api/curriculum" className="btn btn-amber btn-sm btn-block">{pc.featured.curriculum_button}</a>
            </div>
          </div>

          {/* Center: big featured card with mentor photo + thumbnail strip */}
          <div className="feat-card">
            <div className="feat-top">
              <span className="feat-brand">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="7" width="4" height="9" rx="1" fill="#2fbf71" /><rect x="10" y="4" width="4" height="12" rx="1" fill="#e5484d" /><rect x="17" y="9" width="4" height="8" rx="1" fill="#ffb52e" /></svg>
                LEARNCHART FX
              </span>
              <span className="fake-nav"><span>Home</span><span className="on">Courses &amp; Services</span><span>Contact Us</span></span>
            </div>
            <div className="feat-main">
              <div className="feat-text">
                <span className="feat-badge">{pc.featured.badge}</span>
                <h3>{pc.featured.title}</h3>
                <p>
                  {pc.featured.text}
                </p>
                <div className="feat-btns">
                  <Link href="/courses" className="btn btn-amber btn-sm">{pc.featured.cta_join}</Link>
                  <Link href="/faq" className="btn btn-ghost btn-sm">{pc.featured.cta_learn}</Link>
                  <Link href="/courses" className="plus-btn" aria-label="See all courses and services">+</Link>
                </div>
              </div>
              <div className="feat-photo">
                <img src={pc.featured.photo} alt="Mentor Siam Chowdhury at his trading desk with candlestick charts on the monitors" />
              </div>
            </div>
            <div className="feat-strip">
              <div className="fthumb"><img src="/images/mentor-desk.webp" alt="Lesson 1 — starting your trading journey" loading="lazy" /><b>1</b></div>
              <div className="fthumb"><img src="/images/mentor-rex.webp" alt="Lesson 2 — market structure basics" loading="lazy" /><b>2</b></div>
              <div className="fthumb"><img src="/images/mentor-studio.webp" alt="Lesson 3 — live trade analysis" loading="lazy" /><b>3</b></div>
              <div className="fthumb"><img src="/images/consultation-call.webp" alt="Lesson 4 — trading psychology" loading="lazy" /><b>4</b></div>
            </div>
          </div>

          {/* Right: info panel — 90% ring, chips, first two lessons */}
          <aside className="info-panel">
            <div className="ip-head">
              <h3>{pc.featured.info_title}</h3>
              <span className="ring" role="img" aria-label="90 percent">
                <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="#2e2e2e" strokeWidth="3.4" /><circle cx="18" cy="18" r="15.9" fill="none" stroke="#ffb52e" strokeWidth="3.4" pathLength="100" strokeDasharray="90 100" strokeLinecap="round" transform="rotate(-90 18 18)" /></svg>
                <span className="ring-t">90%</span>
              </span>
            </div>
            <p>{pc.featured.info_text}</p>
            <div className="ip-chips">
              <span>{pc.featured.info_chip1}</span>
              <span>{pc.featured.info_chip2}</span>
            </div>
            <Link href="/course-videos" className="lesson-row">
              <img src="/images/mentor-desk.webp" alt="" loading="lazy" />
              <b>Starting Your Trading Journey</b>
              <span className="num">1</span>
            </Link>
            <Link href="/course-videos" className="lesson-row">
              <img src="/images/consultation-call.webp" alt="" loading="lazy" />
              <b>Mastering Trading Psychology</b>
              <span className="num">2</span>
            </Link>
            <p className="small muted">{pc.featured.strip_note}</p>
          </aside>
        </div>
      </section>

      <div className="dots" />

      {/* 4 — Stats strip (all [Placeholder]) */}
      <section className="wrap section">
        <div className="stat-strip">
          {stats.map((s) => (
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
        <SectionTitle>{pc.services.heading}</SectionTitle>
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
            <img src={pc.career.photo} alt="Siam Chowdhury, head mentor of LearnChart FX" loading="lazy" />
            <div className="career-bar">
              <div><b>{pc.career.bar_name}</b> <span className="muted">{pc.career.bar_rest}</span></div>
              <div style={{ marginTop: 10 }}>
                {pc.career.tags.split(",").map((t) => (<span className="chip" key={t.trim()}>{t.trim()}</span>))}
              </div>
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: 32 }}>{pc.career.heading}</h2>
            <p style={{ fontSize: 20, marginTop: 16 }}>
              {pc.career.quote}
            </p>
            <p className="muted">{pc.career.quote_by}</p>
            <p className="muted">{pc.career.sub}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href="/courses" className="btn btn-amber">{pc.career.cta_enroll}</Link>
              <Link href="/mentors" className="btn btn-dark">{pc.career.cta_mentors}</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="dots" />

      {/* 7 — Create Your Trading Account With Confidence (brokers) */}
      <section className="wrap section">
        <SectionTitle sub={pc.brokers.sub}>
          {pc.brokers.heading}
        </SectionTitle>
        <Link href="/contact" className="btn btn-amber" style={{ marginBottom: 20 }}>{pc.brokers.cta}</Link>
        <div className="grid-4">
          {brokers.map((b, i) => (
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
        <SectionTitle>{pc.connect.heading}</SectionTitle>
        <div className="grid-6">
          {socials.map((s) => (
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
        <SectionTitle>{pc.inside.heading}</SectionTitle>
        <div className="card">
          {insideVideoId === "[Placeholder]" ? (
            <InsideVideoCover />
          ) : (
            <div className="video-wrap">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${insideVideoId}`}
                title="Inside LearnChart FX"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {pc.inside.chips.split(",").map((chip) => (<span className="chip" key={chip.trim()}>{chip.trim()}</span>))}
          </div>
        </div>
      </section>

      <div className="dots" />

      {/* 10 — Trusted By Successful Students */}
      <section className="wrap section">
        <SectionTitle sub={pc.testimonials.sub}>
          {pc.testimonials.heading}
        </SectionTitle>
        <Testimonials items={testimonials} />
      </section>

      <div className="dots" />

      {/* 11 — FAQ preview (exactly the 7 questions of Section 13) */}
      <section className="wrap section">
        <SectionTitle>{pc.faq.heading}</SectionTitle>
        {faqPreview.map((f) => (
          <details className="accordion" key={f.q}>
            <summary>{f.q} <span>+</span></summary>
            <div className="answer">{f.a}</div>
          </details>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <Link href="/faq" className="btn btn-dark">{pc.faq.cta_all}</Link>
          <Link href="/courses" className="btn btn-amber">{pc.faq.cta_enroll}</Link>
        </div>
      </section>
      {/* 12 — Footer lives in layout.jsx */}
    </div>
  );
}
