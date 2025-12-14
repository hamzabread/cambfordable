"use client";

import React from "react";
import { Clock, CheckCircle, BarChart3 } from "lucide-react";

const QuickStats = () => {
  const stats = [
    {
      title: "Next Class",
      subtitle: "A-Level Physics",
      detail: "In 45 minutes",
      icon: Clock,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      action: "Join Now",
      actionBg: "bg-slate-900 hover:bg-slate-800",
    },
    {
      title: "Homework Due",
      subtitle: "2 pending tasks",
      detail: "",
      icon: CheckCircle,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      action: "View Homework",
      actionBg: "bg-slate-900 hover:bg-slate-800",
    },
    {
      title: "Recent Quiz Score",
      subtitle: "87%",
      detail: "",
      icon: BarChart3,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      action: "View Results",
      actionBg: "bg-slate-900 hover:bg-slate-800",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`${stat.bgColor} border ${stat.borderColor} rounded-lg p-6`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 font-medium">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {stat.subtitle}
                </h3>
                {stat.detail && (
                  <p className="text-sm text-slate-600 mt-2">{stat.detail}</p>
                )}
              </div>
              <Icon className="w-6 h-6 text-slate-400" />
            </div>

            <button
              className={`w-full ${stat.actionBg} text-white font-semibold py-2 rounded-lg transition`}
            >
              {stat.action}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default QuickStats;