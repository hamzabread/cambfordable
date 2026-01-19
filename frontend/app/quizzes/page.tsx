"use client";

import React, { useState, useEffect } from "react";
import { FileText, AlertCircle, BookOpen, BarChart3 } from "lucide-react";
import axios from "axios";
import Sidebar from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import CreateQuizForm from "../components/Quizzes/CreateQuizForm";
import StudentQuizList from "../components/Quizzes/StudentQuizList";
import QuizSubmissionsGrading from "../components/Quizzes/QuizSubmissionsGrading";

interface Course {
  id: number;
  name: string;
  code: string;
  progress: number;
  completed: number;
}

interface Quiz {
  id: number;
  title: string;
  total_marks: number;
  course_id: number;
}

export default function QuizzesPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"create" | "manage">("create");
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const userRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(userRes.data);
        setLoading(false);

        // If admin, load quizzes for grading
        if (userRes.data.is_admin) {
          // Admin doesn't need enrolled courses
          setCourseLoading(false);
        } else {
          // Fetch enrolled courses for students
          fetchEnrolledCourses(token);
        }
      } catch (err) {
        window.location.href = "/login";
      }
    };

    fetchData();
  }, []);

  const fetchEnrolledCourses = async (token: string) => {
    setCourseLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEnrolledCourses(response.data);
      setCourseError(null);
    } catch (err) {
      setCourseError("Failed to load enrolled courses");
      console.error(err);
    } finally {
      setCourseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden h-14"></div>
        <Header
          user={user}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Header Section */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  {user?.is_admin ? "Quiz Management" : "Quizzes"}
                </h1>
              </div>
              <p className="text-slate-600">
                {user?.is_admin
                  ? "Create quizzes and grade student submissions"
                  : "Complete assigned quizzes from your courses"}
              </p>
            </div>

            {/* Admin View */}
            {user?.is_admin ? (
              <>
                {/* Tabs - Only for Admin */}
                <div className="flex gap-4 border-b border-slate-200 overflow-x-auto">
                  <button
                    onClick={() => {
                      setActiveTab("create");
                      setSelectedQuiz(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
                      activeTab === "create"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                    Create Quiz
                  </button>
                  <button
                    onClick={() => setActiveTab("manage")}
                    className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
                      activeTab === "manage"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    Grade Submissions
                  </button>
                </div>

                {/* Admin Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2">
                    {activeTab === "create" && <CreateQuizForm />}

                    {activeTab === "manage" && (
                      <QuizSubmissionsGrading />
                    )}
                  </div>

                  {/* Info Panel */}
                  <div className="hidden lg:block">
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 sticky top-20">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">
                        {activeTab === "create"
                          ? "Quiz Creation Guide"
                          : "Grading Guide"}
                      </h3>

                      {activeTab === "create" ? (
                        <div className="space-y-4 text-sm text-slate-600">
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1">
                              📚 Select Course
                            </h4>
                            <p>Choose which course this quiz belongs to</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1">
                              ✏️ Add Questions
                            </h4>
                            <p>Support MCQ and short answer questions</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1">
                              🎯 Set Marks & Deadline
                            </h4>
                            <p>Define marks and deadline for each quiz</p>
                          </div>
                          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 text-xs font-medium">
                              💡 Tip: You can set deadlines and allow late submissions
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 text-sm text-slate-600">
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1">
                              📊 View Submissions
                            </h4>
                            <p>See all student submissions for a quiz</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1">
                              ✅ Grade Submissions
                            </h4>
                            <p>Enter scores for each student submission</p>
                          </div>
                          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 text-xs font-medium">
                              ✅ Scores are saved instantly
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Student View */
              <div className="space-y-8">
                {/* Error Message */}
                {courseError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{courseError}</span>
                  </div>
                )}

                {/* Loading State */}
                {courseLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading quizzes...</p>
                    </div>
                  </div>
                ) : enrolledCourses.length === 0 ? (
                  /* No Courses Enrolled */
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg font-medium">
                      No courses enrolled
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      Enroll in courses to see assigned quizzes
                    </p>
                  </div>
                ) : (
                  /* Quizzes by Course */
                  <div className="space-y-6">
                    {enrolledCourses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
                      >
                        <StudentQuizList
                          courseId={course.id}
                          courseName={course.name}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}