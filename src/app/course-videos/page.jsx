// ---------------------------------------------------------------------------
// course-videos/page.jsx — Course Videos (prompt Section 11).
// Locked by default: every lesson is locked until the student is logged
// in + enrolled in the Forex course + has entered their own Course Key.
// The server decides what renders: embed URLs are NEVER in the page
// source, API responses or DOM for a user who has not unlocked.
// Videos are YouTube Unlisted embeds only, lazy-loaded. No video file is
// ever uploaded to or streamed from this hosting.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getLessons, getCourseBySlug } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { canWatchCourseVideos, getForexEnrollment } from "../../lib/access.js";
import LockedPreview from "../../components/LockedPreview.jsx";
import LessonPlayer from "../../components/LessonPlayer.jsx";

export const metadata = {
  title: "Course Videos — LearnChart FX",
  description: "Forex Trading Premium Course video lessons — unlocked with your personal Course Key.",
  robots: { index: false, follow: false },
};

export default async function CourseVideosPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const user = await getSessionUser();
  const course = getCourseBySlug("forex-premium-course");
  const lessons = course ? getLessons(course.id) : [];

  // Not logged in — locked preview with login/signup.
  if (!user) {
    return (
      <div className="wrap section">
        <p className="muted small">HOME › COURSE VIDEOS</p>
        <h1 style={{ fontSize: 36 }}>Forex Trading Premium Course — <span className="amber">Video Lessons</span></h1>
        <LockedPreview
          title="🔒 All Course Videos Are Locked"
          text="Every lesson video on this page is locked. Enroll in the Forex Trading Premium Course and you will receive a personal Course Key in your enrollment confirmation — enter that key here and the whole page unlocks, so you can watch all 10 videos."
          unlocks="Unlocks with: Forex Trading Premium Course ($250)"
          buttons={[
            { href: "/login?next=/course-videos", label: "Log In", style: "btn-amber" },
            { href: "/signup?next=/course-videos", label: "Sign Up", style: "btn-dark" },
            { href: "/courses", label: "See Course Details", style: "btn-dark" },
          ]}
        />
      </div>
    );
  }

  const enrollment = getForexEnrollment(user.id);
  const unlocked = canWatchCourseVideos(user.id);

  return (
    <div className="wrap section">
      <p className="muted small">HOME › COURSE VIDEOS</p>
      <h1 style={{ fontSize: 36 }}>Forex Trading Premium Course — <span className="amber">Video Lessons</span></h1>
      <p className="muted">
        All 10 lesson videos are hosted on YouTube as <strong>Unlisted</strong> and play here through the embedded
        YouTube player. Every video stays locked — enroll in the course, receive your personal Course Key, enter it
        here, and this whole page unlocks so you can watch every lesson.
      </p>

      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}
      {sp?.unlocked === "1" ? (
        <div className="alert alert-ok">🔓 Course videos unlocked. Your key opened this page — all 10 lessons below are ready to watch.</div>
      ) : null}

      {/* Enrolled but not yet unlocked: the key form. */}
      {enrollment && !unlocked ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>🔑 Enter Your Course Key</h3>
          <p className="muted">
            You are enrolled in the Forex Trading Premium Course. Enter the Course Key from your enrollment
            confirmation to unlock this page and watch all 10 lesson videos.
          </p>
          <form action="/api/course-videos/unlock" method="post">
            <div className="field">
              <label htmlFor="cv-key">Course Key</label>
              <input id="cv-key" name="key" required placeholder="LCFX-XXXX-XXXX-XXXX" autoComplete="off" />
            </div>
            <button type="submit" className="btn btn-amber">Unlock Videos</button>
          </form>
          <p className="small muted" style={{ marginTop: 10 }}>
            Your personal key was printed in your enrollment confirmation when you enrolled — copy it from there,
            or from your profile. Every student&apos;s key is different.
          </p>
        </div>
      ) : null}

      {/* Not enrolled at all: locked card + enroll button. */}
      {!enrollment ? (
        <LockedPreview
          title="🔒 All Course Videos Are Locked"
          text="Every lesson video on this page is locked. Enroll in the Forex Trading Premium Course and you will receive a personal Course Key in your enrollment confirmation — enter that key here and the whole page unlocks, so you can watch all 10 videos."
          unlocks="Unlocks with: Forex Trading Premium Course ($250)"
          buttons={[
            { href: "/enroll/forex-premium-course", label: "Enroll Now — Premium Course $250", style: "btn-amber" },
            { href: "/courses", label: "See Course Details", style: "btn-dark" },
          ]}
        />
      ) : null}

      {/* Lesson list. Embeds render ONLY after the server confirmed unlock. */}
      <h2 style={{ marginTop: 24 }}>🎬 Course Lessons — 10 Videos</h2>
      <p className="muted small">
        Videos are streamed from YouTube (Unlisted) — nothing is uploaded to this site. Watch them in order, one lesson at a time.
      </p>
      {/* Player for Lesson 1 (design's .yt-player): cover photo + play button.
          Play loads the real embed only when unlocked with a real video ID.
          NOTE: only plain values (strings/numbers) are passed to this client
          component — node:sqlite row objects are null-prototype and React
          refuses them as client-component props. */}
      {lessons.length > 0 ? (
        <LessonPlayer
          title={lessons[0].title}
          position={lessons[0].position}
          youtubeId={lessons[0].youtube_id || ""}
          unlocked={unlocked}
        />
      ) : null}
      {lessons.map((lesson) => (
        <div className={`lesson ${unlocked ? "" : "locked"}`} key={lesson.id}>
          <span className="num">{unlocked ? "▶" : "🔒"}</span>
          <div style={{ flex: 1 }}>
            <strong>Lesson {lesson.position} · {lesson.title}</strong>
            <div className="small muted">{lesson.duration}{lesson.description ? ` — ${lesson.description}` : ""}</div>
            {unlocked ? (
              lesson.youtube_id ? (
                <div className="video-wrap" style={{ marginTop: 12 }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${lesson.youtube_id}`}
                    title={lesson.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <p className="small muted" style={{ marginTop: 8 }}>
                  ▶ YouTube embed player — video ID is [Placeholder — Siam to provide the Unlisted YouTube ID for this lesson].
                </p>
              )
            ) : (
              <p className="small muted" style={{ marginTop: 8 }}>🔒 Locked — enter your Course Key above to watch.</p>
            )}
          </div>
        </div>
      ))}
      <p className="small muted" style={{ marginTop: 16 }}>
        Note: lesson videos must be set to <strong>Unlisted, not Private</strong> on YouTube — Private videos will not play for students in an embed.
      </p>
    </div>
  );
}
