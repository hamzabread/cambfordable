"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Archive, ArchiveRestore, Check, Loader, Pencil, Trash2, X } from "lucide-react";
import { API_URL, authHeaders, getApiError } from "@/lib/portal";

interface AdminCourse {
  id: number;
  name: string;
  code: string;
  whatsapp_invite_link?: string | null;
  archived_at?: string | null;
  student_count: number;
  class_count: number;
}

type RowMode = { id: number; kind: "edit" | "delete" } | null;

/** Existing courses: edit the name and WhatsApp link, archive finished
 * courses, or delete one permanently. */
export default function ManageCourses({ refreshKey }: { refreshKey: number }) {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<RowMode>(null);
  const [draft, setDraft] = useState({ name: "", whatsapp_invite_link: "" });
  const [confirmCode, setConfirmCode] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<{ id: number; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get<AdminCourse[]>(`${API_URL}/courses/admin`, { headers: authHeaders() })
      .then((response) => {
        if (!cancelled) {
          setCourses(response.data);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(getApiError(requestError, "Courses could not be loaded."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const open = (course: AdminCourse, kind: "edit" | "delete") => {
    setMode({ id: course.id, kind });
    setDraft({ name: course.name, whatsapp_invite_link: course.whatsapp_invite_link || "" });
    setConfirmCode("");
    setRowError(null);
  };

  const replace = (updated: AdminCourse) =>
    setCourses((current) => current.map((course) => (course.id === updated.id ? { ...course, ...updated } : course)));

  const save = async (courseId: number) => {
    const name = draft.name.trim();
    const link = draft.whatsapp_invite_link.trim();
    if (name.length < 2) return setRowError("Course name must be at least 2 characters.");
    if (link && !link.startsWith("https://")) return setRowError("The WhatsApp link must start with https://");
    setBusyId(courseId);
    try {
      const response = await axios.patch<AdminCourse>(
        `${API_URL}/courses/${courseId}`,
        { name, whatsapp_invite_link: link || null },
        { headers: authHeaders() },
      );
      replace(response.data);
      setMode(null);
    } catch (requestError) {
      setRowError(getApiError(requestError, "The course could not be saved."));
    } finally {
      setBusyId(null);
    }
  };

  const toggleArchive = async (course: AdminCourse) => {
    setBusyId(course.id);
    setArchiveError(null);
    try {
      const action = course.archived_at ? "unarchive" : "archive";
      const response = await axios.post<AdminCourse>(`${API_URL}/courses/${course.id}/${action}`, {}, { headers: authHeaders() });
      replace(response.data);
    } catch (requestError) {
      setArchiveError({ id: course.id, message: getApiError(requestError, "The course could not be updated.") });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (course: AdminCourse) => {
    setBusyId(course.id);
    setRowError(null);
    try {
      await axios.delete(`${API_URL}/courses/${course.id}`, { headers: authHeaders(), params: { confirm: confirmCode } });
      setCourses((current) => current.filter((item) => item.id !== course.id));
      setMode(null);
    } catch (requestError) {
      setRowError(getApiError(requestError, "The course could not be deleted."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Existing courses</h2>
      <p className="mt-1 text-sm text-slate-500">
        Edit a course, archive it when it finishes (students keep their recordings and results, nobody new can join, billing stops), or delete it for good.
      </p>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader className="h-4 w-4 animate-spin" /> Loading courses…</div>
      ) : error ? (
        <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>
      ) : courses.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No courses yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {courses.map((course) => {
            const editing = mode?.id === course.id && mode.kind === "edit";
            const deleting = mode?.id === course.id && mode.kind === "delete";
            const busy = busyId === course.id;
            return (
              <li key={course.id} className="py-3">
                {editing ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-600">
                        Course name
                        <input
                          value={draft.name}
                          maxLength={120}
                          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                          className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        WhatsApp group link
                        <input
                          value={draft.whatsapp_invite_link}
                          placeholder="https://chat.whatsapp.com/…"
                          maxLength={300}
                          onChange={(event) => setDraft({ ...draft, whatsapp_invite_link: event.target.value })}
                          className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    </div>
                    {rowError && <p role="alert" className="text-sm text-red-700">{rowError}</p>}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => save(course.id)} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0866ef] px-3 text-xs font-bold text-white disabled:opacity-60">
                        <Check className="h-4 w-4" /> {busy ? "Saving…" : "Save"}
                      </button>
                      <button type="button" onClick={() => setMode(null)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600">
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-800">
                          <span className="truncate">{course.name}</span>
                          {course.archived_at && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">Archived</span>}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {course.code} · {course.student_count} student{course.student_count === 1 ? "" : "s"} · {course.class_count} class{course.class_count === 1 ? "" : "es"} · {course.whatsapp_invite_link ? "WhatsApp link set" : "No WhatsApp link yet"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button type="button" onClick={() => open(course, "edit")} aria-label={`Edit ${course.name}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button type="button" onClick={() => toggleArchive(course)} disabled={busy} aria-label={`${course.archived_at ? "Restore" : "Archive"} ${course.name}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                          {busy && !deleting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : course.archived_at ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                          {course.archived_at ? "Restore" : "Archive"}
                        </button>
                        <button type="button" onClick={() => (deleting ? setMode(null) : open(course, "delete"))} aria-label={`Delete ${course.name}`} aria-expanded={deleting} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-100 px-3 text-xs font-bold text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                    {deleting && (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-semibold text-red-900">Delete {course.name} permanently?</p>
                        <p className="mt-1 text-xs leading-5 text-red-800">
                          This removes its {course.class_count} class{course.class_count === 1 ? "" : "es"} (and their Zoom meetings), every quiz and homework with all submissions and grades, course questions, the enrollments of {course.student_count} student{course.student_count === 1 ? "" : "s"}, and its payment records. Student accounts stay. This can&apos;t be undone. If the course has just finished, archive it instead.
                        </p>
                        <label className="mt-3 block text-xs font-semibold text-red-900">
                          Type <span className="font-mono">{course.code}</span> to confirm
                          <input
                            value={confirmCode}
                            onChange={(event) => setConfirmCode(event.target.value)}
                            autoComplete="off"
                            className="mt-1 block h-10 w-full max-w-xs rounded-lg border border-red-200 bg-white px-3 font-mono text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                          />
                        </label>
                        {rowError && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{rowError}</p>}
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => remove(course)}
                            disabled={busy || confirmCode.trim().toLowerCase() !== course.code.toLowerCase()}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-bold text-white hover:bg-red-700 disabled:bg-red-300"
                          >
                            {busy ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete course
                          </button>
                          <button type="button" onClick={() => setMode(null)} className="h-9 rounded-lg px-3 text-xs font-bold text-slate-600 hover:bg-white">Keep it</button>
                        </div>
                      </div>
                    )}
                    {archiveError?.id === course.id && <p role="alert" className="mt-2 text-xs text-red-700">{archiveError.message}</p>}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
