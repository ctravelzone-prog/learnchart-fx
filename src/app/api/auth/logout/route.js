// ---------------------------------------------------------------------------
// api/auth/logout — end the session and clear the cookie, back to Home.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../lib/http.js";
import { destroySession } from "../../../../lib/auth.js";

export async function POST(request) {
  await destroySession();
  return redirectTo("/");
}
