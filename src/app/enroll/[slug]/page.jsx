// ---------------------------------------------------------------------------
// enroll/[slug] — enrollment page (prompt Section 15).
// Not logged in? Asked to sign up / log in first, then returned here.
// FREE offers enroll on confirmation (unchanged). The PAID course
// ($250 Forex) is paid here, on Binance — automatic rails, and the
// student never leaves this page to pay by hand. The payment methods
// are a LIST (see `methods` below): each method is one component in
// src/components/payments/ + one entry here. A third method (e.g.
// ZiniPay bKash/Nagad) is added the same way — one component + one
// entry — without restructuring this page.
//   1. BEP20 USDT: send exactly the course price to the merchant wallet
//      (address + QR), paste the TxHash, the server verifies it on BNB
//      Smart Chain. FREE (BscScan free key or public BSC RPC), no
//      Binance approval needed.
//   2. Binance Pay (PRIMARY): pay the merchant's Binance Pay ID and
//      paste the Order ID — verified against the owner's Pay history
//      with a READ-ONLY API key. FREE, no merchant application, no
//      approval wait. A hosted merchant checkout appears as well once
//      merchant keys exist (future-optional only, never required).
// Every method is env-gated: when a value is not set, that method says
// honestly "not connected yet" instead of showing a fake address or
// failing silently. The enrollment is created ONLY after a payment
// verifies — there is no confirm-without-payment button for the paid
// course, and /api/enroll refuses paid courses posted directly.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { getCourseBySlug, hasEnrollment } from "../../../lib/db.js";
import { getSessionUser } from "../../../lib/auth.js";
import {
  getBep20Config,
  getBinancePayTxConfig,
  isBinancePayMerchantConfigured,
  getPayableAmountUsdt,
} from "../../../lib/payments.js";
import Bep20Method from "../../../components/payments/Bep20Method.jsx";
import BinancePayMethod from "../../../components/payments/BinancePayMethod.jsx";

export const metadata = { title: "Enroll — LearnChart FX", description: "Enroll in a LearnChart FX course or service." };

export default async function EnrollPage({ params, searchParams }) {
  // Next.js 15: params + searchParams are Promises — await them first.
  const { slug } = await params;
  const sp = await searchParams;
  const course = getCourseBySlug(slug);
  if (!course) redirect("/courses");

  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/enroll/${slug}`);
  if (hasEnrollment(user.id, slug)) redirect(`/enroll/${slug}/success`);

  const isPaid = course.price_cents > 0;
  // What a paid buyer is promised once payment verifies. Video courses
  // (has_videos) get a unique Course Key emailed — the key promise must
  // ONLY appear for those, because completePaidEnrollment generates a key
  // only when has_videos is true. A paid course without videos gets no
  // key, so the promise names the area its `unlocks` flag opens instead.
  // Same unlock names as the success page — keep the two in sync.
  const unlockName =
    course.unlocks === "live-room" ? "Live Room" :
    course.unlocks === "consultation" ? "Trading Consultation area" : null;
  const afterPayment = course.has_videos
    ? `your enrollment completes and your Course Key is emailed to ${user.email}`
    : unlockName
      ? `your enrollment completes and the ${unlockName} opens for you`
      : "your enrollment completes";
  // The USDT amount students must send: the admin-set amount wins when
  // present (Payment Settings), otherwise the course price ($250).
  const priceUsdt = getPayableAmountUsdt(course);

  // BEP20 rail state (env only — never invented).
  const bep20 = getBep20Config();
  const bep20Ready = Boolean(bep20.address);
  // QR code for the wallet address, rendered server-side as a data URL
  // (no third-party service ever sees the address).
  let bep20Qr = null;
  if (bep20Ready) {
    try {
      bep20Qr = await QRCode.toDataURL(bep20.address, { margin: 1, width: 200 });
    } catch {
      bep20Qr = null; // QR is a convenience — the address + copy button stay.
    }
  }

  // Binance Pay TxID rail state.
  const payTx = getBinancePayTxConfig();
  const payTxReady = Boolean(payTx.payId && payTx.apiKey && payTx.apiSecret);
  const merchantReady = isBinancePayMerchantConfigured();

  // --- Payment methods list -------------------------------------------------
  // Each method = one component in src/components/payments/ + one entry
  // here. To add a method (e.g. ZiniPay), write its component and append
  // one entry — this page, the routes and the verification logic need no
  // other change. Order in this list = order on the page.
  const methods = [
    {
      id: "bep20-usdt",
      title: "💰 Option 1 — BEP20 USDT (BNB Smart Chain)",
      body: <Bep20Method priceUsdt={priceUsdt} slug={slug} address={bep20.address} qr={bep20Qr} />,
    },
    {
      id: "binance-pay",
      title: "🟡 Option 2 — Binance Pay",
      body: (
        <BinancePayMethod
          priceUsdt={priceUsdt}
          slug={slug}
          payId={payTx.payId}
          txReady={payTxReady}
          merchantReady={merchantReady}
        />
      ),
    },
  ];

  return (
    <div className="wrap section">
      <div className="card form-card">
        <p className="muted small">ENROLLMENT</p>
        <h1>{course.title}</h1>
        <p className="muted">{course.subtitle}</p>
        <dl className="kv">
          <dt>Level</dt><dd>{course.level}</dd>
          <dt>Status</dt><dd>{course.status}</dd>
          <dt>Price</dt><dd><strong className="amber">{course.price_label}</strong></dd>
        </dl>
        <ul className="check-list">
          {course.features.map((f) => (<li key={f}>{f}</li>))}
        </ul>

        {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}

        {!isPaid ? (
          <>
            <div className="alert alert-info">
              This service is free — enrollment completes on confirmation.
            </div>
            <form action="/api/enroll" method="post">
              <input type="hidden" name="slug" value={slug} />
              <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>
                Confirm Enrollment — {course.price_label}
              </button>
            </form>
          </>
        ) : (
          <>
            <h3 style={{ marginTop: 8 }}>Pay with Binance — automatic, no manual check</h3>
            <p className="muted">
              Pay exactly <strong>{priceUsdt} USDT</strong> with either option below. The site verifies your
              payment automatically — once it matches, {afterPayment}. Nobody checks payments by hand, so keep
              your transaction ID safe.
            </p>

            {/* Payment methods, rendered from the `methods` list above. */}
            {methods.map((m) => (
              <div className="card" key={m.id} style={{ marginBottom: 16 }}>
                <h3>{m.title}</h3>
                {m.body}
              </div>
            ))}
          </>
        )}

        <p className="small muted center" style={{ marginTop: 14 }}>
          <Link href="/courses" className="amber">Back to Courses &amp; Services</Link>
        </p>
      </div>
    </div>
  );
}
