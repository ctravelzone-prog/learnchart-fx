// ---------------------------------------------------------------------------
// api/payments/verify-binance-pay — RAIL 2a: verify a Binance Pay payment
// by the Order ID the student pasted. Server-side only: the server asks
// Binance Spot API (Get Pay Trade History) with the owner's READ-ONLY
// API key and looks for one incoming USDT transaction with that Order ID
// and the exact course amount, never used before (src/lib/payments.js).
// No merchant approval is needed for this rail. On success the
// enrollment is created and the Course Key emailed, same as a free
// enrollment. Failures go back to the payment page with a clear error.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getCourseBySlug, hasEnrollment } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import {
  verifyBinancePayTx,
  completePaidEnrollment,
  recordPaymentAttempt,
  isTxRefUsed,
  isBinancePayTxConfigured,
  getPayableAmountUsdt,
} from "../../../../lib/payments.js";

const ERRORS = {
  "bad-format":
    "Please paste your Binance Pay Order ID — you will find it in the Binance app under Pay, in the transaction details.",
  "not-found":
    "We cannot find a Binance Pay payment with this Order ID for exactly the course price in the last 7 days — check the Order ID in your Binance app and try again.",
  "api-error":
    "We could not check with Binance just now — please try again in a minute.",
  "geo-blocked":
    "Binance Pay check is blocked from our server right now (Binance returns HTTP 451 from US servers) — please pay with BEP20 USDT instead, it verifies instantly on-chain.",
  duplicate:
    "This payment was already used for an enrollment — each payment can only enroll once.",
  "not-configured":
    "Binance Pay verification is not connected yet — the site owner is still setting it up.",
};

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return redirectTo("/login?next=/courses");

  const form = await request.formData();
  const slug = String(form.get("slug") || "");
  const orderId = String(form.get("orderid") || "").trim();
  const course = getCourseBySlug(slug);
  if (!course || course.price_cents <= 0) return redirectTo("/courses");
  if (hasEnrollment(user.id, slug)) return redirectTo(`/enroll/${slug}/success`);

  const back = (reason) =>
    redirectTo(`/enroll/${slug}?error=${encodeURIComponent(ERRORS[reason] || ERRORS["api-error"])}`);

  if (!isBinancePayTxConfigured()) return back("not-configured");
  if (orderId && isTxRefUsed(orderId)) return back("duplicate");

  const expectedAmount = getPayableAmountUsdt(course);
  const result = await verifyBinancePayTx({ orderId, expectedAmountUsdt: expectedAmount });
  if (!result.ok) {
    // Geo-block / not-found: queue for admin review so the payment is
    // traceable. A mistyped ID (bad-format) is not queued.
    if (["not-found", "geo-blocked"].includes(result.reason)) {
      recordPaymentAttempt({
        userId: user.id, courseSlug: slug, method: "binance-pay", txRef: orderId,
        reason: result.reason, expectedAmount, detail: null,
      });
    }
    return back(result.reason);
  }

  const done = await completePaidEnrollment({
    userId: user.id,
    course,
    method: "binance-pay",
    txRef: orderId,
    amount: String(expectedAmount),
    currency: "USDT",
  });
  if (!done.ok) return back(done.reason || "duplicate");
  return redirectTo(`/enroll/${slug}/success${done.keymail ? `?keymail=${done.keymail}` : ""}`);
}
