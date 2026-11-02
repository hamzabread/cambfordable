"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { AlertCircle, ArrowLeft, CalendarDays, FileDown } from "lucide-react";
import PastClassAttachment from "../../components/Schedule/PastClassAttachment";
import ClassRecap, { DeleteClassButton } from "../../components/Schedule/ClassRecap";
import PortalLayout from "../../components/Portal/PortalLayout";
import PortalLoading from "../../components/Portal/PortalLoading";
import { usePortalUser } from "../../components/Portal/usePortalUser";
import { API_URL, authHeaders, CourseCatalogItem, getAccessToken, getApiError, LiveClass } from "@/lib/portal";

function formatDate(value: string) {
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PastClassesPage() {
  const { user, loading: userLoading } = usePortalUser();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [courseFilter, setCourseFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const requestedCourse = Number(new URLSearchParams(window.location.search).get("course"));
    if (requestedCourse) setCourseFilter(requestedCourse);
    const load = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const [classesResponse, coursesResponse] = await Promise.all([
          axios.get<LiveClass[]>(`${API_URL}${user.is_admin ? "/live-classes/" : "/live-classes/me"}`, { headers: authHeaders(token) }),
          axios.get<CourseCatalogItem[]>(`${API_URL}/courses/catalog`, { headers: authHeaders(token) }),
        ]);
        setClasses(classesResponse.data);
        setCourses(user.is_admin ? coursesResponse.data : coursesResponse.data.filter((course) => course.enrollment_status === "enrolled"));
      } catch (requestError) {
        setError(getApiError(requestError, "We could not load past classes."));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [user]);

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const filtered = useMemo(() => {
    const now = new Date();
    const query = search.trim().toLowerCase();
    return classes
      .filter((item) => new Date(item.ends_at) < now)
      .filter((item) => courseFilter === "all" || item.course_id === courseFilter)
      .filter((item) => !query || `${item.title} ${courseMap.get(item.course_id)?.name || ""} ${courseMap.get(item.course_id)?.code || ""}`.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  }, [classes, courseFilter, courseMap, search]);

  if (userLoading || !user) return <PortalLoading label="Loading past classes..." />;

  const updateClass = (id: number, update: Partial<LiveClass>) =>
    setClasses((current) => current.map((item) => (item.id === id ? { ...item, ...update } : item)));
  const removeClass = (id: number) => setClasses((current) => current.filter((item) => item.id !== id));

  return (
    <PortalLayout user={user} wide searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search past classes...">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><Link href="/schedule" className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-[#0866ef]"><ArrowLeft className="h-3.5 w-3.5" /> Back to schedule</Link><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#06182f]">Past Classes</h1><p className="mt-1.5 text-sm text-slate-500">Watch recordings, check attendance and download posted material.</p></div>
        <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-10 min-w-56 rounded-lg border border-[#dce4ef] bg-white px-3 text-xs font-semibold text-slate-600 outline-none"><option value="all">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select>
      </div>
      {error && <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</div>}
      {loading ? <div className="grid gap-3 md:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div> : filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const course = courseMap.get(item.course_id);
            return (
              <article key={item.id} className="rounded-xl border border-[#e2e8f1] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.045)]">
                <div className="flex items-start justify-between gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0866ef]"><CalendarDays className="h-5 w-5" /></span>{item.attachment_url && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase text-emerald-700">Material posted</span>}</div>
                <h2 className="mt-4 text-sm font-bold text-[#263850]">{item.title}</h2><p className="mt-1 text-[10px] font-semibold text-slate-400">{course?.code || "Course"} · {course?.name || "Enrolled course"}</p><p className="mt-3 text-[11px] text-slate-500">{formatDate(item.starts_at)}</p>
                <ClassRecap item={item} staff={user.is_admin || user.is_ta} onChange={updateClass} />
                <div className="mt-4 border-t border-slate-100 pt-3">{item.attachment_url ? <p className="mb-2 flex items-center gap-2 text-[10px] font-bold text-emerald-700"><FileDown className="h-3.5 w-3.5" /> Class material available</p> : <p className="mb-2 text-[10px] font-semibold text-slate-400">No material posted</p>}<PastClassAttachment classId={item.id} className={item.title} isAdmin={user.is_admin} existingAttachmentUrl={item.attachment_url} />{user.is_admin && <div className="mt-2 flex justify-end"><DeleteClassButton item={item} onDeleted={removeClass} /></div>}</div>
              </article>
            );
          })}
        </div>
      ) : <div className="rounded-xl border border-dashed border-blue-200 bg-white px-6 py-16 text-center"><CalendarDays className="mx-auto h-9 w-9 text-blue-300" /><h2 className="mt-3 text-sm font-bold text-slate-700">No past classes match</h2><p className="mt-1 text-xs text-slate-500">Try another course or search phrase.</p></div>}
    </PortalLayout>
  );
}
