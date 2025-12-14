"use client";

import React from "react";

interface User {
  username: string;
  email: string;
  full_name?: string | null;
}

interface WelcomeSectionProps {
  user: User;
}

const WelcomeSection = ({ user }: WelcomeSectionProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            {getGreeting()}, {user.full_name?.split(" ")[0] || user.username}
            <span className="ml-2">👋</span>
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Here's a summary of your learning today.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;