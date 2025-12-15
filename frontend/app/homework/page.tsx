"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import HomeworkList from "../components/Homework/HomeworkList";
import SubmissionsList from "../components/Homework/SubmissionsList";
import AdminHomework from "../components/Homework/Admin/AdminHomework";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";

interface User {
  username: string;
  email: string;
  full_name?: string | null;
  id: number;
  is_admin: boolean;
}

const HomeworkPage = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"assigned" | "submitted">(
    "assigned"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await axios.get("http://localhost:8000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        localStorage.removeItem("access_token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="lg:hidden h-14"></div>
          <Header
            user={user || { username: "", email: "", full_name: null, id: 0, is_admin: false }}
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Loading homework...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Admin View
  if (user.is_admin) {
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
            <div className="p-4 sm:p-6 lg:p-8 space-y-8">
              <AdminHomework isAdmin={true} />
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

  // Student View
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
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Header Section */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-slate-900" />
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  Homework
                </h1>
              </div>
              <p className="text-slate-600">
                View assigned homework and submit your work
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
              <button
                onClick={() => setActiveTab("assigned")}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
                  activeTab === "assigned"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-5 h-5" />
                Assigned Homework
              </button>
              <button
                onClick={() => setActiveTab("submitted")}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
                  activeTab === "submitted"
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                My Submissions
              </button>
            </div>

            {/* Content */}
            {activeTab === "assigned" && <HomeworkList user={user} />}
            {activeTab === "submitted" && <SubmissionsList user={user} />}
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
};

export default HomeworkPage;