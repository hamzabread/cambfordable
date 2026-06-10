"use client";

import React, { useState } from "react";
import { BookOpen, Video, GraduationCap } from "lucide-react";
import CreateCourseForm from "../Admin/CreateCourseForm";
import CreateLiveClassForm from "../Admin/CreateLiveClassForm";

/**
 * Teacher panel.
 *
 * Teachers get the same tools as admins EXCEPT the Payments tab, the Enroll
 * tab, and the Manage Admin/TA tab. That leaves course creation and live-class
 * creation.
 */
const TeacherPanel = () => {
  const [activeTab, setActiveTab] = useState<"courses" | "classes">("courses");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <GraduationCap className="w-8 h-8 text-indigo-600" />
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Teacher Tools
          </h2>
        </div>
        <p className="text-slate-600">
          Create and manage courses and live classes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "courses"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-5 h-5" />
          Create Course
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === "classes"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Video className="w-5 h-5" />
          Create Live Class
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {activeTab === "courses" && <CreateCourseForm />}
          {activeTab === "classes" && <CreateLiveClassForm />}
        </div>

        <div className="hidden lg:block">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sticky top-20">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {activeTab === "courses"
                ? "Course Guidelines"
                : "Live Class Guidelines"}
            </h3>

            {activeTab === "courses" ? (
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">📚 Course ID</h4>
                  <p>Unique identifier for the course. Use numbers (e.g., 4, 5, 6).</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">📖 Course Name</h4>
                  <p>Full name of the course (e.g., Chemistry, Physics, Mathematics).</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">🔢 Course Code</h4>
                  <p>Standard course code (e.g., 9701 for Chemistry A-Level).</p>
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-xs font-medium">
                    💡 Tip: Course codes should follow the Cambridge International
                    Education format.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">📚 Course Selection</h4>
                  <p>Select an existing course to associate with this live class.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">🎓 Class Title</h4>
                  <p>
                    Descriptive title for the class session (e.g., &quot;Organic
                    Chemistry Lecture&quot;).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">⏰ Start &amp; End Times</h4>
                  <p>Set the exact time when the class starts and ends.</p>
                </div>
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-xs font-medium">
                    ✅ Classes are automatically marked as &quot;LIVE&quot; during the
                    scheduled time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPanel;
