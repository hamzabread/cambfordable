"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, CheckCircle, Eye, EyeOff, Phone } from "lucide-react";
import Header from "../components/Landing/Header/Header";
import { useRedirectIfSignedIn } from "../components/Portal/useRedirectIfSignedIn";

// Same rules as the server (schemas/users.py).
const USERNAME_PATTERN = /^[A-Za-z0-9_.-]{3,30}$/;
const PHONE_PATTERN = /^\+[1-9][0-9]{7,14}$/;

function validate(form: { username: string; full_name: string; phone_number: string; password: string }) {
  if (form.full_name.trim().length < 2) return "Enter your full name.";
  if (!USERNAME_PATTERN.test(form.username.trim())) {
    return "Username must be 3 to 30 characters: letters, numbers, dots, dashes or underscores.";
  }
  if (!PHONE_PATTERN.test(form.phone_number.replace(/[\s-]/g, ""))) {
    return "Enter your phone number with the country code, for example +923001234567.";
  }
  if (form.password.length < 8) return "Password must be at least 8 characters.";
  if (form.password.length > 128) return "Password must be at most 128 characters.";
  return null;
}

const inputClass =
  "w-full pl-10 pr-4 py-3 placeholder:text-[#666] text-black border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition";

const SignupPage = () => {
  const checkingSession = useRedirectIfSignedIn();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    phone_number: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const problem = validate(formData);
    if (problem) {
      setError(problem);
      return;
    }
    setLoading(true);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        ...formData,
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
      });
      setMessage("Account created. Taking you to the login page…");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && !err.response) {
        setError("We can't reach the server. Check your connection and try again.");
      } else if (axios.isAxiosError(err) && err.response?.data) {
        const detail: unknown = err.response.data.detail;
        setError(
          Array.isArray(detail)
            ? String(detail[0]?.msg || "Signup failed")
            : typeof detail === "string" ? detail : "Signup failed",
        );
      } else {
        setError("Signup failed");
      }
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-900" aria-busy="true" />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
              <div className="h-1 w-16 bg-[#0866ef] rounded"></div>
            </div>

            {message && (
              <div role="status" className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm font-medium">{message}</p>
              </div>
            )}

            {error && (
              <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-slate-700 mb-2">
                  Full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" aria-hidden="true" />
                  <input
                    id="signup-name"
                    type="text"
                    name="full_name"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    maxLength={120}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-username" className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" aria-hidden="true" />
                  <input
                    id="signup-username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    maxLength={30}
                    aria-describedby="signup-username-hint"
                    className={inputClass}
                  />
                </div>
                <p id="signup-username-hint" className="text-xs text-slate-500 mt-1">
                  3 to 30 characters: letters, numbers, dots, dashes or underscores.
                </p>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" aria-hidden="true" />
                  <input
                    id="signup-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Phone number <span className="text-slate-500 font-normal">(for WhatsApp)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" aria-hidden="true" />
                  <input
                    id="signup-phone"
                    type="tel"
                    name="phone_number"
                    autoComplete="tel"
                    placeholder="+92 300 1234567"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                    aria-describedby="signup-phone-hint"
                    className={inputClass}
                  />
                </div>
                <p id="signup-phone-hint" className="text-xs text-slate-500 mt-1">Include the country code, for example +92 for Pakistan.</p>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" aria-hidden="true" />
                  <input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={8}
                    maxLength={128}
                    required
                    aria-describedby="signup-password-hint"
                    className={`${inputClass} pr-12`}
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
                <p id="signup-password-hint" className="mt-1 text-xs text-slate-500">Use at least 8 characters.</p>
              </div>

              <label className="flex items-start text-sm text-slate-600 mt-6">
                <input type="checkbox" className="mr-2 mt-1 rounded" required />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-[#0866ef] hover:text-blue-800 font-medium">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank" className="text-[#0866ef] hover:text-blue-800 font-medium">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || Boolean(message)}
                className="w-full bg-[#0866ef] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-6"
              >
                {loading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <div className="my-6 flex items-center">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="px-3 text-sm text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <p className="text-center text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="text-[#0866ef] hover:text-blue-800 font-semibold">
                Login here
              </Link>
            </p>
          </div>

          <p className="text-center text-slate-400 text-xs mt-6">
            <Link href="/" className="underline hover:text-white">Back to the home page</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
