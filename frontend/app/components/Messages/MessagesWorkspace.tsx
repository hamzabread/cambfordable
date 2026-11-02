"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { AlertCircle, CalendarClock, Loader2, MessageSquareText, MoreVertical, Search, Send, UsersRound, Video } from "lucide-react";
import { API_URL, authHeaders, CourseCatalogItem, getAccessToken, getApiError, getWebSocketUrl, LiveClass, PortalUser } from "@/lib/portal";

interface ChatMessage {
  id: number;
  live_class_id: number;
  user_id: number;
  message: string;
  created_at: string;
  is_admin: boolean;
  sender_name: string;
}

interface MessagesWorkspaceProps {
  user: PortalUser;
  /** Opens the Course questions tab, for students with no live class. */
  onAskQuestion?: () => void;
}

type ClassStatus = "live" | "upcoming" | "past";

function classStatus(item: LiveClass): ClassStatus {
  const now = Date.now();
  if (now < new Date(item.starts_at).getTime()) return "upcoming";
  if (now > new Date(item.ends_at).getTime()) return "past";
  return "live";
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatClassDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function MessagesWorkspace({ user, onAskQuestion }: MessagesWorkspaceProps) {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadClasses = async () => {
      const token = getAccessToken();
      if (!token) return;
      try {
        const [classResponse, courseResponse] = await Promise.all([
          axios.get<LiveClass[]>(`${API_URL}${user.is_admin ? "/live-classes/" : "/live-classes/me"}`, { headers: authHeaders(token) }),
          axios.get<CourseCatalogItem[]>(`${API_URL}/courses/catalog`, { headers: authHeaders(token) }),
        ]);
        const visibleClasses = user.is_admin ? classResponse.data : classResponse.data.filter((item) => classStatus(item) === "live");
        const sorted = [...visibleClasses].sort((a, b) => {
          const weights = { live: 0, upcoming: 1, past: 2 };
          return weights[classStatus(a)] - weights[classStatus(b)] || new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime();
        });
        setClasses(sorted);
        setCourses(courseResponse.data);
        setSelectedClassId((current) => current ?? sorted[0]?.id ?? null);
        setError(null);
      } catch (requestError) {
        setError(getApiError(requestError, "We could not load class conversations."));
      } finally {
        setLoadingClasses(false);
      }
    };
    void loadClasses();
  }, [user]);

  useEffect(() => {
    if (!selectedClassId) return;
    const token = getAccessToken();
    if (!token) return;
    let cancelled = false;
    setLoadingMessages(true);
    setMessages([]);
    setConnected(false);
    setError(null);

    const loadHistory = async () => {
      try {
        const response = await axios.get<ChatMessage[]>(`${API_URL}/chat/${selectedClassId}/messages`, { headers: authHeaders(token) });
        if (!cancelled) setMessages(response.data);
      } catch (requestError) {
        if (!cancelled) setError(getApiError(requestError, "We could not load this conversation."));
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    };
    void loadHistory();

    const selected = classes.find((item) => item.id === selectedClassId);
    const canConnect = user.is_admin || (selected && classStatus(selected) === "live");
    if (!canConnect) return () => { cancelled = true; };

    const socket = new WebSocket(getWebSocketUrl(`/chat/ws/live-classes/${selectedClassId}/chat`, token));
    socketRef.current = socket;
    socket.onopen = () => { if (!cancelled) setConnected(true); };
    socket.onmessage = (event) => {
      let incoming;
      try {
        incoming = JSON.parse(event.data);
      } catch {
        return;
      }
      if (incoming.event_type === "error") {
        setError(incoming.detail || "Your message wasn't sent.");
        return;
      }
      if (incoming.event_type !== "chat" || !incoming.id) return;
      setError(null);
      setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, incoming]);
    };
    socket.onerror = () => { if (!cancelled) setError("The live chat connection is unavailable."); };
    socket.onclose = () => { if (!cancelled) setConnected(false); };

    return () => {
      cancelled = true;
      setConnected(false);
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [classes, selectedClassId, user.is_admin]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const courseMap = useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const visibleClasses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return classes.filter((item) => !normalized || `${item.title} ${courseMap.get(item.course_id)?.name || ""}`.toLowerCase().includes(normalized));
  }, [classes, courseMap, query]);
  const selectedClass = classes.find((item) => item.id === selectedClassId);
  const participantCount = new Set(messages.map((message) => message.user_id)).size;
  const writable = connected && (user.is_admin || (selectedClass && classStatus(selectedClass) === "live"));

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const value = messageText.trim();
    if (!value || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    // Sent as an envelope so text that looks like a command stays chat.
    socketRef.current.send(JSON.stringify({ action: "chat_message", message: value }));
    setMessageText("");
  };

  return (
    <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-[#dfe6f0] bg-white shadow-[0_15px_45px_rgba(15,35,65,0.07)] lg:h-[calc(100vh-170px)] lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-b border-[#e3e8f0] bg-[#fbfcff] lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-100 p-5"><h2 className="text-lg font-bold tracking-[-0.02em] text-[#12243d]">Live class chat</h2><p className="mt-1 text-xs leading-5 text-slate-500">{user.is_admin ? "Every class conversation." : "Message your instructor during a live class."}</p><label className="relative mt-4 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search conversations" placeholder="Search conversations..." className="h-9 w-full rounded-full border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-blue-300" /></label></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loadingClasses ? <div className="space-y-2 p-2">{[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}</div> : visibleClasses.length ? visibleClasses.map((item) => {
            const status = classStatus(item);
            const course = courseMap.get(item.course_id);
            return <button key={item.id} type="button" onClick={() => setSelectedClassId(item.id)} className={`mb-1 flex w-full gap-3 rounded-xl p-3 text-left transition ${selectedClassId === item.id ? "bg-[#edf4ff] ring-1 ring-inset ring-[#bcd5fb]" : "hover:bg-slate-50"}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0866ef] shadow-sm"><Video className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-xs text-[#263850]">{item.title}</strong><small className="shrink-0 text-[9px] text-slate-400">{formatClassDate(item.starts_at)}</small></span><span className="mt-1 block truncate text-[10px] font-semibold text-blue-500">{course?.name || "Course"}</span><span className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${status === "live" ? "bg-emerald-500" : status === "upcoming" ? "bg-blue-400" : "bg-slate-300"}`} />{status === "live" ? "Live now" : status === "upcoming" ? "Upcoming" : "Class ended"}</span></span></button>;
          }) : <div className="px-5 py-12 text-center"><MessageSquareText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-xs font-bold text-slate-600">{user.is_admin ? "No class conversations" : "No live classes right now"}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">{user.is_admin ? "Create a class to open its conversation." : "Live class messages appear here when a session starts."}</p>{!user.is_admin && (onAskQuestion ? <button type="button" onClick={onAskQuestion} className="mt-4 inline-block rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-[#0866ef] hover:bg-blue-50">Question outside class? Ask your teachers</button> : <Link href="/contact" className="mt-4 inline-block rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-[#0866ef] hover:bg-blue-50">Questions outside class? Contact admissions</Link>)}</div>}
        </div>
      </aside>

      <section className="flex min-h-[540px] min-w-0 flex-col bg-white">
        {selectedClass ? <>
          <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-100 px-4 sm:px-5"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-[#0866ef]">{selectedClass.title[0]?.toUpperCase()}</span><div className="min-w-0"><h2 className="truncate text-sm font-bold text-[#263850]">{selectedClass.title}</h2><p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-400"><span className={`h-1.5 w-1.5 rounded-full ${classStatus(selectedClass) === "live" ? "bg-emerald-500" : "bg-slate-300"}`} />{courseMap.get(selectedClass.course_id)?.name || "Course"} · {classStatus(selectedClass) === "live" ? "Live chat" : "Conversation history"}</p></div></div><div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400"><span className="hidden items-center gap-1.5 sm:flex"><UsersRound className="h-3.5 w-3.5" /> {participantCount} participant{participantCount === 1 ? "" : "s"}</span><MoreVertical className="h-4 w-4" /></div></header>
          <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fff_0%,#fbfdff_100%)] p-4 sm:p-6">
            {loadingMessages ? <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#0866ef]" /></div> : messages.length ? <div className="mx-auto max-w-3xl space-y-4">{messages.map((message) => {
              const mine = message.user_id === user.id;
              return <div key={message.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>{!mine && <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-500">{(message.sender_name || "U")[0].toUpperCase()}</span>}<div className={`max-w-[78%] ${mine ? "text-right" : "text-left"}`}>{!mine && <p className="mb-1 text-[9px] font-bold text-slate-400">{message.sender_name || (message.is_admin ? "Instructor" : "Student")}</p>}<div className={`rounded-2xl px-4 py-3 text-left text-xs leading-5 ${mine ? "rounded-br-md bg-[#0866ef] text-white" : "rounded-bl-md bg-[#eaf2ff] text-[#263850]"}`}>{message.message}</div><p className="mt-1 text-[9px] text-slate-400">{formatTime(message.created_at)}</p></div></div>;
            })}<div ref={messagesEndRef} /></div> : <div className="flex h-full items-center justify-center text-center"><div><MessageSquareText className="mx-auto h-8 w-8 text-blue-200" /><p className="mt-3 text-xs font-bold text-slate-600">No messages yet</p><p className="mt-1 text-[10px] text-slate-400">Start the class conversation when the session is live.</p></div></div>}
          </div>
          {error && <div className="flex items-center gap-2 border-t border-red-100 bg-red-50 px-4 py-2 text-[11px] text-red-700"><AlertCircle className="h-3.5 w-3.5" />{error}</div>}
          <form onSubmit={sendMessage} className="shrink-0 border-t border-slate-100 p-3 sm:p-4"><div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl bg-[#eff4fc] p-2"><textarea aria-label="Message" maxLength={2000} value={messageText} onChange={(event) => setMessageText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(event); } }} disabled={!writable} rows={1} placeholder={writable ? "Type your message..." : classStatus(selectedClass) === "live" ? "Connecting to live chat..." : "This class conversation is read-only"} className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed" /><button type="submit" disabled={!writable || !messageText.trim()} aria-label="Send message" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0866ef] text-white disabled:bg-slate-300"><Send className="h-4 w-4" /></button></div><p className="mt-2 text-center text-[9px] text-slate-400">Press Enter to send · Shift + Enter for a new line</p></form>
        </> : <div className="flex h-full items-center justify-center p-8 text-center"><div><CalendarClock className="mx-auto h-10 w-10 text-blue-200" /><h2 className="mt-4 text-sm font-bold text-slate-700">{classes.length ? "Select a class conversation" : "No conversation to show"}</h2><p className="mt-1 text-xs text-slate-500">{classes.length ? "Choose a class from the list to view its messages." : "Conversations open while a class is live."}</p></div></div>}
      </section>
    </div>
  );
}
