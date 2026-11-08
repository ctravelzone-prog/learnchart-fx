// ---------------------------------------------------------------------------
// page-content.js — DB-backed page copy + pictures for Home, Contact and
// Mentors. Every heading, sub-line, paragraph, button label and content
// block on those three pages is editable from /admin/pages — the owner
// never touches code to change words or pictures.
//
// How it works: PAGE_DEFAULTS below holds the CURRENT copy verbatim
// (the config/design text). The `page_content` table holds only the
// fields the owner has edited. getPageContent(page) merges the two, so
// a page looks exactly as before until an edit exists. Images are
// stored as URLs ("/uploads/pages/...") in the same table; the files
// are uploaded through the admin panel (same validation as profile
// pictures: images only, max 5 MB).
//
// NOTE: some lists are NOT in this file — stats, testimonials, socials
// and brokers live in /admin/settings, mentors live in /admin/mentors,
// lessons live in /admin/lessons. The Pages editor links to those.
// The featured showcase's two lesson rows mirror lessons 1–2 from the
// database (editable in /admin/lessons), so they are not duplicated
// here — editing the lesson title edits the showcase too.
// ---------------------------------------------------------------------------
import { getPageContentRows, setPageContent } from "./db.js";

// field: { label, type: "text" | "textarea" | "image", value }
export const PAGE_DEFAULTS = {
  home: {
    hero: {
      title_start: { label: "Hero title — before the highlight", type: "text", value: "The Asia's First All-in-One Platform For" },
      title_highlight: { label: "Hero title — highlighted word", type: "text", value: "Professional" },
      title_end: { label: "Hero title — after the highlight", type: "text", value: "Trading Education." },
      sub: { label: "Hero subtitle", type: "textarea", value: "Learn forex trading with a trusted mentor, manage risk with a clear plan, and trade with confidence — step by step, from basics to live markets." },
      cta_enroll: { label: "Hero button 1", type: "text", value: "Enroll Now" },
      cta_mentors: { label: "Hero button 2", type: "text", value: "Meet Your Mentors" },
      batch_badge: { label: "Next-batch heading (bold, above the date)", type: "text", value: "Next Batch" },
      batch_title: { label: "Next-batch title", type: "text", value: "Starting on January 10" },
      batch_sub: { label: "Next-batch subtitle", type: "textarea", value: "The next batch of the Forex Trading Premium Course begins soon. Reserve your seat." },
      countdown_label: { label: "Countdown label", type: "text", value: "Countdown to the next batch" },
    },
    featured: {
      badge: { label: "Featured badge", type: "text", value: "Featured" },
      title: { label: "Featured title", type: "text", value: "LEARNCHART FX #01" },
      text: { label: "Featured text", type: "textarea", value: "Boost your trading skills with LearnChart FX. Learn trading strategies, expert market analysis, and risk management with a clear plan, every day." },
      cta_join: { label: "Featured button 1", type: "text", value: "▶ Join Course" },
      cta_learn: { label: "Featured button 2", type: "text", value: "Learn more" },
      photo: { label: "Featured photo", type: "image", value: "/images/mentor-desk.webp" },
      sc_chip: { label: "Showcase chip", type: "text", value: "9. TRADING MINDSET" },
      sc_title: { label: "Showcase title", type: "text", value: "Master trading psychology." },
      sc_text: { label: "Showcase text", type: "textarea", value: "Manage emotions & discipline. Build mindset, get results." },
      sc_duration: { label: "Showcase duration", type: "text", value: "1.5 hrs" },
      sc_image: { label: "Showcase image", type: "image", value: "/images/mentor-studio.webp" },
      curriculum_label: { label: "Curriculum label", type: "text", value: "PREMIUM COURSE CURRICULUM" },
      curriculum_button: { label: "Curriculum button", type: "text", value: "DOWNLOAD PDF ⬇" },
      info_title: { label: "Info panel title", type: "text", value: "LEARNCHART FX" },
      info_text: { label: "Info panel text", type: "textarea", value: "Trading made simple for every learner. Step-by-step lessons with clear guidance. Build confidence and master the market." },
      info_chip1: { label: "Info chip 1", type: "text", value: "10 Lessons" },
      info_chip2: { label: "Info chip 2", type: "text", value: "1.5 hrs" },
      strip_note: { label: "Note under the showcase", type: "textarea", value: "90% — of learners follow the lessons in order, one lesson at a time." },
    },
    services: {
      heading: { label: "Section heading", type: "text", value: "Our services" },
    },
    career: {
      heading: { label: "Section heading", type: "text", value: "Build a Successful Trading Career" },
      quote: { label: "Quote", type: "textarea", value: "“Consistency is the key to success in trading. Stay disciplined — results will follow.”" },
      quote_by: { label: "Quote credit", type: "text", value: "— LearnChart FX" },
      sub: { label: "Sub-line", type: "textarea", value: "Start your journey to becoming a professional trader today." },
      cta_enroll: { label: "Button 1", type: "text", value: "Enroll Now" },
      cta_mentors: { label: "Button 2", type: "text", value: "Meet the Mentors" },
      photo: { label: "Career photo", type: "image", value: "/images/mentor-desk.webp" },
      bar_name: { label: "Photo bar — name", type: "text", value: "Siam Chowdhury" },
      bar_rest: { label: "Photo bar — rest", type: "text", value: "& Rex Mizan — your mentors" },
      tags: { label: "Photo bar tags (comma-separated)", type: "text", value: "FOREX, FUTURES, STOCKS, OPTIONS" },
    },
    brokers: {
      heading: { label: "Section heading", type: "text", value: "Create Your Trading Account With Confidence" },
      sub: { label: "Section subtitle", type: "textarea", value: "LearnChart FX helps beginners learn forex account setup, broker selection, KYC verification, MetaTrader setup, funding, withdrawals, risk management, and trading psychology step by step. Trading involves risk, so choose regulated brokers and trade with proper risk management." },
      cta: { label: "Button", type: "text", value: "Open an Account" },
    },
    connect: {
      heading: { label: "Section heading", type: "text", value: "CONNECT WITH US" },
    },
    inside: {
      heading: { label: "Section heading", type: "text", value: "“Inside LearnChart FX”" },
      chips: { label: "Chips (comma-separated)", type: "text", value: "✓ Personalised Experience, ✓ Multiple Topics & Classes, ✓ Proven Profitable Strategies" },
    },
    testimonials: {
      heading: { label: "Section heading", type: "text", value: "Trusted By Successful Students" },
      sub: { label: "Section subtitle", type: "text", value: "99% — Of Students Were Served Successfully" },
    },
    faq: {
      heading: { label: "Section heading", type: "text", value: "Frequently Asked Questions" },
      cta_all: { label: "Button 1", type: "text", value: "All FAQs →" },
      cta_enroll: { label: "Button 2", type: "text", value: "Enroll Now →" },
    },
  },
  contact: {
    main: {
      heading_start: { label: "Heading — before the highlight", type: "text", value: "Contact" },
      heading_highlight: { label: "Heading — highlighted word", type: "text", value: "Us" },
      intro: { label: "Intro paragraph", type: "textarea", value: "Questions about the course, live trade support or consultation? Reach the LearnChart FX team on any channel below — mentors Siam Chowdhury and Rex Mizan reply inside the member community." },
    },
    channels: {
      telegram_title: { label: "Telegram card title", type: "text", value: "✈️ Telegram" },
      telegram_desc: { label: "Telegram card text", type: "textarea", value: "Join our community — fastest replies and daily live trade updates. [Placeholder link]" },
      youtube_title: { label: "YouTube card title", type: "text", value: "▶️ YouTube" },
      youtube_desc: { label: "YouTube card text", type: "textarea", value: "Subscribe to our official channel for lessons and market breakdowns. [Placeholder link]" },
      facebook_title: { label: "Facebook card title", type: "text", value: "👍 Facebook" },
      facebook_desc: { label: "Facebook card text", type: "textarea", value: "Follow us on Facebook for batch news and student results. [Placeholder link]" },
      tiktok_title: { label: "TikTok card title", type: "text", value: "🎵 TikTok" },
      tiktok_desc: { label: "TikTok card text", type: "textarea", value: "Short trading lessons and live-session clips on our official channel. [Placeholder link]" },
    },
    quick: {
      heading: { label: "Quick-answers heading", type: "text", value: "Before You Write — Quick Answers" },
      text: { label: "Quick-answers text", type: "textarea", value: "Most common questions are answered in the FAQ on the Home page. Community, Live Room and Consultation unlock after enrollment. Mentors are introduced on the open Mentors page." },
      cta: { label: "Quick-answers button", type: "text", value: "Read the FAQ →" },
    },
    form: {
      heading: { label: "Form heading", type: "text", value: "Send a message" },
      button: { label: "Send button", type: "text", value: "Send Message" },
      success: { label: "Success message", type: "textarea", value: "Thank you — your message has been received. Our support team is available 24/7 and will reply as soon as possible (target: within 24 hours)." },
      promise: { label: "Support promise line", type: "textarea", value: "Support promise: 24/7 availability, response within <24h as a support target — not a guarantee of any trading outcome." },
    },
  },
  mentors: {
    main: {
      heading_start: { label: "Heading — before the highlight", type: "text", value: "Meet Your" },
      heading_highlight: { label: "Heading — highlighted word", type: "text", value: "Mentors" },
      intro: { label: "Intro paragraph", type: "textarea", value: "The two traders who teach the course, run the live room and answer you in the community." },
      open_badge: { label: "Open badge", type: "text", value: "🔓 Open to everyone" },
      open_note: { label: "Open note", type: "textarea", value: "This Mentors section is public — any visitor can read it, with no purchase, enrollment or login needed." },
    },
  },
};

// The editable pages, in the order the admin editor lists them.
export const PAGE_LIST = [
  { id: "home", title: "Home Page", note: "Headings, hero, featured showcase, career, brokers, inside-video and FAQ sections. Stats, testimonials, socials and brokers are edited in Site Settings; lessons in Lessons." },
  { id: "contact", title: "Contact Page", note: "Headings, intro, channel cards, quick answers and the message form. This page has no picture slots in the design." },
  { id: "mentors", title: "Mentors Page", note: "Page heading and intro. Each mentor's name, role, bio, tags and photo are edited in Mentors." },
];

// Merge the DB rows over the defaults: { section: { field: value } }.
export function getPageContent(page) {
  const defaults = PAGE_DEFAULTS[page] || {};
  const merged = {};
  for (const [section, fields] of Object.entries(defaults)) {
    merged[section] = {};
    for (const [field, def] of Object.entries(fields)) {
      merged[section][field] = def.value;
    }
  }
  for (const row of getPageContentRows(page)) {
    if (merged[row.section] && row.field in merged[row.section]) {
      merged[row.section][row.field] = row.value;
    }
  }
  return merged;
}

// Full field definitions (label + type + current value) for the editor.
export function getPageFields(page) {
  const defaults = PAGE_DEFAULTS[page] || {};
  const content = getPageContent(page);
  const sections = {};
  for (const [section, fields] of Object.entries(defaults)) {
    sections[section] = Object.entries(fields).map(([field, def]) => ({
      field,
      label: def.label,
      type: def.type,
      value: content[section][field],
      defaultValue: def.value,
    }));
  }
  return sections;
}

// Save one field (admin only — the route checks the admin session).
export function setPageField(page, section, field, value) {
  if (!PAGE_DEFAULTS[page]?.[section]?.[field]) return false;
  setPageContent(page, section, field, String(value ?? ""));
  return true;
}
