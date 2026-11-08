// ---------------------------------------------------------------------------
// api/community/stories/views — who viewed one story (Nov 2026,
// Facebook stories page). GET ?story_id=<id> returns { count, viewers }
// — total views + up to 5 viewers (newest first) for the avatar stack
// under the story viewer. Paid Community members only.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../../lib/auth.js";
import { canEnterCommunity } from "../../../../../lib/access.js";
import { getStoryViewers } from "../../../../../lib/stories.js";

export async function GET(request) {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }
  const storyId = Number(new URL(request.url).searchParams.get("story_id"));
  if (!storyId) return NextResponse.json({ error: "Missing story_id." }, { status: 400 });
  return NextResponse.json(getStoryViewers(storyId));
}
