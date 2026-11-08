// ---------------------------------------------------------------------------
// api/admin/live-settings — save the Live Room Settings form (admin only).
// Two sections, one per POST, so a save in one never touches the other:
//   section "source" — live source (off | own | youtube) + YouTube live
//     ID (parsed from a full URL or bare ID) + Owncast server URL.
//   section "key" — Owncast stream key (secret).
//
// SECRET RULES (same as Payment Settings): the stream key is
// AES-encrypted at rest (lib/keys.js, via setSecretSetting) with an
// "enc:" prefix. The form NEVER receives the full key back: the key
// input arrives empty unless the owner typed a new value. An empty
// field means "keep the current value"; a checked "clear" box means
// "delete it". No response ever contains the key — this route only
// redirects, and the settings page shows the masked value (last 4).
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { setSetting } from "../../../../lib/db.js";
import { setSecretSetting, parseYouTubeLiveId, normalizeOwncastUrl } from "../../../../lib/settings.js";
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

  if (section === "source") {
    const source = String(form.get("source") || "off").trim();
    setSetting("live_source", ["off", "own", "youtube"].includes(source) ? source : "off");

    // YouTube live ID: accept a full URL or a bare ID. A non-empty value
    // that cannot be parsed is rejected (nothing saved for it) so the
    // admin sees the error instead of silently saving a broken ID.
    const youtubeInput = String(form.get("youtube_id") || "").trim();
    if (youtubeInput) {
      const id = parseYouTubeLiveId(youtubeInput);
      if (!id) return redirectTo("/admin/live-settings?error=bad-youtube");
      setSetting("live_youtube_id", id);
    } else {
      setSetting("live_youtube_id", "");
    }

    // Owncast server URL: must be http(s) when given.
    const owncastInput = String(form.get("owncast_url") || "").trim();
    if (owncastInput) {
      const url = normalizeOwncastUrl(owncastInput);
      if (!url) return redirectTo("/admin/live-settings?error=bad-owncast");
      setSetting("live_owncast_url", url);
    } else {
      setSetting("live_owncast_url", "");
    }
  } else if (section === "key") {
    saveSecret(form, "stream_key", "live_owncast_key");
  } else {
    return redirectTo("/admin/live-settings");
  }

  return redirectTo(`/admin/live-settings?saved=${section}`);
}
