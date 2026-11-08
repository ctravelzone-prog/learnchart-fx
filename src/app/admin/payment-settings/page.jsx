// ---------------------------------------------------------------------------
// admin/payment-settings — Payment & Email Settings (admin only).
// Everything the owner needs to make payments and Course Key emails
// work, with NO env vars or code changes: fill the values in here and
// the site uses them (the database wins over env vars when a value is
// set; env vars stay as the fallback, and survive a DB wipe).
//
// SECRET RULES: secrets are AES-encrypted at rest and this page NEVER
// shows a full secret — only "Set — ends with XXXX" or "Not set".
// A secret input left empty keeps the current value; a typed value
// replaces it; the "clear" checkbox deletes it. Per-method toggles
// turn a rail on/off without deleting its values.
// ---------------------------------------------------------------------------
import { requireAdmin } from "../../../lib/admin.js";
import {
  getBep20Settings,
  getBinancePaySettings,
  getMerchantSettings,
  getSmtpSettings,
  getUsdtAmount,
  maskSecret,
} from "../../../lib/settings.js";

export const metadata = { title: "Payment Settings — Admin — LearnChart FX" };

// One secret field: masked state + password input + clear checkbox.
// The input is deliberately EMPTY on load — a browser must never hold
// the real value, and an empty submit means "keep current".
function SecretField({ name, label, hint, value, placeholder }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <p className="small muted" style={{ margin: "0 0 6px" }}>
        Current: <strong>{maskSecret(value)}</strong>
        {hint ? <> — {hint}</> : null}
      </p>
      <input
        id={name}
        name={name}
        type="password"
        autoComplete="off"
        placeholder={placeholder || "Leave empty to keep the current value"}
      />
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, fontSize: 13 }}>
        <input type="checkbox" name={`clear_${name}`} value="1" style={{ width: "auto" }} />
        Clear this value
      </label>
    </div>
  );
}

export default async function AdminPaymentSettingsPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const saved = sp?.saved || null;
  const bep20 = getBep20Settings();
  const pay = getBinancePaySettings();
  const merchant = getMerchantSettings();
  const smtp = getSmtpSettings();
  const usdtAmount = getUsdtAmount(250);

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Payment &amp; Email Settings</h1>
      <p className="muted">
        Fill these in once and payments + Course Key emails work — no env vars, no code changes.
        Values saved here win over env vars; env vars still work as a fallback.
        <strong> Note:</strong> Render&apos;s free tier wipes the database on redeploy, so these settings
        reset on redeploy until the site moves to real hosting — env vars cover that gap.
      </p>
      {saved ? <div className="alert alert-ok">Saved — {saved} settings updated.</div> : null}

      {/* --- BEP20 USDT --- */}
      <form action="/api/admin/payment-settings" method="post">
        <input type="hidden" name="section" value="bep20" />
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>💰 BEP20 USDT (BNB Smart Chain)</h3>
          <p className="muted small">Students send USDT to your wallet; the server verifies the TxHash on-chain. Free — BscScan free key or public BSC RPC.</p>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <input type="checkbox" name="enabled" value="1" defaultChecked={bep20.enabled} style={{ width: "auto" }} />
            <strong>Enable BEP20 USDT payments</strong>
          </label>
          <div className="field">
            <label htmlFor="bep20-address">Your BSC wallet address (receives the USDT)</label>
            <input id="bep20-address" name="address" defaultValue={bep20.address} placeholder="0x…" style={{ fontFamily: "monospace" }} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="bep20-amount">USDT amount students must send</label>
              <input id="bep20-amount" name="usdt_amount" type="number" min="1" step="0.01" defaultValue={usdtAmount} />
              <p className="small muted">Must match the paid course price ($250). This is the amount the server checks on-chain and in Binance Pay.</p>
            </div>
            <SecretField name="bscscan_key" label="BscScan API key (optional — free key)" hint="public BSC RPC is used when empty" value={bep20.bscscanKey} />
          </div>
          <button type="submit" className="btn btn-amber">Save BEP20 Settings</button>
        </div>
      </form>

      {/* --- Binance Pay TxID check --- */}
      <form action="/api/admin/payment-settings" method="post">
        <input type="hidden" name="section" value="binance-pay" />
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>🟡 Binance Pay — Order ID check (primary, free)</h3>
          <p className="muted small">Students pay your Binance Pay ID and paste the Order ID; the server checks your Pay history with a READ-ONLY API key. No merchant application, no approval wait.</p>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <input type="checkbox" name="enabled" value="1" defaultChecked={pay.enabled} style={{ width: "auto" }} />
            <strong>Enable Binance Pay (Order ID check)</strong>
          </label>
          <div className="field">
            <label htmlFor="pay-id">Your Binance Pay ID</label>
            <input id="pay-id" name="pay_id" defaultValue={pay.payId} placeholder="e.g. 123456789" />
          </div>
          <div className="grid-2">
            <SecretField name="api_key" label="Binance API key (read-only)" hint="Spot API key — Enable Reading only, never trade/withdraw" value={pay.apiKey} />
            <SecretField name="api_secret" label="Binance API secret (read-only)" hint="same key's secret" value={pay.apiSecret} />
          </div>
          <p className="small muted">Create the key in Binance → API Management → Create API → Enable Reading only. Restrict it to this server's IP if you can.</p>
          <button type="submit" className="btn btn-amber">Save Binance Pay Settings</button>
        </div>
      </form>

      {/* --- Binance Pay merchant checkout (future-optional) --- */}
      <form action="/api/admin/payment-settings" method="post">
        <input type="hidden" name="section" value="merchant" />
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>🛒 Binance Pay — Merchant checkout (future-optional)</h3>
          <p className="muted small">Hosted Binance Pay checkout button on the enroll page. Only needed if you get a merchant account approved — the Order ID check above works without it.</p>
          <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <input type="checkbox" name="enabled" value="1" defaultChecked={merchant.enabled} style={{ width: "auto" }} />
            <strong>Enable merchant checkout</strong>
          </label>
          <div className="grid-2">
            <SecretField name="api_key" label="Merchant API key" hint="from merchant.binance.com" value={merchant.apiKey} />
            <SecretField name="api_secret" label="Merchant API secret" hint="from merchant.binance.com" value={merchant.apiSecret} />
          </div>
          <button type="submit" className="btn btn-amber">Save Merchant Settings</button>
        </div>
      </form>

      {/* --- SMTP / Course Key emails --- */}
      <form action="/api/admin/payment-settings" method="post">
        <input type="hidden" name="section" value="smtp" />
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>✉️ Email (SMTP) — Course Key emails</h3>
          <p className="muted small">Course Keys are emailed to students on enrollment. Gmail works: 2-Step Verification ON → myaccount.google.com/apppasswords → Mail → use the 16-character app password below. Never paste a password in chat — paste it here.</p>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="smtp-host">SMTP host</label>
              <input id="smtp-host" name="host" defaultValue={smtp.host} placeholder="smtp.gmail.com" />
            </div>
            <div className="field">
              <label htmlFor="smtp-port">SMTP port</label>
              <input id="smtp-port" name="port" type="number" defaultValue={smtp.port} placeholder="587" />
              <p className="small muted">587 = STARTTLS (Gmail), 465 = SSL.</p>
            </div>
            <div className="field">
              <label htmlFor="smtp-user">SMTP username (your email)</label>
              <input id="smtp-user" name="user" type="email" defaultValue={smtp.user} placeholder="you@gmail.com" />
            </div>
            <SecretField name="pass" label="SMTP password / Gmail app password" hint="16-character app password for Gmail" value={smtp.pass} />
          </div>
          <div className="field">
            <label htmlFor="smtp-from">From address (empty = same as username)</label>
            <input id="smtp-from" name="from" defaultValue={smtp.from} placeholder="LearnChart FX <you@gmail.com>" />
          </div>
          <button type="submit" className="btn btn-amber">Save Email Settings</button>
        </div>
      </form>
    </div>
  );
}
