"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  FileText,
  GraduationCap,
  MessagesSquare,
} from "lucide-react";
import AdminPanel from "../components/Admin/AdminPanel";
import TAPanel from "../components/TA/TAPanel";
import PortalLayout from "../components/Portal/PortalLayout";
import PortalLoading from "../components/Portal/PortalLoading";
import { usePortalUser } from "../components/Portal/usePortalUser";
import {
  API_URL,
  authHeaders,
  clampProgress,
  CourseCatalogItem,
  getAccessToken,
  isUnauthorized,
  LiveClass,
} from "@/lib/portal";

interface HomeworkOverviewItem {
  id: number;
  course_id: number;
  course_code: string;
  title: string;
  due_date: string;
  status: "assigned" | "overdue" | "submitted" | "graded";
}

interface TimelineItem {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  type: "class" | "assignment";
}

const quickLinks = [
  { label: "Class schedule", href: "/schedule", icon: CalendarDays },
  { label: "Assignments", href: "/homework", icon: FileText },
  { label: "Quizzes", href: "/quizzes", icon: BookOpenCheck },
  { label: "Contact admissions", href: "/contact", icon: MessagesSquare },
];

function formatTimelineDate(date: Date) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isSameDay(date, now)) return `Today, ${time}`;
  if (isSameDay(date, tomorrow)) return `Tomorrow, ${time}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

export default function DashboardPage() {
  const { user, loading: userLoading, error: userError } = usePortalUser();
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [homeworks, setHomeworks] = useState<HomeworkOverviewItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.is_admin || user.is_ta) {
      if (user) setDataLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const [catalogResponse, classesResponse, homeworkResponse] = await Promise.all([
          axios.get<CourseCatalogItem[]>(`${API_URL}/courses/catalog`, {
            headers: authHeaders(token),
          }),
          axios.get<LiveClass[]>(`${API_URL}/live-classes/me`, {
            headers: authHeaders(token),
          }),
          axios.get<{ items: HomeworkOverviewItem[] }>(`${API_URL}/homeworks/overview`, {
            headers: authHeaders(token),
          }),
        ]);
        setCourses(
          catalogResponse.data.filter((course) => course.enrollment_status === "enrolled"),
        );
        setClasses(classesResponse.data);
        setHomeworks(homeworkResponse.data.items);
        setDataError(null);
      } catch (error) {
        if (!isUnauthorized(error)) {
          setDataError("Some portal information could not be loaded. Refresh to try again.");
        }
      } finally {
        setDataLoading(false);
      }
    };

    void fetchDashboard();
  }, [user]);

  const upcoming = useMemo<TimelineItem[]>(() => {
    const now = new Date();
    const classItems = classes
      .filter((item) => new Date(item.ends_at) > now)
      .map((item) => ({
        id: `class-${item.id}`,
        title: item.title,
        subtitle: courses.find((course) => course.id === item.course_id)?.code || "Live class",
        date: new Date(item.starts_at),
        type: "class" as const,
      }));
    // Only work still to do: submitted assignments drop off the list.
    const homeworkItems = homeworks
      .filter((item) => item.status === "assigned" && new Date(item.due_date) > now)
      .map((item) => ({
        id: `homework-${item.id}`,
        title: item.title,
        subtitle: `${item.course_code || "Course"} · Due`,
        date: new Date(item.due_date),
        type: "assignment" as const,
      }));
    return [...classItems, ...homeworkItems]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 4);
  }, [classes, courses, homeworks]);

  if (userLoading || !user) {
    return <PortalLoading label="Loading your dashboard..." />;
  }

  if (user.is_admin) {
    return (
      <PortalLayout user={user} wide>
        <AdminPanel isAdmin />
      </PortalLayout>
    );
  }

  if (user.is_ta) {
    return (
      <PortalLayout user={user} wide>
        <TAPanel />
      </PortalLayout>
    );
  }

  const firstName = (user.full_name || user.username).trim().split(/\s+/)[0];

  return (
    <PortalLayout user={user} wide>
      <section className="mb-7">
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-[#06182f] sm:text-3xl">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {firstName}.
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">Ready to tackle today&apos;s challenges?</p>
      </section>

      {(userError || dataError) && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {userError || dataError}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.04)] sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-[#edf1f6] pb-4">
              <h2 className="text-lg font-bold text-[#172941]">Your account</h2>
              <Link href="/profile" className="text-xs font-bold text-[#0866ef] hover:text-blue-800">
                View profile <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
              </Link>
            </div>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {[
                ["Name", user.full_name || user.username],
                ["Email", user.email],
                ["Phone", user.phone_number || "Not provided"],
                ["Active courses", String(courses.length)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.06em] text-slate-400">{label}</dt>
                  <dd className="mt-1 truncate text-sm font-semibold text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#071a32]">My Active Courses</h2>
              <Link href="/courses" className="text-xs font-bold text-[#0866ef] hover:text-blue-800">
                View all <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
              </Link>
            </div>

            {dataLoading ? (
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
                {[0, 1].map((item) => (
                  <div key={item} className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white" />
                ))}
              </div>
            ) : courses.length ? (
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
                {courses.slice(0, 4).map((course) => {
                  const progress = clampProgress(course.progress);
                  return (
                    <Link
                      href="/courses"
                      key={course.id}
                      className="group relative overflow-hidden rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(15,35,65,0.08)]"
                    >
                      <span className="absolute -right-9 -top-12 h-32 w-32 rounded-full bg-[#f0f5ff]" />
                      <span className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#e9f1ff] text-[#0866ef]">
                        <GraduationCap className="h-5 w-5" />
                      </span>
                      <h3 className="relative pr-8 text-sm font-bold text-slate-800 group-hover:text-[#0866ef]">{course.name}</h3>
                      <p className="relative mt-1 text-xs text-slate-500">{course.code}</p>
                      <div className="relative mt-5 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span>Progress</span><span className="text-[#0866ef]">{progress}%</span>
                      </div>
                      <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e8eef7]">
                        <div className="h-full rounded-full bg-[#0866ef]" style={{ width: `${progress}%` }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-blue-200 bg-white px-6 py-10 text-center">
                <GraduationCap className="mx-auto h-8 w-8 text-blue-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">No active courses yet</p>
                <Link href="/courses" className="mt-2 inline-block text-sm font-bold text-[#0866ef]">Browse available courses</Link>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.04)]">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#4f8df7]" />
              <h2 className="text-lg font-bold text-[#172941]">Upcoming</h2>
            </div>
            {upcoming.length ? (
              <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[6px] before:top-2 before:w-px before:bg-blue-100">
                {upcoming.map((item, index) => (
                  <div key={item.id} className="relative pl-6">
                    <span className={`absolute left-0 top-1.5 z-10 h-[13px] w-[13px] rounded-full border-[3px] border-white ${index === 0 ? "bg-[#0866ef] ring-1 ring-blue-300" : "bg-blue-200"}`} />
                    <p className="text-[10px] font-bold text-[#4384ee]">{formatTimelineDate(item.date)}</p>
                    <p className="mt-0.5 text-xs font-bold leading-4 text-slate-700">{item.title}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-400">{item.subtitle}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 px-3 py-5 text-center text-xs text-slate-500">Nothing upcoming right now.</p>
            )}
          </section>

          <section className="rounded-xl border border-[#e5eaf2] bg-white p-5 shadow-[0_8px_30px_rgba(15,35,65,0.04)]">
            <h2 className="mb-4 text-lg font-bold text-[#172941]">Quick Links</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg bg-[#eaf2ff] px-2 text-center text-[11px] font-bold leading-3 text-slate-600 transition hover:bg-blue-100 hover:text-[#0866ef]">
                    <Icon className="h-5 w-5 text-[#397ee8]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </PortalLayout>
  );
}
