"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { ArrowRight, CircleAlert, CircleCheck, Clock3, FileText, MessageSquareQuote, RefreshCw, Timer, Video } from "lucide-react";
import PaymentProofDialog from "../Courses/PaymentProofDialog";
import { API_URL, authHeaders, CourseCatalogItem, isUnauthorized, LiveClass, PortalUser } from "@/lib/portal";

interface HomeworkItem {
  id: number;
  course_id: number;
  course_code: string;
  title: string;
  due_date: string;
  status: "assigned" | "overdue" | "submitted" | "graded";
}

interface QuizItem {
  id: number;
  course_id: number;
  course_code: string;
  title: string;
  deadline: string | null;
  duration_minutes: number;
  status: "available" | "submitted" | "graded" | "closed";
}

interface ResultItem {
  id: string;
  type: "quiz" | "assignment";
  title: string;
  course_code: string;
  score: number | null;
  total_marks: number;
  feedback: string | null;
  graded_at: string | null;
  href: string;
}

type Block = "catalog" | "classes" | "homework" | "quizzes" | "results";

interface Loaded<T> {
  data: T;
  failed: boolean;
}

interface DueItem {
  key: string;
  kind: "quiz" | "homework";
  title: string;
  courseCode: string;
  due: Date | null;
  overdue: boolean;
  href: string;
  action: string;
  detail?: string;
}

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const MAX_DUE_ROWS = 5;

// ── Dates, in the student's own words ───────────────────────────────────

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function clock(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** "Today", "Tomorrow", "Thu", or "5 Nov". */
function dayName(date: Date, now: number) {
  const days = Math.round((startOfDay(date) - startOfDay(new Date(now))) / DAY);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1 && days < 7) return date.toLocaleDateString([], { weekday: "long" });
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

function when(date: Date, now: number) {
  return `${dayName(date, now)}, ${clock(date)}`;
}

/** As `when`, but for the middle of a sentence: "due tomorrow, 3:30 PM". */
function whenInline(date: Date, now: number) {
  return when(date, now).replace(/^(Today|Tomorrow|Yesterday)/, (word) => word.toLowerCase());
}

/** "today at 3:30 PM", "on Thursday at…", "on 5 Nov at…": for running sentences. */
function inSentence(date: Date, now: number) {
  const day = dayName(date, now);
  const lead = day === "Today" || day === "Tomorrow" ? day.toLowerCase() : `on ${day}`;
  return `${lead} at ${clock(date)}`;
}

function shortDay(value?: string | null) {
  return value ? new Date(value).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) : "";
}

function startedAgo(start: Date, now: number) {
  const minutes = Math.max(0, Math.round((now - start.getTime()) / MINUTE));
  return minutes < 1 ? "Started just now" : `Started ${plural(minutes, "minute")} ago`;
}

function countdown(start: Date, now: number) {
  const minutes = Math.round((start.getTime() - now) / MINUTE);
  if (minutes < 60) return `Starts in ${Math.max(1, minutes)} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return `Starts in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(minutes / (60 * 24));
  return `Starts in ${days} days`;
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// ── Fees ─────────────────────────────────────────────────────────────────

type FeeTone = "urgent" | "soon" | "waiting" | "paid";

interface FeeLine {
  course: CourseCatalogItem;
  tone: FeeTone;
  text: string;
  note?: string;
  canUpload: boolean;
}

function feeLine(course: CourseCatalogItem, now: number): FeeLine {
  const rejected = course.rejection_reason && !course.proof_pending ? `Last proof wasn't accepted: ${course.rejection_reason}` : undefined;
  if (course.proof_pending) {
    return { course, tone: "waiting", text: "Proof received. An admin is checking it; access continues meanwhile.", canUpload: false };
  }
  if (course.enrollment_status === "paused") {
    const removal = course.removal_on ? ` If no payment arrives, you're removed from the course on ${shortDay(course.removal_on)}.` : "";
    return { course, tone: "urgent", text: `Access is paused. Upload this month's payment proof to restore it.${removal}`, note: rejected, canUpload: true };
  }
  if (course.overdue) {
    const pauses = course.pauses_on && new Date(course.pauses_on).getTime() > now ? `Access pauses ${shortDay(course.pauses_on)}.` : "Access pauses soon.";
    return { course, tone: "urgent", text: `Fee overdue since ${shortDay(course.paid_until)}. ${pauses}`, note: rejected, canUpload: true };
  }
  if (course.renewal_open) {
    return { course, tone: "soon", text: `Next fee due ${shortDay(course.paid_until)}.`, note: rejected, canUpload: true };
  }
  return { course, tone: "paid", text: course.paid_until ? `Paid until ${shortDay(course.paid_until)}` : "Paid", canUpload: false };
}

const TONE_DOT: Record<FeeTone, string> = {
  urgent: "bg-red-600",
  soon: "bg-amber-500",
  waiting: "bg-[#0866ef]",
  paid: "bg-emerald-600",
};

// ── Building blocks ──────────────────────────────────────────────────────

function Panel({ id, title, action, children, className = "" }: { id: string; title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`rounded-xl border border-[#e3e9f2] bg-white p-5 sm:p-6 ${className}`}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-lg font-bold tracking-[-0.01em] text-[#0b1f39]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="-my-2.5 inline-flex shrink-0 items-center gap-1 rounded py-2.5 text-sm font-semibold text-[#0866ef] underline-offset-4 hover:underline">
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
    </div>
  );
}

function LoadError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
      <span className="flex items-center gap-2"><CircleAlert className="h-4 w-4 shrink-0" /> We couldn&apos;t load your {what}.</span>
      <button type="button" onClick={onRetry} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 font-semibold text-red-800 ring-1 ring-red-200 hover:bg-red-100">
        <RefreshCw className="h-3.5 w-3.5" /> Try again
      </button>
    </div>
  );
}

// ── The dashboard ────────────────────────────────────────────────────────

export default function StudentDashboard({ user }: { user: PortalUser }) {
  const [catalog, setCatalog] = useState<Loaded<CourseCatalogItem[]> | null>(null);
  const [classes, setClasses] = useState<Loaded<LiveClass[]> | null>(null);
  const [homework, setHomework] = useState<Loaded<HomeworkItem[]> | null>(null);
  const [quizzes, setQuizzes] = useState<Loaded<QuizItem[]> | null>(null);
  const [results, setResults] = useState<Loaded<ResultItem[]> | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [payingFor, setPayingFor] = useState<CourseCatalogItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (only?: Block) => {
    const wanted = (block: Block) => !only || only === block;
    const get = <T,>(path: string, pick: (data: never) => T) =>
      axios.get(`${API_URL}${path}`, { headers: authHeaders() }).then((response) => pick(response.data as never));
    const settle = async <T,>(block: Block, request: () => Promise<T>, set: (value: Loaded<T> | null) => void, empty: T) => {
      if (!wanted(block)) return;
      if (only) set(null);
      try {
        set({ data: await request(), failed: false });
      } catch (error) {
        // A 401 is handled by the session refresh in AuthSession.
        set({ data: empty, failed: !isUnauthorized(error) });
      }
    };
    await Promise.all([
      settle("catalog", () => get("/courses/catalog", (data: CourseCatalogItem[]) => data), setCatalog, []),
      settle("classes", () => get("/live-classes/me", (data: LiveClass[]) => data), setClasses, []),
      settle("homework", () => get("/homeworks/overview", (data: { items: HomeworkItem[] }) => data.items), setHomework, []),
      settle("quizzes", () => get("/quizzes/me", (data: { items: QuizItem[] }) => data.items), setQuizzes, []),
      settle("results", () => get("/results/me", (data: { items: ResultItem[] }) => data.items), setResults, []),
    ]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Keeps "Live now" and the countdowns honest while the page stays open.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const myCourses = useMemo(
    () => (catalog?.data ?? []).filter((course) => course.enrollment_status === "enrolled" || course.enrollment_status === "paused"),
    [catalog],
  );
  const courseName = useCallback((id: number) => myCourses.find((course) => course.id === id)?.name ?? "", [myCourses]);

  const upcomingClasses = useMemo(
    () =>
      (classes?.data ?? [])
        .filter((item) => new Date(item.ends_at).getTime() > now)
        .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [classes, now],
  );
  const nextClass = upcomingClasses[0];
  const live = nextClass ? new Date(nextClass.starts_at).getTime() <= now : false;

  const due = useMemo<DueItem[]>(() => {
    const items: DueItem[] = [
      ...(homework?.data ?? [])
        .filter((item) => item.status === "assigned" || item.status === "overdue")
        .map((item) => ({
          key: `homework-${item.id}`,
          kind: "homework" as const,
          title: item.title,
          courseCode: item.course_code,
          due: new Date(item.due_date),
          overdue: item.status === "overdue" || new Date(item.due_date).getTime() < now,
          href: `/homework?submit=${item.id}`,
          action: "Submit",
        })),
      ...(quizzes?.data ?? [])
        .filter((item) => item.status === "available")
        .map((item) => ({
          key: `quiz-${item.id}`,
          kind: "quiz" as const,
          title: item.title,
          courseCode: item.course_code,
          due: item.deadline ? new Date(item.deadline) : null,
          overdue: false,
          href: `/quiz/${item.id}`,
          action: "Start quiz",
          detail: `${item.duration_minutes} min`,
        })),
    ];
    // Overdue first, then by due date; quizzes without a deadline last.
    return items.sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      if (!a.due || !b.due) return a.due ? -1 : b.due ? 1 : 0;
      return a.due.getTime() - b.due.getTime();
    });
  }, [homework, quizzes, now]);

  const fees = useMemo(
    () => myCourses.filter((course) => !course.archived).map((course) => feeLine(course, now)),
    [myCourses, now],
  );
  const feeAttention = fees.filter((line) => line.tone !== "paid");

  const latestFeedback = useMemo(
    () =>
      (results?.data ?? [])
        .filter((item) => item.score !== null && item.graded_at)
        .sort((a, b) => new Date(b.graded_at as string).getTime() - new Date(a.graded_at as string).getTime())[0],
    [results],
  );

  const summary = useMemo(() => {
    if (!catalog || !classes || !homework || !quizzes) return null;
    const parts: string[] = [];
    if (nextClass) {
      parts.push(live ? `${nextClass.title} is live now` : `Next class ${inSentence(new Date(nextClass.starts_at), now)}`);
    }
    const overdue = due.filter((item) => item.overdue).length;
    if (due.length) parts.push(`${plural(due.length, "thing")} due${overdue ? `, ${overdue} overdue` : ""}`);
    else parts.push("nothing due");
    const urgent = feeAttention.filter((line) => line.tone === "urgent" || line.tone === "soon");
    if (urgent.length === 1) parts.push(`${urgent[0].course.name} fee ${urgent[0].tone === "soon" ? `due ${shortDay(urgent[0].course.paid_until)}` : "needs attention"}`);
    else if (urgent.length > 1) parts.push(`${urgent.length} fees need attention`);
    else if (fees.length) parts.push("fees paid up");
    const sentence = parts.join(" · ");
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
  }, [catalog, classes, homework, quizzes, nextClass, live, now, due, feeAttention, fees]);

  const firstName = (user.full_name || user.username).trim().split(/\s+/)[0];
  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const openClass = (id: number) => window.open(`/meeting/${id}`, "_blank", "noopener,noreferrer");

  return (
    <div className="mx-auto max-w-[1280px]">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#06182f] sm:text-3xl">{greeting}, {firstName}.</h1>
        <p className="mt-1.5 min-h-6 text-base text-slate-600">{summary}</p>
      </header>

      {notice && (
        <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span className="flex items-start gap-2"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="shrink-0 rounded font-semibold underline-offset-4 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Next class */}
      <section
        aria-labelledby="next-class"
        className={`mb-5 rounded-xl border p-5 sm:p-6 ${live ? "border-[#9cc2fb] bg-[#f2f7ff]" : "border-[#e3e9f2] bg-white"}`}
      >
        <h2 id="next-class" className="sr-only">Next class</h2>
        {!classes ? (
          <Skeleton rows={2} />
        ) : classes.failed ? (
          <LoadError what="classes" onRetry={() => void load("classes")} />
        ) : nextClass ? (
          <div className="grid gap-5 md:grid-cols-[minmax(150px,auto)_minmax(0,1fr)_auto] md:items-center md:gap-8">
            <div>
              <p className={`text-sm font-semibold ${live ? "text-[#0758c9]" : "text-slate-600"}`}>{live ? "Live now" : dayName(new Date(nextClass.starts_at), now)}</p>
              <p className="mt-0.5 font-[family-name:var(--font-heading)] text-3xl font-bold tabular-nums tracking-[-0.02em] text-[#06182f]">
                <time dateTime={nextClass.starts_at}>{clock(new Date(nextClass.starts_at))}</time>
              </p>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-[#0b1f39]">{nextClass.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                {courseName(nextClass.course_id) || "Live class"} · until {clock(new Date(nextClass.ends_at))}
              </p>
              <p className={`mt-2 flex items-center gap-2 text-sm font-semibold ${live ? "text-[#0758c9]" : "text-slate-700"}`}>
                {live ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0866ef] opacity-60 motion-reduce:hidden" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#0866ef]" />
                    </span>
                    {startedAgo(new Date(nextClass.starts_at), now)}. The class opens in a new tab.
                  </>
                ) : (
                  <><Clock3 className="h-4 w-4" />{countdown(new Date(nextClass.starts_at), now)}</>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
              {live ? (
                <button type="button" onClick={() => openClass(nextClass.id)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0866ef] px-5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-[#075bda]">
                  <Video className="h-4 w-4" /> Join class
                </button>
              ) : (
                <p className="max-w-[16rem] text-sm text-slate-600 md:text-right">The Join button appears here when the class starts.</p>
              )}
            </div>
            {upcomingClasses.length > 1 && (
              <div className="border-t border-[#e8edf4] pt-4 md:col-span-3">
                <h3 className="text-sm font-semibold text-slate-600">After that</h3>
                <ul className="mt-2 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                  {upcomingClasses.slice(1, 3).map((item) => (
                    <li key={item.id} className="flex min-w-0 items-baseline gap-2 text-sm">
                      <time dateTime={item.starts_at} className="shrink-0 font-semibold tabular-nums text-slate-800">{when(new Date(item.starts_at), now)}</time>
                      <span className="truncate text-slate-600">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700">No classes are scheduled yet. When your teacher schedules one, it appears here with a Join button.</p>
            <PanelLink href="/schedule/past">Past classes and recordings</PanelLink>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* Work due */}
        <Panel
          id="work-due"
          title={<>Due{due.length > 0 && <span className="ml-2 align-middle text-sm font-semibold text-slate-600">{due.length}</span>}</>}
          action={<PanelLink href="/homework">All homework</PanelLink>}
        >
          {!homework || !quizzes ? (
            <Skeleton />
          ) : homework.failed || quizzes.failed ? (
            <LoadError what={homework.failed && quizzes.failed ? "homework and quizzes" : homework.failed ? "homework" : "quizzes"} onRetry={() => { if (homework.failed) void load("homework"); if (quizzes.failed) void load("quizzes"); }} />
          ) : due.length ? (
            <>
              <ul className="divide-y divide-[#edf1f6]">
                {due.slice(0, MAX_DUE_ROWS).map((item) => {
                  const Icon = item.kind === "quiz" ? Timer : FileText;
                  return (
                    <li key={item.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Icon className={`h-5 w-5 shrink-0 ${item.overdue ? "text-red-600" : "text-slate-500"}`} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-slate-900">{item.title}</p>
                        <p className={`mt-0.5 text-[13px] ${item.overdue ? "font-semibold text-red-700" : "text-slate-600"}`}>
                          {item.kind === "quiz" ? "Quiz" : "Homework"} · {item.courseCode} ·{" "}
                          {item.due ? (
                            <time dateTime={item.due.toISOString()}>{item.overdue ? `Overdue since ${whenInline(item.due, now)}` : `Due ${whenInline(item.due, now)}`}</time>
                          ) : (
                            "No deadline"
                          )}
                          {item.detail && ` · ${item.detail}`}
                        </p>
                      </div>
                      <Link
                        href={item.href}
                        className={`inline-flex h-10 shrink-0 items-center rounded-lg px-4 text-sm font-bold transition ${
                          item.overdue ? "bg-[#0866ef] text-white hover:bg-[#075bda]" : "border border-[#c9d8ee] text-[#0758c9] hover:bg-blue-50"
                        }`}
                        aria-label={`${item.action}: ${item.title}`}
                      >
                        {item.action}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {due.length > MAX_DUE_ROWS && (
                <p className="mt-4 text-sm text-slate-600">
                  And {due.length - MAX_DUE_ROWS} more on <Link href="/homework" className="font-semibold text-[#0866ef] hover:underline">Homework</Link> and <Link href="/quizzes" className="font-semibold text-[#0866ef] hover:underline">Quizzes</Link>.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-700">Nothing due. New quizzes and homework from your teachers show up here with a button to start or submit.</p>
          )}
        </Panel>

        {/* Fees */}
        <Panel id="fees" title="Fees" action={<PanelLink href="/courses">Courses</PanelLink>}>
          {!catalog ? (
            <Skeleton rows={2} />
          ) : catalog.failed ? (
            <LoadError what="fees" onRetry={() => void load("catalog")} />
          ) : !fees.length ? (
            <p className="text-sm text-slate-700">No fees yet. Once you&apos;re enrolled in a course, its monthly fee shows here.</p>
          ) : (
            <>
              {feeAttention.length === 0 && (
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                  <CircleCheck className="h-4 w-4" /> All paid up
                </p>
              )}
              <ul className="space-y-4">
                {[...feeAttention, ...fees.filter((line) => line.tone === "paid")].map((line) => (
                  <li key={line.course.id} className="flex gap-3">
                    <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[line.tone]}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-slate-900">{line.course.name}</p>
                      <p className={`mt-0.5 text-sm ${line.tone === "urgent" ? "text-red-800" : line.tone === "soon" ? "text-amber-900" : "text-slate-600"}`}>{line.text}</p>
                      {line.note && <p className="mt-1 text-sm text-red-800">{line.note}</p>}
                      {line.canUpload && (
                        <button
                          type="button"
                          onClick={() => setPayingFor(line.course)}
                          className={`mt-2.5 inline-flex h-10 items-center rounded-lg px-4 text-sm font-bold transition ${
                            line.tone === "urgent" ? "bg-[#0866ef] text-white hover:bg-[#075bda]" : "border border-[#c9d8ee] text-[#0758c9] hover:bg-blue-50"
                          }`}
                        >
                          Upload payment proof
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)]">
        {/* Latest feedback */}
        <Panel id="latest-feedback" title="Latest feedback" action={<PanelLink href="/results">Results</PanelLink>}>
          {!results ? (
            <Skeleton rows={2} />
          ) : results.failed ? (
            <LoadError what="feedback" onRetry={() => void load("results")} />
          ) : latestFeedback ? (
            <article>
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-[15px] font-semibold text-slate-900">{latestFeedback.title}</p>
                <p className="shrink-0 text-lg font-bold tabular-nums text-[#0b1f39]">
                  {latestFeedback.score}<span className="text-sm font-semibold text-slate-600"> / {latestFeedback.total_marks}</span>
                </p>
              </div>
              <p className="mt-0.5 text-[13px] text-slate-600">
                {latestFeedback.type === "quiz" ? "Quiz" : "Homework"} · {latestFeedback.course_code} · graded {dayName(new Date(latestFeedback.graded_at as string), now).toLowerCase()}
              </p>
              {latestFeedback.feedback ? (
                <blockquote className="mt-4 flex gap-3 rounded-lg bg-[#f6f8fd] p-4 text-[15px] leading-6 text-slate-800">
                  <MessageSquareQuote className="mt-0.5 h-5 w-5 shrink-0 text-[#0866ef]" aria-hidden="true" />
                  <span className="line-clamp-4">{latestFeedback.feedback}</span>
                </blockquote>
              ) : (
                <p className="mt-4 text-sm text-slate-600">Scored without a written remark.</p>
              )}
              <Link href={latestFeedback.href} className="mt-4 inline-flex h-10 items-center rounded-lg border border-[#c9d8ee] px-4 text-sm font-bold text-[#0758c9] transition hover:bg-blue-50">
                Read the feedback
              </Link>
            </article>
          ) : (
            <p className="text-sm leading-6 text-slate-700">Every quiz and homework you submit gets a score and a remark from your teacher. The newest one will show here.</p>
          )}
        </Panel>

        {/* Courses */}
        <Panel id="my-courses" title="Your courses" action={<PanelLink href="/courses">All courses</PanelLink>}>
          {!catalog || !classes ? (
            <Skeleton />
          ) : catalog.failed ? (
            <LoadError what="courses" onRetry={() => void load("catalog")} />
          ) : myCourses.length ? (
            <ul className="divide-y divide-[#edf1f6]">
              {myCourses.map((course) => {
                const next = upcomingClasses.find((item) => item.course_id === course.id);
                const fee = course.archived ? null : fees.find((line) => line.course.id === course.id);
                return (
                  <li key={course.id} className="grid gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)] sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-slate-900">{course.name}</p>
                      <p className="text-[13px] text-slate-600">{course.code}</p>
                    </div>
                    <p className="text-[13px] text-slate-700">
                      {course.archived ? "Course ended" : next ? <>Next class <time dateTime={next.starts_at}>{whenInline(new Date(next.starts_at), now)}</time></> : "No class scheduled"}
                    </p>
                    <p className={`flex items-center gap-2 text-[13px] ${fee && fee.tone === "urgent" ? "font-semibold text-red-800" : fee && fee.tone === "soon" ? "font-semibold text-amber-900" : "text-slate-600"}`}>
                      {fee && <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[fee.tone]}`} aria-hidden="true" />}
                      {course.archived
                        ? "Recordings and results stay available"
                        : !fee
                          ? ""
                          : fee.tone === "urgent"
                            ? course.enrollment_status === "paused" ? "Access paused" : "Fee overdue"
                            : fee.tone === "soon"
                              ? `Fee due ${shortDay(course.paid_until)}`
                              : fee.tone === "waiting"
                                ? "Proof being checked"
                                : fee.text}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-700">You aren&apos;t enrolled in a course yet.</p>
              <PanelLink href="/courses">Browse courses</PanelLink>
            </div>
          )}
        </Panel>
      </div>

      {payingFor && (
        <PaymentProofDialog
          course={payingFor}
          onClose={() => setPayingFor(null)}
          onSubmitted={(message) => {
            setPayingFor(null);
            setNotice(message);
            void load("catalog");
          }}
        />
      )}
    </div>
  );
}
