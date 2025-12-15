"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BookOpen,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader,
  Eye,
} from "lucide-react";
import CreateHomeworkForm from "../Admin/CreateHomeworkForm";
import HomeworkSubmissionsModal from "../Admin/HomeworkSubmissionsModal";

interface Homework {
  id: number;
  course_id: number;
  title: string;
  description: string;
  due_date: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface AdminHomeworkProps {
  isAdmin: boolean;
}

const AdminHomework = ({ isAdmin }: AdminHomeworkProps) => {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(
    null
  );
  const [showSubmissions, setShowSubmissions] = useState(false);

  if (!isAdmin) return null;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        setLoading(true);

        // Fetch all courses
        const coursesRes = await axios.get("http://localhost:8000/courses/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(coursesRes.data);

        // Fetch homeworks for each course
        const allHomeworks: Homework[] = [];
        for (const course of coursesRes.data) {
          try {
            const hwRes = await axios.get(
              `http://localhost:8000/homeworks/course/${course.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            allHomeworks.push(...hwRes.data);
          } catch (err: any) {
            // Skip courses without homeworks
            if (err.response?.status !== 404) {
              console.error(`Error fetching homeworks for course ${course.id}:`, err);
            }
          }
        }

        // Sort by due date (newest first)
        const sorted = allHomeworks.sort(
          (a: Homework, b: Homework) =>
            new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
        );

        setHomeworks(sorted);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching homeworks:", err);
        // Fallback data
        setCourses([
          { id: 1, name: "Chemistry", code: "9701" },
          { id: 2, name: "Mathematics", code: "9709" },
        ]);
        setHomeworks([
          {
            id: 1,
            course_id: 1,
            title: "Organic Chemistry Problem Set",
            description: "Complete problems 1-15 from Chapter 6",
            due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCourseName = (courseId: number) => {
    return courses.find((c) => c.id === courseId)?.name || "Course";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleCreateSuccess = (newHomework: Homework) => {
    setHomeworks([newHomework, ...homeworks]);
    setShowForm(false);
    setError(null);
  };

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-orange-600" />
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Manage Homework
            </h2>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Homework
          </button>
        </div>
        <p className="text-slate-600">
          Create and manage homework assignments for your courses
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <CreateHomeworkForm
          courses={courses}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Homeworks List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading homeworks...</p>
        </div>
      ) : homeworks.length > 0 ? (
        <div className="space-y-4">
          {homeworks.map((homework) => (
            <div
              key={homework.id}
              className={`bg-white rounded-lg shadow-sm border-l-4 p-6 hover:shadow-md transition ${
                isOverdue(homework.due_date)
                  ? "border-l-red-500"
                  : "border-l-blue-500"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {homework.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {getCourseName(homework.course_id)}
                  </p>
                  <p className="text-slate-700 text-sm mt-2">
                    {homework.description}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <span className="text-xs text-slate-500">
                      Due: {formatDate(homework.due_date)}
                    </span>
                    {isOverdue(homework.due_date) && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Section - View Button */}
                <button
                  onClick={() => {
                    setSelectedHomework(homework);
                    setShowSubmissions(true);
                  }}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition flex items-center gap-2 whitespace-nowrap"
                >
                  <Eye className="w-4 h-4" />
                  View Submissions
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">
            No homework created
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Create your first homework assignment to get started
          </p>
        </div>
      )}

      {/* Submissions Modal */}
      {selectedHomework && (
        <HomeworkSubmissionsModal
          homework={selectedHomework}
          courseName={getCourseName(selectedHomework.course_id)}
          isOpen={showSubmissions}
          onClose={() => {
            setShowSubmissions(false);
            setSelectedHomework(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminHomework;