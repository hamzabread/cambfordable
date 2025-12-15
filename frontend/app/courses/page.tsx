"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import {
  BookOpen,
  Plus,
  Check,
  Loader,
  AlertCircle,
  Search,
} from "lucide-react";

interface Course {
  id: number;
  name: string;
  code: string;
  progress: number;
  completed: number;
}

interface EnrolledCourse extends Course {
  enrolled: true;
}

interface AvailableCourse extends Course {
  enrolled: false;
}

const CoursesPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);

        // Fetch user
        const userRes = await axios.get("http://localhost:8000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);

        // Fetch enrolled courses
        const enrolledRes = await axios.get(
          "http://localhost:8000/courses/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEnrolledCourses(enrolledRes.data);

        // Fetch all courses
        const allCoursesRes = await axios.get(
          "http://localhost:8000/courses/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Filter to show only courses not enrolled in
        const available = allCoursesRes.data.filter(
          (course: Course) =>
            !enrolledRes.data.some((ec: Course) => ec.id === course.id)
        );
        setAvailableCourses(available);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          router.push("/login");
        } else {
          setError("Failed to load courses. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleEnroll = async (courseId: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setEnrollingId(courseId);
      await axios.post(
        `http://localhost:8000/courses/${courseId}/enroll`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Move course from available to enrolled
      const courseToEnroll = availableCourses.find((c) => c.id === courseId);
      if (courseToEnroll) {
        setEnrolledCourses([...enrolledCourses, courseToEnroll]);
        setAvailableCourses(
          availableCourses.filter((c) => c.id !== courseId)
        );
        setSuccess(`Successfully enrolled in ${courseToEnroll.name}!`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error("Error enrolling in course:", err);
      setError(
        err.response?.data?.detail || "Failed to enroll in course. Try again."
      );
    } finally {
      setEnrollingId(null);
    }
  };

  const filteredEnrolled = enrolledCourses.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAvailable = availableCourses.filter((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="lg:hidden h-14"></div>
          <Header
            user={user}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading courses...</p>
            </div>
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
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                My Courses
              </h1>
              <p className="text-slate-600">
                Manage your courses and explore new learning opportunities
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border placeholder:text-[#a7a7a7] text-black border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            </div>

            {/* Enrolled Courses Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-slate-900" />
                <h2 className="text-2xl font-bold text-slate-900">
                  Enrolled Courses
                </h2>
                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {filteredEnrolled.length}
                </span>
              </div>

              {filteredEnrolled.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredEnrolled.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
                    >
                      {/* Course Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">
                            {course.name}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {course.code}
                          </p>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                          <Check className="w-6 h-6 text-green-600" />
                        </div>
                      </div>

                      {/* Progress Section */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-2">
                            <p className="text-sm text-slate-600">Progress</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {course.progress}%
                            </p>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-slate-900 h-2 rounded-full transition-all"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {course.completed > 0 && (
                          <p className="text-xs text-slate-500">
                            {course.completed} lessons completed
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <button className="w-full mt-6 px-4 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition">
                        Continue Learning
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">
                    {searchTerm
                      ? "No enrolled courses match your search"
                      : "You haven't enrolled in any courses yet"}
                  </p>
                </div>
              )}
            </div>

            {/* Available Courses Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-6 h-6 text-slate-900" />
                <h2 className="text-2xl font-bold text-slate-900">
                  Available Courses
                </h2>
                <span className="ml-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                  {filteredAvailable.length}
                </span>
              </div>

              {filteredAvailable.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredAvailable.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition group"
                    >
                      {/* Course Header */}
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-slate-700 transition">
                          {course.name}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          {course.code}
                        </p>
                      </div>

                      {/* Course Info */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm text-slate-600">
                            Students Enrolled
                          </span>
                          <span className="font-semibold text-slate-900">
                            {Math.floor(Math.random() * 150) + 50}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <span className="text-sm text-slate-600">
                            Difficulty
                          </span>
                          <span className="font-semibold text-orange-700">
                            A-Level
                          </span>
                        </div>
                      </div>

                      {/* Enroll Button */}
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollingId === course.id}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        {enrollingId === course.id ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Enroll Now
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                  <Plus className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">
                    {searchTerm
                      ? "No available courses match your search"
                      : "All available courses have been enrolled"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/45 bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default CoursesPage;