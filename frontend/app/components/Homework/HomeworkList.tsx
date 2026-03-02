"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, Clock, AlertCircle, FileText, Upload, Loader, ImageIcon, X, Download } from "lucide-react";
import HomeworkSubmitModal from "./HomeworkSubmitModal";

interface Homework {
  id: number;
  course_id: number;
  title: string;
  description: string;
  due_date: string;
  image_url?: string | null;
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
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        setLoading(true);

        // Fetch enrolled courses
        const coursesRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setEnrolledCourses(coursesRes.data);

        // Fetch submissions to check which are already submitted
        const submissionsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/homeworks/me`,
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
            `${process.env.NEXT_PUBLIC_API_URL}/homeworks/course/${course.id}`,
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
          setError("Failed to load homework. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  if (enrolledCourses.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600 font-medium">No courses enrolled</p>
        <p className="text-slate-500 text-sm mt-2">Enroll in courses to see assigned homework</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Group homeworks by course */}
      <div className="space-y-6">
        {enrolledCourses.map((course) => {
          const courseHomeworks = homeworks.filter(hw => hw.course_id === course.id);
          
          return (
            <div key={course.id} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-4">{course.name}</h2>
              
              {courseHomeworks.length === 0 ? (
                <p className="text-slate-600">No pending homework for this course</p>
              ) : (
                <div className="space-y-4">
                  {courseHomeworks.map((homework) => {
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

                    {/* Question Image */}
                    {homework.image_url && (
                      <div className="mb-4 p-3 bg-slate-100 rounded-lg border border-slate-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <ImageIcon className="w-4 h-4" />
                            Question Visual
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setViewingImage(homework.image_url || null)}
                              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                            >
                              View
                            </button>
                            <a
                              href={homework.image_url}
                              download
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </a>
                          </div>
                        </div>
                        <img
                          src={homework.image_url}
                          alt="Homework question"
                          className="w-full h-auto max-h-[200px] object-contain rounded cursor-pointer"
                          onClick={() => setViewingImage(homework.image_url || null)}
                        />
                      </div>
                    )}

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
              )}
            </div>
          );
        })}
      </div>

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

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-[10000] flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Question Image</h2>
              <button
                onClick={() => setViewingImage(null)}
                className="text-slate-500 hover:text-slate-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-50">
              <img
                src={viewingImage}
                alt="Homework question"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 flex gap-3">
              <a
                href={viewingImage}
                download
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <button
                onClick={() => setViewingImage(null)}
                className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-medium rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomeworkList;