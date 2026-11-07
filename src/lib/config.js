// ---------------------------------------------------------------------------
// config.js — the ONE place for every [Placeholder] and every site-wide
// setting. Nothing in the pages invents a value: if Siam has not provided
// it yet, it lives here as a clearly marked [Placeholder], so the later
// master admin can bind to these same fields without touching the pages.
// ---------------------------------------------------------------------------

export const SITE = {
  name: "LearnChart FX",
  tagline: "The Asia's First All-in-One Platform For Professional Trading Education.",
  // Next Batch countdown target (January 10 — the next one after launch).
  nextBatchDate: "2027-01-10T00:00:00+06:00",
  // Footer mission line (from the prompt — real copy, not a placeholder).
  mission:
    "Helping students grow in forex through step-by-step guidance, real market insights, and hands-on learning.",
};

// Mentors — photos, bios, role lines and focus tags are [Placeholder]
// until Siam provides the real ones. No profit claims, ever.
export const MENTORS = [
  {
    id: "siam",
    name: "Siam Chowdhury",
    role: "[Placeholder — role line]",
    badge: "HEAD MENTOR",
    title: "Founder · Gold (XAUUSD) Specialist",
    bio: "[Placeholder — short bio]",
    focusTags: ["Forex", "Futures", "Stocks", "Options"],
    points: [
      "Premium Course — all 10 sessions",
      "London session live, Mon–Fri",
      "Daily plan in the Mentor Special Chat",
    ],
    photo: null, // [Placeholder — mentor photo]
  },
  {
    id: "rex",
    name: "Rex Mizan",
    role: "[Placeholder — role line]",
    badge: "MENTOR",
    title: "Mentor · Live Trade Analyst",
    bio: "[Placeholder — short bio]",
    focusTags: ["Forex", "Futures", "Stocks", "Options"],
    points: [
      "New York session live, Mon–Fri",
      "Trade journal & risk reviews",
      "Weekly planning session co-host",
    ],
    photo: null, // [Placeholder — mentor photo]
  },
];

// Stats strip — ALL numbers are [Placeholder]. Never copy the reference
// site's numbers and never invent numbers.
export const STATS = [
  { label: "Our Subscribers", value: "[Placeholder]" },
  { label: "Active Traders", value: "[Placeholder]" },
  { label: "Active Students", value: "[Placeholder]" },
  { label: "Years Experience", value: "[Placeholder]" },
];

// Testimonials — names, texts and student details are [Placeholder].
export const TESTIMONIALS = [
  { name: "[Student Name]", program: "Student Of LearnChart FX", text: "[Placeholder testimonial — a real student review will be added here.]" },
  { name: "[Student Name]", program: "Trading Consultation", text: "[Placeholder testimonial — a real student review will be added here.]" },
  { name: "[Student Name]", program: "Forex Trading Premium Course", text: "[Placeholder testimonial — a real student review will be added here.]" },
  { name: "[Student Name]", program: "Forex Trading Premium Course", text: "[Placeholder testimonial — a real student review will be added here.]" },
  { name: "[Student Name]", program: "Student Of LearnChart FX", text: "[Placeholder testimonial — a real student review will be added here.]" },
  { name: "[Student Name]", program: "Premium Live Trade Support", text: "[Placeholder testimonial — a real student review will be added here.]" },
];

// Social cards — handles and links are [Placeholder].
export const SOCIALS = [
  { platform: "Telegram", handle: "t.me/[placeholder]", desc: "Join our community", cta: "JOIN" },
  { platform: "YouTube", handle: "youtube.com/@[placeholder]", desc: "Subscribe to our official channel", cta: "SUBSCRIBE" },
  { platform: "Facebook", handle: "facebook.com/[placeholder]", desc: "Follow us on Facebook", cta: "FOLLOW" },
  { platform: "TikTok", handle: "tiktok.com/@[placeholder]", desc: "Subscribe to our official channel", cta: "FOLLOW" },
  { platform: "Instagram", handle: "instagram.com/@[placeholder]", desc: "Subscribe to our official channel", cta: "FOLLOW" },
  { platform: "Telegram Premium", handle: "t.me/[placeholder]", desc: "Join our community", cta: "JOIN" },
];

// Broker cards — names, logos and sign-up links are [Placeholder].
export const BROKERS = [
  { name: "[Broker Name]", logo: null },
  { name: "[Broker Name]", logo: null },
  { name: "[Broker Name]", logo: null },
  { name: "[Broker Name]", logo: null },
];

// "Inside LearnChart FX" video — YouTube video ID is [Placeholder].
export const INSIDE_VIDEO_ID = "[Placeholder]";

// Payment method for the paid enrollment — [Placeholder, Siam to confirm].
export const PAYMENT_METHOD = "[Placeholder — Siam to confirm payment method]";

// Live Room streaming provider — [Placeholder, Siam to confirm].
export const LIVE_STREAM_PROVIDER = "[Placeholder — Siam to confirm streaming provider]";

// Consultation audio/video provider — [Placeholder, Siam to confirm].
export const CONSULT_PROVIDER = "[Placeholder — Siam to confirm audio/video provider]";

// Contact email / address / phone if shown anywhere — [Placeholder].
export const CONTACT_INFO = {
  email: "[Placeholder]",
  phone: "[Placeholder]",
  address: "[Placeholder]",
};

// Curriculum PDF — the Download button exists; the real file comes from Siam.
export const CURRICULUM_PDF = "/api/curriculum"; // serves the placeholder PDF until Siam provides the real file
