"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
  X, 
  Download, 
  Loader, 
  AlertCircle, 
  User, 
  Calendar, 
  ExternalLink, 
  MessageSquare, 
  CheckCircle, 
  Save,
  Upload,
  Trash2,
  FileText 
} from "lucide-react";

interface Homework {
  id: number;
  title: string;
}

interface UserSimple {
  id: number;
  full_name?: string;
  email: string;
}

interface Submission {
  id: number;
  homework_id: number;
  user_id: number;
  user?: UserSimple; // Added user object
  file_url: string;
  submitted_at: string;
  score?: number | null; // Added score
  remark?: string | null; // Added remark
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
  
  // Local state for handling inputs before saving
  const [remarks, setRemarks] = useState<{ [key: number]: string }>({});
  const [scores, setScores] = useState<{ [key: number]: string }>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [solutionUrl, setSolutionUrl] = useState<string | null>(null);
  const [uploadingSolution, setUploadingSolution] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchSubmissions();
    fetchSolutionUrl();
  }, [homework.id, isOpen]);

  const fetchSolutionUrl = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/homeworks/${homework.id}/solution`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSolutionUrl(res.data.solution_url);
    } catch {
      setSolutionUrl(null);
    }
  };

  const handleUploadSolution = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingSolution(true);
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/homeworks/${homework.id}/solution`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      setSolutionUrl(res.data.solution_url);
    } catch (err: any) {
      console.error("Failed to upload solution", err);
      alert(err.response?.data?.detail || "Failed to upload solution");
    } finally {
      setUploadingSolution(false);
      e.target.value = "";
    }
  };

  const handleRemoveSolution = async () => {
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/homeworks/${homework.id}/solution`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSolutionUrl(null);
    } catch (err: any) {
      console.error("Failed to remove solution", err);
      alert(err.response?.data?.detail || "Failed to remove solution");
    }
  };

  const fetchSubmissions = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/homeworks/${homework.id}/submissions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setSubmissions(response.data);
      
      // Initialize local state with existing values
      const initialRemarks: any = {};
      const initialScores: any = {};
      
      response.data.forEach((sub: Submission) => {
        if (sub.remark) initialRemarks[sub.id] = sub.remark;
        if (sub.score !== null && sub.score !== undefined) initialScores[sub.id] = sub.score.toString();
      });
      
      setRemarks(initialRemarks);
      setScores(initialScores);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching submissions:", err);
      if (err.response?.status === 404) {
        setSubmissions([]);
      } else {
        setError("Failed to load submissions.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGrade = async (submissionId: number) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    const scoreVal = scores[submissionId] ? parseFloat(scores[submissionId]) : null;
    const remarkVal = remarks[submissionId] || "";

    setSavingId(submissionId);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/homeworks/grade`,
        {
          submission_id: submissionId,
          score: scoreVal,
          remark: remarkVal,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Update local submissions list to reflect saved state (green border etc)
      setSubmissions(prev => prev.map(s => 
        s.id === submissionId ? { ...s, score: scoreVal, remark: remarkVal } : s
      ));
      
    } catch (err) {
      console.error("Failed to save grade", err);
      alert("Failed to save grade. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const getFullFileUrl = (fileUrl: string): string => {
  if (!fileUrl) return "";
  
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, "");
  
  // If it's already a full URL
  if (fileUrl.startsWith('http')) return fileUrl;

  // Extract just the filename (e.g., "profile.jpeg")
  const filename = fileUrl.split('/').pop();

  // Route the request specifically through the homeworks endpoint
  // This matches: @router.get("/homeworks/{filename}")
  return `${apiUrl}/uploads/homeworks/${filename}`;
};

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const getFileName = (url: string) => url.split("/").pop() || "download";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{homework.title}</h2>
            <p className="text-sm text-slate-600 mt-1">{courseName} • Submissions</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium">Total Submissions</p>
              <p className="text-3xl font-bold text-slate-800">{submissions.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 font-medium">Graded</p>
              <p className="text-3xl font-bold text-green-600">
                {submissions.filter(s => s.score !== null && s.score !== undefined).length}
              </p>
            </div>
          </div>

          {/* Solution Upload Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Solution File
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Students who submitted can download this
                </p>
              </div>
              <div className="flex items-center gap-2">
                {solutionUrl ? (
                  <>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}${solutionUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition text-xs font-medium border border-purple-200"
                    >
                      <Download className="w-3 h-3" />
                      View
                    </a>
                    <button
                      onClick={handleRemoveSolution}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition text-xs font-medium border border-red-200"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </>
                ) : (
                  <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    uploadingSolution
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}>
                    <Upload className="w-3 h-3" />
                    {uploadingSolution ? "Uploading..." : "Upload Solution"}
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleUploadSolution}
                      disabled={uploadingSolution}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 mb-6 text-red-700">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <Loader className="animate-spin w-10 h-10 text-blue-600 mx-auto mb-4" />
              <p className="text-slate-500">Loading student submissions...</p>
            </div>
          ) : submissions.length > 0 ? (
            <div className="space-y-6">
              {submissions.map((submission) => {
                const isGraded = submission.score !== null && submission.score !== undefined;
                
                return (
                  <div 
                    key={submission.id}
                    className={`bg-white border rounded-xl shadow-sm transition-all duration-200 ${
                      isGraded ? "border-green-200 shadow-green-50" : "border-slate-200 hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row">
                      
                      {/* Left Side: Student & File Info */}
                      <div className="flex-1 p-5 border-b md:border-b-0 md:border-r border-slate-100">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">
                              {submission.user?.full_name || `Student #${submission.user_id}`}
                            </h3>
                            <p className="text-xs text-slate-500">{submission.user?.email}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {formatDate(submission.submitted_at)}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-semibold">Submitted File</p>
                          <p className="text-sm font-medium text-slate-700 truncate mb-3">
                            {getFileName(submission.file_url)}
                          </p>
                          <div className="flex gap-2">
                            <a
                              href={`${getFullFileUrl(submission.file_url)}?mode=view`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                            >
                              <ExternalLink className="w-3 h-3" /> View
                            </a>
                            <a
                              href={getFullFileUrl(submission.file_url)}
                              download
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-900 transition"
                            >
                              <Download className="w-3 h-3" /> Download
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Grading & Remarks */}
                      <div className="w-full md:w-[280px] lg:w-[320px] p-5 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Feedback
                          </label>
                          {isGraded && (
                            <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" /> Graded
                            </span>
                          )}
                        </div>

                        <div className="mb-3">
                          <input
                            type="number"
                            placeholder="Score (e.g. 85)"
                            value={scores[submission.id] || ""}
                            onChange={(e) => setScores({...scores, [submission.id]: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <textarea
                          placeholder="Write a remark for the student..."
                          value={remarks[submission.id] || ""}
                          onChange={(e) => setRemarks({...remarks, [submission.id]: e.target.value})}
                          className="w-full h-24 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-3"
                        />

                        <button
                          onClick={() => handleSaveGrade(submission.id)}
                          disabled={savingId === submission.id}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:bg-blue-400"
                        >
                          {savingId === submission.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {isGraded ? "Update Grade" : "Save Grade"}
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-slate-200 border-dashed">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No submissions found</p>
              <p className="text-slate-400 text-sm">Students haven't submitted this homework yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeworkSubmissionsModal;