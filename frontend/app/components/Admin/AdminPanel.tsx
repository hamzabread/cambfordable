"use client";

import React, { useState } from "react";
import { BookOpen, Video, Settings } from "lucide-react";
import CreateCourseForm from "../Admin/CreateCourseForm";
import CreateLiveClassForm from "../Admin/CreateLiveClassForm";

interface AdminPanelProps {
  isAdmin: boolean;
}

const AdminPanel = ({ isAdmin }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState<"courses" | "classes">("courses");

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-orange-600" />
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Admin Tools
          </h2>
        </div>
        <p className="text-slate-600">
          Create and manage courses and live classes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
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
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
            activeTab === "classes"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Video className="w-5 h-5" />
          Create Live Class
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Form */}
        <div>
          {activeTab === "courses" && <CreateCourseForm />}
          {activeTab === "classes" && <CreateLiveClassForm />}
        </div>

        {/* Info Panel */}
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
                  <h4 className="font-semibold text-slate-900 mb-1">
                    📚 Course ID
                  </h4>
                  <p>
                    Unique identifier for the course. Use numbers (e.g., 4, 5,
                    6).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    📖 Course Name
                  </h4>
                  <p>
                    Full name of the course (e.g., Chemistry, Physics,
                    Mathematics).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    🔢 Course Code
                  </h4>
                  <p>
                    Standard course code (e.g., 9701 for Chemistry A-Level).
                  </p>
                </div>
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-xs font-medium">
                    💡 Tip: Course codes should follow the Cambridge
                    International Education format.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    📚 Course Selection
                  </h4>
                  <p>
                    Select an existing course to associate with this live
                    class.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    🎓 Class Title
                  </h4>
                  <p>
                    Descriptive title for the class session (e.g., "Organic
                    Chemistry Lecture").
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    ⏰ Start & End Times
                  </h4>
                  <p>
                    Set the exact time when the class starts and ends.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    🔗 Meeting URL
                  </h4>
                  <p>
                    Zoom, Google Meet, or any meeting platform URL.
                  </p>
                </div>
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-xs font-medium">
                    ✅ Classes are automatically marked as "LIVE" during the
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

export default AdminPanel;