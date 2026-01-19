"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Clock, AlertCircle, CheckCircle, FileText } from "lucide-react";

interface Quiz {
  id: number;
  title: string;
  total_marks: number;
  course_id: number;
  deadline: string | null;
  allow_late: boolean;
  is_published: boolean;
  is_submitted?: boolean;
}

interface StudentQuizListProps {
  courseId: number;
  courseName: string;
}

const StudentQuizList: React.FC<StudentQuizListProps> = ({
  courseId,
  courseName,
}) => {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/quizzes/course/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Check submission status for each quiz in parallel
      const quizzesWithStatus = await Promise.all(
        response.data.map(async (quiz: Quiz) => {
          try {
            const statusRes = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/quiz-submissions/me/${quiz.id}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            return { ...quiz, is_submitted: statusRes.data.submitted };
          } catch {
            return { ...quiz, is_submitted: false };
          }
        }),
      );

      setQuizzes(quizzesWithStatus);
      setError(null);
    } catch (err) {
      setError("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const isQuizOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return "No deadline";
    const date = new Date(deadline);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = (deadline: string | null) => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{courseName}</h3>
        <p className="text-sm text-slate-500">
          {quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""}
        </p>
      </div>

      {quizzes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No quizzes available</p>
          <p className="text-slate-500 text-sm mt-1">
            Quizzes will appear here once created by your teacher
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const isOverdue = isQuizOverdue(quiz.deadline);
            const timeRemaining = getTimeRemaining(quiz.deadline);
            
            // Logic: Cannot take if already submitted OR (overdue AND late not allowed)
            const canTakeQuiz = !quiz.is_submitted && (!isOverdue || quiz.allow_late);

            return (
              <div
                key={quiz.id}
                className={`bg-white rounded-lg shadow-sm border-2 p-5 transition hover:shadow-md ${
                  quiz.is_submitted ? "border-blue-100 bg-blue-50/20" : 
                  isOverdue && !quiz.allow_late ? "border-red-100 bg-red-50/20" : "border-slate-200"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  {/* Info Section */}
                  <div className="md:col-span-2">
                    <h4 className="font-semibold text-slate-900 text-lg mb-1">{quiz.title}</h4>
                    <span className="text-sm text-slate-600 font-medium">Total Marks: {quiz.total_marks}</span>
                  </div>

                  {/* Deadline Section */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Deadline</p>
                      <p className="text-sm font-semibold text-slate-900">{formatDeadline(quiz.deadline)}</p>
                      {timeRemaining && !quiz.is_submitted && (
                        <p className={`text-xs mt-1 font-medium ${isOverdue ? "text-red-600" : "text-green-600"}`}>
                          {isOverdue ? "Overdue" : `${timeRemaining} left`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className="flex flex-col items-end gap-2">
                    {/* Status Badge */}
                    {quiz.is_submitted ? (
                      <div className="px-3 py-1 bg-blue-100 border border-blue-300 rounded-full text-blue-700 text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Submitted
                      </div>
                    ) : isOverdue && !quiz.allow_late ? (
                      <div className="px-3 py-1 bg-red-100 border border-red-300 rounded-full text-red-700 text-xs font-bold">Closed</div>
                    ) : isOverdue && quiz.allow_late ? (
                      <div className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full text-yellow-700 text-xs font-bold">Late Allowed</div>
                    ) : (
                      <div className="px-3 py-1 bg-green-100 border border-green-300 rounded-full text-green-700 text-xs font-bold">Active</div>
                    )}

                    {/* Action Button */}
                    <button
                      disabled={!canTakeQuiz}
                      onClick={() => router.push(`/quiz/${quiz.id}`)}
                      className={`px-4 py-2 font-bold rounded-lg transition text-sm w-full md:w-auto ${
                        !canTakeQuiz
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      }`}
                    >
                      {quiz.is_submitted ? "Completed" : isOverdue && !quiz.allow_late ? "Closed" : "Start Quiz"}
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
};

export default StudentQuizList;
