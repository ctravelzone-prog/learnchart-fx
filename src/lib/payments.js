// ---------------------------------------------------------------------------
// payments.js — Binance payment automation for the paid enrollment
// (Nov 2026: Siam chose Binance over ZiniPay). Two rails, both automatic —
// Siam never checks a payment by hand. Everything here runs server-side
// only; no API key or secret ever reaches the browser, page source, or
// an API response.
//
// RAIL 1 — BEP20 USDT (no Binance approval needed): the student sends
// USDT on BNB Smart Chain to the merchant address and pastes the TxHash.
// The server reads the transaction receipt (BscScan API when
// BSCSCAN_API_KEY is set, otherwise the public BSC JSON-RPC) and checks:
// status Success, a USDT token transfer to the merchant address, the
// EXACT course amount, and that the TxHash was never used before.
//
// RAIL 2 — Binance Pay (two mechanisms):
//   (a) TxID check, NO merchant approval needed: the student pays to the
//       merchant's Binance Pay ID and pastes the Binance Pay Order ID.
//       The server calls Binance Spot API GET /sapi/v1/pay/transactions
//       with the owner's READ-ONLY API key (BINANCE_API_KEY +
//       BINANCE_API_SECRET — never a key with trade/withdraw permission)
//       and finds one incoming USDT transaction with that Order ID and
//       the exact amount, never used before.
//   (b) Merchant webhook (ready for later, when Siam gets merchant
//       approval): Binance fires PAY_SUCCESS to
//       /api/payments/binance-pay-webhook; the signature is verified
//       against Binance's certificates, then the order (created via the
//       Create Order API v3) completes the enrollment.
//
// Every accepted payment lands in the `payments` table (tx_hash UNIQUE
// = the double-spend guard) and then runs the SAME success path as a
// free enrollment: enrollment row + unique Course Key + key email via
// the existing mailer (src/lib/mail.js).
// ---------------------------------------------------------------------------
import crypto from "node:crypto";
import { getDb, hasEnrollment } from "./db.js";
import { generateCourseKey, hashKey, encryptKey } from "./keys.js";
import { sendCourseKeyEmail, isMailConfigured } from "./mail.js";

// --- Fixed facts -----------------------------------------------------------
// USDT on BNB Smart Chain (BEP20): 18 decimals. The contract address is
// the ONLY identity of the token — anyone can deploy a fake "USDT".
export const USDT_BEP20_CONTRACT = "0x55d398326f99059ff775485246999027b3197955";
// keccak256("Transfer(address,address,uint256)") — the ERC-20/BEP-20
// Transfer event topic; the receipt logs carry from/to/amount in it.
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const BSC_RPC_URL = "https://bsc-dataseed.binance.org";
const BSCSCAN_API_URL = "https://api.bscscan.com/api";
const BINANCE_PAY_API_URL = "https://bpay.binanceapi.com";

// Course price in USDT, derived from the course record (25000 cents =
// $250). The verify functions take the expected amount as a parameter
// so tests can pass a real past transaction's own amount.
export function coursePriceUsdt(course) {
  return Number(course.price_cents) / 100;
}

// --- Merchant configuration (env only, read at call time) ------------------
// Nothing is invented here: an empty value means "not connected yet"
// and the pages say so honestly instead of showing a fake address/key.
export function getBep20Config() {
  return {
    address: (process.env.BINANCE_BSC_ADDRESS || "").trim(),
    bscscanKey: (process.env.BSCSCAN_API_KEY || "").trim(),
  };
}
export function isBep20Configured() {
  return Boolean(getBep20Config().address);
}
export function getBinancePayTxConfig() {
  return {
    payId: (process.env.BINANCE_PAY_ID || "").trim(),
    apiKey: (process.env.BINANCE_API_KEY || "").trim(),
    apiSecret: (process.env.BINANCE_API_SECRET || "").trim(),
  };
}
export function isBinancePayTxConfigured() {
  const c = getBinancePayTxConfig();
  return Boolean(c.payId && c.apiKey && c.apiSecret);
}
export function getBinancePayMerchantConfig() {
  return {
    apiKey: (process.env.BINANCE_PAY_API_KEY || "").trim(),
    apiSecret: (process.env.BINANCE_PAY_SECRET_KEY || "").trim(),
  };
}
export function isBinancePayMerchantConfigured() {
  const c = getBinancePayMerchantConfig();
  return Boolean(c.apiKey && c.apiSecret);
}

// --- Small helpers ---------------------------------------------------------
function fetchWithTimeout(url, options = {}, ms = 15000) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(ms) });
}

// A 32-byte topic holds an address right-aligned in the last 20 bytes.
function topicToAddress(topic) {
  return `0x${topic.slice(-40)}`.toLowerCase();
}

// --- RAIL 1: BEP20 receipt lookup ------------------------------------------
// One receipt fetch, BscScan first (when a key is set), public BSC
// JSON-RPC as the fallback so verification works with zero keys.
async function fetchReceipt(txHash, bscscanKey) {
  if (bscscanKey) {
    try {
      const res = await fetchWithTimeout(
        `${BSCSCAN_API_URL}?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${bscscanKey}`
      );
      const json = await res.json();
      if (json && json.result) return json.result;
      // BscScan answered but has no receipt (yet): fall through to the
      // public RPC rather than failing outright.
    } catch (err) {
      console.error("[payments] bscscan receipt lookup failed:", err?.message || err);
    }
  }
  try {
    const res = await fetchWithTimeout(BSC_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [txHash],
      }),
    });
    const json = await res.json();
    return json?.result || null;
  } catch (err) {
    console.error("[payments] bsc rpc receipt lookup failed:", err?.message || err);
    return null;
  }
}

// Verify a BEP20 USDT payment. Returns { ok } or { ok:false, reason }.
// Reasons: "bad-format" | "not-found" | "lookup-failed" | "failed" |
// "no-usdt-transfer" | "wrong-recipient" | "wrong-amount".
export async function verifyBep20Tx({ txHash, expectedAddress, expectedAmountUsdt }) {
  const hash = String(txHash || "").trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
    return { ok: false, reason: "bad-format" };
  }
  const { bscscanKey } = getBep20Config();
  let receipt;
  try {
    receipt = await fetchReceipt(hash, bscscanKey);
  } catch (err) {
    console.error("[payments] receipt fetch threw:", err?.message || err);
    return { ok: false, reason: "lookup-failed" };
  }
  // No receipt yet: not mined, wrong hash, or the chain is lagging.
  if (!receipt) return { ok: false, reason: "not-found" };
  // Receipt status 0x0 = the transaction reverted on-chain.
  if (receipt.status !== "0x1") return { ok: false, reason: "failed" };

  // The receipt's `to` is the USDT contract, NOT the recipient — the
  // real recipient + amount live in the Transfer event logs. Find a
  // USDT transfer in this transaction and check it against the order.
  const expectedValue = BigInt(Math.round(expectedAmountUsdt * 1e18));
  const merchant = expectedAddress.toLowerCase();
  let sawUsdtTransfer = false;
  let sawRightRecipient = false;
  for (const log of receipt.logs || []) {
    if (String(log.address || "").toLowerCase() !== USDT_BEP20_CONTRACT) continue;
    if (!log.topics || log.topics[0] !== TRANSFER_TOPIC) continue;
    sawUsdtTransfer = true;
    const to = topicToAddress(log.topics[2]);
    const value = BigInt(log.data || "0x0");
    if (to === merchant) {
      sawRightRecipient = true;
      if (value === expectedValue) {
        return { ok: true, from: topicToAddress(log.topics[1]), amountUsdt: expectedAmountUsdt };
      }
    }
  }
  if (!sawUsdtTransfer) return { ok: false, reason: "no-usdt-transfer" };
  if (!sawRightRecipient) return { ok: false, reason: "wrong-recipient" };
  return { ok: false, reason: "wrong-amount" };
}

// --- RAIL 2a: Binance Pay TxID check (owner's read-only API key) -----------
// Signed call to Binance Spot API Get Pay Trade History. The endpoint
// returns the key owner's OWN Pay history (recent window only, no
// lookup by ID), so we pull the window and filter in memory. Weight
// 3000 per call — fine at this volume; one call per verification.
//
// GEO NOTE: api.binance.com returns HTTP 451 ("Unavailable For Legal
// Reasons") from some regions — notably US cloud IPs, which includes
// Render's default Oregon region. Binance documents api1–api4 as
// alternate hosts, so we try each in turn. If ALL hosts 451, the rail
// fails with "api-error" (the student sees "try again in a minute") and
// BEP20 stays the working rail — a non-US host, or the merchant API
// (bpay.binanceapi.com, different host), avoids the block entirely.
// This is a property of Binance's geo-rules, not of the code.
const BINANCE_API_HOSTS = [
  "https://api.binance.com",
  "https://api1.binance.com",
  "https://api2.binance.com",
  "https://api3.binance.com",
  "https://api4.binance.com",
];

async function fetchPayHistory({ apiKey, apiSecret, windowDays = 7 }) {
  const now = Date.now();
  const params = new URLSearchParams({
    timestamp: String(now),
    startTime: String(now - windowDays * 24 * 60 * 60 * 1000),
    endTime: String(now),
    limit: "100",
  });
  const query = params.toString();
  const signature = crypto.createHmac("sha256", apiSecret).update(query).digest("hex");
  let lastError = null;
  for (const host of BINANCE_API_HOSTS) {
    try {
      const res = await fetchWithTimeout(
        `${host}/sapi/v1/pay/transactions?${query}&signature=${signature}`,
        { headers: { "X-MBX-APIKEY": apiKey } }
      );
      // 451 = geo-blocked in this region — try the next host.
      if (res.status === 451) {
        lastError = new Error(`binance pay history HTTP 451 from ${host}`);
        continue;
      }
      if (!res.ok) {
        throw new Error(`binance pay history HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!Array.isArray(json?.data)) {
        throw new Error("binance pay history: unexpected response shape");
      }
      return json.data;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("binance pay history unreachable");
}

// Verify a Binance Pay payment by the Order ID the student pasted.
// Matches ONE record in the owner's history: Order ID (transactionId
// or orderId), currency USDT, amount EXACTLY the course price, inside
// the recent window. Direction is checked best-effort: when the record
// carries receiver info and the configured Pay ID is in none of it,
// the record is treated as outgoing and skipped.
// Reasons: "bad-format" | "not-configured" | "api-error" | "not-found".
export async function verifyBinancePayTx({ orderId, expectedAmountUsdt }) {
  const id = String(orderId || "").trim();
  if (!id) return { ok: false, reason: "bad-format" };
  const cfg = getBinancePayTxConfig();
  if (!cfg.apiKey || !cfg.apiSecret) return { ok: false, reason: "not-configured" };

  let history;
  try {
    history = await fetchPayHistory(cfg);
  } catch (err) {
    console.error("[payments] binance pay history failed:", err?.message || err);
    return { ok: false, reason: "api-error" };
  }

  for (const item of history) {
    // The ID the student sees in the Binance app after paying. Match
    // either field name — Binance names it transactionId in this API.
    const candidates = [item.transactionId, item.orderId].filter(Boolean).map(String);
    if (!candidates.includes(id)) continue;
    if (String(item.currency || "").toUpperCase() !== "USDT") continue;
    if (Number(item.amount) !== Number(expectedAmountUsdt)) continue;
    // Best-effort direction check (see header comment). If the record
    // names a receiver and it is not our Pay ID, it is not a payment
    // TO us — skip it. Records without receiver info are accepted on
    // the ID + exact-amount match alone.
    if (cfg.payId && item.receiverInfo && typeof item.receiverInfo === "object") {
      const values = Object.values(item.receiverInfo).map((v) => String(v).toLowerCase());
      if (values.length > 0 && !values.includes(cfg.payId.toLowerCase())) continue;
    }
    return { ok: true, amountUsdt: expectedAmountUsdt, transactionTime: item.transactionTime };
  }
  return { ok: false, reason: "not-found" };
}

// --- Shared success path ---------------------------------------------------
// Record the payment, create the enrollment, generate the Course Key and
// email it — exactly like the free-enroll path in /api/enroll, so a paid
// student ends up in the same state. Idempotent on the transaction
// reference: a tx_hash already in `payments` is rejected BEFORE any
// enrollment is created, and the UNIQUE constraint is the backstop.
// Returns { ok:true, keymail } or { ok:false, reason:"duplicate" }.
export async function completePaidEnrollment({ userId, course, method, txRef, amount, currency = "USDT" }) {
  const db = getDb();
  const slug = course.slug;

  // Already enrolled (e.g. double-click / retry)? Do not create a
  // second enrollment or a second key — the first payment stands.
  if (hasEnrollment(userId, slug)) {
    return { ok: true, keymail: "already-enrolled" };
  }

  // Record the payment FIRST: the UNIQUE tx_hash stops any replay of
  // the same transaction, even under a race.
  try {
    db.prepare(
      "INSERT INTO payments (user_id, course_slug, method, tx_hash, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, 'verified')"
    ).run(userId, slug, method, txRef, String(amount), currency);
  } catch (err) {
    if (String(err?.message || "").includes("UNIQUE")) {
      return { ok: false, reason: "duplicate" };
    }
    throw err;
  }

  const paymentStatus = `paid — ${method} ${amount} ${currency}`;
  const enrollmentId = db
    .prepare("INSERT INTO enrollments (user_id, course_id, status, payment_status) VALUES (?, ?, 'active', ?)")
    .run(userId, course.id, paymentStatus).lastInsertRowid;

  // Forex course: one unique Course Key, emailed to the student's Gmail
  // (same rule as free enroll — the key is never shown on the site).
  let keymail = null;
  if (slug === "forex-premium-course") {
    const key = generateCourseKey();
    db.prepare("INSERT INTO course_keys (enrollment_id, key_hash, key_encrypted) VALUES (?, ?, ?)")
      .run(enrollmentId, hashKey(key), encryptKey(key));
    const user = db.prepare("SELECT name, email FROM users WHERE id = ?").get(userId);
    if (!isMailConfigured()) {
      keymail = "unconfigured";
    } else {
      const result = await sendCourseKeyEmail({ to: user.email, name: user.name, key });
      keymail = result.sent ? "sent" : "failed";
    }
  }
  return { ok: true, keymail };
}

// Has this transaction reference already paid for anything? Used by the
// verify routes to reject replays BEFORE doing chain/API lookups.
export function isTxRefUsed(txRef) {
  const row = getDb().prepare("SELECT id FROM payments WHERE tx_hash = ?").get(String(txRef).trim());
  return Boolean(row);
}

// --- RAIL 2b: Binance Pay merchant API (Create Order + webhook) ------------
// Implemented for later, when Siam's merchant application is approved.
// Everything here is env-gated: without BINANCE_PAY_API_KEY /
// BINANCE_PAY_SECRET_KEY nothing is called and the hosted checkout is
// simply not offered. NOTE: this path has NOT been tested against live
// Binance yet (no merchant keys exist) — it follows the documented
// Create Order API v3 + webhook signature scheme.
//
// Signing (both calls): HMAC-SHA512(secret, timestamp + "\n" + nonce +
// "\n" + JSON body + "\n"), hex. Headers carry the timestamp, nonce,
// certificate serial number and the signature.
function binancePayHeaders(apiKey, apiSecret, bodyString) {
  const timestamp = String(Date.now());
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${timestamp}\n${nonce}\n${bodyString}\n`;
  const signature = crypto.createHmac("sha512", apiSecret).update(payload).digest("hex");
  return {
    "Content-Type": "application/json",
    "BinancePay-Timestamp": timestamp,
    "BinancePay-Nonce": nonce,
    "BinancePay-Certificate-SN": apiKey,
    "BinancePay-Signature": signature,
  };
}

// Create a Binance Pay order and return the hosted checkout URL.
// merchantTradeNo: unique, alphanumeric, max 32 chars.
export async function createBinancePayOrder({ userId, course, webhookUrl, returnUrl }) {
  const cfg = getBinancePayMerchantConfig();
  if (!cfg.apiKey || !cfg.apiSecret) return { ok: false, reason: "not-configured" };

  const merchantTradeNo = `LCFX${Date.now().toString(36).toUpperCase()}${Number(userId).toString(36).toUpperCase()}`;
  const body = {
    env: { terminalType: "WEB" },
    merchantTradeNo,
    orderAmount: coursePriceUsdt(course),
    currency: "USDT",
    goods: {
      goodsType: "02",
      goodsCategory: "D000",
      referenceGoodsId: course.slug,
      goodsName: course.title,
      goodsDetail: course.subtitle || course.title,
    },
    description: `LearnChart FX — ${course.title}`,
    returnUrl,
    webhookUrl,
  };
  const bodyString = JSON.stringify(body);
  const res = await fetchWithTimeout(`${BINANCE_PAY_API_URL}/binancepay/openapi/v3/order`, {
    method: "POST",
    headers: binancePayHeaders(cfg.apiKey, cfg.apiSecret, bodyString),
    body: bodyString,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.status !== "SUCCESS" || !json?.data?.checkoutUrl) {
    console.error("[payments] binance pay create order failed:", res.status, JSON.stringify(json)?.slice(0, 300));
    return { ok: false, reason: "api-error" };
  }

  getDb()
    .prepare(
      "INSERT INTO binance_pay_orders (merchant_trade_no, user_id, course_slug, amount, currency, status) VALUES (?, ?, ?, ?, 'USDT', 'created')"
    )
    .run(merchantTradeNo, userId, course.slug, String(coursePriceUsdt(course)));
  return { ok: true, merchantTradeNo, checkoutUrl: json.data.checkoutUrl };
}

// Verify a Binance Pay webhook signature against Binance's certificates.
// Returns { ok:true, payload } or { ok:false, reason }.
// Reasons: "not-configured" | "bad-signature" | "bad-payload".
let cachedCerts = null;
let cachedCertsAt = 0;
async function getBinancePayCerts() {
  // Certificates change rarely; cache for an hour.
  if (cachedCerts && Date.now() - cachedCertsAt < 60 * 60 * 1000) return cachedCerts;
  const cfg = getBinancePayMerchantConfig();
  const bodyString = "{}";
  const res = await fetchWithTimeout(`${BINANCE_PAY_API_URL}/binancepay/openapi/certificates`, {
    method: "POST",
    headers: binancePayHeaders(cfg.apiKey, cfg.apiSecret, bodyString),
    body: bodyString,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.status !== "SUCCESS" || !Array.isArray(json?.data)) {
    throw new Error("binance pay certificates lookup failed");
  }
  cachedCerts = json.data;
  cachedCertsAt = Date.now();
  return cachedCerts;
}

export async function verifyBinancePayWebhook({ timestamp, nonce, signature, certSn, rawBody }) {
  const cfg = getBinancePayMerchantConfig();
  if (!cfg.apiKey || !cfg.apiSecret) return { ok: false, reason: "not-configured" };
  if (!timestamp || !nonce || !signature || !certSn || !rawBody) {
    return { ok: false, reason: "bad-signature" };
  }
  let certs;
  try {
    certs = await getBinancePayCerts();
  } catch (err) {
    console.error("[payments] binance pay certs failed:", err?.message || err);
    return { ok: false, reason: "bad-signature" };
  }
  const cert = certs.find((c) => String(c.certSerialNo) === String(certSn));
  if (!cert?.certPublicKey) return { ok: false, reason: "bad-signature" };

  // Signed content: timestamp + "\n" + nonce + "\n" + raw body + "\n",
  // RSA-SHA256 with Binance's public key, signature is base64.
  const signed = `${timestamp}\n${nonce}\n${rawBody}\n`;
  let valid = false;
  try {
    valid = crypto.verify("sha256", Buffer.from(signed, "utf8"), cert.certPublicKey, Buffer.from(signature, "base64"));
  } catch (err) {
    console.error("[payments] binance pay signature verify threw:", err?.message || err);
  }
  if (!valid) return { ok: false, reason: "bad-signature" };
  try {
    return { ok: true, payload: JSON.parse(rawBody) };
  } catch {
    return { ok: false, reason: "bad-payload" };
  }
}
