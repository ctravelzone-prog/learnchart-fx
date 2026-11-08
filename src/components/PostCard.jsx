// ---------------------------------------------------------------------------
// PostCard.jsx — one community post, read-only (server component),
// Instagram-style card. Used by member profile pages (/members/[id] grid
// links here for text posts) and by My Posts on the profile page. The
// interactive feed (like/comment forms) lives only on the Community page
// itself — here members just read, and follow the "View in Community"
// link to like or comment.
// Props are plain values only (strings/numbers/arrays of plain objects)
// so node:sqlite null-prototype rows never reach a client component.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { timeAgo } from "../lib/utils.js";
import DrivePlayer from "./DrivePlayer.jsx";

export default function PostCard({ post, authorName, authorPic, authorId }) {
  return (
    <article className="ig-post" id={`post-${post.id}`}>
      <div className="ig-post-head">
        <Link href={`/members/${authorId}`} aria-label={`${authorName}'s profile`}>
          <span className="avatar">
            {authorPic ? <img src={authorPic} alt={authorName} /> : authorName[0]}
          </span>
        </Link>
        <div className="who">
          <Link href={`/members/${authorId}`}><b>{authorName}</b></Link>
          <span>{timeAgo(post.created_at)}</span>
        </div>
        <span className="ig-dots" aria-hidden="true">•••</span>
      </div>
      {post.image_path ? (
        <div className="ig-media"><img src={post.image_path} alt="Post picture" loading="lazy" /></div>
      ) : post.drive_file_id ? (
        <div className="ig-media"><DrivePlayer fileId={post.drive_file_id} /></div>
      ) : post.text ? (
        <div className="ig-text-media"><p>{post.text}</p></div>
      ) : null}
      <div className="ig-likes">{post.likes} like{post.likes === 1 ? "" : "s"}</div>
      {post.text && (post.image_path || post.drive_file_id) ? (
        <div className="ig-caption"><b>{authorName}</b>{post.text}</div>
      ) : null}
      {post.comments.map((c) => (
        <div className="ig-comments" key={c.id}>
          <div className="ig-comment">
            <b>{c.author_name}</b>
            {c.text} <span className="muted">{timeAgo(c.created_at)}</span>
          </div>
        </div>
      ))}
      <div className="ig-add-comment" style={{ borderTop: "none" }}>
        <Link href={`/community#post-${post.id}`} className="amber" style={{ fontWeight: 700, fontSize: 14 }}>
          View in Community →
        </Link>
      </div>
    </article>
  );
}
