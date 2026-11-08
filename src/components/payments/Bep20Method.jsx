// ---------------------------------------------------------------------------
// payments/Bep20Method.jsx — ONE payment method for the enroll page:
// BEP20 USDT on BNB Smart Chain (server component).
// The student sends exactly the course price to the merchant wallet and
// pastes the TxHash; the server verifies it on-chain (src/lib/payments.js).
// FREE: BscScan free-tier key when set, otherwise the public BSC JSON-RPC
// — no paid service anywhere. If the merchant wallet is not configured,
// this renders the honest "not connected yet" notice instead of a form.
// A new method (e.g. ZiniPay) is added as a sibling component + one
// entry in the enroll page's methods list — nothing else changes.
// ---------------------------------------------------------------------------
import CopyButton from "../CopyButton.jsx";

export default function Bep20Method({ priceUsdt, slug, address, qr }) {
  // Not connected: say so honestly, show no address and no form.
  if (!address) {
    return (
      <div className="alert alert-info" style={{ marginBottom: 0 }}>
        BEP20 USDT payments are not connected yet — the site owner is still setting up the receiving
        wallet. Please check back soon.
      </div>
    );
  }

  return (
    <>
      <div className="alert alert-error">
        <strong>Send ONLY via BNB Smart Chain (BEP20).</strong> Sending on any other network
        (ERC20, TRC20, Solana…) will lose your money — it cannot be recovered.
      </div>
      <p className="small muted">Send exactly <strong>{priceUsdt} USDT</strong> to this wallet address:</p>
      <input
        id="copy-source-bep20"
        readOnly
        value={address}
        style={{ width: "100%", fontFamily: "monospace", fontSize: 13, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line2)", background: "#111", color: "var(--ink)" }}
      />
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
        <CopyButton text={address} targetId="copy-source-bep20" label="Copy Address" />
        <span className="small muted">Amount: <strong>{priceUsdt} USDT</strong> · Network: <strong>BNB Smart Chain (BEP20)</strong></span>
      </div>
      {qr ? (
        <div style={{ marginTop: 14, textAlign: "center" }}>
          <img src={qr} alt="QR code for the USDT wallet address" width={200} height={200} />
          <p className="small muted">Scan with your wallet or Binance app to pay.</p>
        </div>
      ) : null}
      <form action="/api/payments/verify-bep20" method="post" style={{ marginTop: 16 }}>
        <input type="hidden" name="slug" value={slug} />
        <div className="field">
          <label htmlFor="txhash">Your transaction hash (TxHash)</label>
          <input
            id="txhash"
            name="txhash"
            required
            placeholder="0x… (64 characters)"
            autoComplete="off"
            style={{ fontFamily: "monospace" }}
          />
        </div>
        <p className="small muted">
          After sending, paste the TxHash from your wallet or BscScan here. It can take a minute
          for the transaction to confirm — if we cannot see it yet, wait a minute and try again.
          Each payment can only enroll once.
        </p>
        <button type="submit" className="btn btn-amber" style={{ width: "100%" }}>
          Verify My BEP20 Payment — {priceUsdt} USDT
        </button>
      </form>
    </>
  );
}
