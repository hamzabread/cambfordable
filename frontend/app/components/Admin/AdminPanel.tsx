"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, CreditCard, Lightbulb, Shield, Users, Video } from "lucide-react";
import CreateCourseForm from "./CreateCourseForm";
import CreateLiveClassForm from "./CreateLiveClassForm";
import EnrollStudentForm from "./EnrollStudentForm";
import ManageAdminTA from "./ManageAdminTA";
import ManagePayments from "./ManagePayments";
import ManageCourses from "./ManageCourses";

type Tab = "courses" | "classes" | "enroll" | "roles" | "payments";

const tabs = [
  { id: "courses" as const, label: "Courses", description: "Create curriculum", icon: BookOpen },
  { id: "classes" as const, label: "Live Classes", description: "Schedule sessions", icon: Video },
  { id: "enroll" as const, label: "Enrollments", description: "Manage students", icon: Users },
  { id: "roles" as const, label: "Access Roles", description: "Admins and TAs", icon: Shield },
  { id: "payments" as const, label: "Payments", description: "Review approvals", icon: CreditCard },
];

export default function AdminPanel({ isAdmin }: { isAdmin: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>("courses");
  const [coursesVersion, setCoursesVersion] = useState(0);
  if (!isAdmin) return null;

  const guidance = activeTab === "courses"
    ? ["Use a unique course code students can recognize.", "Add the WhatsApp invite only when it is ready to share.", "New courses remain available until a student completes enrollment."]
    : ["Choose the course before scheduling the session.", "Times are stored with timezone information.", "Enrolled students receive a portal notification automatically."];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0866ef]">Administration</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-[#06182f]">Admin Control Center</h1><p className="mt-1.5 text-sm text-slate-500">Manage teaching operations, access, and enrollment without leaving the portal.</p></div><div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Administrator access active</div></div>

      <nav className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Admin tools">
        {tabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${active ? "border-blue-300 bg-[#0866ef] text-white shadow-lg shadow-blue-200/60" : "border-[#e2e8f1] bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-white/15" : "bg-blue-50 text-[#0866ef]"}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-xs">{tab.label}</strong><small className={`mt-0.5 block truncate text-[9px] ${active ? "text-blue-100" : "text-slate-400"}`}>{tab.description}</small></span></button>; })}
      </nav>

      <section className="rounded-2xl border border-[#e1e7f0] bg-[#f9fbff] p-4 sm:p-6">
        {activeTab === "enroll" && <EnrollStudentForm />}
        {activeTab === "roles" && <ManageAdminTA />}
        {activeTab === "payments" && <ManagePayments />}
        {(activeTab === "courses" || activeTab === "classes") && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">{activeTab === "courses" ? <><CreateCourseForm onCreated={() => setCoursesVersion((v) => v + 1)} /><ManageCourses refreshKey={coursesVersion} /></> : <CreateLiveClassForm />}</div>
            <aside className="self-start rounded-xl border border-blue-100 bg-white p-5 shadow-sm xl:sticky xl:top-4"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#0866ef]">{activeTab === "courses" ? <BookOpen className="h-4 w-4" /> : <Video className="h-4 w-4" />}</span><div><h2 className="text-sm font-bold text-[#263850]">{activeTab === "courses" ? "Course checklist" : "Scheduling checklist"}</h2><p className="text-[10px] text-slate-400">Before you save</p></div></div><div className="mt-5 space-y-3">{guidance.map((item) => <p key={item} className="flex gap-2 text-[11px] leading-5 text-slate-600"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />{item}</p>)}</div><div className="mt-5 flex gap-2 rounded-lg bg-amber-50 p-3 text-[10px] leading-4 text-amber-800"><Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />Changes become visible to affected students immediately.</div></aside>
          </div>
        )}
      </section>
    </div>
  );
}
