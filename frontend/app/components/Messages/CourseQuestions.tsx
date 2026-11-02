"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, MessageCircleQuestion, Plus, RotateCcw, Send, Trash2 } from "lucide-react";
import { API_URL, authHeaders, getApiError, PortalUser } from "@/lib/portal";
import VoiceInput, { appendSpoken } from "../Portal/VoiceInput";

interface ThreadSummary {
  id: number;
  course_id: number;
  course_name: string;
  title: string;
  author_id: number;
  author_name: string;
  is_resolved: boolean;
  reply_count: number;
  awaiting_staff: boolean;
  last_reply_preview: string;
  created_at: string;
  updated_at: string;
}

interface ThreadReply {
  id: number;
  author_id: number;
  author_name: string;
  is_staff: boolean;
  is_mine: boolean;
  body: string;
  created_at: string;
}

interface ThreadDetail extends ThreadSummary {
  replies: ThreadReply[];
  can_reply: boolean;
}

interface CourseOption {
  id: number;
  name: string;
  code: string;
}

type Filter = "open" | "resolved" | "all";

const REFRESH_MS = 30_000;

function relativeTime(value: string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

function StatusPill({ thread, staff }: { thread: ThreadSummary; staff: boolean }) {
  if (thread.is_resolved) return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Answered</span>;
  if (thread.awaiting_staff) {
    return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{staff ? "Needs a reply" : "Waiting for teacher"}</span>;
  }
  return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#0866ef]">{staff ? "Replied" : "Teacher replied"}</span>;
}

export default function CourseQuestions({ user, initialThreadId }: { user: PortalUser; initialThreadId?: number | null }) {
  const staff = Boolean(user.is_admin || user.is_ta);
  const [filter, setFilter] = useState<Filter>(staff ? "open" : "all");
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(initialThreadId ?? null);
  const [thread, setThread] = useState<ThreadDetail | null>(null);
  const [composing, setComposing] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState({ course_id: 0, title: "", body: "" });
  const endRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const response = await axios.get<ThreadSummary[]>(`${API_URL}/threads`, { headers: authHeaders(), params: { status: filter } });
      setThreads(response.data);
    } catch (requestError) {
      setError(getApiError(requestError, "We couldn't load your questions."));
    } finally {
      setLoadingList(false);
    }
  }, [filter]);

  const loadThread = useCallback(async (id: number, quiet = false) => {
    if (!quiet) setLoadingThread(true);
    try {
      const response = await axios.get<ThreadDetail>(`${API_URL}/threads/${id}`, { headers: authHeaders() });
      setThread(response.data);
    } catch (requestError) {
      if (!quiet) {
        setThread(null);
        setError(getApiError(requestError, "We couldn't open this question."));
      }
    } finally {
      if (!quiet) setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    setLoadingList(true);
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (staff) return;
    axios
      .get<CourseOption[]>(`${API_URL}/threads/courses`, { headers: authHeaders() })
      .then((response) => {
        setCourses(response.data);
        setDraft((current) => ({ ...current, course_id: current.course_id || response.data[0]?.id || 0 }));
      })
      .catch(() => setCourses([]));
  }, [staff]);

  useEffect(() => {
    setConfirmDelete(false);
    if (selectedId) void loadThread(selectedId);
    else setThread(null);
  }, [selectedId, loadThread]);

  // New replies show up without a reload while the page is open.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadThreads();
      if (selectedId) void loadThread(selectedId, true);
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [loadThreads, loadThread, selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread?.replies.length]);

  const openThread = (id: number) => {
    setComposing(false);
    setError(null);
    setSelectedId(id);
  };

  const startQuestion = () => {
    setSelectedId(null);
    setComposing(true);
    setError(null);
  };

  const submitQuestion = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.course_id || draft.title.trim().length < 3 || !draft.body.trim()) {
      setError("Choose a course, give the question a short title, and describe it.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const response = await axios.post<ThreadDetail>(`${API_URL}/threads`, draft, { headers: authHeaders() });
      setDraft((current) => ({ ...current, title: "", body: "" }));
      setComposing(false);
      setThread(response.data);
      setSelectedId(response.data.id);
      if (filter === "resolved") setFilter("all");
      else void loadThreads();
    } catch (requestError) {
      setError(getApiError(requestError, "Your question wasn't sent."));
    } finally {
      setSending(false);
    }
  };

  const sendReply = async (event: FormEvent) => {
    event.preventDefault();
    if (!thread || !reply.trim()) return;
    setSending(true);
    setError(null);
    try {
      const response = await axios.post<ThreadDetail>(`${API_URL}/threads/${thread.id}/replies`, { body: reply }, { headers: authHeaders() });
      setThread(response.data);
      setReply("");
      void loadThreads();
    } catch (requestError) {
      setError(getApiError(requestError, "Your reply wasn't sent."));
    } finally {
      setSending(false);
    }
  };

  const setResolved = async (isResolved: boolean) => {
    if (!thread) return;
    try {
      const response = await axios.patch<ThreadDetail>(`${API_URL}/threads/${thread.id}`, { is_resolved: isResolved }, { headers: authHeaders() });
      setThread(response.data);
      void loadThreads();
    } catch (requestError) {
      setError(getApiError(requestError, "That change wasn't saved."));
    }
  };

  const deleteThread = async () => {
    if (!thread) return;
    try {
      await axios.delete(`${API_URL}/threads/${thread.id}`, { headers: authHeaders() });
      setSelectedId(null);
      void loadThreads();
    } catch (requestError) {
      setError(getApiError(requestError, "The question wasn't deleted."));
    }
  };

  const showDetail = composing || selectedId !== null;
  const canAsk = !staff && courses.length > 0;

  return (
    <div className="grid min-h-155 overflow-hidden rounded-2xl border border-[#dfe6f0] bg-white shadow-[0_15px_45px_rgba(15,35,65,0.07)] lg:h-[calc(100vh-170px)] lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className={`min-h-0 flex-col border-b border-[#e3e8f0] bg-[#fbfcff] lg:flex lg:border-b-0 lg:border-r ${showDetail ? "hidden" : "flex"}`}>
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-[-0.02em] text-[#12243d]">Course questions</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {staff ? "Questions students sent to the course teachers." : "Ask your teachers anything about the course, any time. Only you and your teachers see it."}
              </p>
            </div>
            {canAsk && (
              <button type="button" onClick={startQuestion} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#0866ef] px-3 text-xs font-bold text-white hover:bg-[#0657cc]">
                <Plus className="h-3.5 w-3.5" /> Ask
              </button>
            )}
          </div>
          <div role="tablist" aria-label="Filter questions" className="mt-4 grid grid-cols-3 rounded-lg bg-slate-100 p-1 text-[11px] font-bold">
            {(["open", "resolved", "all"] as Filter[]).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                onClick={() => setFilter(value)}
                className={`h-8 rounded-md transition ${filter === value ? "bg-white text-[#12243d] shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {value === "open" ? "Open" : value === "resolved" ? "Answered" : "All"}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loadingList ? (
            <div className="space-y-2 p-2">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : threads.length ? (
            threads.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openThread(item.id)}
                className={`mb-1 w-full rounded-xl p-3 text-left transition ${selectedId === item.id ? "bg-[#edf4ff] ring-1 ring-inset ring-[#bcd5fb]" : "hover:bg-slate-50"}`}
              >
                <span className="flex items-start justify-between gap-2">
                  <strong className="line-clamp-2 text-xs leading-5 text-[#263850]">{item.title}</strong>
                  <small className="shrink-0 pt-0.5 text-[10px] text-slate-400">{relativeTime(item.updated_at)}</small>
                </span>
                <span className="mt-1 block truncate text-[11px] font-semibold text-blue-500">
                  {item.course_name}
                  {staff && <span className="font-normal text-slate-400"> · {item.author_name}</span>}
                </span>
                <span className="mt-1 block truncate text-[11px] text-slate-500">{item.last_reply_preview}</span>
                <span className="mt-2 flex items-center gap-2">
                  <StatusPill thread={item} staff={staff} />
                  {item.reply_count > 0 && <span className="text-[10px] text-slate-400">{item.reply_count} repl{item.reply_count === 1 ? "y" : "ies"}</span>}
                </span>
              </button>
            ))
          ) : (
            <div className="px-5 py-12 text-center">
              <MessageCircleQuestion className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-xs font-bold text-slate-600">
                {filter === "open" ? "No open questions" : filter === "resolved" ? "No answered questions yet" : "No questions yet"}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-slate-400">
                {staff
                  ? "When a student asks something outside class, it appears here."
                  : canAsk
                    ? "Stuck on something after class? Ask and your teacher will reply here."
                    : "Once you're enrolled in a course you can ask its teachers questions here."}
              </p>
              {canAsk && (
                <button type="button" onClick={startQuestion} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-[#0866ef] hover:bg-blue-50">
                  <Plus className="h-3.5 w-3.5" /> Ask a question
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      <section className={`min-h-135 min-w-0 flex-col bg-white lg:flex ${showDetail ? "flex" : "hidden"}`}>
        {composing ? (
          <form onSubmit={submitQuestion} className="flex min-h-0 flex-1 flex-col">
            <header className="flex h-17.5 shrink-0 items-center gap-3 border-b border-slate-100 px-4 sm:px-6">
              <button type="button" onClick={() => setComposing(false)} aria-label="Back to questions" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-[#263850]">Ask your teachers</h3>
                <p className="text-[11px] text-slate-400">They&apos;ll get a notification and reply here.</p>
              </div>
            </header>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              <label className="block max-w-2xl">
                <span className="text-xs font-semibold text-slate-600">Course</span>
                <select
                  value={draft.course_id}
                  onChange={(event) => setDraft((current) => ({ ...current, course_id: Number(event.target.value) }))}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                >
                  {courses.map((course) => <option key={course.id} value={course.id}>{course.name} ({course.code})</option>)}
                </select>
              </label>
              <div className="max-w-2xl">
                <div className="flex items-start justify-between gap-3">
                  <label htmlFor="question-title" className="pt-1.5 text-xs font-semibold text-slate-600">Short title</label>
                  <VoiceInput label="question title" onText={(text) => setDraft((current) => ({ ...current, title: appendSpoken(current.title, text).slice(0, 150) }))} />
                </div>
                <input
                  id="question-title"
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  maxLength={150}
                  placeholder="e.g. Why does the current split in a parallel circuit?"
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="max-w-2xl">
                <div className="flex items-start justify-between gap-3">
                  <label htmlFor="question-body" className="pt-1.5 text-xs font-semibold text-slate-600">Your question</label>
                  <VoiceInput label="question" onText={(text) => setDraft((current) => ({ ...current, body: appendSpoken(current.body, text).slice(0, 4000) }))} />
                </div>
                <textarea
                  id="question-body"
                  value={draft.body}
                  onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                  maxLength={4000}
                  rows={7}
                  placeholder="Explain what you tried and where you got stuck. You can also tap Speak and say it."
                  className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            {error && <div className="flex items-center gap-2 border-t border-red-100 bg-red-50 px-4 py-2 text-[11px] text-red-700"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}</div>}
            <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 p-4">
              <button type="button" onClick={() => setComposing(false)} className="h-10 rounded-lg px-4 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={sending} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0866ef] px-4 text-xs font-bold text-white hover:bg-[#0657cc] disabled:bg-slate-300">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send question
              </button>
            </div>
          </form>
        ) : loadingThread && !thread ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#0866ef]" /></div>
        ) : thread ? (
          <>
            <header className="flex min-h-17.5 shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" onClick={() => setSelectedId(null)} aria-label="Back to questions" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-[#263850]">{thread.title}</h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-blue-500">{thread.course_name}</span>
                    {staff && <span>Asked by {thread.author_name}</span>}
                    <StatusPill thread={thread} staff={staff} />
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {thread.is_resolved ? (
                  <button type="button" onClick={() => setResolved(false)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100">
                    <RotateCcw className="h-3.5 w-3.5" /> Reopen
                  </button>
                ) : (
                  <button type="button" onClick={() => setResolved(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark answered
                  </button>
                )}
                {user.is_admin && (confirmDelete ? (
                  <span className="flex items-center gap-1">
                    <button type="button" onClick={deleteThread} className="h-8 rounded-lg bg-red-600 px-2.5 text-[11px] font-bold text-white hover:bg-red-700">Delete</button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="h-8 rounded-lg px-2 text-[11px] font-bold text-slate-500 hover:bg-slate-100">Keep</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Delete question" title="Delete question" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fff_0%,#fbfdff_100%)] p-4 sm:p-6">
              <ol className="mx-auto max-w-3xl space-y-4">
                {thread.replies.map((item) => (
                  <li key={item.id} className={`flex gap-2 ${item.is_mine ? "justify-end" : "justify-start"}`}>
                    {!item.is_mine && (
                      <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${item.is_staff ? "bg-[#0866ef] text-white" : "bg-slate-100 text-slate-500"}`}>
                        {(item.author_name || "U")[0].toUpperCase()}
                      </span>
                    )}
                    <div className={`max-w-[80%] ${item.is_mine ? "text-right" : "text-left"}`}>
                      {!item.is_mine && (
                        <p className="mb-1 text-[10px] font-bold text-slate-400">
                          {item.author_name}
                          {item.is_staff && <span className="ml-1.5 rounded bg-blue-50 px-1 py-px text-[9px] uppercase tracking-wide text-[#0866ef]">Teacher</span>}
                        </p>
                      )}
                      <div className={`whitespace-pre-wrap wrap-break-word rounded-2xl px-4 py-3 text-left text-[13px] leading-6 ${item.is_mine ? "rounded-br-md bg-[#0866ef] text-white" : item.is_staff ? "rounded-bl-md bg-[#eaf2ff] text-[#263850]" : "rounded-bl-md bg-slate-100 text-[#263850]"}`}>
                        {item.body}
                      </div>
                      <p className="mt-1 text-[10px] text-slate-400">{relativeTime(item.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div ref={endRef} />
            </div>
            {error && <div className="flex items-center gap-2 border-t border-red-100 bg-red-50 px-4 py-2 text-[11px] text-red-700"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}</div>}
            {thread.can_reply ? (
              <form onSubmit={sendReply} className="shrink-0 border-t border-slate-100 p-3 sm:p-4">
                <div className="mx-auto max-w-3xl">
                  <div className="mb-1.5 flex justify-end">
                    <VoiceInput label="reply" onText={(text) => setReply((current) => appendSpoken(current, text).slice(0, 4000))} />
                  </div>
                  <div className="flex items-end gap-2 rounded-xl bg-[#eff4fc] p-2">
                    <textarea
                      aria-label="Reply"
                      value={reply}
                      maxLength={4000}
                      onChange={(event) => setReply(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                          event.preventDefault();
                          void sendReply(event);
                        }
                      }}
                      rows={2}
                      placeholder={staff ? "Write your answer..." : "Add a follow-up..."}
                      className="max-h-40 min-h-12 flex-1 resize-y bg-transparent px-2 py-2 text-[13px] leading-5 text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    <button type="submit" disabled={sending || !reply.trim()} aria-label="Send reply" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0866ef] text-white disabled:bg-slate-300">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-center text-[10px] text-slate-400">Ctrl + Enter to send</p>
                </div>
              </form>
            ) : (
              <p className="shrink-0 border-t border-slate-100 p-4 text-center text-[11px] text-slate-400">This question is read-only because your access to the course has ended.</p>
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div>
              <MessageCircleQuestion className="mx-auto h-10 w-10 text-blue-200" />
              <h3 className="mt-4 text-sm font-bold text-slate-700">{threads.length ? "Select a question" : staff ? "Nothing to answer yet" : "Ask your first question"}</h3>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
                {threads.length ? "Choose one from the list to read and reply." : staff ? "Student questions from your courses will show up here." : "Your teachers get a notification and reply here."}
              </p>
              {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
