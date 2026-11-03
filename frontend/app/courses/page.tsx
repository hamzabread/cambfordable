"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock3,
  FileUp,
  GraduationCap,
  X,
} from "lucide-react";
import PaymentProofDialog from "../components/Courses/PaymentProofDialog";
import PortalLayout from "../components/Portal/PortalLayout";
import PortalLoading from "../components/Portal/PortalLoading";
import { usePortalUser } from "../components/Portal/usePortalUser";
import {
  API_URL,
  authHeaders,
  clampProgress,
  CourseCatalogItem,
  formatDay,
  getAccessToken,
  isUnauthorized,
} from "@/lib/portal";

const COURSE_IMAGE = "/assets/kimberly-farmer-lUaaKCUANVI-unsplash.jpg";

// Courses the student has (or had, while paused) access to.
const mine = (course: CourseCatalogItem) =>
  course.enrollment_status === "enrolled" || course.enrollment_status === "paused";


function BillingNote({ course, onUpload }: { course: CourseCatalogItem; onUpload: () => void }) {
  if (!course.paid_until) return null;
  const uploadButton = (
    <button type="button" onClick={onUpload} className="mt-2 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#0866ef] text-xs font-bold text-[#0866ef] hover:bg-blue-50">
      Upload this month&apos;s payment <FileUp className="h-3.5 w-3.5" />
    </button>
  );
  if (course.proof_pending) {
    return <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">Your payment proof is being reviewed. Paid until {formatDay(course.paid_until)}.</p>;
  }
  if (course.overdue) {
    return (
      <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
        Payment overdue since {formatDay(course.paid_until)}. Access pauses on {formatDay(course.pauses_on)}.
        {course.rejection_reason && <span className="block">Last proof not accepted: {course.rejection_reason}</span>}
        {uploadButton}
      </div>
    );
  }
  if (course.renewal_open) {
    return (
      <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
        Next payment due {formatDay(course.paid_until)}.
        {course.rejection_reason && <span className="block">Last proof not accepted: {course.rejection_reason}</span>}
        {uploadButton}
      </div>
    );
  }
  return <p className="mt-3 text-[11px] font-medium text-slate-500">Paid until {formatDay(course.paid_until)}</p>;
}

export default function CoursesPage() {
  const { user, loading: userLoading } = usePortalUser();
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [activeTab, setActiveTab] = useState<"enrolled" | "available">("enrolled");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseCatalogItem | null>(null);

  const fetchCatalog = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const response = await axios.get<CourseCatalogItem[]>(`${API_URL}/courses/catalog`, {
        headers: authHeaders(token),
      });
      setCourses(response.data);
      setError(null);
    } catch (requestError) {
      if (!isUnauthorized(requestError)) {
        setError("We could not load the course catalog. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const query = new URLSearchParams(window.location.search).get("search");
    if (query) setSearch(query);
    void fetchCatalog();
  }, [user]);

  // Arriving from the header search: open the tab that has the matches.
  const [initialTabChosen, setInitialTabChosen] = useState(false);
  useEffect(() => {
    if (initialTabChosen || loading || !search.trim()) return;
    setInitialTabChosen(true);
    const query = search.trim().toLowerCase();
    const enrolledMatch = courses.some(
      (course) =>
        mine(course) &&
        (course.name.toLowerCase().includes(query) || course.code.toLowerCase().includes(query)),
    );
    if (!enrolledMatch) setActiveTab("available");
  }, [courses, initialTabChosen, loading, search]);

  const visibleCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return courses.filter((course) => {
      const inTab =
        activeTab === "enrolled"
          ? mine(course)
          : !mine(course);
      const matches =
        !normalizedSearch ||
        course.name.toLowerCase().includes(normalizedSearch) ||
        course.code.toLowerCase().includes(normalizedSearch);
      return inTab && matches;
    });
  }, [activeTab, courses, search]);

  const enrolledCount = courses.filter(mine).length;
  const availableCount = courses.length - enrolledCount;
  const otherTab = activeTab === "enrolled" ? "available" : "enrolled";
  const otherTabMatches = search.trim()
    ? courses.filter((course) => {
        const query = search.trim().toLowerCase();
        const inOther = otherTab === "enrolled" ? mine(course) : !mine(course);
        return inOther && (course.name.toLowerCase().includes(query) || course.code.toLowerCase().includes(query));
      }).length
    : 0;

  if (userLoading || !user) return <PortalLoading label="Loading courses..." />;

  return (
    <PortalLayout
      user={user}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search courses by name or code..."
    >
      <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#051831] sm:text-4xl">My Courses</h1>
          <p className="mt-1.5 text-sm text-slate-500">Manage your enrolled curriculum and discover new opportunities.</p>
        </div>
        <div className="inline-flex self-start rounded-lg border border-[#dce4ef] bg-[#f2f5fa] p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("enrolled")}
            className={`rounded-md px-5 py-2 text-xs font-bold transition ${activeTab === "enrolled" ? "bg-[#0866ef] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Enrolled <span className="ml-1 opacity-70">{enrolledCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("available")}
            className={`rounded-md px-5 py-2 text-xs font-bold transition ${activeTab === "available" ? "bg-[#0866ef] text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Available <span className="ml-1 opacity-70">{availableCount}</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}
      {error && !selectedCourse && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {[0, 1, 2].map((item) => <div key={item} className="h-[380px] animate-pulse rounded-xl border border-slate-200 bg-white" />)}
        </div>
      ) : visibleCourses.length ? (
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {visibleCourses.map((course) => {
            const progress = clampProgress(course.progress);
            const pending = course.enrollment_status === "pending";
            const rejected = course.enrollment_status === "rejected";
            const paused = course.enrollment_status === "paused";
            const openUpload = () => { setSelectedCourse(course); setError(null); };
            const complete = course.enrollment_status === "enrolled" && (progress >= 100 || course.completed >= 100);
            return (
              <article key={course.id} className="overflow-hidden rounded-xl border border-[#e4e9f1] bg-white p-4 shadow-[0_10px_35px_rgba(13,35,68,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(13,35,68,0.09)]">
                <div className="relative h-40 overflow-hidden rounded-lg bg-slate-100">
                  <Image src={COURSE_IMAGE} alt="A stack of academic textbooks" fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" priority={course === visibleCourses[0]} />
                  <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${rejected || paused ? "bg-red-50 text-red-700" : pending ? "bg-amber-50 text-amber-700" : complete ? "bg-slate-100 text-slate-600" : course.enrollment_status === "enrolled" ? "bg-blue-50 text-[#0866ef]" : "bg-white text-slate-700"}`}>
                    {rejected || paused ? <AlertCircle className="h-3 w-3" /> : pending ? <Clock3 className="h-3 w-3" /> : complete ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    {paused ? "Access paused" : rejected ? "Proof not accepted" : pending ? "Pending review" : complete ? "Completed" : course.enrollment_status === "enrolled" ? "In progress" : "Open for enrollment"}
                  </span>
                </div>

                <div className="px-1 pb-1 pt-4">
                  <h2 className="min-h-12 text-lg font-bold leading-6 text-[#24364f]">{course.name}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <GraduationCap className="h-3.5 w-3.5" /> {course.code}
                  </p>

                  {course.enrollment_status === "enrolled" ? (
                    <>
                      <div className="mt-5 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span>Progress</span><span className="font-bold text-[#0866ef]">{progress}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e5ebf4]"><div className="h-full rounded-full bg-[#0866ef]" style={{ width: `${progress}%` }} /></div>
                      <Link href="/schedule" className={`mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-xs font-bold transition ${complete ? "border border-[#72a7f6] text-[#397be0] hover:bg-blue-50" : "bg-[#0866ef] text-white shadow-md shadow-blue-200 hover:bg-[#075bda]"}`}>
                        {complete ? "Review material" : "Continue learning"} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <BillingNote course={course} onUpload={openUpload} />
                    </>
                  ) : paused ? (
                    <div className="mt-5 space-y-3">
                      <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium leading-5 text-red-800">
                        Your access is paused because this month&apos;s payment is overdue.
                        {course.removal_on ? ` If no payment arrives by ${formatDay(course.removal_on)}, you'll be removed from the course.` : ""}
                      </p>
                      {course.proof_pending ? (
                        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">Your payment proof is being reviewed.</p>
                      ) : (
                        <button type="button" onClick={openUpload} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0866ef] text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-[#075bda]">
                          Upload payment proof <FileUp className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : rejected ? (
                    <div className="mt-5 space-y-3">
                      <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium leading-5 text-red-800">
                        Your payment proof wasn&apos;t accepted{course.rejection_reason ? `: ${course.rejection_reason}` : "."}
                      </p>
                      <button type="button" onClick={() => { setSelectedCourse(course); setError(null); }} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0866ef] text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-[#075bda]">
                        Upload a new proof <FileUp className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : pending ? (
                    <div className="mt-5 flex min-h-[66px] items-center rounded-lg bg-amber-50 px-3 text-xs font-medium leading-5 text-amber-800">Your enrollment request is awaiting approval. Course access unlocks after review.</div>
                  ) : (
                    <button type="button" onClick={() => { setSelectedCourse(course); setError(null); }} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0866ef] text-xs font-bold text-white shadow-md shadow-blue-200 transition hover:bg-[#075bda]">
                      Request enrollment <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-blue-200 bg-white px-6 py-16 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-blue-300" />
          <h2 className="mt-4 text-base font-bold text-slate-700">No courses found</h2>
          <p className="mt-1 text-sm text-slate-500">{search ? "Try a different course name or code." : activeTab === "enrolled" ? "Your approved courses will appear here." : "There are no additional courses available right now."}</p>
          {otherTabMatches > 0 && (
            <button type="button" onClick={() => setActiveTab(otherTab)} className="mt-4 rounded-lg border border-blue-200 px-4 py-2 text-sm font-bold text-[#0866ef] hover:bg-blue-50">
              Show {otherTabMatches} {otherTabMatches === 1 ? "match" : "matches"} in {otherTab === "enrolled" ? "Enrolled" : "Available"}
            </button>
          )}
        </div>
      )}

      {selectedCourse && (
        <PaymentProofDialog
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          onSubmitted={(message) => {
            setSelectedCourse(null);
            setSuccess(message);
            void fetchCatalog();
          }}
        />
      )}
    </PortalLayout>
  );
}
