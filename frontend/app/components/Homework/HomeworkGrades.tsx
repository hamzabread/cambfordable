"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { MessageSquare, Clock, Download, AlertCircle } from "lucide-react";

interface HomeworkGrade {
  id: number;
  homework_id: number;
  file_url: string;
  submitted_at: string;
  score: number | null;
  remark: string | null;
}

interface HomeworkGradesProps {
  homeworkId: number;
}

const HomeworkGrades: React.FC<HomeworkGradesProps> = ({ homeworkId }) => {
  const [submission, setSubmission] = useState<HomeworkGrade | null>(null);
  const [solutionUrl, setSolutionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGrade();
    fetchSolution();
  }, [homeworkId]);

  const fetchSolution = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/homeworks/${homeworkId}/solution`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSolutionUrl(res.data.solution_url);
    } catch {
      setSolutionUrl(null);
    }
  };

  const fetchGrade = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/homeworks/me`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      // Find submission for this specific homework
      const submissionData = response.data.find(
        (s: HomeworkGrade) => s.homework_id === homeworkId
      );
      
      if (submissionData) {
        setSubmission(submissionData);
      }
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

  if (!submission) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">You have not submitted this homework yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grade Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h3 className="text-md font-bold text-slate-900 mb-4">Your Grade</h3>

        {/* Score Display */}
        {submission.score !== null ? (
          <div className="mb-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold text-green-600">
                {submission.score}
              </div>
              <div className="text-sm text-slate-600">
                <p className="font-semibold text-slate-900">Points Awarded</p>
                <p>Submitted on {new Date(submission.submitted_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <p className="text-blue-800 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Your submission is under review. Check back soon for your grade.
            </p>
          </div>
        )}

        {/* File Download */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
          <Download className="w-4 h-4 text-slate-600" />
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}${submission.file_url}`}
            download
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Download Your Submission
          </a>
        </div>
      </div>

      {/* Remarks Card */}
      {submission.remark && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">Teacher's Feedback</h3>
          </div>
          <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
            {submission.remark}
          </p>
        </div>
      )}

      {/* No Remarks */}
      {!submission.remark && submission.score !== null && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-sm">
          No feedback provided by instructor yet.
        </div>
      )}

      {/* Solution Download */}
      {solutionUrl && (
        <div className="bg-white rounded-lg border border-purple-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-600" />
                Solution
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Download the official solution for this homework
              </p>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL}${solutionUrl}`}
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
    </div>
  );
};

export default HomeworkGrades;
