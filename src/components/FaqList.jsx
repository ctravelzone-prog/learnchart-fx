// ---------------------------------------------------------------------------
// FaqList.jsx — FAQ tabs + accordions (prompt Section 13, client side).
// Tabs: All Questions / General / Enrollment — counts always correct
// because they come from the data, not from typed numbers. Accordions
// open/close on click and are keyboard-usable (<details>).
// The questions come from the database (admin-editable); the parent
// server page passes them in as `items` ({ category, question, answer }).
// ---------------------------------------------------------------------------
"use client";
import { useState } from "react";

export default function FaqList({ items }) {
  const [tab, setTab] = useState("all");
  const general = items.filter((f) => f.category === "General");
  const enrollment = items.filter((f) => f.category === "Enrollment");
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
        <details className="accordion" key={f.id || f.question}>
          <summary>{f.question} <span>+</span></summary>
          <div className="answer">{f.answer}</div>
        </details>
      ))}
    </div>
  );
}
