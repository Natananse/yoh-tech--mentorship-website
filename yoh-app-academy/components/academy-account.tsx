"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  LogOut,
  LockKeyhole,
  Menu,
  Play,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import type {
  Certificate,
  CertificateEligibility,
  Lesson,
  Progress,
  User,
} from "../lib/platform-types";
import { LessonWorkspace } from "./academy-upgrade";
import { StudentEnrollmentPanel, useStudentEnrollment } from "./student-enrollment";

export async function platformRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body && typeof options.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.error || "The request could not be completed. Try again.",
    );
  return body as T;
}

export function AcademyAuthDialog({
  onClose,
  onSuccess,
  initialRole = "student",
}: {
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialRole?: "student" | "mentor";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"student" | "mentor">(initialRole);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await platformRequest<{ user: User }>(
        `/api/auth/${mode}`,
        {
          method: "POST",
          body: JSON.stringify(
            mode === "register"
              ? {
                  name: name.trim(),
                  email: email.trim(),
                  password,
                  role,
                  inviteCode: role === "mentor" ? inviteCode.trim() : undefined,
                }
              : { email: email.trim(), password },
          ),
        },
      );
      onSuccess(result.user);
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="ac-auth-dialog"
      aria-labelledby="account-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <button
        className="ac-icon-button ac-dialog-close"
        type="button"
        onClick={onClose}
        aria-label="Close account dialog"
      >
        <X size={21} />
      </button>
      <span className="ac-label">Your learning, saved</span>
      <h2 id="account-dialog-title">
        {mode === "login" ? "Welcome back." : "Start with one lesson."}
      </h2>
      <p>
        {mode === "login"
          ? "Sign in to pick up where you left off."
          : "Create an account to request enrollment and keep your learning progress."}
      </p>
      <div className="ac-auth-tabs" role="group" aria-label="Account action">
        <button
          type="button"
          aria-pressed={mode === "login"}
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          aria-pressed={mode === "register"}
          onClick={() => {
            setMode("register");
            setError("");
          }}
        >
          Create account
        </button>
      </div>
      <form onSubmit={submit}>
        {mode === "register" && (
          <label className="ac-field">
            Full name
            <input
              autoComplete="name"
              name="name"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}
        <label className="ac-field">
          Email address
          <input
            autoComplete="email"
            name="email"
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="ac-field">
          Password
          <span className="ac-password-field">
            <input
              autoComplete={
                mode === "register" ? "new-password" : "current-password"
              }
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={10}
              maxLength={256}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              className="ac-icon-button"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </span>
          {mode === "register" && <small>At least 10 characters.</small>}
        </label>
        {mode === "register" && (
          <>
            <label className="ac-field">
              I’m joining as
              <select
                name="role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as "student" | "mentor")
                }
              >
                <option value="student">Student</option>
                <option value="mentor">Mentor</option>
              </select>
            </label>
            {role === "mentor" && (
              <label className="ac-field">
                Mentor invitation code
                <input
                  name="inviteCode"
                  autoComplete="off"
                  required
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                />
                <small>
                  Ask the academy administrator for your invitation code.
                </small>
              </label>
            )}
          </>
        )}
        {error && (
          <div className="ac-error" role="alert">
            {error}
          </div>
        )}
        <button
          className="ac-button ac-button-primary ac-auth-submit"
          type="submit"
          disabled={busy}
        >
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Sign in to your account"
              : "Create your account"}
          <ArrowRight size={18} />
        </button>
      </form>
      <div className="ac-auth-note">
        <ShieldCheck size={17} />
        <span>
          Your progress is linked to your account, not just this browser.
        </span>
      </div>
    </dialog>
  );
}

export function AccountHeader({
  user,
  onHome,
  onWorkspace,
  onStudio,
  onLogout,
  active = "dashboard",
}: {
  user: User | null;
  onHome: () => void;
  onWorkspace?: () => void;
  onStudio?: () => void;
  onLogout?: () => void;
  active?: "dashboard" | "studio";
}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  const canTeach = user?.role === "mentor" || user?.role === "admin";
  const navigation = (
    <>
      <button
        type="button"
        aria-current={active === "dashboard" ? "page" : undefined}
        onClick={() => {
          setOpen(false);
          onWorkspace?.();
        }}
      >
        <BookOpen size={18} />
        My learning
      </button>
      {canTeach && (
        <button
          type="button"
          aria-current={active === "studio" ? "page" : undefined}
          onClick={() => {
            setOpen(false);
            onStudio?.();
          }}
        >
          <UploadCloud size={18} />
          {user?.role === "admin" ? "Admin studio" : "Mentor studio"}
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          onHome();
        }}
      >
        <ArrowLeft size={18} />
        Academy home
      </button>
      {onLogout && user && (
        <button type="button" onClick={onLogout}>
          <LogOut size={18} />
          Sign out
        </button>
      )}
    </>
  );
  return (
    <header className="ac-header">
      <div className="ac-header-inner">
        <button
          className="ac-brand"
          type="button"
          onClick={onHome}
          aria-label="YO Tech Academy home"
        >
          <span>
            <Code2 size={24} />
          </span>
          <b>
            YO<em>.</em>
            <small>APP ACADEMY</small>
          </b>
        </button>
        <nav className="ac-desktop-nav" aria-label="Account navigation">
          {navigation}
        </nav>
        <div className="ac-identity">
          <span>
            {user?.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("") || "Y"}
          </span>
          <div>
            <b>{user?.name || "Your account"}</b>
            <small>{user?.role || "Signed out"}</small>
          </div>
        </div>
        <button
          ref={toggle}
          className="ac-icon-button ac-menu-toggle"
          aria-expanded={open}
          aria-controls="account-mobile-navigation"
          aria-label={
            open ? "Close workspace navigation" : "Open workspace navigation"
          }
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <>
          <button
            className="ac-drawer-scrim"
            aria-label="Close workspace navigation backdrop"
            onClick={() => setOpen(false)}
          />
          <nav
            id="account-mobile-navigation"
            className="ac-mobile-nav"
            aria-label="Workspace navigation"
          >
            {navigation}
          </nav>
        </>
      )}
    </header>
  );
}

export function AccountGate({
  title,
  description,
  onSignIn,
  onHome,
}: {
  title: string;
  description: string;
  onSignIn?: () => void;
  onHome: () => void;
}) {
  return (
    <main className="ac-gate">
      <span className="ac-gate-icon">
        <BookOpen size={30} />
      </span>
      <span className="ac-label">YO Tech Academy</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div>
        {onSignIn && (
          <button className="ac-button ac-button-primary" onClick={onSignIn}>
            Sign in or create an account <ArrowRight size={17} />
          </button>
        )}
        <button className="ac-button ac-button-outline" onClick={onHome}>
          Back to the academy
        </button>
      </div>
    </main>
  );
}

export function AccountWorkspace({
  user,
  onHome,
  onStudio,
  onSignIn,
  onLogout,
}: {
  user: User | null;
  onHome: () => void;
  onStudio: () => void;
  onSignIn: () => void;
  onLogout: () => void;
}) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSample, setShowSample] = useState(false);
  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const result = await platformRequest<{ lessons: Lesson[] }>(
        "/api/lessons",
      );
      const published = result.lessons.filter(
        (lesson) => lesson.published && (lesson.videoUrl || lesson.canWatch === false),
      );
      setLessons(published);
      setSelected(previous => previous ? published.find(lesson => lesson.id === previous.id) || null : null);
      const values = await Promise.all(
        published.filter(lesson => lesson.canWatch !== false).map(async (lesson) => {
          try {
            const result = await platformRequest<{ progress: Progress }>(
              `/api/progress/${lesson.id}`,
            );
            return [lesson.id, result.progress] as const;
          } catch {
            return [lesson.id, null] as const;
          }
        }),
      );
      setProgress(
        Object.fromEntries(values.filter(([, value]) => value)) as Record<
          string,
          Progress
        >,
      );
      setError("");
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : "Your lessons could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  const enrollmentState = useStudentEnrollment(user);
  useEffect(() => {
    refresh();
    window.addEventListener("academy-progress-updated", refresh);
    window.addEventListener("academy-enrollment-updated", refresh);
    return () => {
      window.removeEventListener("academy-progress-updated", refresh);
      window.removeEventListener("academy-enrollment-updated", refresh);
    };
  }, [refresh]);
  const completed = lessons.filter(
    (lesson) => progress[lesson.id]?.completed,
  ).length;
  const started = lessons.filter(
    (lesson) =>
      (progress[lesson.id]?.position || 0) > 0 &&
      !progress[lesson.id]?.completed,
  ).length;
  if (!user)
    return (
      <div className="ac-site">
        <AccountHeader user={null} onHome={onHome} />
        <AccountGate
          title="Your next lesson is waiting."
          description="Sign in to request access to uploaded lessons and save your place across devices."
          onSignIn={onSignIn}
          onHome={onHome}
        />
      </div>
    );

  return (
    <div className="ac-site">
      <AccountHeader
        user={user}
        onHome={onHome}
        onStudio={onStudio}
        onWorkspace={() => {
          setSelected(null);
          setShowSample(false);
        }}
        onLogout={onLogout}
      />
      <main className="ac-workspace">
        <div className="ac-page-heading">
          <div>
            <span className="ac-label">Your learning space</span>
            <h1>Keep building, {user.name.split(" ")[0]}.</h1>
            <p>
              Pick up a lesson. Your place and completed lessons are saved to
              your account.
            </p>
          </div>
          {(user.role === "mentor" || user.role === "admin") && (
            <button className="ac-button ac-button-outline" onClick={onStudio}>
              Open lesson studio <ArrowRight size={17} />
            </button>
          )}
        </div>
        {user.role === "student" && (!selected || selected.canWatch !== false) && <StudentEnrollmentPanel state={enrollmentState} />}
        {(started > 0 || completed > 0) && (
          <div
            className="ac-live-stats"
            aria-label="Your saved learning activity"
          >
            {started > 0 && (
              <span>
                <Play size={16} />
                <strong>{started}</strong> in progress
              </span>
            )}
            {completed > 0 && (
              <span>
                <CheckCircle2 size={17} />
                <strong>{completed}</strong> completed
              </span>
            )}
          </div>
        )}
        {error && (
          <div className="ac-error" role="alert">
            {error}
            <button onClick={refresh}>Try again</button>
          </div>
        )}
        {(selected || showSample) && (
          <section className="ac-current-lesson" aria-label="Current lesson">
            <button
              className="ac-text-button"
              onClick={() => {
                setSelected(null);
                setShowSample(false);
              }}
            >
              <ArrowLeft size={17} />
              All lessons
            </button>
            <LessonWorkspace
              key={selected?.id || "sample"}
              lesson={selected || undefined}
              sampleOnly={showSample}
              onAuthRequired={onSignIn}
            />
          </section>
        )}
        {!selected && !showSample && (
          <section aria-labelledby="your-lessons-title">
            <div className="ac-section-heading">
              <h2 id="your-lessons-title">Your lesson library</h2>
              <span className="ac-label">
                {loading
                  ? "Loading lessons"
                  : lessons.length
                    ? `${lessons.length} published ${lessons.length === 1 ? "lesson" : "lessons"}`
                    : "Published by your mentors"}
              </span>
            </div>
            {loading ? (
              <div
                className="ac-skeleton-list"
                role="status"
                aria-label="Loading your lessons"
              >
                <div />
                <div />
                <div />
              </div>
            ) : lessons.length ? (
              <div className="ac-lesson-library">
                {lessons.map((lesson) => {
                  const saved = progress[lesson.id];
                  const percent = saved?.completed
                    ? 100
                    : saved?.duration
                      ? Math.min(100, (saved.position / saved.duration) * 100)
                      : 0;
                  return (
                    <button
                      className="ac-library-row"
                      key={lesson.id}
                      onClick={() => {
                        setSelected(lesson);
                        window.scrollTo({ top: 0, behavior: "instant" });
                      }}
                    >
                      <span
                        className={`ac-library-icon${saved?.completed ? " ac-is-complete" : ""}`}
                      >
                        {lesson.canWatch === false ? <LockKeyhole size={23} /> : saved?.completed ? (
                          <Check size={24} />
                        ) : (
                          <Play size={22} />
                        )}
                      </span>
                      <span className="ac-library-copy">
                        <span className="ac-label">{lesson.mentorName}</span>
                        <strong>{lesson.title}</strong>
                        <span>
                          {lesson.canWatch === false ? "Administrator approval required" : saved?.completed
                            ? "Completed"
                            : saved?.position > 0
                              ? `Resume from ${formatTime(saved.position)}`
                              : "Ready when you are"}{" "}
                          ·{" "}
                          {lesson.duration > 0
                            ? formatTime(lesson.duration)
                            : "Duration set by recording"}
                        </span>
                        {lesson.canWatch !== false && <span
                          className="ac-library-progress"
                          role="progressbar"
                          aria-label={`${lesson.title} progress`}
                          aria-valuenow={Math.round(percent)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <i
                            style={{ transform: `scaleX(${percent / 100})` }}
                          />
                        </span>}
                      </span>
                      <ArrowRight size={21} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="ac-empty">
                <BookOpen size={31} />
                <h3>No published lessons yet.</h3>
                <p>
                  Your mentors’ uploaded lessons will appear here when they are
                  published.
                </p>
                <button
                  className="ac-button ac-button-outline"
                  onClick={() => setShowSample(true)}
                >
                  Try the sample classroom <ArrowRight size={17} />
                </button>
              </div>
            )}
          </section>
        )}
        {user.role === "student" && enrollmentState.canViewLessons && <StudentCertificates />}
      </main>
    </div>
  );
}

function StudentCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [eligibleCourses, setEligibleCourses] = useState<
    CertificateEligibility[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const refresh = useCallback(async () => {
    try {
      const result = await platformRequest<{
        certificates: Certificate[];
        eligibleCourses: CertificateEligibility[];
      }>("/api/certificates");
      setCertificates(result.certificates);
      setEligibleCourses(
        result.eligibleCourses.filter((course) => course.publishedLessons > 0),
      );
      setError("");
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : "Certificates could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    window.addEventListener("academy-progress-updated", refresh);
    return () =>
      window.removeEventListener("academy-progress-updated", refresh);
  }, [refresh]);
  async function issue(courseId: string) {
    setIssuing(courseId);
    setError("");
    setMessage("");
    try {
      const result = await platformRequest<{ certificate: Certificate }>(
        "/api/certificates",
        { method: "POST", body: JSON.stringify({ courseId }) },
      );
      setCertificates((current) => [
        result.certificate,
        ...current.filter(
          (certificate) => certificate.id !== result.certificate.id,
        ),
      ]);
      setMessage(
        "Your certificate is ready. You can download it or share its verification link.",
      );
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : "The certificate could not be created.",
      );
    } finally {
      setIssuing(null);
    }
  }
  const unissued = eligibleCourses.filter(
    (course) =>
      !certificates.some(
        (certificate) => certificate.courseId === course.courseId,
      ),
  );
  return (
    <section
      className="ac-certificates"
      aria-labelledby="student-certificates-title"
    >
      <div className="ac-section-heading">
        <div>
          <span className="ac-label">A record of your work</span>
          <h2 id="student-certificates-title">Course certificates</h2>
        </div>
        <Award size={28} />
      </div>
      <p className="ac-certificate-intro">
        Finish a course’s published lessons, then create a completion
        certificate in your name.
      </p>
      <p className="ac-certificate-disclosure">
        <ShieldCheck size={18} />
        <span>
          Anyone with this ID can verify the completion. The verification page
          shows your name, course and issue date.
        </span>
      </p>
      {error && (
        <div className="ac-error" role="alert">
          {error}
          <button onClick={refresh}>Try again</button>
        </div>
      )}
      {message && (
        <div className="ac-success" role="status">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}
      {loading ? (
        <div
          className="ac-skeleton-list"
          role="status"
          aria-label="Loading course certificates"
        >
          <div />
        </div>
      ) : (
        <div className="ac-certificate-list">
          {certificates.map((certificate) => (
            <article className="ac-certificate-row" key={certificate.id}>
              <span className="ac-certificate-icon">
                <Award size={28} />
              </span>
              <div className="ac-certificate-copy">
                <span className="ac-label">Completion recorded</span>
                <h3>{certificate.courseTitle}</h3>
                <p>
                  {certificate.completedLessonCount} published{" "}
                  {certificate.completedLessonCount === 1
                    ? "lesson"
                    : "lessons"}{" "}
                  completed · Issued{" "}
                  {new Date(certificate.issuedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    timeZone: "Africa/Addis_Ababa",
                  })}
                </p>
                <span className="ac-certificate-id">ID {certificate.id}</span>
              </div>
              <div className="ac-certificate-actions">
                <a
                  className="ac-button ac-button-primary"
                  href={certificate.pdfUrl}
                  download
                >
                  <Download size={17} />
                  Download PDF
                </a>
                <a
                  className="ac-button ac-button-outline"
                  href={certificate.verifyUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify completion <ExternalLink size={16} />
                </a>
              </div>
            </article>
          ))}
          {unissued.map((course) => (
            <article className="ac-certificate-row" key={course.courseId}>
              <span className="ac-certificate-icon">
                <BookOpen size={26} />
              </span>
              <div className="ac-certificate-copy">
                <span className="ac-label">
                  {course.eligible ? "Ready to issue" : "Keep building"}
                </span>
                <h3>{course.courseTitle}</h3>
                <p>
                  {course.eligible
                    ? course.publishedLessons === 1
                      ? "The published lesson is complete."
                      : `All ${course.publishedLessons} published lessons are complete.`
                    : course.completedLessons > 0
                      ? `${course.completedLessons} of ${course.publishedLessons} published lessons complete.`
                      : `Complete the ${course.publishedLessons} published ${course.publishedLessons === 1 ? "lesson" : "lessons"} to request a certificate.`}
                </p>
              </div>
              <div className="ac-certificate-actions">
                <button
                  className="ac-button ac-button-primary"
                  disabled={!course.eligible || issuing !== null}
                  onClick={() => issue(course.courseId)}
                >
                  {issuing === course.courseId
                    ? "Creating…"
                    : "Create certificate"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </article>
          ))}
          {certificates.length === 0 && unissued.length === 0 && (
            <div className="ac-certificate-empty">
              <p>
                Your certificates will appear here as you finish published
                courses.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function formatTime(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
