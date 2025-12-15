"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { X, Download, Loader, AlertCircle, User, Calendar } from "lucide-react";

interface Homework {
  id: number;
  title: string;
}

interface Submission {
  id: number;
  homework_id: number;
  user_id: number;
  file_url: string;
  submitted_at: string;
}

interface HomeworkSubmissionsModalProps {
  homework: Homework;
  courseName: string;
  isOpen: boolean;
  onClose: () => void;
}

const HomeworkSubmissionsModal = ({
  homework,
  courseName,
  isOpen,
  onClose,
}: HomeworkSubmissionsModalProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSubmissions = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:8000/homeworks/${homework.id}/submissions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSubmissions(response.data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching submissions:", err);
        if (err.response?.status === 404) {
          setSubmissions([]);
        } else {
          setError("Failed to load submissions. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [homework.id, isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {homework.title}
            </h2>
            <p className="text-sm text-slate-600 mt-1">{courseName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Total Submissions</p>
              <p className="text-3xl font-bold text-blue-600">
                {submissions.length}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-1">Submitted</p>
              <p className="text-3xl font-bold text-green-600">
                {submissions.length}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading submissions...</p>
            </div>
          ) : submissions.length > 0 ? (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-300">
                          <User className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            User #{submission.user_id}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID: {submission.user_id}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-3 ml-10">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(submission.submitted_at)}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          {getFileName(submission.file_url)}
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
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg font-medium">
                No submissions yet
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Students will submit their work before the due date
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeworkSubmissionsModal;