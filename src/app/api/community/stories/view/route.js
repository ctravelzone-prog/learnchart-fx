// ---------------------------------------------------------------------------
// api/community/stories/view — record a story view (Nov 2026, Facebook
// stories page). POST { story_id } as JSON (or form). One row per user
// per story (INSERT OR IGNORE in src/lib/stories.js), so re-watching
// never inflates the count. Paid Community members only.
// ---------------------------------------------------------------------------
import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../../lib/auth.js";
import { canEnterCommunity } from "../../../../../lib/access.js";
import { recordStoryView } from "../../../../../lib/stories.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return NextResponse.json({ error: "Members only." }, { status: 403 });
  }
  let storyId = null;
  try {
    const body = await request.json();
    storyId = Number(body?.story_id);
  } catch {
    const form = await request.formData();
    storyId = Number(form.get("story_id"));
  }
  if (!storyId) return NextResponse.json({ error: "Missing story_id." }, { status: 400 });
  const ok = recordStoryView(storyId, user.id);
  return NextResponse.json({ ok });
}
