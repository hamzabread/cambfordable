"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import {
  Video,
  Calendar,
  Clock,
  AlertCircle,
  Loader,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

interface LiveClass {
  id: number;
  course_id: number;
  title: string;
  starts_at: string;
  ends_at: string;
  meeting_url: string;
  is_live: boolean;
}

interface EnrolledCourse {
  id: number;
  name: string;
  code: string;
}

const LiveClassesPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filterCourse, setFilterCourse] = useState<number | null>(null);

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
        const coursesRes = await axios.get(
          "http://localhost:8000/courses/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEnrolledCourses(coursesRes.data);

        // Fetch live classes
        const classesRes = await axios.get(
          "http://localhost:8000/live-classes/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Filter classes to only show those from enrolled courses
        const enrolledCourseIds = coursesRes.data.map(
          (c: EnrolledCourse) => c.id
        );
        const filteredClasses = classesRes.data.filter((cls: LiveClass) =>
          enrolledCourseIds.includes(cls.course_id)
        );

        setLiveClasses(filteredClasses);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching live classes:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          router.push("/login");
        } else {
          setError("Failed to load live classes. Please try again later.");
          // Fallback data for demo
          setLiveClasses([
            {
              id: 1,
              course_id: 1,
              title: "Chemistry Lecture - Organic Reactions",
              starts_at: new Date(Date.now() + 3600000).toISOString(),
              ends_at: new Date(Date.now() + 7200000).toISOString(),
              meeting_url: "https://zoom.us/j/example1",
              is_live: true,
            },
            {
              id: 2,
              course_id: 2,
              title: "Mathematics - Calculus Session",
              starts_at: new Date(Date.now() + 7200000).toISOString(),
              ends_at: new Date(Date.now() + 10800000).toISOString(),
              meeting_url: "https://zoom.us/j/example2",
              is_live: false,
            },
          ]);
          setEnrolledCourses([
            { id: 1, name: "Chemistry", code: "9701" },
            { id: 2, name: "Mathematics", code: "9709" },
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleJoinClass = async (classId: number, meetingUrl: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setJoiningId(classId);
      setError(null);

      // Get join details from backend
      const response = await axios.get(
        `http://localhost:8000/live-classes/${classId}/join`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Open the Zoom URL in a new window
      const zoomUrl = response.data.zoom_url || meetingUrl;
      if (zoomUrl) {
        window.open(zoomUrl, "_blank");
      }
    } catch (err: any) {
      console.error("Error joining class:", err);

      // Fallback: open the meeting URL directly
      if (!err.response) {
        window.open(meetingUrl, "_blank");
      } else {
        setError(
          err.response?.data?.detail ||
            "Failed to join class. Please try again."
        );
      }
    } finally {
      setJoiningId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCourseName = (courseId: number) => {
    return enrolledCourses.find((c) => c.id === courseId)?.name || "Unknown";
  };

  const isClassLive = (startsAt: string, endsAt: string) => {
    const now = new Date();
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    return now >= start && now <= end;
  };

  const isUpcoming = (startsAt: string) => {
    return new Date(startsAt) > new Date();
  };

  const filteredClasses = filterCourse
    ? liveClasses.filter((cls) => cls.course_id === filterCourse)
    : liveClasses;

  const liveNowClasses = filteredClasses.filter((cls) =>
    isClassLive(cls.starts_at, cls.ends_at)
  );
  const upcomingClasses = filteredClasses.filter((cls) =>
    isUpcoming(cls.starts_at)
  );
  const pastClasses = filteredClasses.filter(
    (cls) => !isClassLive(cls.starts_at, cls.ends_at) && !isUpcoming(cls.starts_at)
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
              <p className="text-slate-600">Loading live classes...</p>
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
              <div className="flex items-center gap-3 mb-2">
                <Video className="w-8 h-8 text-slate-900" />
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  Live Classes
                </h1>
              </div>
              <p className="text-slate-600">
                Join online classes for your enrolled courses
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Filter by Course */}
            {enrolledCourses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterCourse(null)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterCourse === null
                      ? "bg-slate-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  All Courses
                </button>
                {enrolledCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setFilterCourse(course.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterCourse === course.id
                        ? "bg-slate-900 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {course.name}
                  </button>
                ))}
              </div>
            )}

            {/* Live Now Section */}
            {liveNowClasses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Live Now
                  </h2>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                    {liveNowClasses.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {liveNowClasses.map((liveClass) => (
                    <div
                      key={liveClass.id}
                      className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg shadow-md border border-red-200 p-6 hover:shadow-lg transition"
                    >
                      {/* Live Badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 rounded-full">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-bold text-red-700">
                            LIVE
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {liveClass.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">
                        {getCourseName(liveClass.course_id)}
                      </p>

                      {/* Time Info */}
                      <div className="space-y-2 mb-6">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(liveClass.starts_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(liveClass.starts_at)} -{" "}
                            {formatTime(liveClass.ends_at)}
                          </span>
                        </div>
                      </div>

                      {/* Join Button */}
                      <button
                        onClick={() =>
                          handleJoinClass(liveClass.id, liveClass.meeting_url)
                        }
                        disabled={joiningId === liveClass.id}
                        className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        {joiningId === liveClass.id ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4" />
                            Join Now
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Classes Section */}
            {upcomingClasses.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-6 h-6 text-slate-900" />
                  <h2 className="text-2xl font-bold text-slate-900">
                    Upcoming Classes
                  </h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    {upcomingClasses.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {upcomingClasses.map((liveClass) => (
                    <div
                      key={liveClass.id}
                      className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
                    >
                      {/* Content */}
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {liveClass.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">
                        {getCourseName(liveClass.course_id)}
                      </p>

                      {/* Time Info */}
                      <div className="space-y-2 mb-6 bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(liveClass.starts_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(liveClass.starts_at)} -{" "}
                            {formatTime(liveClass.ends_at)}
                          </span>
                        </div>
                      </div>

                      {/* Join Button */}
                      <button
                        onClick={() =>
                          handleJoinClass(liveClass.id, liveClass.meeting_url)
                        }
                        disabled={joiningId === liveClass.id}
                        className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                      >
                        {joiningId === liveClass.id ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Preparing...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Ready to Join
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Classes Section */}
            {pastClasses.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Past Classes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {pastClasses.map((liveClass) => (
                    <div
                      key={liveClass.id}
                      className="bg-slate-50 rounded-lg shadow-sm border border-slate-200 p-6 opacity-75"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {liveClass.title}
                        </h3>
                        <CheckCircle className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-sm text-slate-600 mb-4">
                        {getCourseName(liveClass.course_id)}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(liveClass.starts_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(liveClass.starts_at)} -{" "}
                            {formatTime(liveClass.ends_at)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 mt-4">
                        This class has ended
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Classes Message */}
            {filteredClasses.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
                <Video className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 text-lg font-medium">
                  No live classes available
                </p>
                <p className="text-slate-500 text-sm mt-2">
                  Check back later for upcoming classes in your enrolled courses
                </p>
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
};

export default LiveClassesPage;