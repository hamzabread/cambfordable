"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { ChevronLeft } from "lucide-react";
import Sidebar from "../../../components/Dashboard/Sidebar";
import Header from "../../../components/Dashboard/Header";
import QuizGrades from "../../../components/Quizzes/QuizGrades";

interface User {
  username: string;
  email: string;
  full_name?: string | null;
  id: number;
  is_admin?: boolean;
}

export default function QuizGradesPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = parseInt(params.id as string);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [quizTitle, setQuizTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Fetch user data
        const userRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(userRes.data);

        // Get quiz title (uses /title endpoint that bypasses deadline check)
        const quizRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/quizzes/${quizId}/title`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setQuizTitle(quizRes.data.title);
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quizId, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Breadcrumb */}
        <div className="lg:hidden h-14"></div>

        {/* Header */}
        <Header user={user} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Quizzes
          </button>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {loading ? "Loading..." : `${quizTitle} - Your Grade`}
            </h1>
            <p className="text-slate-600">
              View your score, remarks, and detailed feedback
            </p>
          </div>

          {/* Grades Component */}
          {!loading && <QuizGrades quizId={quizId} />}
        </main>
      </div>
    </div>
  );
}
