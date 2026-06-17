"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle } from "lucide-react";

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
  payment_uploaded_at?: string | null;
  user: EnrollmentUser;
}

interface ManagePaymentsProps {
  onPaymentsChanged?: () => void;
}

const ManagePayments = ({ onPaymentsChanged }: ManagePaymentsProps = {}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  // Ids of courses that have a new (unreviewed) payment proof — these get a red dot.
  const [pendingCourseIds, setPendingCourseIds] = useState<number[]>([]);

  useEffect(() => {
    fetchCourses();
    fetchPendingCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchPendingCourses = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/pending-payments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingCourseIds(response.data?.course_ids || []);
    } catch {
      // Non-critical: just don't show the dots if the check fails.
    }
  };

  const handleSelectCourse = async (courseId: number) => {
    setSelectedCourse(courseId);

    // Opening a course with a pending proof clears its red dot. Persist that so
    // the dot stays gone until a newer payment arrives, and refresh the parent's
    // Payments-tab dot (which goes away once no course has a pending proof).
    if (!pendingCourseIds.includes(courseId)) return;

    setPendingCourseIds((prev) => prev.filter((id) => id !== courseId));
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${courseId}/mark-payments-seen`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onPaymentsChanged?.();
    } catch {
      // If it fails, re-show the dot so the admin knows it's still unreviewed.
      setPendingCourseIds((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
    }
  };

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

  const handleTogglePayment = async (entry: EnrollmentPayment) => {
    setUpdating(entry.user_id);
    try {
      const token = localStorage.getItem("access_token");
      const nextPaid = !entry.paid;

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/payment`,
        {
          user_id: entry.user_id,
          course_id: entry.course_id,
          paid: nextPaid,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEnrollments((prev) =>
        prev.map((item) =>
          item.user_id === entry.user_id ? { ...item, paid: nextPaid } : item
        )
      );

      const name = entry.user.full_name || entry.user.username;
      setSuccess(`✅ ${name} marked as ${nextPaid ? "paid" : "unpaid"}`);
      setTimeout(() => setSuccess(null), 3000);
      setError(null);
      // Approving/unapproving changes what's pending — refresh both the
      // per-course dots and the parent's Payments-tab red dot.
      fetchPendingCourses();
      onPaymentsChanged?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update payment status");
    } finally {
      setUpdating(null);
    }
  };

  const getProofUrl = (entry: EnrollmentPayment) => {
    if (!entry.payment_proof_url) return null;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "";
    // The proof is served from the DB behind an auth check. Since it opens in a
    // new tab (no Authorization header), the token travels as a query param.
    const token = localStorage.getItem("access_token") || "";
    return `${apiBase}${entry.payment_proof_url}?token=${encodeURIComponent(token)}`;
  };

  const formatUploadedAt = (value?: string | null) => {
    if (!value) return null;
    // Backend stores naive UTC timestamps; treat a missing timezone as UTC.
    const normalized = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
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
                  onClick={() => handleSelectCourse(course.id)}
                  className={`relative w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedCourse === course.id
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-slate-200 hover:border-emerald-300 bg-white"
                  }`}
                >
                  {pendingCourseIds.includes(course.id) && (
                    <span
                      title="New payment proof awaiting review"
                      className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"
                    />
                  )}
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
              👥 Enrolled Students
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
                      <div key={entry.user_id} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div>
                          <div className="font-medium text-slate-900">
                            {entry.user.full_name || entry.user.username}
                          </div>
                          <div className="text-xs text-slate-500">
                            {entry.user.username} • {entry.user.email}
                          </div>
                          {entry.payment_proof_url && (
                            <div className="mt-0.5">
                              <a
                                className="text-xs text-emerald-700 underline"
                                href={getProofUrl(entry) ?? "#"}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View payment proof
                              </a>
                              {formatUploadedAt(entry.payment_uploaded_at) && (
                                <span className="block text-[11px] text-slate-400">
                                  Uploaded {formatUploadedAt(entry.payment_uploaded_at)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTogglePayment(entry)}
                          disabled={updating === entry.user_id}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                            entry.paid
                              ? "border-emerald-600 text-emerald-700 bg-emerald-50"
                              : "border-amber-500 text-amber-700 bg-amber-50"
                          } ${updating === entry.user_id ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}`}
                        >
                          {updating === entry.user_id
                            ? "Updating..."
                            : entry.paid
                            ? "Paid"
                            : "Unpaid"}
                        </button>
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
