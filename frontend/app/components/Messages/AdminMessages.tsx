"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Send, Loader, AlertCircle, Users } from "lucide-react";

interface Message {
  id: number;
  message: string;
  created_at: string;
  user_id: number;
}

interface LiveClass {
  id: number;
  title: string;
  course_id: number;
  starts_at: string;
  ends_at: string;
}

interface User {
  id: number;
  username: string;
}

interface AdminMessagesProps {
  user: User;
}

const AdminMessages = ({ user }: AdminMessagesProps) => {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [activeUsers, setActiveUsers] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all live classes
  useEffect(() => {
    const fetchLiveClasses = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        setLoading(true);

        // Fetch all courses
        const coursesRes = await axios.get("http://localhost:8000/courses/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch all live classes
        const classesRes = await axios.get(
          "http://localhost:8000/live-classes/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setLiveClasses(classesRes.data);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching live classes:", err);
        if (err.response?.status !== 405) {
          setError("Failed to load live classes");
        }
        // Fallback data
        setLiveClasses([
          {
            id: 1,
            title: "Chemistry Live Session",
            course_id: 1,
            starts_at: new Date().toISOString(),
            ends_at: new Date(Date.now() + 3600000).toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveClasses();
  }, []);

  // Connect to WebSocket when class is selected
  useEffect(() => {
    if (!selectedClass) return;

    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Fetch chat history
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/chat/${selectedClass}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data);
        const userIds = new Set<number>(
          response.data.map((msg: any) => msg.user_id)
        );
        setActiveUsers(userIds);
        scrollToBottom();
      } catch (err) {
        console.error("Error fetching chat history:", err);
      }
    };

    fetchChatHistory();

    // Connect WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//localhost:8000/chat/ws/live-classes/${selectedClass}/chat?token=${token}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("Connected to admin chat");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      setActiveUsers((prev) => new Set([...prev, data.user_id]));
      scrollToBottom();
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Failed to connect to chat");
    };

    websocket.onclose = () => {
      console.log("Disconnected from admin chat");
      setWs(null);
    };

    // Cleanup: close WebSocket when component unmounts or selectedClass changes
    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [selectedClass]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() || !ws || ws.readyState !== WebSocket.OPEN) {
      setError("Message could not be sent");
      return;
    }

    const messageContent = messageText;

    try {
      setSending(true);
      setMessageText("");
      setError(null);

      // Send via WebSocket - don't add optimistically
      // The server will broadcast it back and we'll add it in onmessage
      ws.send(messageContent);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isClassLive = (startsAt: string, endsAt: string) => {
    const now = new Date();
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading live classes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Selection */}
      {liveClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveClasses.map((cls) => {
            const live = isClassLive(cls.starts_at, cls.ends_at);
            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`p-4 rounded-lg border-2 transition text-left ${
                  selectedClass === cls.id
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900 flex-1">
                    {cls.title}
                  </h3>
                  {live && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">View chat and messages</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">
            No live classes available
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Create a live class to view student messages
          </p>
        </div>
      )}

      {/* Chat Area */}
      {selectedClass && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-96">
          {/* Header */}
          <div className="border-b border-slate-200 p-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">
              {liveClasses.find((c) => c.id === selectedClass)?.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4" />
              <span>{activeUsers.size} active</span>
            </div>
          </div>

          {/* Messages Display */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                <p className="text-sm">
                  No messages yet. Students will appear here when they message.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {msg.user_id === user.id
                        ? "You (Admin)"
                        : `User ${msg.user_id}`}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <p
                    className={`text-slate-700 text-sm p-3 rounded-lg max-w-md ${
                      msg.user_id === user.id
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-slate-50 border border-slate-200"
                    }`}
                  >
                    {msg.message}
                  </p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-red-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            </div>
          )}

          {/* Message Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-slate-200 p-4 flex gap-2"
          >
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Send a message to students..."
              disabled={!ws || ws.readyState !== WebSocket.OPEN}
              className="flex-1 px-4 py-2 border text-black placeholder:text-[#b3b3b3] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={
                sending ||
                !ws ||
                ws.readyState !== WebSocket.OPEN ||
                !messageText.trim()
              }
              className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {sending ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;
