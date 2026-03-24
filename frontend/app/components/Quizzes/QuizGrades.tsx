"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, AlertCircle, MessageSquare, Clock, Download } from "lucide-react";

interface QuizGrade {
  submitted: boolean;
  score?: number;
  total_marks?: number;
  is_late?: boolean;
  submitted_at?: string;
  flagged_for_review?: boolean;
  remarks?: string;
  solution_url?: string;
}

interface QuizGradesProps {
  quizId: number;
}

const QuizGrades: React.FC<QuizGradesProps> = ({ quizId }) => {
  const [grade, setGrade] = useState<QuizGrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGrade();
  }, [quizId]);

  const fetchGrade = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/quiz-submissions/me/${quizId}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setGrade(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Grade fetch error:", err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("You do not have permission to view these grades.");
      } else {
        setError(err.response?.data?.detail || "Failed to load grades");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Error</p>
        <p className="text-red-700 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!grade?.submitted) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">You have not submitted this quiz yet.</p>
      </div>
    );
  }

  const scorePercentage =
    grade.score && grade.total_marks
      ? Math.round((grade.score / grade.total_marks) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Score Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-md font-bold text-slate-900">Your Score</h3>
          {grade.flagged_for_review && (
            <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Flagged for Review
            </span>
          )}
        </div>

        {/* Score Display */}
        <div className="flex items-center gap-6 mb-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-blue-600">
                {grade.score ?? "—"}
              </span>
              <span className="text-lg text-slate-500">
                / {grade.total_marks}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {scorePercentage > 0 && `${scorePercentage}%`}
              {scorePercentage >= 80 && " • Excellent"}
              {scorePercentage >= 60 && scorePercentage < 80 && " • Good"}
              {scorePercentage >= 40 && scorePercentage < 60 && " • Fair"}
              {scorePercentage < 40 && scorePercentage > 0 && " • Needs Improvement"}
            </p>
          </div>
        </div>

        {/* Submission Info */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="w-4 h-4" />
          Submitted on {new Date(grade.submitted_at || "").toLocaleDateString()}
          {grade.is_late && (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
              Late Submission
            </span>
          )}
        </div>
      </div>

      {/* Remarks Card */}
      {grade.remarks && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Teacher's Remarks</h3>
          </div>
          <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
            {grade.remarks}
          </p>
        </div>
      )}

      {/* No Remarks */}
      {!grade.remarks && grade.score !== null && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm">
          No remarks provided by instructor yet.
        </div>
      )}

      {/* Solution Download */}
      {grade.solution_url && (
        <div className="bg-white rounded-lg border border-purple-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-600" />
                Solution
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Download the official solution for this quiz
              </p>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}${grade.solution_url}`}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition text-sm"
            >
              <Download className="w-4 h-4" />
              Download Solution
            </a>
          </div>
        </div>
      )}

      {/* No Grade Yet */}
      {grade.score === null && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Your submission is under review. Check back soon for your grade.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizGrades;
