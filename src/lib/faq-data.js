// ---------------------------------------------------------------------------
// faq-data.js — the 11 FAQ questions (prompt Section 13). One source of
// truth: the FAQ page and the home-page preview both read from here, so
// the counts (General 2 / Enrollment 9) can never drift apart.
// Answers are written from the facts in the prompt only — no invented
// promises. The profit question states clearly: profit is NOT guaranteed.
// ---------------------------------------------------------------------------

export const FAQ_GENERAL = [
  {
    q: "What is LearnChart FX and how does it help traders?",
    a: "LearnChart FX is a trading education platform by mentors Siam Chowdhury and Rex Mizan. It helps traders learn forex trading step by step — technical analysis, price action, market structure, risk management, trading psychology and live market analysis — so they can trade with a clear plan instead of guessing.",
  },
  {
    q: "Is LearnChart FX good for beginner forex traders?",
    a: "Yes. LearnChart FX is built for beginner forex traders who want to learn step by step, starting from basic market understanding to chart analysis, price action, risk management, and trading discipline.",
  },
];

export const FAQ_ENROLLMENT = [
  {
    q: "What will I learn in the Premium Forex Trading Course?",
    a: "Market structure, price action trading, SMC, ICT concepts, technical analysis, fundamental analysis, backtesting, risk management, trading psychology, and strategy building — across 10 sessions, beginner to advanced.",
  },
  {
    q: "Do you provide live market analysis and trading guidance?",
    a: "Yes — through Premium Live Trade Support. Members get daily trade setups, real-time forex and gold market analysis with clear entry, stop-loss and take-profit levels, and live sessions with the mentors Monday to Friday.",
  },
  {
    q: "Does LearnChart FX cover forex, metals, and indices?",
    a: "Yes. The lessons and live analysis cover major forex pairs, metals such as gold (XAUUSD), and indices — always with the same structure, liquidity and risk-management approach.",
  },
  {
    q: "Does LearnChart FX guarantee trading profit?",
    a: "No. Trading involves risk, and no course or market analysis can guarantee profit. LearnChart FX focuses on education, discipline, risk management, and practical trading skills so traders can make informed decisions.",
  },
  {
    q: "Can I learn SMC, ICT, order blocks and liquidity trading?",
    a: "Yes. LearnChart FX helps traders understand Smart Money Concepts, ICT trading concepts, order blocks, liquidity, market structure shifts, fair value gaps, and how these ideas connect with real market analysis.",
  },
  {
    q: "Is LearnChart FX suitable for complete beginners?",
    a: "Yes. The Premium Course starts from the complete basics — what the forex market is, how pairs and lots work, and how to read a chart — before moving to advanced concepts. No previous trading experience is needed to enroll.",
  },
  {
    q: "How long does it take to learn trading?",
    a: "It depends on your pace and practice. The Premium Course covers the full foundation in 10 sessions, and members keep improving through the daily live sessions and community practice. Trading is a skill — consistent, disciplined practice over time matters more than speed.",
  },
  {
    q: "What should I learn before opening a trading account?",
    a: "Learn the basics first: how the market moves, risk and capital management, and trading psychology. When you open an account, choose a regulated broker, complete KYC verification, set up MetaTrader, and practise on a demo account before trading live — the mentors guide you through each step.",
  },
  {
    q: "Can I learn trading from mobile or laptop?",
    a: "Yes. The lessons, community and live sessions can all be followed from a mobile phone, tablet or laptop. A bigger screen makes chart practice easier, but many students learn and follow the live analysis entirely from their phone.",
  },
];

// Home page FAQ preview: exactly these 7 (Section 13) — the 2 General
// questions plus Enrollment questions 1–5.
export const FAQ_HOME_PREVIEW = [...FAQ_GENERAL, ...FAQ_ENROLLMENT.slice(0, 5)];
