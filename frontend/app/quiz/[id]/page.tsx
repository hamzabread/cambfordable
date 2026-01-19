"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Sidebar from "../../components/Dashboard/Sidebar";
import Header from "../../components/Dashboard/Header";
import QuizTaker from "../../components/Quizzes/QuizTaker";

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = Number(params.id);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data);

        // Redirect admins to dashboard
        if (response.data.is_admin) {
          router.push("/dashboard");
          return;
        }

        setLoading(false);
      } catch (err) {
        router.push("/login");
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleQuizSubmit = () => {
    // Redirect back to quizzes page after submission
    setTimeout(() => {
      router.push("/quizzes");
    }, 2000);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden h-14"></div>
        <Header
          user={user}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Back Button */}
            <button
              onClick={() => router.push("/quizzes")}
              className="mb-6 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Quizzes
            </button>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quiz Content */}
            <div className="max-w-4xl mx-auto">
              <QuizTaker quizId={quizId} onSubmit={handleQuizSubmit} />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}