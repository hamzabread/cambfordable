"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Clock, Award, FileText, Eye, X, Download, ExternalLink, AlertTriangle, Upload, Trash2 } from "lucide-react";

interface Submission {
  submission_id?: number;
  id?: number;
  student_name?: string;
  student_email?: string;
  user_id?: number;
  submitted_at: string;
  status?: "pending" | "graded";
  score: number | null;
  total_marks: number;
  quiz_id: number;
  is_late?: boolean;
  tab_switches?: number;
  fullscreen_exits?: number;
  auto_submitted?: boolean;
  flagged_for_review?: boolean;
}

interface Answer {
  question_id: number;
  question_text: string;
  is_mcq: boolean;
  marks: number;
  selected_option?: {
    id: number;
    option_text: string;
  };
  user_answer?: string;
  uploaded_file_url?: string;
  original_filename?: string;
  correct_answer?: string;
  is_correct?: boolean;
  points_awarded?: number;
}

interface Quiz {
  id: number;
  title: string;
  total_marks: number;
  course_id: number;
  course_name?: string;
}

interface QuizSubmissionsGradingProps {
  quizId?: number;
  quizTitle?: string;
  isTAMode?: boolean;
}

const QuizSubmissionsGrading: React.FC<QuizSubmissionsGradingProps> = ({
  quizId: initialQuizId,
  quizTitle: initialQuizTitle,
  isTAMode = false,
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [grading, setGrading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scores, setScores] = useState<{ [key: number]: number }>({});
  const [viewingAnswers, setViewingAnswers] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [solutionUrl, setSolutionUrl] = useState<string | null>(null);
  const [uploadingSolution, setUploadingSolution] = useState(false);

  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(
    initialQuizId || null
  );
  const [selectedQuizTitle, setSelectedQuizTitle] = useState<string>(
    initialQuizTitle || ""
  );

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuizId) {
      fetchSubmissions();
    }
  }, [selectedQuizId]);

  const isFileUrl = (str: string): boolean => {
    if (!str) return false;
    return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/');
  };

  const getFilenameFromUrl = (url: string, originalFilename?: string): string => {
    if (originalFilename) return originalFilename;

    try {
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const decoded = decodeURIComponent(filename);

      const lastUnderscoreIndex = decoded.lastIndexOf("_");

      if (lastUnderscoreIndex !== -1) {
        const namePart = decoded.substring(0, lastUnderscoreIndex);
        const rest = decoded.substring(lastUnderscoreIndex + 1);

        if (rest.includes(".")) {
          const ext = rest.split(".")[1];
          return `${namePart}.${ext}`;
        }
      }
      return decoded;
    } catch {
      return 'downloaded-file';
    }
  };

  const getFullFileUrl = (fileUrl: string): string => {
    if (!fileUrl) return "";
    
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    
    const cleanPath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return `${apiUrl}/${cleanPath}`;
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      
      // Use /courses/me for TAs, /courses/ for admins
      const coursesUrl = isTAMode 
        ? `${process.env.NEXT_PUBLIC_API_URL}/courses/me`
        : `${process.env.NEXT_PUBLIC_API_URL}/courses/`;
      
      const coursesRes = await axios.get(coursesUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allQuizzes: Quiz[] = [];

      for (const course of coursesRes.data) {
        try {
          const quizzesRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/quizzes/course/${course.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          // Add course_name to each quiz
          const quizzesWithCourse = quizzesRes.data.map((quiz: any) => ({
            ...quiz,
            course_name: course.name,
          }));
          allQuizzes.push(...quizzesWithCourse);
        } catch (err) {
          console.log(`No quizzes for course ${course.id}`);
        }
      }

      setQuizzes(allQuizzes);
      setError(null);
    } catch (err) {
      setError("Failed to load quizzes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!selectedQuizId) return;

    setSubmissionsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/quiz-submissions/quiz/${selectedQuizId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      let submissionsData = Array.isArray(response.data) ? response.data : [response.data];
      
      const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId);
      const totalMarks = selectedQuiz?.total_marks || 0;
      
      submissionsData = submissionsData.map((sub) => ({
        ...sub,
        total_marks: sub.total_marks || totalMarks,
      }));
      
      setSubmissions(submissionsData);
      setError(null);
    } catch (err) {
      setError("Failed to load submissions");
      console.error(err);
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleSelectQuiz = (quizId: number) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (quiz) {
      setSelectedQuizId(quizId);
      setSelectedQuizTitle(quiz.title);
      setScores({});
      setSolutionUrl(null);
      fetchSolutionUrl(quizId);
    }
  };

  const fetchSolutionUrl = async (quizId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/quizzes/${quizId}/solution`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSolutionUrl(res.data.solution_url);
    } catch {
      setSolutionUrl(null);
    }
  };

  const handleUploadSolution = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedQuizId || !e.target.files?.[0]) return;
    setUploadingSolution(true);
    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/quizzes/${selectedQuizId}/solution`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      setSolutionUrl(res.data.solution_url);
      setSuccess("Solution uploaded successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to upload solution");
    } finally {
      setUploadingSolution(false);
      e.target.value = "";
    }
  };

  const handleRemoveSolution = async () => {
    if (!selectedQuizId) return;
    try {
      const token = localStorage.getItem("access_token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/quizzes/${selectedQuizId}/solution`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSolutionUrl(null);
      setSuccess("Solution removed");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to remove solution");
    }
  };

  const handleGradeSubmission = async (submission: Submission) => {
    const submissionId = submission.submission_id || submission.id;
    if (!submissionId) {
      setError("Invalid submission ID");
      return;
    }

    const score = scores[submissionId];

    if (score === undefined || score === null || isNaN(score) || score < 0) {
      setError("Please enter a valid score");
      return;
    }

    if (score > submission.total_marks) {
      setError(`Score cannot exceed ${submission.total_marks}`);
      return;
    }

    setGrading(submissionId);
    setError(null);
    
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/quiz-submissions/grade`,
        {
          submission_id: submissionId,
          score: score,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(
        `✅ ${submission.student_name || 'Student'} graded with ${score}/${submission.total_marks}`
      );
      setScores((prev) => {
        const updated = { ...prev };
        delete updated[submissionId];
        return updated;
      });

      setTimeout(() => fetchSubmissions(), 1000);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to grade submission");
      console.error("Grading error:", err);
    } finally {
      setGrading(null);
    }
  };

  const handleViewAnswers = async (submissionId: number) => {
    setViewingAnswers(submissionId);
    setLoadingAnswers(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/quiz-submissions/${submissionId}/answers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const answersData = response.data.answers || [];
      setAnswers(answersData);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load answers");
      console.error("Load answers error:", err);
      setViewingAnswers(null);
    } finally {
      setLoadingAnswers(false);
    }
  };

  const closeAnswersModal = () => {
    setViewingAnswers(null);
    setAnswers([]);
  };

  const gradedCount = submissions.filter((s) => s.status === "graded" || (s.score !== null && s.score !== undefined)).length;
  const pendingCount = submissions.filter((s) => s.status === "pending" || (s.score === null || s.score === undefined)).length;
  const flaggedCount = submissions.filter((s) => s.flagged_for_review).length;

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

  if (!selectedQuizId) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Grade Submissions</h3>
          <p className="text-slate-600">Select a quiz to view and grade student submissions</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">No quizzes available</p>
            <p className="text-slate-500 text-sm mt-1">
              Create a quiz first to grade submissions
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {(() => {
              // Group quizzes by course
              const courseMap = new Map<number, { name: string; quizzes: Quiz[] }>();
              quizzes.forEach((quiz) => {
                if (!courseMap.has(quiz.course_id)) {
                  courseMap.set(quiz.course_id, {
                    name: quiz.course_name || "Unknown Course",
                    quizzes: [],
                  });
                }
                courseMap.get(quiz.course_id)!.quizzes.push(quiz);
              });

              // Convert to sorted array
              const courses = Array.from(courseMap.entries())
                .map(([, value]) => value)
                .sort((a, b) => a.name.localeCompare(b.name));

              return courses.map((course) => (
                <div key={course.name}>
                  <h4 className="text-xl font-bold text-slate-900 mb-4">
                    {course.name}
                  </h4>
                  <div className="space-y-3">
                    {course.quizzes.map((quiz) => (
                      <button
                        key={quiz.id}
                        onClick={() => handleSelectQuiz(quiz.id)}
                        className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition bg-white shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {quiz.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Total Marks: {quiz.total_marks}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-blue-600 font-medium">
                              Click to grade →
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => {
          setSelectedQuizId(null);
          setSelectedQuizTitle("");
          setSubmissions([]);
          setError(null);
        }}
        className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
      >
        ← Back to Quizzes
      </button>

      <div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          {selectedQuizTitle}
        </h3>
        <p className="text-slate-600">Manage and grade student submissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-xs text-slate-600">Total Submissions</p>
              <p className="text-2xl font-bold text-blue-600">
                {submissions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-xs text-slate-600">Graded</p>
              <p className="text-2xl font-bold text-green-600">{gradedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-xs text-slate-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-xs text-slate-600">Flagged</p>
              <p className="text-2xl font-bold text-red-600">{flaggedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Solution Upload Section */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Solution File
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Upload a solution — students who submitted can download it
            </p>
          </div>
          <div className="flex items-center gap-3">
            {solutionUrl ? (
              <>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}${solutionUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition text-sm font-medium border border-purple-200"
                >
                  <Download className="w-4 h-4" />
                  View Solution
                </a>
                <button
                  onClick={handleRemoveSolution}
                  className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition text-sm font-medium border border-red-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </>
            ) : (
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition ${
                uploadingSolution
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}>
                <Upload className="w-4 h-4" />
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-3">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {submissionsLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading submissions...</p>
          </div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No submissions yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Submissions will appear here once students take the quiz
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => {
            const submissionId = submission.submission_id || submission.id;
            const isGraded = submission.score !== null && submission.score !== undefined;
            const studentName = submission.student_name || "Unknown Student";
            const studentEmail = submission.student_email || "No email";
            
            if (!submissionId) return null;
            
            return (
            <div
              key={submissionId}
              className={`bg-white rounded-lg shadow-sm border p-4 transition ${
                isGraded
                  ? "border-green-200 bg-green-50"
                  : submission.flagged_for_review
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-slate-900 truncate">
                      {studentName}
                    </p>
                    {submission.flagged_for_review && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 border border-red-300 rounded text-red-700 text-xs font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        FLAGGED
                      </span>
                    )}
                    {submission.auto_submitted && (
                      <span className="px-2 py-0.5 bg-orange-100 border border-orange-300 rounded text-orange-700 text-xs font-bold">
                        AUTO-SUBMIT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {studentEmail}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {submission.submitted_at
                      ? new Date(submission.submitted_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "No submission date"}
                  </p>
                  
                  {/* Proctoring warnings */}
                  {((submission.tab_switches && submission.tab_switches > 0) || 
                    (submission.fullscreen_exits && submission.fullscreen_exits > 0)) && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {submission.tab_switches && submission.tab_switches > 0 && (
                        <span className={`px-2 py-1 rounded ${
                          submission.tab_switches > 2 
                            ? "bg-red-100 text-red-700 border border-red-200" 
                            : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        }`}>
                          Tab switches: {submission.tab_switches}
                        </span>
                      )}
                      {submission.fullscreen_exits && submission.fullscreen_exits > 0 && (
                        <span className={`px-2 py-1 rounded ${
                          submission.fullscreen_exits > 1 
                            ? "bg-red-100 text-red-700 border border-red-200" 
                            : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        }`}>
                          Fullscreen exits: {submission.fullscreen_exits}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    {isGraded ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                          {submission.score || 0}/{submission.total_marks || 0}
                        </span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-600 whitespace-nowrap">
                          Pending
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => handleViewAnswers(submissionId)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View Answers
                  </button>

                  {!isGraded && (
                    <div className="flex gap-2 ml-auto">
                      <input
                        type="number"
                        min={0}
                        max={submission.total_marks || 100}
                        step="0.5"
                        value={scores[submissionId] ?? ""}
                        onChange={(e) =>
                          setScores({
                            ...scores,
                            [submissionId]: Number(e.target.value),
                          })
                        }
                        placeholder={`Score (max ${submission.total_marks || 0})`}
                        className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleGradeSubmission(submission)}
                        disabled={grading === submissionId || scores[submissionId] === undefined}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition text-sm whitespace-nowrap"
                      >
                        {grading === submissionId
                          ? "Grading..."
                          : "Grade"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {viewingAnswers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-slate-900">Submission Answers</h3>
              <button
                onClick={closeAnswersModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingAnswers ? (
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading answers...</p>
                  </div>
                </div>
              ) : answers.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">No answers found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {answers.map((answer, index) => {
                    let studentAnswer;
                    let hasUploadedFile = false;
                    
                    if (answer.is_mcq) {
                      studentAnswer = answer.selected_option?.option_text || "No option selected";
                    } else {
                      if (answer.uploaded_file_url && isFileUrl(answer.uploaded_file_url)) {
                        hasUploadedFile = true;
                        studentAnswer = answer.uploaded_file_url;
                      } else {
                        studentAnswer = answer.user_answer || answer.uploaded_file_url || "No answer provided";
                      }
                    }
                    
                    const isCorrect = answer.is_correct ?? false;
                    
                    return (
                    <div
                      key={answer.question_id}
                      className="p-4 rounded-lg border-2 border-slate-200 bg-slate-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-700">
                            Question {index + 1}
                          </span>
                          {answer.is_correct !== undefined && (
                            answer.is_correct ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )
                          )}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          {answer.marks} marks
                        </span>
                      </div>

                      <p className="text-slate-900 font-medium mb-3">
                        {answer.question_text}
                      </p>

                      <div className="mb-3">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {answer.is_mcq ? "Multiple Choice" : hasUploadedFile ? "File Upload" : "Short Answer"}
                        </span>
                      </div>

                      <div className="mb-2">
                        <p className="text-xs font-semibold text-slate-600 mb-1">
                          Student's Answer:
                        </p>
                        
                        {hasUploadedFile ? (
                          <div className="bg-white p-4 rounded border border-slate-200">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">
                                    {getFilenameFromUrl(studentAnswer, answer.original_filename)}
                                  </p>
                                  <p className="text-xs text-slate-500">Uploaded file</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <a
                                  href={`${getFullFileUrl(studentAnswer)}?mode=view`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View
                                </a>
                                <a
                                  href={getFullFileUrl(studentAnswer)}
                                  download={getFilenameFromUrl(studentAnswer, answer.original_filename)}
                                  className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </a>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200">
                            {studentAnswer}
                          </p>
                        )}
                      </div>

                      {answer.is_mcq && answer.selected_option && (
                        <p className="text-xs text-slate-500 mt-2">
                          Selected Option ID: {answer.selected_option.id}
                        </p>
                      )}

                      {!isCorrect && answer.correct_answer && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-slate-600 mb-1">
                            Correct Answer:
                          </p>
                          <p className="text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200">
                            {answer.correct_answer}
                          </p>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={closeAnswersModal}
                className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSubmissionsGrading;