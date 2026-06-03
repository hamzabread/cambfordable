"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

let zoomGlobalLock = false;

interface ActiveQuestion {
  questionId: number;
  question: string;
  options: string[];
}

interface QuestionStats {
  questionId: number;
  counts: number[];
  totalResponses: number;
}

interface EndedQuestionResult {
  question: string;
  options: string[];
  correctOption: number;
  counts: number[];
  totalResponses: number;
}

export default function ZoomProvider({
  meetingData,
  classId,
}: {
  meetingData: any;
  classId: number;
}) {
  const deviceIdRef = useRef<string>("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const router = useRouter();

  const meetingSDKElement = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestion | null>(null);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<{
    isCorrect: boolean;
    correctOption: number;
  } | null>(null);
  const [endedResult, setEndedResult] = useState<EndedQuestionResult | null>(null);
  const [studentAnswerOpen, setStudentAnswerOpen] = useState(true);

  const [adminQuestionText, setAdminQuestionText] = useState("");
  const [adminOptions, setAdminOptions] = useState(["", "", "", ""]);
  const [adminCorrectOption, setAdminCorrectOption] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 16, y: 16 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storageKey = "zoom_device_id";
    const existing = window.localStorage.getItem(storageKey);
    if (existing) {
      deviceIdRef.current = existing;
      return;
    }

    const fallbackId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const newId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : fallbackId;
    window.localStorage.setItem(storageKey, newId);
    deviceIdRef.current = newId;
  }, []);

  // 1. Fetch Auth State to determine isAdmin
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUser(response.data);
      } catch (err) {
        localStorage.removeItem("access_token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // Determine admin status from the /auth/me response
  const isAdmin = user?.is_admin === true;

  useEffect(() => {
    if (loading || !user || !classId) {
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    const wsBase = apiBase.replace(/^http/i, "ws");
    const wsUrl = `${wsBase}/chat/ws/live-classes/${classId}/chat?token=${token}`;

    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ action: "question_sync_request" }));
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const eventType = payload.event_type;

        if (eventType === "question_publish" || eventType === "question_sync") {
          setActiveQuestion({
            questionId: payload.question_id,
            question: payload.question,
            options: payload.options,
          });
          setQuestionStats(null);
          setEndedResult(null);
          setStudentAnswerOpen(true);
          setAnswerFeedback(null);

          if (typeof payload.user_answer === "number") {
            setSelectedOption(payload.user_answer);
            setHasSubmitted(true);
          } else {
            setSelectedOption(null);
            setHasSubmitted(false);
          }
          return;
        }

        if (eventType === "question_stats") {
          setQuestionStats({
            questionId: payload.question_id,
            counts: payload.counts || [],
            totalResponses: payload.total_responses || 0,
          });
          return;
        }

        if (eventType === "question_ack") {
          setSelectedOption(payload.selected_option);
          setHasSubmitted(true);
          if (typeof payload.is_correct === "boolean") {
            setAnswerFeedback({
              isCorrect: payload.is_correct,
              correctOption: payload.correct_option,
            });
          }
          return;
        }

        if (eventType === "question_end") {
          setEndedResult({
            question: payload.question,
            options: payload.options,
            correctOption: payload.correct_option,
            counts: payload.counts || [],
            totalResponses: payload.total_responses || 0,
          });
          setActiveQuestion(null);
          setQuestionStats(null);
          setSelectedOption(null);
          setHasSubmitted(false);
          setStudentAnswerOpen(false);
          setAnswerFeedback(null);
        }
      } catch (err) {
        // Ignore non-JSON payloads and unrelated events.
      }
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [classId, loading, user]);

  useEffect(() => {
    if (loading || !user || !classId) {
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    let heartbeatId: ReturnType<typeof setInterval> | null = null;
    let canceled = false;

    const claimSession = async () => {
      try {
        await axios.post(
          `${apiBase}/live-classes/${classId}/session/claim`,
          { device_id: deviceIdRef.current },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (canceled) return;
        setSessionReady(true);
        setSessionError(null);

        heartbeatId = setInterval(async () => {
          try {
            await axios.post(
              `${apiBase}/live-classes/${classId}/session/heartbeat`,
              { device_id: deviceIdRef.current },
              { headers: { Authorization: `Bearer ${token}` } },
            );
          } catch (err) {
            setSessionReady(false);
            setSessionError("Your session is active on another device.");
          }
        }, 30000);
      } catch (err: any) {
        if (canceled) return;
        const message =
          err?.response?.status === 409
            ? "Your account is already active on another device."
            : "Unable to verify your session. Please try again.";
        setSessionReady(false);
        setSessionError(message);
      }
    };

    claimSession();

    return () => {
      canceled = true;
      if (heartbeatId) {
        clearInterval(heartbeatId);
      }
      axios.delete(
        `${apiBase}/live-classes/${classId}/session/release`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { device_id: deviceIdRef.current },
        },
      ).catch(() => {
        // Best effort cleanup.
      });
    };
  }, [classId, loading, user]);

  const sendSocketEvent = (payload: Record<string, unknown>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }
    wsRef.current.send(JSON.stringify(payload));
  };

  const handleAdminOptionChange = (index: number, value: string) => {
    setAdminOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handlePublishQuestion = () => {
    const normalizedQuestion = adminQuestionText.trim();
    const normalizedOptions = adminOptions.map((opt) => opt.trim()).filter(Boolean);

    if (!normalizedQuestion || normalizedOptions.length < 2) {
      return;
    }

    const correctedIndex = Math.min(adminCorrectOption, normalizedOptions.length - 1);

    sendSocketEvent({
      action: "question_publish",
      question: normalizedQuestion,
      options: normalizedOptions,
      correct_option: correctedIndex,
    });

    setAdminQuestionText("");
    setAdminOptions(["", "", "", ""]);
    setAdminCorrectOption(0);
  };

  const handleSelectOption = (optionIndex: number) => {
    if (hasSubmitted) {
      return;
    }
    setSelectedOption(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (hasSubmitted || !activeQuestion || selectedOption === null) {
      return;
    }
    sendSocketEvent({
      action: "question_submit",
      selected_option: selectedOption,
    });
  };

  const handleEndQuestion = () => {
    sendSocketEvent({ action: "question_end" });
  };

  const handlePanelMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdmin || !panelOpen) {
      return;
    }

    event.preventDefault();
    setIsDraggingPanel(true);
    dragOffsetRef.current = {
      x: event.clientX - panelPosition.x,
      y: event.clientY - panelPosition.y,
    };
  };

  useEffect(() => {
    if (!isDraggingPanel) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const nextX = Math.max(
        12,
        Math.min(window.innerWidth - 180, event.clientX - dragOffsetRef.current.x),
      );
      const nextY = Math.max(
        12,
        Math.min(window.innerHeight - 120, event.clientY - dragOffsetRef.current.y),
      );

      setPanelPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      setIsDraggingPanel(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingPanel]);

  useEffect(() => {
    // Only proceed if we have user data, meeting data, and no lock
    if (
      loading ||
      !user ||
      !meetingData?.signature ||
      !meetingSDKElement.current ||
      zoomGlobalLock ||
      !sessionReady ||
      sessionError
    )
      return;

    const setupZoom = async () => {
      try {
        zoomGlobalLock = true;
        const ZoomEmbedMod = await import("@zoom/meetingsdk/embedded");
        const ZoomMtgEmbedded =
          ZoomEmbedMod.ZoomMtgEmbedded || ZoomEmbedMod.default || ZoomEmbedMod;

        if (!clientRef.current) {
          clientRef.current = ZoomMtgEmbedded.createClient();
        }

        const client = clientRef.current;
        const mNumber = String(meetingData.meeting_id).replace(/\s/g, "");
        const sKey = String(meetingData.sdk_key).trim();
        const sig = String(meetingData.signature).trim();
        const pass = meetingData.password ? String(meetingData.password) : "";

        await client.init({
          zoomAppRoot: meetingSDKElement.current,
          language: "en-US",
          patchJsMedia: true,
          leaveUrl: `${window.location.origin}/courses`,
          appKey: sKey,
          customize: {
            meeting_info: isAdmin
              ? ["topic", "host", "participant_number"]
              : [],
            toolbar: {
              buttons: [
                { name: "participants", visible: isAdmin },
                { name: "share", visible: isAdmin },
                { name: "chat", visible: true },
                { name: "leave", visible: true },
              ],
            },
            video: {
              isUserDecode: true,
              viewSizes: {
                default: {
                  width: window.innerWidth,
                  height: window.innerHeight,
                },
                screenShare: {
                  width: window.innerWidth,
                  height: window.innerHeight,
                },
              },
              isSpeakerView: true,
              isResizable: false,
              viewType: "gallery",
            },
            chat: isAdmin
              ? {}
              : {
                  // Students can only chat with host
                  allowPrivateChat: false,
                },
            screenShare: isAdmin
              ? {}
              : {
                  // Students cannot share screen
                  sharePermission: false,
                },
          },
        });

        await client.join({
          signature: sig,
          meetingNumber: mNumber,
          password: pass,
          userName: user.full_name || user.username,
          userEmail: user.email,
        });

        // Speaker view is already set in video config above
        // No need to call setVideoLayout as it's not a standard API method

        client.on("connection-change", (payload: any) => {
          if (payload.state === "Closed" || payload.state === "Terminated") {
            zoomGlobalLock = false;
            // Instead of redirecting the current tab, we close it
            window.close();
            // Note: window.close() only works if the tab was opened via window.open()
          }
        });
      } catch (error: any) {
        console.error("Zoom Error:", error);
        if (error.type !== "ALREADY_JOINED") zoomGlobalLock = false;
      }
    };

    setupZoom();
    return () => {
      zoomGlobalLock = false;
    };
  }, [meetingData, isAdmin, loading, user]);

  const enterFullScreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
  };

  if (loading)
    return (
      <div className="bg-black h-screen w-screen flex items-center justify-center text-white">
        Loading Class...
      </div>
    );

  if (sessionError) {
    return (
      <div className="bg-black h-screen w-screen flex items-center justify-center text-white p-6 text-center">
        <div>
          <p className="text-lg font-semibold">{sessionError}</p>
          <p className="mt-2 text-sm text-white/70">
            Please close this tab or sign out on the other device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black w-screen h-screen overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          #zmmtg-root { 
            pointer-events: auto !important; 
            width: 100% !important;
            height: 100% !important;
            background-color: #104278 !important;
          }

          #zmmtg-root .meeting-app,
          #zmmtg-root .meeting-client,
          #zmmtg-root .meeting-container,
          #zmmtg-root .main-layout,
          #zmmtg-root .video-container,
          #zmmtg-root .share-view-container,
          #zmmtg-root .screen-share-container {
            background-color: #104278 !important;
          }

          #zmmtg-root .meeting-footer { 
            display: flex !important; 
            visibility: visible !important; 
            pointer-events: auto !important; 
          }

          /* ===== SCREEN SHARE FULLSCREEN SETTINGS ===== */
          #zmmtg-root.zm-embedded.zm-screen-sharing-view .share-view-container,
          #zmmtg-root.zm-embedded.zm-screen-sharing-view [class*="share-view"],
          #zmmtg-root.zm-embedded.zm-screen-sharing-view .screen-share-container {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            flex: 1 !important;
            object-fit: contain !important;
          }

          /* Ensure screenshare and video containers take full screen */
          #zmmtg-root .share-view-container,
          #zmmtg-root .share-view,
          #zmmtg-root .screen-share-container,
          #zmmtg-root .screen-shared-container,
          #zmmtg-root .video-container,
          #zmmtg-root .meeting-container,
          #zmmtg-root [class*="share-view"],
          #zmmtg-root [class*="screen"] {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
          }

          /* Ensure main video/content area is full screen */
          #zmmtg-root .video-js,
          #zmmtg-root .zm-video-container,
          #zmmtg-root video {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
          }

          /* Hide participant gallery during screen share for cleaner view */
          #zmmtg-root.zm-screen-sharing-view .gallery-layout,
          #zmmtg-root.zm-screen-sharing-view .filmstrip-container,
          #zmmtg-root.zm-screen-sharing-view [class*="participant-video"] {
            display: none !important;
          }
          
          ${
            !isAdmin
              ? `
            /* ===== STUDENT VIEW: HIDE ALL PARTICIPANT INFO ===== */
            
            /* Hide participant count badge */
            #zmmtg-root .header-info-participant-number,
            #zmmtg-root .footer-button__participants-indicator,
            #zmmtg-root [class*="participant-count"],
            
            /* Hide participants panel/sidebar */
            #zmmtg-root .footer-button__participants-container,
            #zmmtg-root .sidebar-container,
            #zmmtg-root .participant-list-container,
            #zmmtg-root .participants-button,
            #zmmtg-root .participant-panel-container,
            
            /* Hide gallery/participant video views */
            #zmmtg-root .item-list__gallery-view,
            #zmmtg-root .gallery-layout,
            #zmmtg-root .gallery-video-container,
            #zmmtg-root .gallery-item,
            #zmmtg-root .gallery-cell,
            
            /* Hide filmstrip (participant videos at bottom) */
            #zmmtg-root .filmstrip-video-container,
            #zmmtg-root .filmstrip-container,
            #zmmtg-root [class*="filmstrip"],
            
            /* Hide speaker view sidebar with participant list */
            #zmmtg-root .speaker-view-sidebar,
            #zmmtg-root .speaker-non-video-area,
            
            /* Hide other participant indicators */
            #zmmtg-root .avatar-wrapper[class*="participant"],
            #zmmtg-root [class*="video-container"][class*="remote"],
            #zmmtg-root .remote-video-container,
            
            /* Hide names/labels of other participants */
            #zmmtg-root .video-label,
            #zmmtg-root [class*="video-name"],
            #zmmtg-root .participant-display-name,
            
            /* Hide any view switching buttons that show participant list */
            #zmmtg-root .view-app-btn,
            #zmmtg-root [class*="layout-button"],
            #zmmtg-root [class*="view-switch"]
            {
              display: none !important;
              visibility: hidden !important;
              pointer-events: none !important;
              height: 0 !important;
              width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
            }

            /* Ensure teacher/admin video takes full screen */
            #zmmtg-root .active-video-container,
            #zmmtg-root .single-video-container,
            #zmmtg-root .speaker-video-container {
              width: 100% !important;
              height: 100% !important;
              display: flex !important;
              visibility: visible !important;
            }

            /* Hide participant list in header */
            #zmmtg-root .meeting-header [class*="participant"],
            #zmmtg-root .header-participant-count {
              display: none !important;
            }

            /* Ensure video stream is maximized */
            #zmmtg-root .video-js,
            #zmmtg-root video {
              width: 100% !important;
              height: 100% !important;
              object-fit: contain !important;
            }

          `
              : `
            /* ===== ADMIN/TEACHER VIEW: SHOW ALL CONTROLS ===== */
            
            #zmmtg-root .sidebar-container,
            #zmmtg-root .participant-list-container,
            #zmmtg-root .participant-panel-container,
            #zmmtg-root .footer-button__participants-container,
            #zmmtg-root .header-info-participant-number {
               visibility: visible !important;
               display: block !important;
               pointer-events: auto !important;
               z-index: 1000 !important;
            }

            /* Show participant count */
            #zmmtg-root .footer-button__participants-indicator,
            #zmmtg-root [class*="participant-count"] {
              display: block !important;
              visibility: visible !important;
            }
          `
          }

          /* Universal fixes for both views */
          #zmmtg-root button {
            background-color: transparent;
            text-transform: none;
          }

          #zmmtg-root .meeting-footer button {
            display: flex !important;
            visibility: visible !important;
          }

          /* Ensure footer buttons are clickable */
          #zmmtg-root .footer-button__leave {
            pointer-events: auto !important;
          }

          .css-1000dfy {
            padding: 0 20px !important;
          }

          .css-1lt6p2g {
            max-width: 95vw !important;
          }
        `,
        }}
      />

      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={enterFullScreen}
          className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full backdrop-blur-md border border-white/20"
        >
          ⛶
        </button>
      </div>

      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        {!panelOpen && isAdmin && (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="pointer-events-auto fixed top-4 left-4 bg-[#104278] text-white px-4 py-2 rounded-full shadow-lg font-semibold hover:opacity-90"
          >
            Open MCQ Panel
          </button>
        )}

        {isAdmin && panelOpen && (
          <div
            className="pointer-events-auto fixed w-90 max-w-[92vw] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4"
            style={{ left: panelPosition.x, top: panelPosition.y, touchAction: "none" }}
          >
            <div
              className="flex items-center justify-between mb-3 cursor-move select-none"
              onMouseDown={handlePanelMouseDown}
            >
              <h3 className="text-base font-bold text-slate-900">Live MCQ Panel</h3>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Hide
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={adminQuestionText}
                onChange={(e) => setAdminQuestionText(e.target.value)}
                placeholder="Type MCQ question"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
              />

              {adminOptions.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  value={option}
                  onChange={(e) => handleAdminOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                />
              ))}

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">Correct:</label>
                <select
                  value={adminCorrectOption}
                  onChange={(e) => setAdminCorrectOption(Number(e.target.value))}
                  className="px-2 py-1 rounded border border-slate-300 text-slate-900"
                >
                  <option value={0}>Option 1</option>
                  <option value={1}>Option 2</option>
                  <option value={2}>Option 3</option>
                  <option value={3}>Option 4</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePublishQuestion}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#104278] text-white font-semibold hover:opacity-90"
                >
                  Publish
                </button>
                <button
                  type="button"
                  onClick={handleEndQuestion}
                  disabled={!activeQuestion}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  End
                </button>
              </div>

              {activeQuestion && questionStats && (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900 mb-1">Live responses: {questionStats.totalResponses}</p>
                  {activeQuestion.options.map((option, index) => (
                    <p key={index}>
                      {index + 1}. {option} - {questionStats.counts[index] || 0}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!isAdmin && activeQuestion && (
          <>
            {!studentAnswerOpen && (
              <button
                type="button"
                onClick={() => setStudentAnswerOpen(true)}
                className="pointer-events-auto fixed bottom-6 right-6 bg-[#104278] text-white px-4 py-3 rounded-full shadow-lg font-semibold hover:opacity-90"
              >
                Answer MCQ
              </button>
            )}

            {studentAnswerOpen && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto w-140 max-w-[92vw] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-xs uppercase tracking-wide font-semibold text-[#104278]">Live Question</p>
                  <button
                    type="button"
                    onClick={() => setStudentAnswerOpen(false)}
                    className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    Hide
                  </button>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-3">{activeQuestion.question}</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeQuestion.options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={hasSubmitted}
                        onClick={() => handleSelectOption(index)}
                        className={`text-left px-3 py-2 rounded-lg border transition ${
                          isSelected
                            ? "bg-[#104278] text-white border-[#104278]"
                            : "bg-white text-slate-800 border-slate-300 hover:border-[#104278]"
                        } ${hasSubmitted ? "opacity-80 cursor-not-allowed" : ""}`}
                      >
                        {index + 1}. {option}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={hasSubmitted || selectedOption === null}
                    className="px-4 py-2 rounded-lg bg-[#104278] text-white font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    Submit Answer
                  </button>

                  {answerFeedback && (
                    <p className={`text-sm font-semibold ${answerFeedback.isCorrect ? "text-green-700" : "text-red-600"}`}>
                      {answerFeedback.isCorrect
                        ? "Correct answer"
                        : `Wrong answer. Correct: ${answerFeedback.correctOption + 1}`}
                    </p>
                  )}
                </div>

                {hasSubmitted && (
                  <p className="mt-3 text-sm font-medium text-green-700">Answer submitted.</p>
                )}
              </div>
            )}
          </>
        )}

        {endedResult && (
          <div className="absolute top-16 right-4 pointer-events-auto w-90 max-w-[92vw] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg p-4">
            <p className="text-xs uppercase tracking-wide font-semibold text-[#104278] mb-1">Question Ended</p>
            <p className="text-sm font-semibold text-slate-900 mb-2">{endedResult.question}</p>
            <p className="text-sm text-slate-700 mb-2">Total responses: {endedResult.totalResponses}</p>
            <div className="space-y-1 text-sm text-slate-700">
              {endedResult.options.map((option, index) => (
                <p key={index} className={index === endedResult.correctOption ? "font-semibold text-green-700" : ""}>
                  {index + 1}. {option} - {endedResult.counts[index] || 0}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setEndedResult(null)}
              className="mt-3 text-xs font-medium text-[#104278] underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      <div id="zmmtg-root" ref={meetingSDKElement} className="w-full h-full" />
    </div>
  );
}
