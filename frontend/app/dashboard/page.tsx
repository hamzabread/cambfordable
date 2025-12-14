"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import WelcomeSection from "../components/Dashboard/WelcomeSection";
import QuickStats from "../components/Dashboard/QuickStats";
import ActiveCourses from "../components/Dashboard/ActiveCourses";
import Notifications from "../components/Dashboard/Notification";

interface User {
  username: string;
  email: string;
  full_name?: string | null;
}

const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header user={user} />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-8 space-y-8">
            {/* Welcome Section */}
            <WelcomeSection user={user} />

            {/* Quick Stats */}
            <QuickStats />

            {/* Main Grid */}
            <div className="grid grid-cols-3 gap-8">
              {/* Left Column - Active Courses */}
              <div className="col-span-2">
                <ActiveCourses />
              </div>

              {/* Right Column - Notifications */}
              <div>
                <Notifications />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;