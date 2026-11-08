// ---------------------------------------------------------------------------
// CopyButton.jsx — small client component: copies `text` to the clipboard
// and briefly shows "Copied ✓". Used for the wallet address / Pay ID on
// the payment page, where typing a long address by hand invites mistakes.
// ---------------------------------------------------------------------------
"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "Copy", targetId = "copy-source" }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard API unavailable (old browser / non-secure context):
      // fall back to selecting the text so the user can copy by hand.
      const input = document.getElementById(targetId);
      if (input) {
        input.focus();
        input.select();
      }
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={copy} className="btn btn-dark btn-sm">
      {copied ? "Copied ✓" : label}
    </button>
  );
}
