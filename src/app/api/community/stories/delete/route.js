// ---------------------------------------------------------------------------
// api/community/stories/delete — delete your own stories (Nov 2026,
// Facebook stories page Archive + Settings). Form POST with either
// story_id (delete ONE of your stories) or all=1 (delete ALL of your
// stories). Only your own stories can be deleted — the helpers check
// ownership, so nobody deletes another member's story. Paid Community
// members only. Redirects back to the Archive with a confirmation.
// ---------------------------------------------------------------------------
import { redirectTo } from "../../../../../lib/http.js";
import { getSessionUser } from "../../../../../lib/auth.js";
import { canEnterCommunity } from "../../../../../lib/access.js";
import { deleteStory, deleteAllMyStories } from "../../../../../lib/stories.js";

export async function POST(request) {
  const user = await getSessionUser();
  if (!user || !canEnterCommunity(user.id)) {
    return redirectTo("/community");
  }
  const form = await request.formData();
  if (form.get("all") === "1") {
    const n = deleteAllMyStories(user.id);
    return redirectTo(
      "/community/stories?view=archive&deleted=" + encodeURIComponent(n === 1 ? "1 story deleted." : `${n} stories deleted.`)
    );
  }
  const storyId = Number(form.get("story_id"));
  if (!storyId) return redirectTo("/community/stories?view=archive");
  const ok = deleteStory(storyId, user.id);
  return redirectTo(
    "/community/stories?view=archive&deleted=" + encodeURIComponent(ok ? "Story deleted." : "That story is not yours.")
  );
}
