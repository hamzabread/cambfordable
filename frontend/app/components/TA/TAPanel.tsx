"use client";

import React, { useState } from "react";
import { BarChart3, FileText } from "lucide-react";
import QuizSubmissionsGrading from "../Quizzes/QuizSubmissionsGrading";
import AdminHomework from "../Homework/Admin/AdminHomework";

const TAPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"quizzes" | "homework">("quizzes");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">TA Grading Panel</h1>
        <p className="text-slate-600 mt-2">
          Grade quiz and homework submissions for your courses
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("quizzes")}
          className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${
            activeTab === "quizzes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          Grade Quizzes
        </button>
        <button
          onClick={() => setActiveTab("homework")}
          className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${
            activeTab === "homework"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-5 h-5" />
          Grade Homework
        </button>
      </div>

      {/* Content */}
      {activeTab === "quizzes" && <QuizSubmissionsGrading isTAMode={true} />}
      {activeTab === "homework" && <AdminHomework isAdmin={false} isTAMode={true} />}
    </div>
  );
};

export default TAPanel;
