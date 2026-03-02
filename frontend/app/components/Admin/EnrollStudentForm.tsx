"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Circle, AlertCircle } from "lucide-react";

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  is_admin: boolean;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface StudentWithEnrollment {
  student: User;
  isEnrolled: boolean;
}

const EnrollStudentForm = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch students and courses on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch enrollments for selected course
  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments();
    }
  }, [selectedCourse]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");

      const [usersRes, coursesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Filter out admin users
      const nonAdminUsers = usersRes.data.filter((u: User) => !u.is_admin);
      setStudents(nonAdminUsers);
      setCourses(coursesRes.data);
      setError(null);
    } catch (err: any) {
      setError("Failed to load data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!selectedCourse) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/enrollments/${selectedCourse}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const enrolledUserIds = response.data.map((e: any) => e.user_id);
      const enrollmentMap: { [key: string]: boolean } = {};
      
      students.forEach((student) => {
        enrollmentMap[`${selectedCourse}-${student.id}`] = enrolledUserIds.includes(student.id);
      });

      setEnrollments(enrollmentMap);
    } catch (err) {
      console.error("Failed to fetch enrollments:", err);
    }
  };

  const handleToggleEnrollment = async (studentId: number) => {
    if (!selectedCourse) return;

    const enrollmentKey = `${selectedCourse}-${studentId}`;
    const isCurrentlyEnrolled = enrollments[enrollmentKey] || false;

    setEnrolling(studentId);
    try {
      const token = localStorage.getItem("access_token");

      if (isCurrentlyEnrolled) {
        // Unenroll
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/unenroll`,
          {
            user_id: studentId,
            course_id: selectedCourse,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        // Enroll
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/enroll`,
          {
            user_id: studentId,
            course_id: selectedCourse,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      // Update local state
      setEnrollments((prev) => ({
        ...prev,
        [enrollmentKey]: !isCurrentlyEnrolled,
      }));

      const studentName = students.find(s => s.id === studentId)?.full_name;
      const courseName = courses.find(c => c.id === selectedCourse)?.name;
      const action = isCurrentlyEnrolled ? "unenrolled from" : "enrolled in";
      setSuccess(`✅ ${studentName} ${action} ${courseName}`);

      setTimeout(() => setSuccess(null), 3000);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update enrollment");
    } finally {
      setEnrolling(null);
    }
  };

  const filteredStudents = students.filter((s) => {
    // Filter by search term
    const matchesSearch =
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Exclude already enrolled students if a course is selected
    const enrollmentKey = selectedCourse ? `${selectedCourse}-${s.id}` : null;
    const isNotEnrolled = !enrollmentKey || !enrollments[enrollmentKey];

    return matchesSearch && isNotEnrolled;
  });

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-start gap-3">
          <span>{success}</span>
        </div>
      )}

      {/* Top Row: Courses and Students */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Courses */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <label className="block text-sm font-bold text-slate-900 mb-4">
            🎓 Select Course
          </label>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : courses.length > 0 ? (
            <div className="space-y-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedCourse === course.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300 bg-white"
                  }`}
                >
                  <div className="font-semibold text-slate-900">
                    {course.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Code: {course.code}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No courses available
            </div>
          )}
        </div>

        {/* Right Column: Students */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                👥 Available Students in{" "}
                {selectedCourse
                  ? courses.find((c) => c.id === selectedCourse)?.name
                  : "Selected Course"}
              </label>

              {!selectedCourse ? (
                <div className="py-12 text-center text-slate-500">
                  Select a course to view students
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search by name, username, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  />

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg">
                      {filteredStudents.length > 0 ? (
                        <div className="divide-y">
                          {filteredStudents.map((student) => {
                            const enrollmentKey = `${selectedCourse}-${student.id}`;
                            const isEnrolled = enrollments[enrollmentKey] || false;

                            return (
                              <button
                                key={student.id}
                                onClick={() =>
                                  handleToggleEnrollment(student.id)
                                }
                                disabled={enrolling === student.id}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition flex items-center gap-3 disabled:opacity-50"
                              >
                                {enrolling === student.id ? (
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                ) : isEnrolled ? (
                                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  </div>
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                                )}
                                <div className="flex-1">
                                  <div className="font-medium text-slate-900">
                                    {student.full_name}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {student.username} • {student.email}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-4 py-8 text-center text-slate-500">
                          No students found
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Guidelines */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          📋 Enrollment Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">
              🎯 Select a Course
            </h4>
            <p>
              Click on a course on the left to view all available (non-enrolled) students. Only one
              course can be active at a time.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">
              ✅ Click to Enroll Student
            </h4>
            <p>
              Click on any student to enroll them. Once enrolled, students are removed from the list.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">
              🔍 Search Students
            </h4>
            <p>
              Search by name, username, or email to quickly find available students to enroll.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">
              💡 Only Available Students Shown
            </h4>
            <p>
              The list automatically hides already-enrolled students. Only unenrolled students appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollStudentForm;