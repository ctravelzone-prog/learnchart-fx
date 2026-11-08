// ---------------------------------------------------------------------------
// http.js — small response helpers shared by the API routes.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";

// redirectTo(path) — send a 303 redirect with a RELATIVE Location header.
//
// Why relative, and why not NextResponse.redirect(new URL(path,
// request.url))? That builds an ABSOLUTE Location from the incoming
// request's Host header — and behind the hosting proxy the app can see
// a private host (localhost:5000), so the browser was sent to
// "localhost" and showed "This site can't be reached". A relative
// Location is resolved by the browser against the page it is already
// on, so the redirect always stays on the live domain no matter what
// host the proxy reports. (RFC 7231 allows a relative Location.)
export function redirectTo(path, status = 303) {
  return new NextResponse(null, { status, headers: { Location: path } });
}
