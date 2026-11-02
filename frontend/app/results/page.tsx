"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { AlertCircle, BarChart3, BookOpenCheck, ChevronRight, FileCheck2, GraduationCap, TrendingUp } from "lucide-react";
import PortalLayout from "../components/Portal/PortalLayout";
import PortalLoading from "../components/Portal/PortalLoading";
import { usePortalUser } from "../components/Portal/usePortalUser";
import { API_URL, authHeaders, getAccessToken, getApiError } from "@/lib/portal";

interface CourseOption { id: number; name: string; code: string }
interface ResultItem {
  id: string;
  type: "quiz" | "assignment";
  title: string;
  course_id: number;
  course_name: string;
  course_code: string;
  score: number;
  total_marks: number;
  percentage: number;
  graded_at: string;
  feedback?: string | null;
  href: string;
}
interface ResultsResponse {
  courses: CourseOption[];
  summary: { average_percentage: number | null; letter_grade: string; graded_items: number; courses_with_results: number; academic_standing: string };
  items: ResultItem[];
  trend: { label: string; percentage: number }[];
}

const emptyResults: ResultsResponse = { courses: [], summary: { average_percentage: null, letter_grade: "—", graded_items: 0, courses_with_results: 0, academic_standing: "Not provided" }, items: [], trend: [] };

function Sparkline({ values }: { values: number[] }) {
  if (!values.length) return <div className="flex h-24 items-center justify-center rounded-lg bg-slate-50 text-[11px] text-slate-400">No graded work yet</div>;
  const padded = values.length === 1 ? [values[0], values[0]] : values;
  const points = padded.map((value, index) => `${(index / (padded.length - 1)) * 220},${92 - (Math.max(0, Math.min(100, value)) / 100) * 78}`).join(" ");
  return <svg viewBox="0 0 220 100" role="img" aria-label="Performance trend" className="h-24 w-full overflow-visible"><path d="M0 92 H220" stroke="#dce7f7" strokeWidth="1" /><polyline points={points} fill="none" stroke="#0866ef" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><polyline points={`0,92 ${points} 220,92`} fill="#dceaff" opacity="0.65" /></svg>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function ResultsPage() {
  const { user, loading: userLoading } = usePortalUser();
  const [data, setData] = useState<ResultsResponse>(emptyResults);
  const [courseFilter, setCourseFilter] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get<ResultsResponse>(`${API_URL}/results/me`, {
        headers: authHeaders(token),
        params: courseFilter === "all" ? {} : { course_id: courseFilter },
      });
      setData(response.data);
      setError(null);
    } catch (requestError) {
      setError(getApiError(requestError, "We could not load your academic results."));
    } finally {
      setLoading(false);
    }
  }, [courseFilter]);

  useEffect(() => { if (user) void loadResults(); }, [loadResults, user]);

  if (userLoading || !user) return <PortalLoading label="Loading academic results..." />;
  const average = data.summary.average_percentage;

  return (
    <PortalLayout user={user} wide>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#06182f]">Results & Performance</h1><p className="mt-1.5 text-sm text-slate-500">A course-by-course overview built from your graded quizzes and assignments.</p></div>
        <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-10 min-w-56 rounded-lg border border-[#dce4ef] bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-blue-300"><option value="all">All courses</option>{data.courses.map((course) => <option key={course.id} value={course.id}>{course.name} ({course.code})</option>)}</select>
      </div>

      {error && <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</div>}

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-[#e2e8f1] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.045)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall grade</p>
          <div className="mt-4 flex items-center justify-center"><div className="relative flex h-28 w-28 items-center justify-center rounded-full" style={{ background: `conic-gradient(#0866ef ${(average || 0) * 3.6}deg, #e8eef7 0deg)` }}><div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-white"><strong className="text-3xl text-[#10233d]">{data.summary.letter_grade}</strong><span className="text-[10px] font-bold text-[#0866ef]">{average === null ? "No grade" : `${average}%`}</span></div></div></div>
          <p className="mt-4 text-center text-[11px] font-medium text-slate-500">Based on {data.summary.graded_items} graded item{data.summary.graded_items === 1 ? "" : "s"}</p>
        </section>

        <section className="rounded-2xl border border-[#e2e8f1] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.045)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic standing</p>
          <div className="mt-5 flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0866ef]"><GraduationCap className="h-5 w-5" /></span><div><strong className="block text-xl text-[#10233d]">{data.summary.academic_standing}</strong><span className="text-[11px] text-slate-500">Profile academic status</span></div></div>
          <div className="mt-8"><div className="flex justify-between text-[10px] font-semibold text-slate-500"><span>Courses with results</span><span>{data.summary.courses_with_results}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e4ebf5]"><div className="h-full rounded-full bg-[#0866ef]" style={{ width: `${data.courses.length ? Math.min(100, (data.summary.courses_with_results / data.courses.length) * 100) : 0}%` }} /></div></div>
        </section>

        <section className="rounded-2xl border border-[#e2e8f1] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.045)]">
          <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Performance trend</p><TrendingUp className="h-4 w-4 text-[#0866ef]" /></div>
          <div className="mt-4"><Sparkline values={data.trend.map((point) => point.percentage)} /></div>
          <p className="mt-2 text-[11px] text-slate-500">Oldest to newest graded work</p>
        </section>
      </div>

      <section className="rounded-2xl border border-[#e2e8f1] bg-white p-4 shadow-[0_8px_30px_rgba(15,35,65,0.045)] sm:p-5">
        <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold text-[#20334d]">Recent Results</h2><p className="mt-0.5 text-[11px] text-slate-500">Every score shown uses the assessment&apos;s configured maximum.</p></div><BarChart3 className="h-5 w-5 text-blue-400" /></div>
        {loading ? <div className="space-y-2">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div> : data.items.length ? (
          <div className="divide-y divide-slate-100">
            {data.items.map((item) => {
              const Icon = item.type === "quiz" ? BookOpenCheck : FileCheck2;
              return <Link key={item.id} href={item.href} className="group flex items-center gap-3 rounded-xl px-2 py-3.5 hover:bg-slate-50"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-[#0866ef]"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#263850]">{item.title}</strong><span className="mt-1 block truncate text-[9px] font-bold uppercase tracking-wide text-slate-400">{item.type} · {item.course_code} · {formatDate(item.graded_at)}</span></span><span className="shrink-0 text-right"><strong className="text-lg text-[#263850]">{item.score}<span className="text-[10px] text-slate-400">/{item.total_marks}</span></strong><small className="block text-[9px] font-bold text-[#0866ef]">{item.percentage}%</small></span><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0866ef]" /></Link>;
            })}
          </div>
        ) : <div className="px-6 py-14 text-center"><GraduationCap className="mx-auto h-9 w-9 text-blue-300" /><h3 className="mt-3 text-sm font-bold text-slate-700">No graded results yet</h3><p className="mt-1 text-xs text-slate-500">Results will appear here after an instructor grades your work.</p></div>}
      </section>
    </PortalLayout>
  );
}
