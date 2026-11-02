"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { AlertCircle, BarChart3, BookOpenCheck, CalendarClock, CheckCircle2, Clock3, FileCheck2, Play, SlidersHorizontal } from "lucide-react";
import PortalLayout from "../components/Portal/PortalLayout";
import PortalLoading from "../components/Portal/PortalLoading";
import { usePortalUser } from "../components/Portal/usePortalUser";
import CreateQuizForm from "../components/Quizzes/CreateQuizForm";
import QuizSubmissionsGrading from "../components/Quizzes/QuizSubmissionsGrading";
import { API_URL, authHeaders, getAccessToken, getApiError } from "@/lib/portal";

interface CourseOption {
  id: number;
  name: string;
  code: string;
}

interface QuizOverview {
  id: number;
  title: string;
  course_id: number;
  course_name: string;
  course_code: string;
  total_marks: number;
  duration_minutes: number;
  deadline?: string | null;
  allow_late: boolean;
  status: "available" | "submitted" | "graded" | "closed";
  score?: number | null;
  submitted_at?: string | null;
  remarks?: string | null;
}

type StudentFilter = "available" | "submitted" | "closed";
type AdminTab = "create" | "grade";

const statusConfig = {
  available: { label: "Available", classes: "bg-blue-50 text-blue-700", border: "border-[#cfe0fb]" },
  submitted: { label: "Submitted", classes: "bg-slate-100 text-slate-600", border: "border-[#e2e8f1]" },
  graded: { label: "Graded", classes: "bg-emerald-50 text-emerald-700", border: "border-emerald-200" },
  closed: { label: "Closed", classes: "bg-rose-50 text-rose-700", border: "border-rose-200" },
};

function dateTime(value?: string | null) {
  if (!value) return "No deadline";
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function QuizzesPage() {
  const { user, loading: userLoading } = usePortalUser();
  const [items, setItems] = useState<QuizOverview[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseFilter, setCourseFilter] = useState<number | "all">("all");
  const [statusFilters, setStatusFilters] = useState<Set<StudentFilter>>(new Set(["available", "submitted"]));
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<AdminTab>("create");

  useEffect(() => {
    if (!user || user.is_admin || user.is_ta) {
      if (user?.is_admin || user?.is_ta) setLoading(false);
      return;
    }
    const load = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const response = await axios.get<{ courses: CourseOption[]; items: QuizOverview[] }>(`${API_URL}/quizzes/me`, { headers: authHeaders(token) });
        setCourses(response.data.courses);
        setItems(response.data.items);
        setError(null);
      } catch (requestError) {
        setError(getApiError(requestError, "We could not load your quizzes."));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const counts = useMemo(() => ({
    available: items.filter((item) => item.status === "available").length,
    submitted: items.filter((item) => item.status === "submitted" || item.status === "graded").length,
    closed: items.filter((item) => item.status === "closed").length,
  }), [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const filterStatus: StudentFilter = item.status === "graded" ? "submitted" : item.status;
      return statusFilters.has(filterStatus)
        && (courseFilter === "all" || item.course_id === courseFilter)
        && (!query || `${item.title} ${item.course_name} ${item.course_code}`.toLowerCase().includes(query));
    });
  }, [courseFilter, items, search, statusFilters]);

  const toggleStatus = (status: StudentFilter) => {
    setStatusFilters((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  if (userLoading || !user) return <PortalLoading label="Loading quizzes..." />;

  if (user.is_ta) {
    return <PortalLayout user={user} wide><div className="mb-6"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0866ef]">Teaching assistant</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-[#06182f]">Quiz Submissions</h1><p className="mt-1.5 text-sm text-slate-500">Select an assessment from one of your assigned courses to review and grade.</p></div><div className="rounded-2xl border border-[#e1e7f0] bg-[#f9fbff] p-4 sm:p-6"><QuizSubmissionsGrading isTAMode /></div></PortalLayout>;
  }

  if (user.is_admin) {
    return (
      <PortalLayout user={user} wide>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0866ef]">Assessment workspace</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-[#06182f]">Quiz Management</h1><p className="mt-1.5 text-sm text-slate-500">Create assessments and review student submissions from one workspace.</p></div>
          <div className="inline-flex self-start rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button type="button" onClick={() => setAdminTab("create")} className={`flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-bold ${adminTab === "create" ? "bg-[#0866ef] text-white" : "text-slate-500"}`}><BookOpenCheck className="h-4 w-4" /> Create quiz</button>
            <button type="button" onClick={() => setAdminTab("grade")} className={`flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-bold ${adminTab === "grade" ? "bg-[#0866ef] text-white" : "text-slate-500"}`}><BarChart3 className="h-4 w-4" /> Grade submissions</button>
          </div>
        </div>
        <div className="rounded-2xl border border-[#e1e7f0] bg-[#f9fbff] p-4 sm:p-6">{adminTab === "create" ? <CreateQuizForm /> : <QuizSubmissionsGrading />}</div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout user={user} wide searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search quizzes or courses...">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#06182f]">Quizzes & Assessments</h1><p className="mt-1.5 text-sm text-slate-500">Manage upcoming assessments and review your submitted results.</p></div>
        <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-10 min-w-52 rounded-lg border border-[#dce4ef] bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-blue-300">
          <option value="all">All courses</option>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.name} ({course.code})</option>)}
        </select>
      </div>

      {error && <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</div>}

      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="self-start rounded-xl border border-[#e2e8f1] bg-white p-4 shadow-[0_8px_30px_rgba(15,35,65,0.045)] lg:sticky lg:top-4">
          <div className="mb-4 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-[#0866ef]" /><h2 className="text-sm font-bold text-slate-800">Filter</h2></div>
          <div className="space-y-2">
            {(["available", "submitted", "closed"] as StudentFilter[]).map((status) => (
              <label key={status} className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                <span className="flex items-center gap-2 text-xs font-semibold capitalize text-slate-600"><input type="checkbox" checked={statusFilters.has(status)} onChange={() => toggleStatus(status)} className="h-3.5 w-3.5 accent-[#0866ef]" />{status}</span>
                <span className="text-[10px] font-bold text-slate-400">{counts[status]}</span>
              </label>
            ))}
          </div>
          <Link href="/results" className="mt-5 flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-50 text-xs font-bold text-[#0866ef] hover:bg-blue-100"><BarChart3 className="h-4 w-4" /> View all results</Link>
        </aside>

        <section className="min-w-0">
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div>
          ) : filteredItems.length ? (
            <div className="space-y-3">
              {filteredItems.map((quiz) => {
                const config = statusConfig[quiz.status];
                return (
                  <article key={quiz.id} className={`rounded-xl border ${config.border} bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.045)]`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${config.classes}`}>{config.label}</span>
                        <h2 className="mt-2 text-base font-bold text-[#263850]">{quiz.title}</h2>
                        <p className="mt-1 text-[11px] font-semibold text-slate-400">{quiz.course_code} · {quiz.course_name}</p>
                      </div>
                      <div className="shrink-0 text-left sm:text-right"><p className="text-xl font-bold text-[#263850]">{quiz.status === "graded" ? quiz.score : quiz.total_marks}<span className="text-[10px] font-semibold text-slate-400">/{quiz.status === "graded" ? quiz.total_marks : " marks"}</span></p><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{quiz.status === "graded" ? "Score achieved" : "Total marks"}</p></div>
                    </div>
                    <div className="mt-4 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
                      <p className="flex items-center gap-2 text-[11px] font-medium text-slate-500"><Clock3 className="h-3.5 w-3.5" />{quiz.duration_minutes} minutes</p>
                      <p className="flex items-center gap-2 text-[11px] font-medium text-slate-500"><CalendarClock className="h-3.5 w-3.5" />{quiz.status === "submitted" || quiz.status === "graded" ? `Submitted ${dateTime(quiz.submitted_at)}` : `Due ${dateTime(quiz.deadline)}`}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-end">
                      {quiz.status === "available" && <Link href={`/quiz/${quiz.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0866ef] px-4 text-xs font-bold text-white hover:bg-[#075bda]"><Play className="h-3.5 w-3.5" /> Start quiz</Link>}
                      {quiz.status === "submitted" && <Link href={`/quiz/${quiz.id}/grades`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-300 px-4 text-xs font-bold text-[#0866ef] hover:bg-blue-50"><FileCheck2 className="h-3.5 w-3.5" /> View submission</Link>}
                      {quiz.status === "graded" && <Link href={`/quiz/${quiz.id}/grades`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 px-4 text-xs font-bold text-emerald-700 hover:bg-emerald-50"><CheckCircle2 className="h-3.5 w-3.5" /> View feedback</Link>}
                      {quiz.status === "closed" && <span className="text-[11px] font-semibold text-slate-400">Closed {dateTime(quiz.deadline)}</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-blue-200 bg-white px-6 py-16 text-center"><BookOpenCheck className="mx-auto h-9 w-9 text-blue-300" /><h2 className="mt-3 text-sm font-bold text-slate-700">No quizzes match these filters</h2><p className="mt-1 text-xs text-slate-500">Try another course or assessment status.</p></div>
          )}
        </section>
      </div>
    </PortalLayout>
  );
}
