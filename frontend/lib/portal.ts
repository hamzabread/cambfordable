import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export interface PortalUser {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  is_admin: boolean;
  is_ta: boolean;
  payment?: boolean;
  date_of_birth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  permanent_address?: string | null;
  student_id?: string | null;
  major?: string | null;
  current_year?: string | null;
  academic_standing?: string | null;
  created_at?: string;
}

export interface CourseCatalogItem {
  id: number;
  name: string;
  code: string;
  enrollment_status: "available" | "pending" | "rejected" | "enrolled" | "paused";
  archived?: boolean;
  progress: number;
  completed: number;
  rejection_reason?: string | null;
  paid_until?: string | null;
  overdue?: boolean;
  pauses_on?: string | null;
  removal_on?: string | null;
  renewal_open?: boolean;
  proof_pending?: boolean;
}

export function formatDay(value?: string | null) {
  return value ? new Date(value).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) : "";
}

export interface LiveClass {
  id: number;
  course_id: number;
  title: string;
  starts_at: string;
  ends_at: string;
  meeting_id: string;
  join_url: string;
  start_url?: string;
  attachment_url?: string | null;
  recording_url?: string | null;
  recording_passcode?: string | null;
  my_attendance_minutes?: number | null;
  attendance_status?: AttendanceStatus | null;
}

export type AttendanceStatus = "present" | "partial" | "absent";

export interface Homework {
  id: number;
  course_id: number;
  title: string;
  description?: string | null;
  due_date: string;
}

export interface PortalNotification {
  id: number;
  kind: string;
  title: string;
  message: string;
  href?: string | null;
  is_read: boolean;
  created_at: string;
}

export function getWebSocketUrl(path: string, token: string) {
  const api = new URL(API_URL);
  api.protocol = api.protocol === "https:" ? "wss:" : "ws:";
  api.pathname = path.startsWith("/") ? path : `/${path}`;
  api.search = new URLSearchParams({ token }).toString();
  return api.toString();
}

export function getAccessToken() {
  return typeof window === "undefined"
    ? null
    : window.localStorage.getItem("access_token");
}

export function authHeaders(token = getAccessToken()) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return "We can't reach the server. Check your connection and try again.";
  const detail = error.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
  return fallback;
}

const INLINE_FILE_TYPES = new Set([
  "application/pdf",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);

function apiFileUrl(fileUrl: string) {
  const normalized = fileUrl.replace(/\\/g, "/");
  const path = /^https?:\/\//i.test(normalized) ? new URL(normalized).pathname : normalized;
  return `${API_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function fileNameFromUrl(fileUrl: string) {
  return fileUrl.replace(/\\/g, "/").split("/").pop() || "download";
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function fetchProtectedFile(fileUrl: string, mode: "view" | "download" = "download") {
  const response = await axios.get<Blob>(apiFileUrl(fileUrl), {
    headers: authHeaders(),
    params: { mode },
    responseType: "blob",
  });
  return response.data;
}

export async function downloadProtectedFile(fileUrl: string, filename?: string) {
  const blob = await fetchProtectedFile(fileUrl, "download");
  saveBlob(blob, filename || fileNameFromUrl(fileUrl));
}

export async function viewProtectedFile(fileUrl: string, filename?: string) {
  // Opened before the request, while this still counts as the user's click,
  // so the browser doesn't treat it as a popup.
  const tab = window.open("", "_blank");
  try {
    const blob = await fetchProtectedFile(fileUrl, "view");
    // A blob page runs on the portal's own origin, so only render types that
    // can't execute scripts. Everything else is saved instead.
    if (!tab || !INLINE_FILE_TYPES.has(blob.type.split(";")[0])) {
      tab?.close();
      saveBlob(blob, filename || fileNameFromUrl(fileUrl));
      return;
    }
    const url = URL.createObjectURL(blob);
    tab.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    tab?.close();
    throw error;
  }
}

export function getFileError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return "Your session has expired. Please log in again.";
    if (error.response?.status === 403) return "You do not have access to this file.";
    if (error.response?.status === 404) return "This file could not be found.";
  }
  return "This file could not be opened. Please try again.";
}

export function clampProgress(value: number | null | undefined) {
  return Math.min(100, Math.max(0, Number(value) || 0));
}
