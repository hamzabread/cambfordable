"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { AlertCircle, Check, Copy, Loader2, PlayCircle, RefreshCw, Trash2, UsersRound, X } from "lucide-react";
import { API_URL, AttendanceStatus, authHeaders, getApiError, LiveClass } from "@/lib/portal";

interface AttendanceRow {
  user_id: number | null;
  name: string;
  username: string | null;
  minutes: number;
  status: AttendanceStatus;
}

interface ClassAttendance {
  class_id: number;
  class_minutes: number;
  source: "zoom" | "portal" | null;
  synced_at: string | null;
  students: AttendanceRow[];
  unmatched: AttendanceRow[];
}

// Zoom usually finishes processing a cloud recording within a few hours.
const RECORDING_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-50 text-emerald-700",
  partial: "bg-amber-50 text-amber-700",
  absent: "bg-slate-100 text-slate-500",
};

function statusLabel(status: AttendanceStatus, minutes: number) {
  if (status === "present") return `Attended · ${minutes} min`;
  if (status === "partial") return `Joined for ${minutes} min`;
  return "Missed";
}

export function AttendanceBadge({ status, minutes }: { status?: AttendanceStatus | null; minutes?: number | null }) {
  if (!status) return null;
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[status]}`}>{statusLabel(status, minutes ?? 0)}</span>;
}

function CopyPasscode({ passcode }: { passcode: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(passcode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" onClick={copy} title="Copy passcode" className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600 hover:bg-slate-200">
      {passcode}
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      <span className="sr-only">{copied ? "Copied" : "Copy passcode"}</span>
    </button>
  );
}

function AttendanceDialog({ item, onClose, onSynced }: { item: LiveClass; onClose: () => void; onSynced: (update: Partial<LiveClass>) => void }) {
  const [data, setData] = useState<ClassAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await axios.get<ClassAttendance>(`${API_URL}/live-classes/${item.id}/attendance`, { headers: authHeaders() });
      setData(response.data);
      setError(null);
    } catch (requestError) {
      setError(getApiError(requestError, "We couldn't load attendance."));
    } finally {
      setLoading(false);
    }
  }, [item.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const refresh = async () => {
    setSyncing(true);
    setError(null);
    setNotice(null);
    try {
      const response = await axios.post<{ recording: string; attendance: string; recording_url: string | null; recording_passcode: string | null }>(
        `${API_URL}/live-classes/${item.id}/zoom-sync`,
        {},
        { headers: authHeaders() },
      );
      const result = response.data;
      onSynced({ recording_url: result.recording_url, recording_passcode: result.recording_passcode });
      const parts = [
        result.attendance === "zoom" ? "Attendance updated from Zoom." : "Zoom has no participant report for this class, so attendance comes from portal joins.",
        result.recording === "found" ? "Recording found." : result.recording === "error" ? "Zoom couldn't be reached for the recording." : "No cloud recording yet.",
      ];
      setNotice(parts.join(" "));
      await load();
    } catch (requestError) {
      setError(getApiError(requestError, "Zoom couldn't be reached. Try again in a few minutes."));
    } finally {
      setSyncing(false);
    }
  };

  const counts = data
    ? data.students.reduce((total, row) => ({ ...total, [row.status]: total[row.status] + 1 }), { present: 0, partial: 0, absent: 0 } as Record<AttendanceStatus, number>)
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`attendance-title-${item.id}`}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <h2 id={`attendance-title-${item.id}`} className="text-base font-bold text-slate-900">Attendance</h2>
            <p className="mt-0.5 truncate text-xs text-slate-500">{item.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#0866ef]" /></div>
          ) : data ? (
            <>
              {data.synced_at && counts ? (
                <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                  {(["present", "partial", "absent"] as AttendanceStatus[]).map((status) => (
                    <div key={status} className={`rounded-xl px-2 py-2.5 ${STATUS_STYLES[status]}`}>
                      <p className="text-lg font-bold tabular-nums">{counts[status]}</p>
                      <p className="text-[10px] font-semibold">{status === "present" ? "Attended" : status === "partial" ? "Part of class" : "Missed"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 rounded-xl bg-blue-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
                  Attendance is collected from Zoom automatically shortly after class. You can also fetch it now.
                </p>
              )}
              <ul className="divide-y divide-slate-100">
                {data.students.map((row) => (
                  <li key={row.user_id ?? row.name} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{row.name}</p>
                      {row.username && <p className="truncate text-[11px] text-slate-400">@{row.username}</p>}
                    </div>
                    {data.synced_at ? <AttendanceBadge status={row.status} minutes={row.minutes} /> : <span className="text-[11px] text-slate-400">Not taken yet</span>}
                  </li>
                ))}
                {!data.students.length && <li className="py-6 text-center text-xs text-slate-500">No students are enrolled in this course.</li>}
              </ul>
              {data.unmatched.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-100 p-3">
                  <p className="text-[11px] font-bold text-slate-600">Joined Zoom without a portal account</p>
                  <ul className="mt-2 space-y-1">
                    {data.unmatched.map((row) => (
                      <li key={row.name} className="flex justify-between text-[11px] text-slate-500"><span className="truncate">{row.name}</span><span className="tabular-nums">{row.minutes} min</span></li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-4 text-[11px] leading-4 text-slate-400">
                {data.source === "zoom"
                  ? "From Zoom's participant report. Attended means at least half the class."
                  : data.source === "portal"
                    ? "Zoom had no participant report, so this uses the times students had the class open in the portal."
                    : `Class length: ${data.class_minutes} min. Attended means at least half the class.`}
              </p>
            </>
          ) : null}
          {notice && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{notice}</p>}
          {error && <p className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}</p>}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg px-4 text-xs font-bold text-slate-600 hover:bg-slate-100">Close</button>
          <button type="button" onClick={refresh} disabled={syncing} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0866ef] px-4 text-xs font-bold text-white hover:bg-[#0657cc] disabled:bg-slate-300">
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Checking Zoom..." : "Refresh from Zoom"}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/** Admin-only delete with an inline confirmation step. */
export function DeleteClassButton({ item, onDeleted, compact = false }: { item: LiveClass; onDeleted: (id: number) => void; compact?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upcoming = new Date(item.starts_at) > new Date();

  const remove = async () => {
    setDeleting(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/live-classes/${item.id}`, { headers: authHeaders() });
      onDeleted(item.id);
    } catch (requestError) {
      setError(getApiError(requestError, "The class wasn't deleted."));
      setDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${item.title}`}
        title="Delete class"
        className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 ${compact ? "h-8 w-8" : "h-8 px-2.5 text-[11px] font-bold"}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {!compact && "Delete"}
      </button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-lg border border-red-200 bg-red-50 p-3 text-left">
      <p className="text-[11px] leading-4 text-red-800">
        {upcoming
          ? "Cancel this class? Its Zoom meeting is deleted and students won't be able to join."
          : "Delete this class? Its chat, attendance and posted material are removed for everyone."}
      </p>
      {error && <p className="mt-1.5 text-[11px] font-semibold text-red-700">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={remove} disabled={deleting} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-red-600 px-3 text-[11px] font-bold text-white hover:bg-red-700 disabled:bg-red-300">
          {deleting && <Loader2 className="h-3 w-3 animate-spin" />} {upcoming ? "Cancel class" : "Delete class"}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="h-8 rounded-md px-3 text-[11px] font-bold text-slate-600 hover:bg-white">Keep</button>
      </div>
    </div>
  );
}

interface ClassRecapProps {
  item: LiveClass;
  /** Admins and TAs see the attendance list instead of their own status. */
  staff: boolean;
  onChange: (id: number, update: Partial<LiveClass>) => void;
}

/** Recording link and attendance for a class that has ended. */
export default function ClassRecap({ item, staff, onChange }: ClassRecapProps) {
  const [showAttendance, setShowAttendance] = useState(false);
  const [renderedAt] = useState(() => Date.now());
  const recentlyEnded = renderedAt - new Date(item.ends_at).getTime() < RECORDING_GRACE_MS;

  return (
    <div className="mt-3 space-y-2">
      {item.recording_url ? (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={item.recording_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0866ef] px-3 text-[11px] font-bold text-white hover:bg-[#0657cc]"
          >
            <PlayCircle className="h-3.5 w-3.5" /> Watch recording
          </a>
          {item.recording_passcode && <CopyPasscode passcode={item.recording_passcode} />}
        </div>
      ) : recentlyEnded ? (
        <p className="text-[10px] font-semibold text-slate-400">The recording appears here once Zoom has processed it.</p>
      ) : null}

      {staff ? (
        <button type="button" onClick={() => setShowAttendance(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-slate-600 hover:border-blue-200 hover:text-[#0866ef]">
          <UsersRound className="h-3.5 w-3.5" /> Attendance
        </button>
      ) : (
        <AttendanceBadge status={item.attendance_status} minutes={item.my_attendance_minutes} />
      )}

      {showAttendance && <AttendanceDialog item={item} onClose={() => setShowAttendance(false)} onSynced={(update) => onChange(item.id, update)} />}
    </div>
  );
}
