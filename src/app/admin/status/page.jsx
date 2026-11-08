// ---------------------------------------------------------------------------
// admin/status — Payment & Email status. Shows which rails are
// configured and enabled, and whether SMTP works — from the DB settings
// first, env vars as fallback. NEVER shows a secret value: only
// "set (from admin panel)" / "set (from env)" / "not set", plus the
// masked last-4 for the owner's own reference.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin.js";
import { getSetting } from "../../../lib/db.js";
import {
  getBep20Settings,
  getBinancePaySettings,
  getMerchantSettings,
  getSmtpSettings,
  getUsdtAmount,
  maskSecret,
} from "../../../lib/settings.js";

export const metadata = { title: "Payment & Email Status — Admin — LearnChart FX" };

// Where did this value come from — the admin panel (DB row exists) or env?
function sourceOf(settingKey, envPresent) {
  const dbValue = getSetting(settingKey);
  if (dbValue !== null && dbValue !== "") return "admin panel";
  if (envPresent) return "env var";
  return null;
}

function Row({ label, ok, detail }) {
  return (
    <p style={{ display: "flex", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
      <span>{label}</span>
      <span style={{ textAlign: "right" }}>
        {ok ? <span className="badge badge-green">Ready</span> : <span className="badge badge-amber">Not set</span>}
        <br /><span className="small muted">{detail}</span>
      </span>
    </p>
  );
}

export default async function AdminStatusPage() {
  await requireAdmin();
  const bep20 = getBep20Settings();
  const pay = getBinancePaySettings();
  const merchant = getMerchantSettings();
  const smtp = getSmtpSettings();
  const usdtAmount = getUsdtAmount(250);

  const bep20Source = sourceOf("pay_bep20_address", Boolean(process.env.BINANCE_BSC_ADDRESS));
  const paySource = sourceOf("pay_binance_pay_id", Boolean(process.env.BINANCE_PAY_ID));
  const merchantSource = sourceOf("pay_merchant_api_key", Boolean(process.env.BINANCE_PAY_API_KEY));
  const smtpSource = sourceOf("smtp_host", Boolean(process.env.SMTP_HOST));

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Payment &amp; Email Status</h1>
      <p className="muted">Which rails are configured and where the values came from. Secrets are never shown — only whether they are set.</p>
      <p><Link href="/admin/payment-settings" className="btn btn-amber">Edit Payment &amp; Email Settings →</Link></p>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>BEP20 USDT</h3>
        <Row
          label="Rail enabled"
          ok={bep20.enabled}
          detail={bep20.enabled ? "On" : "Off — turn it on in Payment Settings"}
        />
        <Row
          label="Merchant wallet address"
          ok={Boolean(bep20.address)}
          detail={bep20.address ? `Set (${bep20Source}) — ${bep20.address.slice(0, 8)}…${bep20.address.slice(-6)}` : "Not set"}
        />
        <Row
          label="BscScan API key (optional)"
          ok={Boolean(bep20.bscscanKey)}
          detail={bep20.bscscanKey ? `Set — ${maskSecret(bep20.bscscanKey)}` : "Not set — public BSC RPC will be used"}
        />
        <Row
          label="USDT amount checked"
          ok={usdtAmount > 0}
          detail={`${usdtAmount} USDT`}
        />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Binance Pay — Order ID check</h3>
        <Row
          label="Rail enabled"
          ok={pay.enabled}
          detail={pay.enabled ? "On" : "Off — turn it on in Payment Settings"}
        />
        <Row
          label="Pay ID"
          ok={Boolean(pay.payId)}
          detail={pay.payId ? `Set (${paySource})` : "Not set"}
        />
        <Row
          label="Read-only API key"
          ok={Boolean(pay.apiKey)}
          detail={pay.apiKey ? `Set — ${maskSecret(pay.apiKey)}` : "Not set"}
        />
        <Row
          label="Read-only API secret"
          ok={Boolean(pay.apiSecret)}
          detail={pay.apiSecret ? `Set — ${maskSecret(pay.apiSecret)}` : "Not set"}
        />
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Binance Pay — Merchant checkout (future-optional)</h3>
        <Row
          label="Rail enabled"
          ok={merchant.enabled}
          detail={merchant.enabled ? "On" : "Off"}
        />
        <Row
          label="Merchant API key"
          ok={Boolean(merchant.apiKey)}
          detail={merchant.apiKey ? `Set (${merchantSource}) — ${maskSecret(merchant.apiKey)}` : "Not set"}
        />
        <Row
          label="Merchant API secret"
          ok={Boolean(merchant.apiSecret)}
          detail={merchant.apiSecret ? `Set — ${maskSecret(merchant.apiSecret)}` : "Not set"}
        />
      </div>

      <div className="card">
        <h3>Email (SMTP) — Course Key emails</h3>
        <Row
          label="SMTP host"
          ok={Boolean(smtp.host)}
          detail={smtp.host ? `Set (${smtpSource}) — ${smtp.host}:${smtp.port}` : "Not set"}
        />
        <Row
          label="SMTP user"
          ok={Boolean(smtp.user)}
          detail={smtp.user || "Not set"}
        />
        <Row
          label="SMTP password"
          ok={Boolean(smtp.pass)}
          detail={smtp.pass ? `Set — ${maskSecret(smtp.pass)}` : "Not set"}
        />
        <p className="small muted" style={{ marginTop: 12 }}>
          Course Key emails can only send when host + user + password are all set. Until then, enrollments still
          complete and pages say honestly that email is not connected yet.
        </p>
      </div>
    </div>
  );
}
