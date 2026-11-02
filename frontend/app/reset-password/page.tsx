"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Lock } from "lucide-react";
import Header from "../components/Landing/Header/Header";
import { API_URL, getApiError } from "@/lib/portal";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { token, new_password: password });
      setDone(true);
    } catch (requestError) {
      setError(getApiError(requestError, "This reset link didn't work. Request a new one."));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        This link is missing its reset code.{" "}
        <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>.
      </p>
    );
  }

  if (done) {
    return (
      <div role="status" className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Your password has been changed.{" "}
        <Link href="/login" className="font-semibold underline">Log in</Link> with your new password.
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-black placeholder:text-[#666] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}{" "}
          {error.includes("expired") && (
            <Link href="/forgot-password" className="font-semibold underline">Request a new link</Link>
          )}
        </div>
      )}
      <div>
        <label htmlFor="reset-password" className="mb-2 block text-sm font-medium text-slate-700">New password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          <input id="reset-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className={field} />
        </div>
      </div>
      <div>
        <label htmlFor="reset-confirm" className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" aria-hidden="true" />
          <input id="reset-confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} className={field} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#0866ef] py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70">
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <div className="min-h-[88vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-slate-900">Choose a new password</h1>
          <Suspense fallback={null}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}
