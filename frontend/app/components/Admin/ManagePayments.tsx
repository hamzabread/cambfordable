"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle } from "lucide-react";
import { ProtectedFileLink } from "../Portal/ProtectedFile";
import { formatDay, getApiError } from "@/lib/portal";

interface Course {
  id: number;
  name: string;
  code: string;
}

interface EnrollmentUser {
  id: number;
  username: string;
  full_name?: string | null;
  email: string;
}

interface EnrollmentPayment {
  user_id: number;
  course_id: number;
  paid: boolean;
  payment_proof_url?: string | null;
  payment_proof_name?: string | null;
  payment_rejection_reason?: string | null;
  proof_pending?: boolean;
  paid_until?: string | null;
  overdue?: boolean;
  pauses_on?: string | null;
  paused_at?: string | null;
  removal_on?: string | null;
  user: EnrollmentUser;
}

function billingStatus(entry: EnrollmentPayment) {
  if (entry.paid && entry.overdue) return { label: `Overdue · pauses ${formatDay(entry.pauses_on)}`, tone: "bg-red-50 text-red-700" };
  if (entry.paid) return { label: entry.paid_until ? `Paid until ${formatDay(entry.paid_until)}` : "Paid", tone: "bg-emerald-50 text-emerald-700" };
  if (entry.paused_at) return { label: `Paused · removed ${formatDay(entry.removal_on)}`, tone: "bg-red-50 text-red-700" };
  if (entry.proof_pending) return { label: "Proof to review", tone: "bg-amber-50 text-amber-800" };
  return { label: "Unpaid", tone: "bg-slate-100 text-slate-600" };
}

const ManagePayments = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourses(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async (courseId: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/enrollments/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEnrollments(response.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load enrolled students.");
    } finally {
      setLoading(false);
    }
  };

  // Approve (first payment or monthly renewal) or pause access.
  const handleTogglePayment = async (entry: EnrollmentPayment) => {
    setUpdating(entry.user_id);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem("access_token")}` };
      const approving = entry.proof_pending || !entry.paid;
      if (approving) {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/payment/approve`,
          { user_id: entry.user_id, course_id: entry.course_id },
          { headers },
        );
      } else {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/payment`,
          { user_id: entry.user_id, course_id: entry.course_id, paid: false },
          { headers },
        );
      }
      if (selectedCourse) await fetchEnrollments(selectedCourse);

      const name = entry.user.full_name || entry.user.username;
      setSuccess(approving ? `${name}'s payment is approved for another month.` : `${name}'s access is paused; they've been told.`);
      setTimeout(() => setSuccess(null), 4000);
      setError(null);
    } catch (err: unknown) {
      setError(getApiError(err, "Failed to update payment status"));
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (entry: EnrollmentPayment) => {
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      setError("Give the student a short reason, for example \"The amount doesn't match the fee\".");
      return;
    }
    setUpdating(entry.user_id);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/payment/reject`,
        { user_id: entry.user_id, course_id: entry.course_id, reason },
        { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } },
      );
      setEnrollments((prev) =>
        prev.map((item) =>
          item.user_id === entry.user_id
            ? { ...item, payment_proof_url: null, payment_proof_name: null, payment_rejection_reason: reason }
            : item,
        ),
      );
      setRejecting(null);
      setRejectReason("");
      setSuccess(`${entry.user.full_name || entry.user.username} has been asked for a new proof.`);
      setTimeout(() => setSuccess(null), 4000);
      setError(null);
    } catch (err: unknown) {
      setError(getApiError(err, "The proof could not be rejected."));
    } finally {
      setUpdating(null);
    }
  };

  const filteredEnrollments = enrollments.filter((entry) => {
    const needle = searchTerm.toLowerCase();
    const name = (entry.user.full_name || "").toLowerCase();
    const username = entry.user.username.toLowerCase();
    const email = entry.user.email.toLowerCase();
    return name.includes(needle) || username.includes(needle) || email.includes(needle);
  });

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-start gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 lg:col-span-1">
          <label className="block text-sm font-bold text-slate-900 mb-4">
            💳 Select Course
          </label>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : courses.length > 0 ? (
            <div className="space-y-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedCourse === course.id
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-slate-200 hover:border-emerald-300 bg-white"
                  }`}
                >
                  <div className="font-semibold text-slate-900">
                    {course.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Code: {course.code}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">No courses available</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 lg:col-span-2">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-900">
              Students and payment proofs
            </label>

            {!selectedCourse ? (
              <div className="py-12 text-center text-slate-500">Select a course to view payments</div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />

                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : filteredEnrollments.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-lg divide-y">
                    {filteredEnrollments.map((entry) => (
                      <div key={entry.user_id} className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">
                            {entry.user.full_name || entry.user.username}
                          </div>
                          <div className="text-xs text-slate-500">
                            {entry.user.username} • {entry.user.email}
                          </div>
                          {entry.payment_proof_url && (
                            <ProtectedFileLink
                              fileUrl={entry.payment_proof_url}
                              filename={entry.payment_proof_name ?? undefined}
                              className="text-xs text-emerald-700 underline"
                            >
                              View payment proof
                            </ProtectedFileLink>
                          )}
                          {!entry.proof_pending && entry.payment_rejection_reason && (
                            <p className="mt-1 text-xs text-red-700">Rejected: {entry.payment_rejection_reason}. Waiting for a new proof.</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${billingStatus(entry).tone}`}>
                            {billingStatus(entry).label}
                          </span>
                          {entry.paid && entry.proof_pending && (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Renewal to review</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleTogglePayment(entry)}
                            disabled={updating === entry.user_id}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-60 ${entry.paid && !entry.proof_pending ? "border border-slate-300 text-slate-700 hover:bg-slate-50" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                          >
                            {updating === entry.user_id ? "Updating..." : entry.proof_pending ? "Approve" : entry.paid ? "Pause access" : "Mark paid"}
                          </button>
                          {entry.proof_pending && rejecting !== entry.user_id && (
                            <button
                              type="button"
                              onClick={() => { setRejecting(entry.user_id); setRejectReason(""); }}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                      {rejecting === entry.user_id && (
                        <div className="mt-3 flex flex-col gap-2 rounded-lg bg-red-50 p-3 sm:flex-row sm:items-center">
                          <label className="sr-only" htmlFor={`reject-${entry.user_id}`}>Reason for rejecting</label>
                          <input
                            id={`reject-${entry.user_id}`}
                            value={rejectReason}
                            maxLength={500}
                            onChange={(event) => setRejectReason(event.target.value)}
                            placeholder="Reason the student will see"
                            className="h-9 flex-1 rounded-lg border border-red-200 bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-red-200"
                          />
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleReject(entry)} disabled={updating === entry.user_id} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60">
                              Send rejection
                            </button>
                            <button type="button" onClick={() => setRejecting(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-500">No enrolled students found</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagePayments;
