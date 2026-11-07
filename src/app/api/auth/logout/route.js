// ---------------------------------------------------------------------------
// api/auth/logout — end the session and clear the cookie, back to Home.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { destroySession } from "../../../../lib/auth.js";

export async function POST(request) {
  await destroySession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
