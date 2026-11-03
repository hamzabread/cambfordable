"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Bell, BookOpenCheck, CalendarDays, Check, FileCheck2, GraduationCap, Mail, MessageCircleQuestion } from "lucide-react";
import { API_URL, authHeaders, getAccessToken, PortalNotification } from "@/lib/portal";

interface NotificationResponse {
  items: PortalNotification[];
  unread_count: number;
}

const kindIcons = {
  quiz: BookOpenCheck,
  homework: FileCheck2,
  grade: Check,
  schedule: CalendarDays,
  enrollment: GraduationCap,
  contact: Mail,
  question: MessageCircleQuestion,
};

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

interface NotificationMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationMenu({ open, onOpenChange }: NotificationMenuProps) {
  const router = useRouter();
  const setOpen = (next: boolean | ((value: boolean) => boolean)) =>
    onOpenChange(typeof next === "function" ? next(open) : next);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const response = await axios.get<NotificationResponse>(`${API_URL}/notifications/`, {
        headers: authHeaders(token),
      });
      setItems(response.data.items);
      setUnreadCount(response.data.unread_count);
    } catch {
      // The header remains usable if notifications are temporarily unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(loadNotifications, 45_000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const openNotification = async (notification: PortalNotification) => {
    const token = getAccessToken();
    if (token && !notification.is_read) {
      setItems((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        await axios.patch(`${API_URL}/notifications/${notification.id}/read`, {}, { headers: authHeaders(token) });
      } catch {
        void loadNotifications();
      }
    }
    setOpen(false);
    if (notification.href) router.push(notification.href);
  };

  const markAllRead = async () => {
    const token = getAccessToken();
    if (!token || unreadCount === 0) return;
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
    try {
      await axios.post(`${API_URL}/notifications/read-all`, {}, { headers: authHeaders(token) });
    } catch {
      void loadNotifications();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-[#0866ef]"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[72px] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
              <p className="text-[11px] text-slate-500">{unreadCount ? `${unreadCount} unread` : "You are all caught up"}</p>
            </div>
            <button type="button" onClick={markAllRead} disabled={!unreadCount} className="text-[11px] font-bold text-[#0866ef] disabled:text-slate-300">
              Mark all read
            </button>
          </div>
          <div className="max-h-[430px] overflow-y-auto p-2">
            {loading ? (
              <div className="space-y-2 p-2">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
            ) : items.length ? (
              items.map((notification) => {
                const Icon = kindIcons[notification.kind as keyof typeof kindIcons] || Bell;
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={`flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50 ${notification.is_read ? "" : "bg-blue-50/70"}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e5efff] text-[#0866ef]"><Icon className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2"><span className="truncate text-xs font-bold text-slate-800">{notification.title}</span><span className="shrink-0 text-[11px] text-slate-500">{relativeTime(notification.created_at)}</span></span>
                      <span className={`mt-1 text-[11px] leading-4 text-slate-500 ${notification.kind === "contact" ? "block whitespace-pre-wrap break-words" : "line-clamp-2"}`}>{notification.message}</span>
                    </span>
                    {!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0866ef]" />}
                  </button>
                );
              })
            ) : (
              <div className="px-6 py-10 text-center"><Bell className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-xs font-semibold text-slate-600">No notifications yet</p><p className="mt-1 text-xs text-slate-500">Course updates and grades will appear here.</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
