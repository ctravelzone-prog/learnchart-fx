// ---------------------------------------------------------------------------
// StoryViewer.jsx — the dedicated stories viewer (Nov 2026, Facebook
// stories page). One person's stories in order, auto-advancing every
// 6 seconds, with progress bars, prev/next, time left, close (back to
// /community), author + time at the top, and — at the bottom — the real
// viewers count + avatar stack for the story on screen. When a person's
// stories end, the viewer moves to the next person in the list; at the
// very end it goes back to /community. Every story shown records one
// view for this user (POST /api/community/stories/view, one row per
// user per story), and the viewers stack is read live from
// /api/community/stories/views?story_id= — so the "N new" counts and
// the rings on the list go grey after viewing.
// ---------------------------------------------------------------------------
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function timeLeft(expiresAt) {
  // SQLite stores UTC "YYYY-MM-DD HH:MM:SS" — parse it as UTC.
  const end = new Date(String(expiresAt).replace(" ", "T") + "Z").getTime();
  const ms = Math.max(0, end - Date.now());
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "less than a minute left";
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m left`;
}

export default function StoryViewer({ groups, selectedUserId, me }) {
  const router = useRouter();
  const startIdx = Math.max(0, groups.findIndex((g) => g.user_id === Number(selectedUserId)));
  const [pos, setPos] = useState({ groupIdx: startIdx, storyIdx: 0 });
  const [viewers, setViewers] = useState({ count: 0, viewers: [] });
  const viewedRef = useRef(new Set());

  const group = groups[pos.groupIdx] || null;
  const story = group ? group.stories[pos.storyIdx] : null;
  const isMine = group ? group.user_id === me.id : false;

  // Record a view for the story on screen (once per story per visit)
  // and load its viewers for the stack below.
  useEffect(() => {
    if (!story) return;
    const key = story.id;
    if (!viewedRef.current.has(key)) {
      viewedRef.current.add(key);
      fetch("/api/community/stories/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_id: story.id }),
      }).catch(() => { /* view not recorded — the story still plays */ });
    }
    fetch(`/api/community/stories/views?story_id=${story.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setViewers(d); })
      .catch(() => { /* viewers stay empty — the story still plays */ });
  }, [story]);

  // Auto-advance: 6 seconds per story, then the next story (or the
  // next person's first story); back to /community at the very end.
  useEffect(() => {
    if (!story) return;
    const id = setTimeout(() => next(), 6000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, groups]);

  // Close on Escape; arrows step.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") router.push("/community");
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, groups]);

  function next() {
    if (!group) return;
    if (pos.storyIdx + 1 < group.stories.length) {
      setPos({ groupIdx: pos.groupIdx, storyIdx: pos.storyIdx + 1 });
    } else if (pos.groupIdx + 1 < groups.length) {
      const nextGroup = groups[pos.groupIdx + 1];
      setPos({ groupIdx: pos.groupIdx + 1, storyIdx: 0 });
      router.replace(`/community/stories?user=${nextGroup.user_id}`);
    } else {
      router.push("/community");
    }
  }
  function prev() {
    if (!group) return;
    if (pos.storyIdx > 0) {
      setPos({ groupIdx: pos.groupIdx, storyIdx: pos.storyIdx - 1 });
    } else if (pos.groupIdx > 0) {
      const prevGroup = groups[pos.groupIdx - 1];
      setPos({ groupIdx: pos.groupIdx - 1, storyIdx: prevGroup.stories.length - 1 });
      router.replace(`/community/stories?user=${prevGroup.user_id}`);
    }
  }

  if (!group || !story) {
    return (
      <div className="card center" style={{ padding: 40 }}>
        <p className="muted">No stories to show right now.</p>
        <Link href="/community/create?tab=story" className="btn btn-amber btn-sm">Add a story →</Link>
      </div>
    );
  }

  return (
    <div className="fb-story-viewer">
      <div className="fb-story-viewer-box">
        <div className="fb-story-progress">
          {group.stories.map((s, i) => (
            <span key={s.id} className={`fb-story-bar ${i < pos.storyIdx ? "seen" : ""} ${i === pos.storyIdx ? "now" : ""}`} />
          ))}
        </div>
        <div className="fb-story-head">
          <span className="avatar">
            {group.profile_pic ? <img src={group.profile_pic} alt={group.name} /> : group.name[0]}
          </span>
          <b>{group.name}</b>
          <span className="muted">{timeLeft(story.expires_at)}</span>
          <Link href="/community" className="fb-story-close" aria-label="Close stories">✕</Link>
        </div>
        <div className="fb-story-media">
          <button type="button" className="fb-story-zone fb-story-zone-left" onClick={prev} aria-label="Previous story" />
          <img src={story.image_path} alt={`${group.name}'s story`} />
          <button type="button" className="fb-story-zone fb-story-zone-right" onClick={next} aria-label="Next story" />
        </div>
        <div className="fb-story-foot">
          {isMine ? (
            <Link href="/community/create?tab=story" className="btn btn-amber btn-sm">＋ Add to story</Link>
          ) : (
            <span className="small muted">{pos.storyIdx + 1} of {group.stories.length}</span>
          )}
        </div>
        {/* Viewers of the story on screen — real count + avatar stack. */}
        <div className="fb-story-viewers">
          {viewers.viewers.map((v) => (
            <span key={v.id} className="avatar" title={v.name}>
              {v.profile_pic ? <img src={v.profile_pic} alt={v.name} /> : v.name[0]}
            </span>
          ))}
          <span className="small">
            {viewers.count === 0
              ? "No views yet"
              : `${viewers.count} viewer${viewers.count === 1 ? "" : "s"}`}
          </span>
        </div>
      </div>
    </div>
  );
}
