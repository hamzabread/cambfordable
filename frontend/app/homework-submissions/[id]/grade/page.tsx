"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { AlertCircle, ArrowLeft, Clock, FileText, Save } from "lucide-react";
import PortalLayout from "../../../components/Portal/PortalLayout";
import PortalLoading from "../../../components/Portal/PortalLoading";
import { usePortalUser } from "../../../components/Portal/usePortalUser";
import { ProtectedFileLink } from "../../../components/Portal/ProtectedFile";
import { API_URL, authHeaders, getApiError } from "@/lib/portal";

interface HomeworkSubmissionDetail {
  id: number;
  homework_id: number;
  homework_title: string;
  course_title: string;
  student_name: string;
  student_username: string;
  submitted_at: string;
  is_late: boolean;
  score: number | null;
  max_score: number;
  remark: string | null;
  file_url: string;
}

export default function GradeHomeworkPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = Number(params.id);
  const validId = Number.isInteger(submissionId) && submissionId > 0;
  const { user, loading: userLoading } = usePortalUser();
  const [submission, setSubmission] = useState<HomeworkSubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (!user || (!user.is_admin && !user.is_ta) || !validId) return;
    axios
      .get<HomeworkSubmissionDetail>(`${API_URL}/homeworks/submissions/${submissionId}`, { headers: authHeaders() })
      .then((response) => {
        setSubmission(response.data);
        setScore(response.data.score === null ? "" : String(response.data.score));
        setRemark(response.data.remark || "");
      })
      .catch((requestError) => setError(getApiError(requestError, "This submission could not be loaded.")))
      .finally(() => setLoading(false));
  }, [submissionId, user, validId]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!submission) return;
    setSaveError(null);
    const value = score.trim() === "" ? null : Number(score);
    if (value !== null && (Number.isNaN(value) || value < 0 || value > submission.max_score)) {
      setSaveError(`Score must be between 0 and ${submission.max_score}.`);
      return;
    }
    if (value === null && !remark.trim()) {
      setSaveError("Enter a score, feedback, or both.");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `${API_URL}/homeworks/grade`,
        { submission_id: submission.id, score: value, remark: remark.trim() || null },
        { headers: authHeaders() },
      );
      router.push(user?.is_ta && !user.is_admin ? "/ta" : "/homework");
    } catch (requestError) {
      setSaveError(getApiError(requestError, "The grade could not be saved."));
      setSaving(false);
    }
  };

  if (userLoading || !user) return <PortalLoading label="Loading submission..." />;
  const isStaff = user.is_admin || user.is_ta;
  const shownError = !isStaff
    ? "Only teachers and teaching assistants can grade submissions."
    : !validId
      ? "This submission doesn't exist."
      : error;
  const stillLoading = isStaff && validId && loading;

  return (
    <PortalLayout user={user}>
      <Link
        href={user.is_ta && !user.is_admin ? "/ta" : "/homework"}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#0866ef] hover:text-blue-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {stillLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-white" />
      ) : shownError || !submission ? (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="font-semibold">{shownError || "This submission could not be loaded."}</p>
        </div>
      ) : (
        <div className="max-w-2xl rounded-xl border border-[#e4eaf2] bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0866ef]">{submission.course_title}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{submission.homework_title}</h1>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-slate-500">Student</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {submission.student_name} <span className="font-normal text-slate-500">({submission.student_username})</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-slate-500">Submitted</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-slate-800">
                <Clock className="h-4 w-4 text-slate-400" />
                {new Date(submission.submitted_at).toLocaleString()}
                {submission.is_late && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">Late</span>}
              </dd>
            </div>
          </dl>

          <ProtectedFileLink
            fileUrl={submission.file_url}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-4 w-4" /> Open submitted file
          </ProtectedFileLink>

          <form onSubmit={handleSave} className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            <div>
              <label htmlFor="grade-score" className="block text-sm font-semibold text-slate-700">
                Score (out of {submission.max_score})
              </label>
              <input
                id="grade-score"
                type="number"
                min={0}
                max={submission.max_score}
                step="any"
                value={score}
                onChange={(event) => setScore(event.target.value)}
                className="mt-2 h-11 w-40 rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="grade-remark" className="block text-sm font-semibold text-slate-700">Feedback</label>
              <textarea
                id="grade-remark"
                rows={4}
                maxLength={2000}
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {saveError && (
              <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {saveError}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0866ef] px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save grade"}
            </button>
          </form>
        </div>
      )}
    </PortalLayout>
  );
}
