// ---------------------------------------------------------------------------
// admin/community — community moderation. All posts, newest first, with
// like + comment counts; each post expands its comments. The admin can
// delete any post (comments + likes go with it) or any single comment.
// Members' own posts are never edited here — only removed.
// ---------------------------------------------------------------------------
import { requireAdmin } from "../../../lib/admin.js";
import { listPostsAdmin, getPostComments } from "../../../lib/db.js";

export const metadata = { title: "Community Moderation — Admin — LearnChart FX" };

export default async function AdminCommunityPage({ searchParams }) {
  await requireAdmin();
  const sp = await searchParams;
  const posts = listPostsAdmin();

  return (
    <div className="wrap section">
      <h1 style={{ fontSize: 36 }}>Community Moderation ({posts.length} posts)</h1>
      {sp?.saved === "1" ? <div className="alert alert-ok">Deleted.</div> : null}
      {posts.map((p) => {
        const comments = getPostComments(p.id);
        return (
          <div className="card" key={p.id} style={{ marginBottom: 16 }}>
            <p className="small muted">
              <strong>{p.author_name}</strong> ({p.author_email}) · {new Date(p.created_at).toLocaleString("en-GB")} · ❤️ {p.like_count} · 💬 {p.comment_count}
            </p>
            <p>{p.text}</p>
            {p.image_path ? <p><img src={p.image_path} alt="Post" style={{ maxWidth: 240, borderRadius: 10 }} /></p> : null}
            {p.drive_file_id ? <p className="small muted">Drive video: {p.drive_file_id}</p> : null}
            <form action="/api/admin/community/delete" method="post" style={{ marginTop: 8 }}>
              <input type="hidden" name="kind" value="post" />
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className="btn btn-dark btn-sm">Delete post</button>
            </form>
            {comments.length > 0 ? (
              <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <h4>Comments ({comments.length})</h4>
                {comments.map((c) => (
                  <p key={c.id} className="small" style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <span><strong>{c.author_name}:</strong> {c.text}</span>
                    <span>
                      <form action="/api/admin/community/delete" method="post">
                        <input type="hidden" name="kind" value="comment" />
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="btn btn-ghost btn-sm">Delete</button>
                      </form>
                    </span>
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      {posts.length === 0 ? <div className="card"><p className="muted">No community posts yet.</p></div> : null}
    </div>
  );
}
