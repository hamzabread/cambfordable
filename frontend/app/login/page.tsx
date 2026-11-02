"use client";

import React, { Suspense, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Header from "../components/Landing/Header/Header";
import { safeNextPath, saveTokens } from "@/lib/auth";
import { useRedirectIfSignedIn } from "../components/Portal/useRedirectIfSignedIn";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

function loginError(err: unknown) {
  if (!axios.isAxiosError(err)) return "Login failed. Please try again.";
  if (!err.response) return "We can't reach the server. Check your connection and try again.";
  const detail = err.response.data?.detail;
  if (typeof detail === "string") return detail;
  return "Login failed. Please try again.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const expired = searchParams.get("reason") === "expired";
  const checkingSession = useRedirectIfSignedIn(next);
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = new URLSearchParams();
      data.append("username", formData.username.trim());
      data.append("password", formData.password);

      const response = await axios.post(
        `${API_BASE_URL}/auth/login`,
        data,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      saveTokens(response.data);
      router.replace(safeNextPath(next));
    } catch (err) {
      setError(loginError(err));
      setLoading(false);
    }
  };

  if (checkingSession) {
    return <div className="min-h-[88vh] bg-slate-900" aria-busy="true" />;
  }

  return (
    <div className="min-h-[88vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back to your learning journey</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Login</h2>
            <div className="h-1 w-16 bg-[#0866ef] rounded"></div>
          </div>

          {expired && !error && (
            <div role="status" className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm font-medium">Your session has expired. Please log in again.</p>
            </div>
          )}

          {error && (
            <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-username" className="block text-sm font-medium text-slate-700 mb-2">
                Username or email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="login-username"
                  type="text"
                  name="username"
                  autoComplete="username"
                  placeholder="Enter your username or email"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border text-black placeholder:text-[#666] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border text-black placeholder:text-[#666] border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end text-sm">
              <Link href="/forgot-password" className="text-[#0866ef] hover:text-blue-800 font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0866ef] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="px-3 text-sm text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <p className="text-center text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#0866ef] hover:text-blue-800 font-semibold">
              Sign up here
            </Link>
          </p>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          By logging in, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-white">Terms of Service</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-white">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="min-h-[88vh] bg-slate-900" />}>
        <LoginForm />
      </Suspense>
    </>
  );
}
