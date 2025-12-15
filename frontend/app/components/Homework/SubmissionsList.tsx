"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Download,
  AlertCircle,
  CheckCircle,
  File,
  Calendar,
  Loader,
} from "lucide-react";

interface Submission {
  id: number;
  homework_id: number;
  user_id: number;
  file_url: string;
  submitted_at: string;
}

interface HomeworkInfo {
  [key: number]: {
    title: string;
    course_id: number;
  };
}

interface User {
  id: number;
}

interface SubmissionsListProps {
  user: User;
}

const SubmissionsList = ({ user }: SubmissionsListProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [homeworkInfo, setHomeworkInfo] = useState<HomeworkInfo>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        setLoading(true);

        // Fetch submissions
        const submissionsRes = await axios.get(
          "http://localhost:8000/homeworks/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Sort by submitted date (newest first)
        const sorted = submissionsRes.data.sort(
          (a: Submission, b: Submission) =>
            new Date(b.submitted_at).getTime() -
            new Date(a.submitted_at).getTime()
        );
        setSubmissions(sorted);

        // Fetch homework info for each submission
        const hwInfoMap: HomeworkInfo = {};
        for (const submission of sorted) {
          if (!hwInfoMap[submission.homework_id]) {
            try {
              const hwRes = await axios.get(
                `http://localhost:8000/homeworks/${submission.homework_id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              hwInfoMap[submission.homework_id] = hwRes.data;
            } catch (e) {
              // Fallback
              hwInfoMap[submission.homework_id] = {
                title: "Homework",
                course_id: 0,
              };
            }
          }
        }
        setHomeworkInfo(hwInfoMap);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching submissions:", err);
        if (err.response?.status === 401) {
          setError("Session expired. Please login again.");
        } else if (err.response?.status === 404) {
          // No submissions yet (not necessarily an error)
          setSubmissions([]);
        } else {
          setError("Failed to load submissions. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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

  const getFileName = (url: string) => {
    return url.split("/").pop() || "download";
  };

  const handleDownload = (url: string) => {
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading submissions...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {submissions.length > 0 ? (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="rounded-lg bg-green-100 p-2 flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {homeworkInfo[submission.homework_id]?.title ||
                          "Homework"}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Submitted
                      </p>
                    </div>
                  </div>

                  {/* Submission Details */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600">
                        {formatDate(submission.submitted_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <File className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600">
                        {getFileName(submission.file_url)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section - Download Button */}
                <button
                  onClick={() => handleDownload(submission.file_url)}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition flex items-center gap-2 whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <File className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">
            No submissions yet
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Submit your homework to see it here
          </p>
        </div>
      )}
    </>
  );
};

export default SubmissionsList;