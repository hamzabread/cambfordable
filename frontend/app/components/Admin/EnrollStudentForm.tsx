"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, X } from "lucide-react";

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

const EnrollStudentForm = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch students and courses on mount
  useEffect(() => {
    fetchData();
  }, []);

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

  const handleEnroll = async () => {
    if (!selectedStudent || !selectedCourse) {
      setError("Please select both a student and a course");
      return;
    }

    setEnrolling(true);
    try {
      const token = localStorage.getItem("access_token");

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/enroll`,
        {
          user_id: selectedStudent,
          course_id: selectedCourse,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const studentName = students.find(s => s.id === selectedStudent)?.full_name;
      const courseName = courses.find(c => c.id === selectedCourse)?.name;

      setSuccess(`✅ ${studentName} enrolled in ${courseName}`);
      setSelectedStudent(null);
      setSelectedCourse(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to enroll student");
    } finally {
      setEnrolling(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Student Search & Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-3">
            🎓 Select Student
          </label>
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
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
              {filteredStudents.length > 0 ? (
                <div className="space-y-1">
                  {filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student.id)}
                      className={`w-full text-left px-4 py-3 transition ${
                        selectedStudent === student.id
                          ? "bg-blue-100 border-l-4 border-blue-600"
                          : "hover:bg-slate-50 border-l-4 border-transparent"
                      }`}
                    >
                      <div className="font-semibold text-slate-900">
                        {student.full_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {student.username} • {student.email}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-slate-500">
                  No students found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Student Badge */}
        {selectedStudent && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              ✓ {students.find(s => s.id === selectedStudent)?.full_name} selected
            </span>
            <button
              onClick={() => setSelectedStudent(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Course Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4">
        <label className="block text-sm font-semibold text-slate-900">
          📚 Select Course
        </label>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course.id)}
                className={`p-4 rounded-lg border-2 transition text-left ${
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
        )}

        {/* Selected Course Badge */}
        {selectedCourse && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium text-green-900">
              ✓ {courses.find(c => c.id === selectedCourse)?.name} selected
            </span>
            <button
              onClick={() => setSelectedCourse(null)}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-start gap-3">
          <span>{success}</span>
        </div>
      )}

      {/* Enroll Button */}
      <button
        onClick={handleEnroll}
        disabled={!selectedStudent || !selectedCourse || enrolling}
        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition flex items-center justify-center gap-2"
      >
        {enrolling ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Enrolling...
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Enroll Student
          </>
        )}
      </button>
    </div>
  );
};

export default EnrollStudentForm;