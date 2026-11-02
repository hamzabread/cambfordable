"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  ExternalLink,
  FileDown,
  Link2,
  MessageCircle,
  Video,
  X,
} from "lucide-react";
import PastClassAttachment from "../components/Schedule/PastClassAttachment";
import ClassRecap, { DeleteClassButton } from "../components/Schedule/ClassRecap";
import PortalLayout from "../components/Portal/PortalLayout";
import PortalLoading from "../components/Portal/PortalLoading";
import { usePortalUser } from "../components/Portal/usePortalUser";
import {
  API_URL,
  authHeaders,
  CourseCatalogItem,
  getAccessToken,
  isUnauthorized,
  LiveClass,
} from "@/lib/portal";

type ViewMode = "today" | "week" | "month";

interface CreatedLiveClassState {
  id: number;
  title: string;
  courseName: string;
}

const CREATED_LIVE_CLASS_KEY = "created_live_class_state";

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function CalendarCard() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];

  return (
    <section className="rounded-xl border border-[#e4eaf2] bg-white p-4 shadow-[0_8px_30px_rgba(15,35,65,0.045)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#263850]">{today.toLocaleDateString([], { month: "long", year: "numeric" })}</h2>
        <CalendarDays className="h-4 w-4 text-[#4384ee]" />
      </div>
      <div className="grid grid-cols-7 gap-y-2 text-center text-[10px]">
        {['S','M','T','W','T','F','S'].map((day, index) => <span key={`${day}-${index}`} className="font-bold text-slate-400">{day}</span>)}
        {cells.map((day, index) => (
          <span key={index} className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full font-semibold ${day === today.getDate() ? "bg-[#0866ef] text-white" : day ? "text-slate-600" : ""}`}>{day}</span>
        ))}
      </div>
    </section>
  );
}

export default function SchedulePage() {
  const { user, loading: userLoading } = usePortalUser();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [courseFilter, setCourseFilter] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAttachmentModal, setOpenAttachmentModal] = useState<number | null>(null);
  const [savedAdminClass, setSavedAdminClass] = useState<CreatedLiveClassState | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchSchedule = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const [classesResponse, catalogResponse] = await Promise.all([
          axios.get<LiveClass[]>(`${API_URL}${user.is_admin ? "/live-classes/" : "/live-classes/me"}`, { headers: authHeaders(token) }),
          axios.get<CourseCatalogItem[]>(`${API_URL}/courses/catalog`, { headers: authHeaders(token) }),
        ]);
        setClasses(classesResponse.data);
        setCourses(user.is_admin ? catalogResponse.data : catalogResponse.data.filter((course) => course.enrollment_status === "enrolled"));
        setError(null);
      } catch (requestError) {
        if (!isUnauthorized(requestError)) setError("We could not load your class schedule. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    void fetchSchedule();
  }, [user]);

  useEffect(() => {
    if (!user?.is_admin) return;
    const saved = localStorage.getItem(CREATED_LIVE_CLASS_KEY);
    if (!saved) return;
    try {
      setSavedAdminClass(JSON.parse(saved));
    } catch {
      localStorage.removeItem(CREATED_LIVE_CLASS_KEY);
    }
  }, [user]);

  const courseName = (courseId: number) => courses.find((course) => course.id === courseId)?.name || "Course";
  const courseCode = (courseId: number) => courses.find((course) => course.id === courseId)?.code || "";

  const filtered = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    if (viewMode === "today") end.setHours(23, 59, 59, 999);
    if (viewMode === "week") end.setDate(now.getDate() + 7);
    if (viewMode === "month") {
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    return classes
      .filter((item) => courseFilter === "all" || item.course_id === courseFilter)
      .filter((item) => {
        const start = new Date(item.starts_at);
        const classEnd = new Date(item.ends_at);
        if (classEnd >= now && start <= end) return viewMode !== "today" || sameDay(start, now) || start < now;
        return false;
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [classes, courseFilter, viewMode]);

  const pastClasses = useMemo(() => {
    const now = new Date();
    return classes
      .filter((item) => new Date(item.ends_at) < now)
      .filter((item) => courseFilter === "all" || item.course_id === courseFilter)
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  }, [classes, courseFilter]);

  if (userLoading || !user) return <PortalLoading label="Loading class schedule..." />;

  const updateClass = (id: number, update: Partial<LiveClass>) =>
    setClasses((current) => current.map((item) => (item.id === id ? { ...item, ...update } : item)));
  const removeClass = (id: number) => setClasses((current) => current.filter((item) => item.id !== id));
  const staff = user.is_admin || user.is_ta;

  const now = new Date();
  const viewTitle = viewMode === "today" ? "Today’s Classes" : viewMode === "week" ? "Next 7 Days" : "This Month";

  return (
    <PortalLayout user={user}>
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#06182f]">Class Schedule</h1>
          <p className="mt-1.5 text-sm text-slate-500">Manage your upcoming lectures and review past class materials.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value === "all" ? "all" : Number(event.target.value))} className="h-9 rounded-lg border border-[#dce4ef] bg-white px-3 text-xs font-semibold text-slate-600 outline-none focus:border-blue-300">
              <option value="all">All courses</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
          <div className="inline-flex rounded-lg border border-[#dce4ef] bg-[#f2f5fa] p-1">
            {(["today", "week", "month"] as ViewMode[]).map((mode) => (
              <button key={mode} type="button" onClick={() => setViewMode(mode)} className={`rounded-md px-3.5 py-1.5 text-xs font-bold capitalize transition ${viewMode === mode ? "bg-white text-[#0866ef] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{mode}</button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><AlertCircle className="h-4 w-4" />{error}</div>
      )}

      {savedAdminClass && (
        <div className="mb-5 flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#0866ef]">Admin quick access</p><p className="mt-1 text-sm font-bold text-slate-800">{savedAdminClass.title}</p><p className="text-xs text-slate-500">{savedAdminClass.courseName}</p></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Join my live class: ${savedAdminClass.title}\n${window.location.origin}/meeting/${savedAdminClass.id}`)}`, "_blank", "noopener,noreferrer")} className="flex h-9 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-xs font-bold text-slate-700"><MessageCircle className="h-4 w-4" /> Share</button>
            <button type="button" onClick={() => window.open(`/meeting/${savedAdminClass.id}`, "_blank", "noopener,noreferrer")} className="flex h-9 items-center gap-2 rounded-lg bg-[#0866ef] px-3 text-xs font-bold text-white"><ExternalLink className="h-4 w-4" /> Open class</button>
            <button type="button" aria-label="Clear quick access" onClick={() => { localStorage.removeItem(CREATED_LIVE_CLASS_KEY); setSavedAdminClass(null); }} className="rounded-lg p-2 text-slate-400 hover:bg-white"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <h2 className="mb-4 text-lg font-bold text-[#071a32]">{viewTitle}</h2>
          {loading ? (
            <div className="space-y-3">{[0,1,2].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div>
          ) : filtered.length ? (
            <div className="space-y-3">
              {filtered.map((item) => {
                const start = new Date(item.starts_at);
                const end = new Date(item.ends_at);
                const live = start <= now && end >= now;
                return (
                  <article key={item.id} className={`rounded-xl border bg-white shadow-[0_8px_30px_rgba(15,35,65,0.045)] ${live ? "border-[#bcd5fb] bg-[#f7fbff] ring-1 ring-[#dbe8fd] p-5" : "border-[#e4eaf2] p-4"}`}>
                    {live ? (
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e9f4ff] px-2.5 py-1 text-[10px] font-bold text-[#2879df]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0866ef]" /> Happening now</span>
                          <h3 className="mt-3 text-sm font-bold text-[#23354e]">{item.title}</h3>
                          <p className="mt-1 text-xs font-medium text-slate-500">{courseCode(item.course_id)} · {courseName(item.course_id)}</p>
                          <button type="button" onClick={() => window.open(`/meeting/${item.id}`, "_blank", "noopener,noreferrer")} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-[#0866ef] px-4 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-[#075bda]"><Video className="h-4 w-4" /> Join live lecture</button>
                        </div>
                        <div className="sm:text-right"><p className="text-xl font-bold text-[#1d68d5]">{formatTime(item.starts_at)}</p><p className="mt-1 text-[10px] font-medium text-slate-500">Ends at {formatTime(item.ends_at)}</p></div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-0">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#edf3fc] text-slate-500"><BookOpen className="h-5 w-5" /></span>
                        <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-bold text-[#263850]">{item.title}</h3><p className="mt-1 truncate text-[10px] font-medium text-slate-500">{courseCode(item.course_id)} · {courseName(item.course_id)}</p></div>
                        <div className="shrink-0 text-right"><p className="text-sm font-bold text-slate-700">{formatTime(item.starts_at)}</p><p className="text-[10px] text-slate-400">{formatDate(item.starts_at)}</p></div>
                        {user.is_admin && <DeleteClassButton item={item} onDeleted={removeClass} compact />}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-blue-200 bg-white px-6 py-14 text-center"><CalendarDays className="mx-auto h-9 w-9 text-blue-300" /><h3 className="mt-3 text-sm font-bold text-slate-700">No classes in this view</h3><p className="mt-1 text-xs text-slate-500">Try another time range or check back after a class is scheduled.</p></div>
          )}

          <section className="mt-8">
            <h2 className="mb-4 text-lg font-bold text-[#071a32]">Past Classes</h2>
            {pastClasses.length ? (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {pastClasses.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#e4eaf2] bg-white p-4 shadow-[0_8px_30px_rgba(15,35,65,0.045)]">
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-xs font-bold text-slate-700">{item.title}</h3><p className="mt-0.5 text-[10px] text-slate-400">{formatDate(item.starts_at)}, {formatTime(item.starts_at)}</p></div>{item.attachment_url && <span className="rounded bg-emerald-50 px-1.5 py-1 text-[8px] font-bold uppercase text-emerald-600">Material</span>}</div>
                    <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-[#397ee8]">
                      {item.attachment_url ? <span className="flex items-center gap-1"><FileDown className="h-3 w-3" /> Material below</span> : <span className="text-slate-400">No material posted</span>}
                    </div>
                    <ClassRecap item={item} staff={staff} onChange={updateClass} />
                    <PastClassAttachment classId={item.id} className={item.title} isAdmin={user.is_admin} existingAttachmentUrl={item.attachment_url} onModalStateChange={setOpenAttachmentModal} />
                    {user.is_admin && <div className="mt-2 flex justify-end"><DeleteClassButton item={item} onDeleted={removeClass} /></div>}
                  </div>
                ))}
              </div>
            ) : <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">No past classes yet.</p>}
            {pastClasses.length > 6 && <Link href={courseFilter === "all" ? "/schedule/past" : `/schedule/past?course=${courseFilter}`} className="mt-4 flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-white text-xs font-bold text-[#0866ef] hover:bg-blue-50">View all past classes ({pastClasses.length})</Link>}
          </section>
        </div>

        <aside className="space-y-5">
          <CalendarCard />
          <Link href="/contact" className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-[#397ee8] hover:bg-blue-100"><Link2 className="h-4 w-4" /> Report a schedule issue</Link>
        </aside>
      </div>

      {openAttachmentModal !== null && <div className="fixed inset-0 z-[60] bg-black/60" />}
    </PortalLayout>
  );
}
