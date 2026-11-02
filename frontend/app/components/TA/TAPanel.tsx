"use client";

import { useState } from "react";
import { BookOpenCheck, FileCheck2, ShieldCheck } from "lucide-react";
import QuizSubmissionsGrading from "../Quizzes/QuizSubmissionsGrading";
import AdminHomework from "../Homework/Admin/AdminHomework";

export default function TAPanel() {
  const [activeTab, setActiveTab] = useState<"quizzes" | "homework">("quizzes");
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0866ef]">Teaching assistant</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-[#06182f]">Grading Workspace</h1><p className="mt-1.5 text-sm text-slate-500">Review submissions for the courses assigned to your account.</p></div><div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700"><ShieldCheck className="h-4 w-4" /> Course-scoped access</div></div>
      <div className="mb-5 grid max-w-2xl gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setActiveTab("quizzes")} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${activeTab === "quizzes" ? "border-blue-300 bg-[#0866ef] text-white shadow-lg shadow-blue-200/60" : "border-slate-200 bg-white text-slate-600"}`}><span className={`flex h-10 w-10 items-center justify-center rounded-lg ${activeTab === "quizzes" ? "bg-white/15" : "bg-blue-50 text-[#0866ef]"}`}><BookOpenCheck className="h-5 w-5" /></span><span><strong className="block text-sm">Quiz submissions</strong><small className={`text-[10px] ${activeTab === "quizzes" ? "text-blue-100" : "text-slate-400"}`}>Scores and proctoring review</small></span></button>
        <button type="button" onClick={() => setActiveTab("homework")} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${activeTab === "homework" ? "border-blue-300 bg-[#0866ef] text-white shadow-lg shadow-blue-200/60" : "border-slate-200 bg-white text-slate-600"}`}><span className={`flex h-10 w-10 items-center justify-center rounded-lg ${activeTab === "homework" ? "bg-white/15" : "bg-blue-50 text-[#0866ef]"}`}><FileCheck2 className="h-5 w-5" /></span><span><strong className="block text-sm">Homework submissions</strong><small className={`text-[10px] ${activeTab === "homework" ? "text-blue-100" : "text-slate-400"}`}>Files, remarks, and grades</small></span></button>
      </div>
      <section className="rounded-2xl border border-[#e1e7f0] bg-[#f9fbff] p-4 sm:p-6">{activeTab === "quizzes" ? <QuizSubmissionsGrading isTAMode /> : <AdminHomework isAdmin={false} isTAMode />}</section>
    </div>
  );
}
