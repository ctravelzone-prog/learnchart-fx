// ---------------------------------------------------------------------------
// api/payments/create-binance-pay-order — RAIL 2b: start a Binance Pay
// merchant checkout (Create Order API v3). Server-side only, merchant
// keys required. Creates the order on Binance, stores it locally by
// merchantTradeNo (so the webhook can find it later), and redirects the
// student to Binance's hosted checkout page. If merchant keys are not
// configured the student is sent back to the payment page with an
// honest error — the TxID-check rail is unaffected.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { getCourseBySlug, hasEnrollment } from "../../../../lib/db.js";
import { getSessionUser } from "../../../../lib/auth.js";
import { createBinancePayOrder, isBinancePayMerchantConfigured } from "../../../../lib/payments.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return redirectTo("/login?next=/courses");

  const form = await request.formData();
  const slug = String(form.get("slug") || "");
  const course = getCourseBySlug(slug);
  if (!course || course.price_cents <= 0) return redirectTo("/courses");
  if (hasEnrollment(user.id, slug)) return redirectTo(`/enroll/${slug}/success`);

  const back = (message) =>
    redirectTo(`/enroll/${slug}?error=${encodeURIComponent(message)}`);

  if (!isBinancePayMerchantConfigured()) {
    return back("Binance Pay checkout is not connected yet — the site owner is still setting it up.");
  }

  // The site must be reachable by Binance for the webhook. The live
  // preview URL is used here; a custom domain replaces it later.
  const base = process.env.SITE_URL || "https://learnchart-fx.onrender.com";
  const created = await createBinancePayOrder({
    userId: user.id,
    course,
    webhookUrl: `${base}/api/payments/binance-pay-webhook`,
    returnUrl: `${base}/enroll/${slug}/success`,
  });
  if (!created.ok) {
    return back("Binance Pay checkout could not be started right now — please try again in a minute, or pay with BEP20 USDT instead.");
  }
  // Hosted checkout: the student pays in the Binance app, Binance calls
  // the webhook, and the enrollment completes automatically.
  return redirectTo(created.checkoutUrl);
}
