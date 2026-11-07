// ---------------------------------------------------------------------------
// FaqList.jsx — FAQ tabs + accordions (prompt Section 13, client side).
// Tabs: All Questions / General (2) / Enrollment (9) — counts always
// correct because they come from the data, not from typed numbers.
// Accordions open/close on click and are keyboard-usable (<details>).
// ---------------------------------------------------------------------------
"use client";
import { useState } from "react";
import { FAQ_GENERAL, FAQ_ENROLLMENT } from "../lib/faq-data.js";

export default function FaqList() {
  const [tab, setTab] = useState("all");
  const general = FAQ_GENERAL.map((f) => ({ ...f, cat: "General" }));
  const enrollment = FAQ_ENROLLMENT.map((f) => ({ ...f, cat: "Enrollment" }));
  const all = [...general, ...enrollment];
  const shown = tab === "all" ? all : tab === "general" ? general : enrollment;

  return (
    <div>
      <div className="tabs" role="tablist" aria-label="FAQ categories">
        <button type="button" className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
          All Questions ({all.length})
        </button>
        <button type="button" className={`tab ${tab === "general" ? "active" : ""}`} onClick={() => setTab("general")}>
          General ({general.length})
        </button>
        <button type="button" className={`tab ${tab === "enrollment" ? "active" : ""}`} onClick={() => setTab("enrollment")}>
          Enrollment ({enrollment.length})
        </button>
      </div>
      {shown.map((f) => (
        <details className="accordion" key={f.q}>
          <summary>{f.q} <span>+</span></summary>
          <div className="answer">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
