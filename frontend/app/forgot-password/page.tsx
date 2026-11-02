"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Mail } from "lucide-react";
import Header from "../components/Landing/Header/Header";
import { API_URL, getApiError } from "@/lib/portal";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ kind: "sent" | "unavailable" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email: email.trim() });
      setStatus({ kind: "sent", text: response.data.message });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 503) {
        setStatus({ kind: "unavailable", text: getApiError(error, "") });
      } else if (axios.isAxiosError(error) && !error.response) {
        setStatus({ kind: "error", text: "We can't reach the server. Check your connection and try again." });
      } else {
        setStatus({ kind: "error", text: getApiError(error, "Something went wrong. Please try again.") });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-[88vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-slate-900">Forgot your password?</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter the email address on your account and we&apos;ll send you a link to choose a new password.
          </p>

          {status && (
            <div
              role={status.kind === "error" ? "alert" : "status"}
              className={`mt-6 rounded-lg border p-4 text-sm font-medium ${
                status.kind === "sent"
                  ? "border-green-200 bg-green-50 text-green-800"
                  : status.kind === "unavailable"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {status.text}
              {status.kind === "unavailable" && (
                <Link href="/contact" className="mt-2 block font-semibold underline">
                  Go to the contact page
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="forgot-email" className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" aria-hidden="true" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-black placeholder:text-[#666] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || status?.kind === "sent"}
              className="w-full rounded-lg bg-[#0866ef] py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-[#0866ef] hover:text-blue-800">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
