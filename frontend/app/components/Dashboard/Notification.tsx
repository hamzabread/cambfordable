"use client";

import React from "react";
import { Bell, CheckCircle, MessageSquare } from "lucide-react";

interface Notification {
  id: string;
  type: "info" | "success" | "warning";
  icon: React.ReactNode;
  message: string;
}

const Notifications = () => {
  const notifications: Notification[] = [
    {
      id: "1",
      type: "info",
      icon: <Bell className="w-5 h-5" />,
      message: "Teacher posted new notes",
    },
    {
      id: "2",
      type: "success",
      icon: <CheckCircle className="w-5 h-5" />,
      message: "Quiz #4 is now available",
    },
    {
      id: "3",
      type: "success",
      icon: <CheckCircle className="w-5 h-5" />,
      message: "Homework feedback received",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
        Notifications
      </h2>

      <div className="space-y-3 sm:space-y-4">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition"
          >
            {/* Icon */}
            <div className="flex-shrink-0 text-slate-600 mt-1">
              {notif.icon}
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base text-slate-700 font-medium break-words">
                {notif.message}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* View All Button */}
      <button className="w-full mt-4 sm:mt-6 py-2 text-slate-900 font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition text-sm sm:text-base">
        View All Notifications
      </button>
    </div>
  );
};

export default Notifications;