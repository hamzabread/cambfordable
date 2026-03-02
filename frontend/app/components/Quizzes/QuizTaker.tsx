"use client";

import React, { useState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, Send, Upload, X, FileText, Shield, Eye, AlertTriangle, Maximize, ImageIcon, Download } from "lucide-react";

interface Option {
  id: number;
  option_text: string;
}

interface Question {
  id: number;
  question_text: string;
  is_mcq: boolean;
  marks: number;
  options: Option[];
  image_url?: string | null;
}

interface QuizData {
  id: number;
  title: string;
  total_marks: number;
  course_id: number;
  deadline: string | null;
  is_published: boolean;
  allow_late: boolean;
  questions: Question[];
}

interface QuizTakerProps {
  quizId: number;
  onSubmit?: () => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ quizId, onSubmit }) => {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: number]: boolean }>({});
  
  // Anti-cheat states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState<number | null>(null);

  const [answers, setAnswers] = useState<{ [key: number]: any }>({});
  const [fileNames, setFileNames] = useState<{ [key: number]: string }>({});
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Maximum violations allowed before auto-submit
  const MAX_TAB_SWITCHES = 2;
  const MAX_FULLSCREEN_EXITS = 2;

  useEffect(() => {
    fetchQuiz();
    
    // Cleanup on unmount
    return () => {
      if (autoSubmitTimerRef.current) clearInterval(autoSubmitTimerRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      exitFullscreen();
    };
  }, [quizId]);

  // Set up anti-cheat monitoring when quiz starts
  useEffect(() => {
    if (!quizStarted) return;

    // Fullscreen change detection
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && quizStarted) {
        handleFullscreenExit();
      }
    };

    // Tab visibility change detection
    const handleVisibilityChange = () => {
      if (document.hidden && quizStarted) {
        handleTabSwitch();
      }
    };

    // Prevent copy-paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      showTemporaryWarning("Copying is disabled during the quiz");
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      showTemporaryWarning("Pasting is disabled during the quiz");
    };

    // Prevent right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showTemporaryWarning("Right-click is disabled during the quiz");
    };

    // Add event listeners
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [quizStarted]);

  const showTemporaryWarning = (message: string) => {
    setWarningMessage(message);
    setShowWarning(true);
    
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(false);
    }, 3000);
  };

  const handleTabSwitch = () => {
    setTabSwitches(prev => {
      const newCount = prev + 1;
      
      if (newCount >= MAX_TAB_SWITCHES) {
        triggerAutoSubmit("Maximum tab switches exceeded. Quiz is being auto-submitted.");
      } else {
        showTemporaryWarning(
          `Warning: Tab switching detected (${newCount}/${MAX_TAB_SWITCHES}). ${MAX_TAB_SWITCHES - newCount} warnings remaining.`
        );
      }
      
      return newCount;
    });
  };

  const handleFullscreenExit = () => {
    setFullscreenExits(prev => {
      const newCount = prev + 1;
      
      if (newCount >= MAX_FULLSCREEN_EXITS) {
        triggerAutoSubmit("Exited fullscreen too many times. Quiz is being auto-submitted.");
      } else {
        showTemporaryWarning(
          `Warning: You exited fullscreen (${newCount}/${MAX_FULLSCREEN_EXITS}). Please click the button to return to fullscreen. ${MAX_FULLSCREEN_EXITS - newCount} exits remaining before auto-submit.`
        );
      }
      
      return newCount;
    });
  };

  const triggerAutoSubmit = (reason: string) => {
    setError(reason);
    setAutoSubmitCountdown(5);
    
    let countdown = 5;
    autoSubmitTimerRef.current = setInterval(() => {
      countdown--;
      setAutoSubmitCountdown(countdown);
      
      if (countdown <= 0) {
        if (autoSubmitTimerRef.current) clearInterval(autoSubmitTimerRef.current);
        handleSubmit(true); // Force submit
      }
    }, 1000);
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).mozRequestFullScreen) {
      (elem as any).mozRequestFullScreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  };

  const startQuiz = () => {
    enterFullscreen();
    setQuizStarted(true);
  };

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/quizzes/${quizId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (!response.ok) throw new Error("Failed to fetch quiz");
      
      const data = await response.json();
      setQuiz(data);
      setError(null);
    } catch (err) {
      setError("Failed to load quiz");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    });
  };

  const handleFileUpload = async (questionId: number, file: File) => {
    setUploadingFiles({ ...uploadingFiles, [questionId]: true });
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/uploads/quiz-answer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data = await response.json();
      const fileUrl = data.file_url;
      
      if (!fileUrl) {
        throw new Error("No file URL returned from server");
      }
      
      handleAnswerChange(questionId, fileUrl);
      setFileNames({ ...fileNames, [questionId]: file.name });
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
      console.error(err);
    } finally {
      setUploadingFiles({ ...uploadingFiles, [questionId]: false });
    }
  };

  const handleFileRemove = (questionId: number) => {
    const newAnswers = { ...answers };
    delete newAnswers[questionId];
    setAnswers(newAnswers);

    const newFileNames = { ...fileNames };
    delete newFileNames[questionId];
    setFileNames(newFileNames);
  };

  const handleSubmit = async (forceSubmit: boolean = false) => {
    if (!quiz) return;

    // Check if all questions are answered (unless forced auto-submit)
    if (!forceSubmit) {
      const unanswered = quiz.questions.filter((q) => !(q.id in answers));
      if (unanswered.length > 0) {
        setError(`Please answer all ${unanswered.length} question(s)`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("access_token");

      const payload = {
        quiz_id: quizId,
        answers: quiz.questions.map((question) => {
          const answer: any = {
            question_id: question.id,
          };

          if (question.is_mcq) {
            answer.selected_option_id = answers[question.id] ? Number(answers[question.id]) : null;
            answer.uploaded_file_url = null;
          } else {
            answer.selected_option_id = null;
            answer.uploaded_file_url = answers[question.id] ? String(answers[question.id]) : null;
          }

          return answer;
        }),
        tab_switches: tabSwitches,
        fullscreen_exits: fullscreenExits,
        auto_submitted: forceSubmit,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/quiz-submissions/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: responseText };
        }
        
        const errorMsg = errorData.detail 
          ? (typeof errorData.detail === 'string' 
              ? errorData.detail 
              : JSON.stringify(errorData.detail))
          : "Failed to submit quiz";
        
        throw new Error(errorMsg);
      }

      setSuccess("✅ Quiz submitted successfully!");
      exitFullscreen();
      
      setTimeout(() => {
        if (onSubmit) onSubmit();
      }, 2000);
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        Failed to load quiz
      </div>
    );
  }

  // Show start screen before quiz begins
  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg border-2 border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{quiz.title}</h1>
          <p className="text-slate-600 mb-6">
            Total Marks: <span className="font-bold">{quiz.total_marks}</span> | 
            Questions: <span className="font-bold">{quiz.questions.length}</span>
          </p>

          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-yellow-900 text-lg mb-2">Anti-Cheating Measures Active</h3>
                <p className="text-yellow-800 text-sm mb-3">
                  This quiz uses proctoring technology to ensure academic integrity.
                </p>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-yellow-900">
              <li className="flex items-start gap-2">
                <Maximize className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Fullscreen Required:</strong> You must stay in fullscreen mode. Exiting fullscreen more than {MAX_FULLSCREEN_EXITS} times will auto-submit your quiz.</span>
              </li>
              <li className="flex items-start gap-2">
                <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>No Tab Switching:</strong> Switching tabs or windows more than {MAX_TAB_SWITCHES} times will auto-submit your quiz.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Copy/Paste Disabled:</strong> You cannot copy or paste text during the quiz.</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><strong>Activity Logged:</strong> All suspicious activities will be logged and reported to your instructor.</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-900 text-sm">
              ⓘ By clicking "Start Quiz", you agree to the proctoring terms and acknowledge that violations may result in automatic submission and academic consequences.
            </p>
          </div>

          <button
            onClick={startQuiz}
            className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 text-lg"
          >
            <Shield className="w-5 h-5" />
            I Understand - Start Quiz
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;

  return (
    <div className="space-y-6">
      {/* Anti-cheat status bar */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-4 sticky top-0 z-40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5" />
            <span className="font-bold">Proctored Quiz Active</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>Tab Switches: {tabSwitches}/{MAX_TAB_SWITCHES}</span>
            </div>
            <div className="flex items-center gap-2">
              <Maximize className="w-4 h-4" />
              <span>Fullscreen Exits: {fullscreenExits}/{MAX_FULLSCREEN_EXITS}</span>
            </div>
            {isFullscreen ? (
              <div className="flex items-center gap-2 bg-green-500 px-3 py-1 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Fullscreen Active</span>
              </div>
            ) : (
              <button
                onClick={enterFullscreen}
                className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-full font-medium transition animate-pulse"
              >
                <Maximize className="w-4 h-4" />
                <span>Click to Return to Fullscreen</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Warning overlay */}
      {showWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-pulse">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-red-400 max-w-md">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <p className="font-bold">{warningMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Auto-submit countdown */}
      {autoSubmitCountdown !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Auto-Submitting Quiz</h2>
            <p className="text-slate-700 mb-4">{error}</p>
            <p className="text-4xl font-bold text-red-600 mb-4">{autoSubmitCountdown}</p>
            <p className="text-sm text-slate-600">Your quiz will be automatically submitted...</p>
          </div>
        </div>
      )}

      {/* Quiz Header */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{quiz.title}</h1>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Total Marks:</span>
            <span className="font-bold text-slate-900">{quiz.total_marks}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Questions:</span>
            <span className="font-bold text-slate-900">{totalQuestions}</span>
          </div>
          <div className="flex items-center gap-2 text-blue-600">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && !autoSubmitCountdown && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {quiz.questions.map((question, idx) => (
          <div
            key={question.id}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Question {idx + 1}
                </h3>
                <p className="text-slate-700">{question.question_text}</p>
              </div>
              <div className="ml-4 px-3 py-1 bg-blue-100 rounded-full text-blue-700 text-sm font-semibold whitespace-nowrap">
                {question.marks} mark{question.marks > 1 ? "s" : ""}
              </div>
            </div>

            {/* Question Image */}
            {question.image_url && (
              <div className="mt-4 bg-white rounded-lg border border-slate-300 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-300">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <ImageIcon className="w-4 h-4" />
                    Question Visual
                  </div>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}${question.image_url}`}
                    download
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </a>
                </div>
                <div className="p-4 flex justify-center bg-white min-h-[100px]">
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}${question.image_url}`}
                    alt="Question visual"
                    className="max-w-full h-auto max-h-[500px] object-contain rounded cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setViewingImage(`${process.env.NEXT_PUBLIC_API_URL}${question.image_url}`)}
                  />
                </div>
              </div>
            )}

            {question.is_mcq ? (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-semibold text-slate-600">
                  Select one option:
                </p>
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                        answers[question.id] === option.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option.id}
                        checked={answers[question.id] === option.id}
                        onChange={(e) =>
                          handleAnswerChange(question.id, Number(e.target.value))
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-slate-700">{option.option_text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-600 mb-2">
                  Upload your answer:
                </p>
                
                {!answers[question.id] ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="mb-2 text-sm text-slate-600">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500">PDF, DOC, DOCX, TXT, PNG, JPEG, or other images (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.webp,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(question.id, file);
                        }
                      }}
                      disabled={uploadingFiles[question.id]}
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          {fileNames[question.id] || "File uploaded"}
                        </p>
                        <p className="text-xs text-green-600">Ready to submit</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFileRemove(question.id)}
                      className="p-1 hover:bg-green-100 rounded transition"
                    >
                      <X className="w-5 h-5 text-green-700" />
                    </button>
                  </div>
                )}

                {uploadingFiles[question.id] && (
                  <div className="mt-2 flex items-center gap-2 text-blue-600 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Uploading file...</span>
                  </div>
                )}
              </div>
            )}

            {question.id in answers && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Answered</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="text-sm text-slate-600">
          <span className="font-semibold">
            {answeredCount}/{totalQuestions}
          </span>
          {" "}questions answered
        </div>
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting || answeredCount !== totalQuestions}
          className={`px-8 py-3 font-bold rounded-lg transition flex items-center gap-2 ${
            submitting || answeredCount !== totalQuestions
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
          }`}
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Quiz
            </>
          )}
        </button>
      </div>

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
                alt="Question visual"
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
    </div>
  );
};

export default QuizTaker;