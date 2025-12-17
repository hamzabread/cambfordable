"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, AlertCircle, FileText, Upload, Loader } from "lucide-react";
import HomeworkSubmitModal from "./HomeworkSubmitModal";

interface Homework {
  id: number;
  course_id: number;
  title: string;
  description: string;
  due_date: string;
}

interface User {
  id: number;
}

interface HomeworkListProps {
  user: User;
}

const HomeworkList = ({ user }: HomeworkListProps) => {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [submittedHomeworkIds, setSubmittedHomeworkIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        setLoading(true);

        // Fetch enrolled courses
        const coursesRes = await axios.get(
          "http://localhost:8000/courses/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEnrolledCourses(coursesRes.data);

        // Fetch submissions to check which are already submitted
        const submissionsRes = await axios.get(
          "http://localhost:8000/homeworks/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const submittedIds = submissionsRes.data.map(
          (s: any) => s.homework_id
        );
        setSubmittedHomeworkIds(submittedIds);

        // Fetch homeworks for each course
        const allHomeworks: Homework[] = [];
        for (const course of coursesRes.data) {
          const hwRes = await axios.get(
            `http://localhost:8000/homeworks/course/${course.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          allHomeworks.push(...hwRes.data);
        }

        // Filter out already submitted homeworks
        const unsubmittedHomeworks = allHomeworks.filter(
          (hw) => !submittedIds.includes(hw.id)
        );

        // Sort by due date
        unsubmittedHomeworks.sort(
          (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        );

        setHomeworks(unsubmittedHomeworks);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching homework:", err);
        if (err.response?.status === 401) {
          setError("Session expired. Please login again.");
        } else {
          // Fallback data
          setHomeworks([
            {
              id: 1,
              course_id: 1,
              title: "Organic Chemistry Problem Set",
              description:
                "Complete problems 1-15 from Chapter 6 on organic reaction mechanisms.",
              due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: 2,
              course_id: 2,
              title: "Calculus Assignment",
              description:
                "Solve differential equations exercises 1-20 on page 45.",
              due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getCourseName = (courseId: number) => {
    return enrolledCourses.find((c) => c.id === courseId)?.name || "Course";
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

  const isDueToday = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return (
      today.getDate() === due.getDate() &&
      today.getMonth() === due.getMonth() &&
      today.getFullYear() === due.getFullYear()
    );
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const daysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading assignments...</p>
      </div>
    );
  }

  return (
    <>
      {homeworks.length > 0 ? (
        <div className="space-y-4">
          {homeworks.map((homework) => {
            const overdue = isOverdue(homework.due_date);
            const dueToday = isDueToday(homework.due_date);
            const daysLeft = daysUntilDue(homework.due_date);

            return (
              <div
                key={homework.id}
                className={`bg-white rounded-lg shadow-sm border-l-4 p-6 hover:shadow-md transition ${
                  overdue
                    ? "border-l-red-500 bg-red-50"
                    : dueToday
                    ? "border-l-orange-500 bg-orange-50"
                    : "border-l-blue-500 bg-blue-50"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <FileText className="w-6 h-6 text-slate-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {homework.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {getCourseName(homework.course_id)}
                        </p>
                      </div>
                    </div>

                    <p className="text-slate-700 text-sm mb-4">
                      {homework.description}
                    </p>

                    {/* Due Date Info */}
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">
                          {formatDate(homework.due_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600">
                          {formatTime(homework.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Status & Button */}
                  <div className="flex flex-col items-start sm:items-end gap-3">
                    {/* Status Badge */}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        overdue
                          ? "bg-red-100 text-red-700"
                          : dueToday
                          ? "bg-orange-100 text-orange-700"
                          : daysLeft <= 2
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {overdue
                        ? "Overdue"
                        : dueToday
                        ? "Due Today"
                        : daysLeft <= 2
                        ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`
                        : `${daysLeft} days left`}
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={() => {
                        setSelectedHomework(homework);
                        setShowModal(true);
                      }}
                      className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                        overdue
                          ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                      disabled={overdue}
                    >
                      <Upload className="w-4 h-4" />
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">
            No homework assigned
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Check back later for new assignments
          </p>
        </div>
      )}

      {/* Submit Modal */}
      {selectedHomework && (
        <HomeworkSubmitModal
          homework={selectedHomework}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedHomework(null);
          }}
          onSuccess={() => {
            // Remove submitted homework from list
            setHomeworks(
              homeworks.filter((hw) => hw.id !== selectedHomework.id)
            );
            setSubmittedHomeworkIds([
              ...submittedHomeworkIds,
              selectedHomework.id,
            ]);
            setShowModal(false);
            setSelectedHomework(null);
          }}
        />
      )}
    </>
  );
};

export default HomeworkList;