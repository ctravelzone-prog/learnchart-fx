// ---------------------------------------------------------------------------
// course-videos/page.jsx — Course Videos (prompt Section 11, Nov 2026
// per-visit key rule). GENERALIZED (Nov 2026): works PER VIDEO COURSE —
// any course with has_videos = 1, not just Forex. ?course=<slug> picks
// the course (defaults to the Forex course for backward compatibility);
// the page lists the student's other video courses as a switcher.
// Locked by default: every lesson is locked until the student is logged
// in + enrolled in THAT course + has entered their own Course Key FOR
// THIS VISIT. The key is never shown on the site — it is emailed to the
// student's Gmail on enrollment. The server decides what renders: the
// lesson list and embed URLs are NEVER in the page source, API responses
// or DOM until a valid single-use visit token (?visit=...) is consumed
// for this visit. Leaving and coming back asks for the key again.
// Videos are YouTube Unlisted embeds only, lazy-loaded. No video file
// is ever uploaded to or streamed from this hosting.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { getLessons, getCourseBySlug } from "../../lib/db.js";
import { getSessionUser } from "../../lib/auth.js";
import { consumeKeyVisit, getVideoEnrollment, getVideoEnrollments, SLUGS } from "../../lib/access.js";
import LockedPreview from "../../components/LockedPreview.jsx";
import LessonPlayer from "../../components/LessonPlayer.jsx";

export const metadata = {
  title: "Course Videos — LearnChart FX",
  description: "Video lessons for your enrolled video courses — unlocked with your personal Course Key.",
  robots: { index: false, follow: false },
};

export default async function CourseVideosPage({ searchParams }) {
  // Next.js 15: searchParams is a Promise — await it first.
  const sp = await searchParams;
  const user = await getSessionUser();
  // Which video course? ?course=<slug> when it names a video course,
  // otherwise the Forex course (backward compatible default).
  const requested = typeof sp?.course === "string" ? sp.course : "";
  const requestedCourse = requested ? getCourseBySlug(requested) : null;
  const course =
    requestedCourse && requestedCourse.has_videos
      ? requestedCourse
      : getCourseBySlug(SLUGS.FOREX);
  const lessons = course ? getLessons(course.id) : [];
  const myVideoCourses = user ? getVideoEnrollments(user.id) : [];

  const heading = `${course ? course.title : "Course Videos"} — Video Lessons`;

  // Not logged in — locked preview with login/signup.
  if (!user) {
    return (
      <div className="wrap section">
        <p className="muted small">HOME › COURSE VIDEOS</p>
        <h1 style={{ fontSize: 36 }}>{heading}</h1>
        <LockedPreview
          title="🔒 All Course Videos Are Locked"
          text={`Every lesson video on this page is locked. Enroll in the ${course ? course.title : "course"} and your personal Course Key will be emailed to your Gmail — enter that key here and the whole page unlocks, so you can watch all ${lessons.length} videos.`}
          unlocks={`Unlocks with: ${course ? course.title : "a video course"}${course && course.price_label ? ` (${course.price_label})` : ""}`}
          buttons={[
            { href: `/login?next=/course-videos${course ? `?course=${course.slug}` : ""}`, label: "Log In", style: "btn-amber" },
            { href: `/signup?next=/course-videos${course ? `?course=${course.slug}` : ""}`, label: "Sign Up", style: "btn-dark" },
            { href: "/courses", label: "See Course Details", style: "btn-dark" },
          ]}
        />
      </div>
    );
  }

  const enrollment = course ? getVideoEnrollment(user.id, course.slug) : null;
  // Per-visit unlock: only a fresh, valid, single-use visit token opens
  // the lessons for this visit. The token is tied to ONE enrollment —
  // a token minted for another course never opens this one.
  const visitToken = typeof sp?.visit === "string" ? sp.visit : null;
  const unlockedEnrollment = visitToken ? consumeKeyVisit(user.id, visitToken) : null;
  const unlocked = Boolean(unlockedEnrollment && unlockedEnrollment.course_slug === course?.slug);

  return (
    <div className="wrap section">
      <p className="muted small">HOME › COURSE VIDEOS</p>
      <h1 style={{ fontSize: 36 }}>{heading}</h1>
      <p className="muted">
        All {lessons.length} lesson videos are hosted on YouTube as <strong>Unlisted</strong> and play here through the embedded
        YouTube player. Every video stays locked — enroll in the course, check your Gmail for your personal Course Key,
        enter it here, and this whole page unlocks so you can watch every lesson. The key is asked again every time
        you open this page.
      </p>

      {/* Switcher: the student's other video courses. */}
      {myVideoCourses.length > 1 ? (
        <p className="small" style={{ marginBottom: 16 }}>
          Your video courses:{" "}
          {myVideoCourses.map((e) => (
            <span key={e.course_slug} style={{ marginRight: 10 }}>
              {e.course_slug === course?.slug ? (
                <strong>{e.course_title}</strong>
              ) : (
                <Link href={`/course-videos?course=${e.course_slug}`} className="amber">{e.course_title} →</Link>
              )}
            </span>
          ))}
        </p>
      ) : null}

      {sp?.error ? <div className="alert alert-error">{sp.error}</div> : null}
      {unlocked ? (
        <div className="alert alert-ok">🔓 Course videos unlocked for this visit. Your key opened this page — all {lessons.length} lessons below are ready to watch. If you leave and come back, enter your key again.</div>
      ) : null}
      {visitToken && !unlocked ? (
        <div className="alert alert-info">That unlock was for a single visit only — enter your Course Key again below to watch.</div>
      ) : null}

      {/* Enrolled but not yet unlocked: ONLY the key form. No lesson list,
          no embeds, no titles beyond the page heading — until verified. */}
      {enrollment && !unlocked ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3>🔑 Enter Your Course Key</h3>
          <p className="muted">
            You are enrolled in {course.title}. Enter the Course Key that was emailed to your Gmail
            to unlock this page and watch all {lessons.length} lesson videos.
          </p>
          <form action="/api/course-videos/unlock" method="post">
            <input type="hidden" name="course" value={course.slug} />
            <div className="field">
              <label htmlFor="cv-key">Course Key</label>
              <input id="cv-key" name="key" required placeholder="LCFX-XXXX-XXXX-XXXX" autoComplete="off" />
            </div>
            <button type="submit" className="btn btn-amber">Unlock Videos</button>
          </form>
          <p className="small muted" style={{ marginTop: 10 }}>
            Your key was emailed to your Gmail when you enrolled — check your inbox (and Spam folder). Every
            student&apos;s key is different. Lost it? Use &ldquo;Resend my key&rdquo; on your profile.
          </p>
        </div>
      ) : null}

      {/* Not enrolled at all: locked card + enroll button. */}
      {!enrollment ? (
        <LockedPreview
          title="🔒 All Course Videos Are Locked"
          text={`Every lesson video on this page is locked. Enroll in the ${course ? course.title : "course"} and your personal Course Key will be emailed to your Gmail — enter that key here and the whole page unlocks, so you can watch all ${lessons.length} videos.`}
          unlocks={`Unlocks with: ${course ? course.title : "a video course"}${course && course.price_label ? ` (${course.price_label})` : ""}`}
          buttons={[
            { href: `/enroll/${course?.slug || ""}`, label: `Enroll Now — ${course?.title || "Course"}${course?.price_label ? ` ${course.price_label}` : ""}`, style: "btn-amber" },
            { href: "/courses", label: "See Course Details", style: "btn-dark" },
          ]}
        />
      ) : null}

      {/* Lesson list + embeds render ONLY after the key was verified for
          this visit. A locked visitor sees nothing of the lessons here. */}
      {unlocked ? (
        <>
          <h2 style={{ marginTop: 24 }}>🎬 Course Lessons — {lessons.length} Videos</h2>
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
            <div className="lesson" key={lesson.id}>
              <span className="num">▶</span>
              <div style={{ flex: 1 }}>
                <strong>Lesson {lesson.position} · {lesson.title}</strong>
                <div className="small muted">{lesson.duration}{lesson.description ? ` — ${lesson.description}` : ""}</div>
                {lesson.youtube_id ? (
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
                )}
              </div>
            </div>
          ))}
          <p className="small muted" style={{ marginTop: 16 }}>
            Note: lesson videos must be set to <strong>Unlisted, not Private</strong> on YouTube — Private videos will not play for students in an embed.
          </p>
        </>
      ) : null}
    </div>
  );
}
