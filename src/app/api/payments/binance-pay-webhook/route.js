// ---------------------------------------------------------------------------
// api/payments/binance-pay-webhook — RAIL 2b: Binance Pay merchant webhook.
// Binance POSTs here when a merchant order is paid. The signature is
// verified against Binance's certificates FIRST (src/lib/payments.js) —
// an unverified call is rejected and processes nothing. On a verified
// bizType=PAY + bizStatus=PAY_SUCCESS the order is looked up by
// merchantTradeNo and the enrollment is completed (enroll + Course Key
// email), exactly like the TxID rails. The endpoint answers Binance's
// expected { returnCode:"SUCCESS" } so it stops retrying; a genuine
// processing failure answers 500 so Binance retries (up to 6 times).
// Only reachable when merchant keys are configured — otherwise 503.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getDb, getCourseBySlug } from "../../../../lib/db.js";
import {
  verifyBinancePayWebhook,
  completePaidEnrollment,
  isBinancePayMerchantConfigured,
} from "../../../../lib/payments.js";

export async function POST(request) {
  // The signature covers the RAW body — read it as text first, never
  // as parsed JSON (re-serialising would break the signature).
  const rawBody = await request.text();

  if (!isBinancePayMerchantConfigured()) {
    return NextResponse.json({ returnCode: "FAIL", returnMessage: "not configured" }, { status: 503 });
  }

  const verified = await verifyBinancePayWebhook({
    timestamp: request.headers.get("BinancePay-Timestamp"),
    nonce: request.headers.get("BinancePay-Nonce"),
    signature: request.headers.get("BinancePay-Signature"),
    certSn: request.headers.get("BinancePay-Certificate-SN"),
    rawBody,
  });
  if (!verified.ok) {
    console.error("[payments] binance pay webhook rejected:", verified.reason);
    return NextResponse.json({ returnCode: "FAIL", returnMessage: "bad signature" }, { status: 401 });
  }

  const payload = verified.payload;
  // Only payment-success events do anything; anything else is ignored
  // (but answered SUCCESS so Binance stops retrying it).
  if (payload?.bizType !== "PAY" || payload?.bizStatus !== "PAY_SUCCESS") {
    return NextResponse.json({ returnCode: "SUCCESS", returnMessage: "ok" });
  }

  const merchantTradeNo = String(payload?.data?.merchantTradeNo || "");
  if (!merchantTradeNo) {
    return NextResponse.json({ returnCode: "SUCCESS", returnMessage: "ok" });
  }

  const db = getDb();
  const order = db
    .prepare("SELECT * FROM binance_pay_orders WHERE merchant_trade_no = ?")
    .get(merchantTradeNo);
  if (!order) {
    // Not one of our orders (or already cleaned up) — nothing to do.
    console.error("[payments] binance pay webhook: unknown order", merchantTradeNo);
    return NextResponse.json({ returnCode: "SUCCESS", returnMessage: "ok" });
  }
  if (order.status === "paid") {
    // Idempotent: Binance may deliver twice; the second is a no-op.
    return NextResponse.json({ returnCode: "SUCCESS", returnMessage: "ok" });
  }

  const course = getCourseBySlug(order.course_slug);
  if (!course) {
    return NextResponse.json({ returnCode: "SUCCESS", returnMessage: "ok" });
  }

  try {
    const done = await completePaidEnrollment({
      userId: order.user_id,
      course,
      method: "binance-pay-merchant",
      txRef: merchantTradeNo,
      amount: order.amount,
      currency: order.currency || "USDT",
    });
    if (!done.ok && done.reason !== "duplicate") throw new Error(`enrollment failed: ${done.reason}`);
    db.prepare("UPDATE binance_pay_orders SET status = 'paid' WHERE merchant_trade_no = ?").run(merchantTradeNo);
  } catch (err) {
    // Real failure: answer 500 so Binance retries the notification.
    console.error("[payments] binance pay webhook processing failed:", err?.message || err);
    return NextResponse.json({ returnCode: "FAIL", returnMessage: "processing failed" }, { status: 500 });
  }
  return NextResponse.json({ returnCode: "SUCCESS", returnMessage: "ok" });
}
