// ---------------------------------------------------------------------------
// PostCard.jsx — one community post, read-only (server component).
// Used by member profile pages (/members/[id]) and by My Posts on the
// profile page. The interactive feed (like/comment forms) lives only on
// the Community page itself — here members just read, and follow the
// "View in Community" link to like or comment.
// Props are plain values only (strings/numbers/arrays of plain objects)
// so node:sqlite null-prototype rows never reach a client component.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { timeAgo } from "../lib/utils.js";
import DrivePlayer from "./DrivePlayer.jsx";

export default function PostCard({ post, authorName, authorPic, authorId }) {
  return (
    <article className="card post">
      <div className="post-head">
        <Link href={`/members/${authorId}`} aria-label={`${authorName}'s profile`}>
          <span className="avatar">
            {authorPic ? <img src={authorPic} alt={authorName} /> : authorName[0]}
          </span>
        </Link>
        <div>
          <Link href={`/members/${authorId}`}><strong>{authorName}</strong></Link>
          <div className="small muted">{timeAgo(post.created_at)}</div>
        </div>
      </div>
      {post.text ? <p style={{ whiteSpace: "pre-wrap" }}>{post.text}</p> : null}
      {post.image_path ? <img src={post.image_path} alt="Post picture" loading="lazy" style={{ borderRadius: 12, marginTop: 8 }} /> : null}
      {post.drive_file_id ? (
        <div style={{ marginTop: 10 }}>
          <DrivePlayer fileId={post.drive_file_id} />
        </div>
      ) : null}
      <div className="post-actions">
        <span>♥ {post.likes} likes</span>
        <span>💬 {post.comments.length} comments</span>
        <Link href="/community" className="amber">View in Community →</Link>
      </div>
      {post.comments.map((c) => (
        <div className="comment" key={c.id}>
          <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{c.author_name[0]}</span>
          <div className="body">
            <strong>{c.author_name}</strong> <span className="muted small">{timeAgo(c.created_at)}</span>
            <div>{c.text}</div>
          </div>
        </div>
      ))}
    </article>
  );
}
