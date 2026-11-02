"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { AlertCircle, ArrowUpDown, CalendarClock, CheckCircle2, ChevronDown, Clock3, Download, FileCheck2, FileText, Filter, TriangleAlert, Upload } from "lucide-react";
import PortalLayout from "../components/Portal/PortalLayout";
import PortalLoading from "../components/Portal/PortalLoading";
import { usePortalUser } from "../components/Portal/usePortalUser";
import AdminHomework from "../components/Homework/Admin/AdminHomework";
import HomeworkSubmitModal from "../components/Homework/HomeworkSubmitModal";
import { ProtectedFileLink, ProtectedImage } from "../components/Portal/ProtectedFile";
import { API_URL, authHeaders, getAccessToken, getApiError } from "@/lib/portal";

interface CourseOption {
  id: number;
  name: string;
  code: string;
}

interface HomeworkOverview {
  id: number;
  course_id: number;
  course_name: string;
  course_code: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  solution_url?: string | null;
  due_date: string;
  max_score: number;
  status: "assigned" | "overdue" | "submitted" | "graded";
  is_late?: boolean;
  submission_id?: number | null;
  file_url?: string | null;
  submitted_at?: string | null;
  score?: number | null;
  remark?: string | null;
}

type Tab = "assigned" | "submitted" | "graded";

const tabLabels: Record<Tab, string> = { assigned: "Assigned", submitted: "Submitted", graded: "Graded" };

function formatDate(value: string) {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function assignmentIcon(_index: number) {
  return <FileText className="h-4 w-4" />;
}

export default function HomeworkPage() {
  const { user, loading: userLoading } = usePortalUser();
  const [items, setItems] = useState<HomeworkOverview[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [tab, setTab] = useState<Tab>("assigned");
  const [courseFilter, setCourseFilter] = useState<number | "all">("all");
  const [sortNewest, setSortNewest] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedHomework, setSelectedHomework] = useState<HomeworkOverview | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHomework = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const response = await axios.get<{ courses: CourseOption[]; items: HomeworkOverview[] }>(`${API_URL}/homeworks/overview`, { headers: authHeaders(token) });
      setCourses(response.data.courses);
      setItems(response.data.items);
      setError(null);
    } catch (requestError) {
      setError(getApiError(requestError, "We could not load your assignments."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.is_admin || user.is_ta) {
      if (user?.is_admin || user?.is_ta) setLoading(false);
      return;
    }
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "submitted" || requestedTab === "graded") setTab(requestedTab);
    void loadHomework();
  }, [loadHomework, user]);

  const counts = useMemo(() => ({
    assigned: items.filter((item) => item.status === "assigned" || item.status === "overdue").length,
    submitted: items.filter((item) => item.status === "submitted").length,
    graded: items.filter((item) => item.status === "graded").length,
    overdue: items.filter((item) => item.status === "overdue").length,
    upcoming: items.filter((item) => item.status === "assigned").length,
  }), [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((item) => tab === "assigned" ? item.status === "assigned" || item.status === "overdue" : item.status === tab)
      .filter((item) => courseFilter === "all" || item.course_id === courseFilter)
      .filter((item) => !query || `${item.title} ${item.description || ""} ${item.course_name} ${item.course_code}`.toLowerCase().includes(query))
      .sort((a, b) => (new Date(a.due_date).getTime() - new Date(b.due_date).getTime()) * (sortNewest ? -1 : 1));
  }, [courseFilter, items, search, sortNewest, tab]);

  if (userLoading || !user) return <PortalLoading label="Loading assignments..." />;

  if (user.is_ta) {
    return <PortalLayout user={user} wide><div className="rounded-2xl border border-[#e1e7f0] bg-[#f9fbff] p-4 sm:p-6"><AdminHomework isAdmin={false} isTAMode /></div></PortalLayout>;
  }

  if (user.is_admin) {
    return (
      <PortalLayout user={user} wide>
        <div className="rounded-2xl border border-[#e1e7f0] bg-[#f9fbff] p-4 sm:p-6"><AdminHomework isAdmin /></div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout user={user} wide searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search assignments or courses...">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#06182f]">Assignments</h1><p className="mt-1.5 max-w-2xl text-sm leading-5 text-slate-500">Manage coursework, review submissions, and keep track of every deadline.</p></div>
        <div className="flex gap-3">
          <div className="flex min-w-32 items-center gap-3 rounded-xl border border-rose-100 bg-white px-4 py-3 shadow-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500"><TriangleAlert className="h-4 w-4" /></span><span><strong className="block text-lg leading-none text-slate-800">{counts.overdue}</strong><small className="text-[9px] font-bold uppercase text-slate-400">Overdue</small></span></div>
          <div className="flex min-w-32 items-center gap-3 rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#0866ef]"><CalendarClock className="h-4 w-4" /></span><span><strong className="block text-lg leading-none text-slate-800">{counts.upcoming}</strong><small className="text-[9px] font-bold uppercase text-slate-400">Upcoming</small></span></div>
        </div>
      </div>

      {error && <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</div>}

      <div className="mb-5 flex flex-col gap-3 border-b border-[#dfe6f0] sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {(Object.keys(tabLabels) as Tab[]).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`relative px-4 py-3 text-xs font-bold transition ${tab === item ? "text-[#0866ef] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-[#0866ef]" : "text-slate-500 hover:text-slate-800"}`}>{tabLabels[item]} <span className="ml-1 text-[10px] text-slate-400">({counts[item]})</span></button>)}
        </div>
        <div className="flex gap-2 pb-2">
          <label className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-9 min-w-44 rounded-lg border border-[#dce4ef] bg-white pl-8 pr-3 text-[11px] font-semibold text-slate-600 outline-none"><option value="all">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></label>
          <button type="button" onClick={() => setSortNewest((value) => !value)} className="flex h-9 items-center gap-2 rounded-lg border border-[#dce4ef] bg-white px-3 text-[11px] font-semibold text-slate-600"><ArrowUpDown className="h-3.5 w-3.5" /> {sortNewest ? "Newest due" : "Soonest due"}</button>
        </div>
      </div>

      <section className="rounded-2xl border border-blue-100 bg-[#f7faff] p-3 sm:p-4">
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-[72px] animate-pulse rounded-xl bg-white" />)}</div>
        ) : filteredItems.length ? (
          <div className="space-y-2.5">
            {filteredItems.map((homework, index) => (
              <article key={homework.id} className={`rounded-xl border bg-white p-4 shadow-[0_5px_20px_rgba(15,35,65,0.035)] ${homework.status === "overdue" ? "border-rose-200" : "border-[#e2e8f1]"}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${homework.status === "overdue" ? "bg-rose-50 text-rose-500" : homework.status === "graded" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-[#0866ef]"}`}>{assignmentIcon(index)}</span>
                <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold text-[#263850]">{homework.title}</h2><p className="mt-1 truncate text-[10px] font-semibold text-slate-400">{homework.course_name} · {homework.course_code} · Due {formatDate(homework.due_date)}</p>{homework.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{homework.description}</p>}{homework.remark && <p className="mt-1 line-clamp-1 text-[10px] text-slate-500">Feedback: {homework.remark}</p>}</div>
                <div className="flex shrink-0 flex-wrap items-center gap-3 sm:ml-auto">
                  <button type="button" onClick={() => setExpandedId((current) => current === homework.id ? null : homework.id)} aria-expanded={expandedId === homework.id} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">Details <ChevronDown className={`h-3.5 w-3.5 transition ${expandedId === homework.id ? "rotate-180" : ""}`} /></button>
                  <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${homework.status === "overdue" ? "bg-rose-100 text-rose-700" : homework.status === "graded" ? "bg-emerald-100 text-emerald-700" : homework.status === "submitted" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-600"}`}>{homework.status === "graded" ? `${homework.score}/${homework.max_score}` : homework.status === "submitted" && homework.is_late ? "submitted late" : homework.status}</span>
                  {(homework.status === "assigned" || homework.status === "overdue") && <button type="button" onClick={() => setSelectedHomework(homework)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0866ef] px-4 text-xs font-bold text-white hover:bg-[#075bda]"><Upload className="h-3.5 w-3.5" /> Submit</button>}
                  {homework.status === "submitted" && homework.file_url && <ProtectedFileLink fileUrl={homework.file_url} className="inline-flex h-9 items-center gap-2 rounded-lg border border-blue-200 px-4 text-xs font-bold text-[#0866ef] hover:bg-blue-50"><Clock3 className="h-3.5 w-3.5" /> View submission</ProtectedFileLink>}
                  {homework.status === "graded" && <Link href="/results" className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 px-4 text-xs font-bold text-emerald-700 hover:bg-emerald-50"><CheckCircle2 className="h-3.5 w-3.5" /> View result</Link>}
                </div>
                </div>
                {expandedId === homework.id && (
                  <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Instructions</h3>
                      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{homework.description || "No written instructions were provided."}</p>
                    </div>
                    {homework.image_url && (
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Question image</h3>
                          <ProtectedFileLink fileUrl={homework.image_url} mode="download" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0866ef] hover:underline"><Download className="h-3.5 w-3.5" /> Download</ProtectedFileLink>
                        </div>
                        <div className="mt-2 flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <ProtectedImage fileUrl={homework.image_url} alt={`Question image for ${homework.title}`} className="max-h-[480px] max-w-full rounded object-contain" />
                        </div>
                      </div>
                    )}
                    {homework.solution_url && (
                      <ProtectedFileLink fileUrl={homework.solution_url} mode="download" className="inline-flex h-9 items-center gap-2 rounded-lg border border-purple-200 px-4 text-xs font-bold text-purple-700 hover:bg-purple-50"><Download className="h-3.5 w-3.5" /> Download solution</ProtectedFileLink>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center"><FileCheck2 className="mx-auto h-9 w-9 text-blue-300" /><h2 className="mt-3 text-sm font-bold text-slate-700">No {tabLabels[tab].toLowerCase()} assignments</h2><p className="mt-1 text-xs text-slate-500">Try another course, or check back when new coursework is posted.</p></div>
        )}
      </section>

      {selectedHomework && <HomeworkSubmitModal homework={selectedHomework} isOpen onClose={() => setSelectedHomework(null)} onSuccess={() => { setSelectedHomework(null); void loadHomework(); }} />}
    </PortalLayout>
  );
}
