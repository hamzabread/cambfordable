"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, Save, AlertCircle, FileText, Download } from "lucide-react";
import Sidebar from "../../../components/Dashboard/Sidebar";
import TASidebar from "../../../components/TA/TASidebar";
import Header from "../../../components/Dashboard/Header";

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_ta: boolean;
}

interface HomeworkSubmission {
  id: number;
  homework_id: number;
  homework_title: string;
  course_title: string;
  student_user_id: number;
  student_username: string;
  submitted_at: string;
  score: number | null;
  total_marks: number;
  remarks: string | null;
  file_url?: string;
  file_name?: string;
}

export default function GradeHomeworkPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id;

  const [user, setUser] = useState<User | null>(null);
  const [submission, setSubmission] = useState<HomeworkSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [remarks, setRemarks] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Get current user
        const userRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUser(userRes.data);

        // Check if user is admin or TA
        if (!userRes.data.is_admin && !userRes.data.is_ta) {
          setError("You do not have permission to grade submissions");
          return;
        }

        // Fetch submission details
        const submissionRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/homework-submissions/${submissionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubmission(submissionRes.data);
        setScore(submissionRes.data.score);
        setRemarks(submissionRes.data.remarks || "");
      } catch (err: any) {
        console.error("Error fetching data:", err);
        if (err.response?.status === 403) {
          setError("You do not have permission to grade this submission");
        } else {
          setError("Failed to load submission details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [submissionId, router]);

  const handleSaveGrade = async () => {
    if (score === null || score === undefined) {
      setError("Please enter a score");
      return;
    }

    if (score < 0 || score > (submission?.total_marks || 0)) {
      setError(
        `Score must be between 0 and ${submission?.total_marks}`
      );
      return;
    }

    setSaving(true);
    const token = localStorage.getItem("access_token");

    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/homework-submissions/${submissionId}/grade`,
        {
          score,
          remarks,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Redirect back to TA panel
      router.push("/ta");
    } catch (err: any) {
      console.error("Error saving grade:", err);
      setError(err.response?.data?.detail || "Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="lg:hidden h-14"></div>
          <Header
            user={user || { username: "", email: "", id: 0, is_admin: false, is_ta: false }}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !submission) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {user.is_ta ? (
        <TASidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      ) : (
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden h-14"></div>
        <Header
          user={user}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-slate-200 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Grade Homework Submission
                </h1>
                <p className="text-slate-600 mt-1">
                  {submission.homework_title} - {submission.course_title}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Student Info */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Student Information
                  </h2>
                  <div className="space-y-2">
                    <p className="text-slate-600">
                      <span className="font-medium">Username:</span>{" "}
                      {submission.student_username}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium">Submitted:</span>{" "}
                      {new Date(
                        submission.submitted_at
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Submission File */}
                {submission.file_url && (
                  <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">
                      Submitted File
                    </h2>
                    <a
                      href={submission.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-600 font-medium transition"
                    >
                      <Download className="w-4 h-4" />
                      {submission.file_name || "Download Submission"}
                    </a>
                  </div>
                )}
              </div>

              {/* Sidebar - Grading */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-slate-200 p-6 sticky top-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Grading
                  </h2>

                  <div className="space-y-4">
                    {/* Score Input */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Score
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max={submission.total_marks}
                          value={score || ""}
                          onChange={(e) =>
                            setScore(
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                        <span className="text-slate-600 font-medium">
                          / {submission.total_marks}
                        </span>
                      </div>
                    </div>

                    {/* Remarks */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Remarks (Optional)
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Add any feedback for the student..."
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSaveGrade}
                      disabled={saving}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Saving..." : "Save Grade"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
