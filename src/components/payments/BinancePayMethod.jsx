// ---------------------------------------------------------------------------
// payments/BinancePayMethod.jsx — ONE payment method for the enroll page:
// Binance Pay (server component).
// PRIMARY path (free, no merchant application): the student pays the
// merchant's Binance Pay ID and pastes the Order ID; the server checks
// the owner's Pay history with a READ-ONLY API key (src/lib/payments.js).
// FUTURE-OPTIONAL path: once merchant keys exist, the hosted Binance Pay
// checkout button appears as well — it is never required for Binance Pay
// to work. If nothing is configured, this renders the honest "not
// connected yet" notice instead of a form.
// A new method (e.g. ZiniPay) is added as a sibling component + one
// entry in the enroll page's methods list — nothing else changes.
// ---------------------------------------------------------------------------
import CopyButton from "../CopyButton.jsx";

export default function BinancePayMethod({ priceUsdt, slug, payId, txReady, merchantReady }) {
  // Nothing configured at all: honest notice, no form.
  if (!txReady && !merchantReady) {
    return (
      <div className="alert alert-info" style={{ marginBottom: 0 }}>
        Binance Pay is not connected yet — the site owner is still setting it up. Please check back
        soon, or pay with BEP20 USDT above.
      </div>
    );
  }

  return (
    <>
      {merchantReady ? (
        <>
          <p className="muted">
            Pay directly in the Binance app — the fastest option. Binance will confirm your payment
            automatically.
          </p>
          <form action="/api/payments/create-binance-pay-order" method="post">
            <input type="hidden" name="slug" value={slug} />
            <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>
              Pay {priceUsdt} USDT with Binance Pay →
            </button>
          </form>
          <p className="small muted center" style={{ marginTop: 10 }}>— or pay manually below —</p>
        </>
      ) : null}
      {payId ? (
        <>
          <p className="small muted">
            Send exactly <strong>{priceUsdt} USDT</strong> with Binance Pay to this Pay ID:
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <strong style={{ fontSize: 18 }}>{payId}</strong>
            <CopyButton text={payId} label="Copy Pay ID" />
          </div>
          <form action="/api/payments/verify-binance-pay" method="post" style={{ marginTop: 16 }}>
            <input type="hidden" name="slug" value={slug} />
            <div className="field">
              <label htmlFor="orderid">Your Binance Pay Order ID</label>
              <input
                id="orderid"
                name="orderid"
                required
                placeholder="Order ID from your Binance app (Pay → transaction details)"
                autoComplete="off"
              />
            </div>
            <p className="small muted">
              After paying, paste the Order ID from the Binance app here. We match it against the
              payment records automatically. Each payment can only enroll once.
            </p>
            <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>
              Verify My Binance Pay Payment — {priceUsdt} USDT
            </button>
          </form>
        </>
      ) : (
        <div className="alert alert-info" style={{ marginBottom: 0 }}>
          Manual Binance Pay (Pay ID + Order ID check) is not connected yet.
        </div>
      )}
    </>
  );
}
