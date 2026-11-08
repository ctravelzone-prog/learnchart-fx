// ---------------------------------------------------------------------------
// api/admin/payment-settings — save the Payment Settings form (admin
// only). One section per POST (bep20 / binance-pay / merchant / smtp),
// so a save in one section never touches the others.
//
// SECRET RULES (the whole point of this route):
// - Secrets are AES-encrypted at rest (lib/keys.js, via
//   src/lib/settings.js setSecretSetting) and stored with an "enc:"
//   prefix. The form NEVER receives a full secret back: secret inputs
//   arrive empty unless the owner typed a new value.
// - An empty secret field means "keep the current value". A checked
//   "clear" box means "delete it". A typed value replaces it.
// - No API response ever contains a full secret — this route only
//   redirects, and the settings page shows masked values (last 4).
// - Toggles: a checked box posts "1", an unchecked box posts nothing,
//   which this route reads as "0" — so turning a rail OFF works.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { setSetting } from "../../../../lib/db.js";
import { setSecretSetting } from "../../../../lib/settings.js";
import { getAdminUser } from "../../../../lib/admin.js";

// Save one secret: clear > new value > keep current.
function saveSecret(form, fieldName, settingKey) {
  if (form.get(`clear_${fieldName}`) === "1") {
    setSecretSetting(settingKey, "");
    return;
  }
  const value = String(form.get(fieldName) || "").trim();
  if (value) setSecretSetting(settingKey, value);
}

export async function POST(request) {
  const admin = await getAdminUser();
  if (!admin) return redirectTo("/admin/login");

  const form = await request.formData();
  const section = String(form.get("section") || "");

  if (section === "bep20") {
    setSetting("pay_bep20_enabled", form.get("enabled") === "1" ? "1" : "0");
    setSetting("pay_bep20_address", String(form.get("address") || "").trim());
    saveSecret(form, "bscscan_key", "pay_bep20_bscscan_key");
    const amount = Number(String(form.get("usdt_amount") || "").replace(/[^0-9.]/g, ""));
    if (Number.isFinite(amount) && amount > 0) setSetting("pay_usdt_amount", String(amount));
  } else if (section === "binance-pay") {
    setSetting("pay_binance_pay_enabled", form.get("enabled") === "1" ? "1" : "0");
    setSetting("pay_binance_pay_id", String(form.get("pay_id") || "").trim());
    saveSecret(form, "api_key", "pay_binance_api_key");
    saveSecret(form, "api_secret", "pay_binance_api_secret");
  } else if (section === "merchant") {
    setSetting("pay_merchant_enabled", form.get("enabled") === "1" ? "1" : "0");
    saveSecret(form, "api_key", "pay_merchant_api_key");
    saveSecret(form, "api_secret", "pay_merchant_api_secret");
  } else if (section === "smtp") {
    setSetting("smtp_host", String(form.get("host") || "").trim());
    setSetting("smtp_port", String(form.get("port") || "").trim() || "587");
    setSetting("smtp_user", String(form.get("user") || "").trim());
    saveSecret(form, "pass", "smtp_pass");
    setSetting("smtp_from", String(form.get("from") || "").trim());
  } else {
    return redirectTo("/admin/payment-settings");
  }

  return redirectTo(`/admin/payment-settings?saved=${section}`);
}
