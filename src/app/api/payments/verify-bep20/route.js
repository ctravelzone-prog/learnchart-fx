// ---------------------------------------------------------------------------
// api/payments/verify-bep20 — RAIL 1: verify a BEP20 USDT payment by TxHash.
// Server-side only. The student pastes the TxHash from their wallet;
// the server checks the BNB Smart Chain receipt (src/lib/payments.js):
// Success + a USDT transfer of exactly the course price to the merchant
// address + a TxHash never used before. On success the enrollment is
// created and the Course Key emailed — same as a free enrollment. On
// failure the student is sent back to the payment page with a clear
// error (never a raw chain/API error).
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getCourseBySlug, hasEnrollment } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import {
  verifyBep20Tx,
  completePaidEnrollment,
  isTxRefUsed,
  isBep20Configured,
  getBep20Config,
  coursePriceUsdt,
} from "../../../../lib/payments.js";

// User-facing wording per failure reason — plain, actionable, no jargon.
const ERRORS = {
  "bad-format":
    "That does not look like a transaction hash — copy the full TxHash (0x followed by 64 characters) from your wallet or BscScan.",
  "not-found":
    "We cannot see this transaction on BNB Smart Chain yet — it may still be confirming. Wait a minute and try again.",
  "lookup-failed":
    "We could not reach the blockchain just now — please try again in a minute.",
  failed:
    "This transaction failed on-chain — no USDT was sent. Please send a new payment.",
  "no-usdt-transfer":
    "This transaction contains no USDT transfer. Make sure you sent USDT (BEP20) to our wallet address.",
  "wrong-recipient":
    "This payment was not sent to our wallet address — check the address and the network (BNB Smart Chain / BEP20 only).",
  "wrong-amount":
    "The amount in this transaction is not exactly the course price — the Forex Premium Course costs exactly 250 USDT.",
  duplicate:
    "This transaction was already used for an enrollment — each payment can only enroll once.",
  "not-configured":
    "BEP20 USDT payments are not connected yet — the site owner is still setting up the receiving wallet.",
};

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return redirectTo("/login?next=/courses");

  const form = await request.formData();
  const slug = String(form.get("slug") || "");
  const txHash = String(form.get("txhash") || "").trim();
  const course = getCourseBySlug(slug);
  if (!course || course.price_cents <= 0) return redirectTo("/courses");
  if (hasEnrollment(user.id, slug)) return redirectTo(`/enroll/${slug}/success`);

  const back = (reason) =>
    redirectTo(`/enroll/${slug}?error=${encodeURIComponent(ERRORS[reason] || ERRORS["lookup-failed"])}`);

  // BEP20 not connected: honest error, no chain lookup attempted.
  if (!isBep20Configured()) return back("not-configured");
  // Replay guard before any chain lookup.
  if (txHash && isTxRefUsed(txHash)) return back("duplicate");

  const expectedAmount = coursePriceUsdt(course);
  const result = await verifyBep20Tx({
    txHash,
    expectedAddress: getBep20Config().address,
    expectedAmountUsdt: expectedAmount,
  });
  if (!result.ok) return back(result.reason);

  // Same transaction could have been verified twice in parallel — the
  // UNIQUE tx_hash in completePaidEnrollment is the final guard.
  const done = await completePaidEnrollment({
    userId: user.id,
    course,
    method: "bep20-usdt",
    txRef: txHash,
    amount: String(expectedAmount),
    currency: "USDT",
  });
  if (!done.ok) return back(done.reason || "duplicate");
  return redirectTo(`/enroll/${slug}/success${done.keymail ? `?keymail=${done.keymail}` : ""}`);
}
