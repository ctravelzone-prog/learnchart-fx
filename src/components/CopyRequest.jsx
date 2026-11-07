// ---------------------------------------------------------------------------
// CopyRequest.jsx — "Copy Request Details" on the consultation page.
// Client component: copies the booking summary to the clipboard so the
// member can send it to the mentor team.
// ---------------------------------------------------------------------------
"use client";
import { useState } from "react";

export default function CopyRequest({ details }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button type="button" className="btn btn-dark btn-sm" onClick={copy}>
      {copied ? "✓ Copied!" : "Copy Request Details"}
    </button>
  );
}
