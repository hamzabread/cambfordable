"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { ChevronLeft } from "lucide-react";
import Sidebar from "../../../components/Dashboard/Sidebar";
import Header from "../../../components/Dashboard/Header";
import HomeworkGrades from "../../../components/Homework/HomeworkGrades";

interface User {
  username: string;
  email: string;
  full_name?: string | null;
  id: number;
  is_admin?: boolean;
}

export default function HomeworkGradesPage() {
  const router = useRouter();
  const params = useParams();
  const homeworkId = parseInt(params.id as string);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [homeworkTitle, setHomeworkTitle] = useState<string | null>(null);
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

        // Get course homeworks to find the title
        // We need to search through enrolled courses
        const coursesRes = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Search through all homeworks in enrolled courses
        for (const course of coursesRes.data) {
          try {
            const hwRes = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/homeworks/course/${course.id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            
            const homework = hwRes.data.find((hw: any) => hw.id === homeworkId);
            if (homework) {
              setHomeworkTitle(homework.title);
              break;
            }
          } catch (err) {
            // Continue to next course
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        localStorage.removeItem("access_token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [homeworkId, router]);

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
            Back to Homework
          </button>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {loading ? "Loading..." : `${homeworkTitle} - Your Grade`}
            </h1>
            <p className="text-slate-600">
              View your score, feedback, and submission details
            </p>
          </div>

          {/* Grades Component */}
          {!loading && <HomeworkGrades homeworkId={homeworkId} />}
        </main>
      </div>
    </div>
  );
}
