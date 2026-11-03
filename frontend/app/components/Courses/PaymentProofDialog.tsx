"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { AlertCircle, FileUp, LoaderCircle, X } from "lucide-react";
import { API_URL, authHeaders, CourseCatalogItem, getApiError } from "@/lib/portal";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Courses the student has (or had, while paused) access to: a proof for one
 * of these is the monthly payment, not an enrollment request. */
export const isRenewal = (course: CourseCatalogItem) =>
  course.enrollment_status === "enrolled" || course.enrollment_status === "paused";

interface PaymentProofDialogProps {
  course: CourseCatalogItem;
  onClose: () => void;
  /** Called with a confirmation sentence once the proof is uploaded. */
  onSubmitted: (message: string) => void;
}

/** Upload a payment receipt for a course. Used on Courses and the dashboard;
 * a parent paying on the student's account goes through the same steps. */
export default function PaymentProofDialog({ course, onClose, onSubmitted }: PaymentProofDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const renewal = isRenewal(course);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0] ?? null;
    if (chosen && chosen.size > MAX_FILE_BYTES) {
      setError("The file must be 10 MB or smaller.");
      event.target.value = "";
      setFile(null);
      return;
    }
    setFile(chosen);
    setError(null);
  };

  const submit = async () => {
    if (!file) {
      setError("Choose the receipt to upload first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`${API_URL}/courses/${course.id}/enroll-with-proof`, formData, { headers: authHeaders() });
      onSubmitted(
        renewal
          ? `Payment proof for ${course.name} uploaded. An admin will check it; access continues meanwhile.`
          : `${course.name}: payment proof uploaded and waiting for review.`,
      );
    } catch (requestError) {
      setError(getApiError(requestError, "The payment proof wasn't uploaded. Try again."));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#06172d]/65 p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-proof-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl outline-none sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="payment-proof-title" className="text-xl font-bold text-[#0b1f39]">
              {renewal ? "Upload this month's payment proof" : "Request enrollment"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{course.name} · {course.code}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-slate-700">
          Pay the fee by your usual bank or JazzCash transfer, then upload the receipt here. Whoever paid can upload it.
          Need the payment details? <Link href="/contact" className="font-bold text-[#0866ef] hover:underline">Contact admissions</Link>.
        </p>

        <label className="mt-5 block text-sm font-bold text-slate-800" htmlFor="payment-proof">Receipt</label>
        <label htmlFor="payment-proof" className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-300 bg-[#f8fbff] px-4 text-center transition hover:bg-blue-50">
          <FileUp className="h-6 w-6 text-[#0866ef]" />
          <span className="mt-2 text-sm font-semibold text-slate-700">{file ? file.name : "Choose the receipt or a screenshot of it"}</span>
          <span className="mt-1 text-xs text-slate-500">PDF, JPEG, PNG or WebP, up to 10 MB</span>
        </label>
        <input id="payment-proof" type="file" className="sr-only" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={chooseFile} />

        {error && <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={submit} disabled={!file || submitting} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0866ef] px-5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-[#075bda] disabled:cursor-not-allowed disabled:opacity-50">
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />} Submit for review
          </button>
        </div>
      </div>
    </div>
  );
}
