"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Clock, CheckCircle } from "lucide-react";

interface QuickStat {
  title: string;
  subtitle: string;
  detail: string;
  icon: React.ComponentType<{ className: string }>;
  bgColor: string;
  borderColor: string;
  action: string;
  actionBg: string;
}

const QuickStats = () => {
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setLoading(false);
          return;
        }

        const newStats: QuickStat[] = [];

        // Fetch next class
        try {
          const classesRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/live-classes/me`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (classesRes.data && classesRes.data.length > 0) {
            const now = new Date();
            const upcomingClasses = classesRes.data
              .filter((cls: any) => {
                return new Date(cls.starts_at) > now;
              })
              .sort(
                (a: any, b: any) =>
                  new Date(a.starts_at).getTime() -
                  new Date(b.starts_at).getTime()
              );

            if (upcomingClasses.length > 0) {
              const nextClass = upcomingClasses[0];
              const startTime = new Date(nextClass.starts_at);
              const timeUntil = Math.floor(
                (startTime.getTime() - now.getTime()) / (1000 * 60)
              );

              let timeDisplay = "";
              if (timeUntil < 60) {
                timeDisplay = `In ${timeUntil} minutes`;
              } else if (timeUntil < 1440) {
                timeDisplay = `In ${Math.floor(timeUntil / 60)} hours`;
              } else {
                timeDisplay = `In ${Math.floor(timeUntil / 1440)} days`;
              }

              newStats.push({
                title: "Next Class",
                subtitle: nextClass.title,
                detail: timeDisplay,
                icon: Clock,
                bgColor: "bg-orange-50",
                borderColor: "border-orange-200",
                action: "Join Now",
                actionBg: "bg-slate-900 hover:bg-slate-800",
              });
            }
          }
        } catch (err) {
          console.log("No upcoming classes");
        }

        // Fetch user's courses
        try {
          const coursesRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/courses/me`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (coursesRes.data && coursesRes.data.length > 0) {
            const now = new Date();
            const allPendingHomework = [];

            // Fetch homeworks for each course
            for (const course of coursesRes.data) {
              try {
                const homeworkRes = await axios.get(
                  `${process.env.NEXT_PUBLIC_API_URL}/homeworks/course/${course.id}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                if (homeworkRes.data) {
                  const pending = homeworkRes.data.filter((hw: any) => {
                    const dueDate = new Date(hw.due_date);
                    return dueDate > now;
                  });
                  allPendingHomework.push(...pending);
                }
              } catch (err) {
                console.log(`No homeworks for course ${course.id}`);
              }
            }

            if (allPendingHomework.length > 0) {
              newStats.push({
                title: "Homework Due",
                subtitle: `${allPendingHomework.length} pending task${allPendingHomework.length !== 1 ? "s" : ""}`,
                detail: "",
                icon: CheckCircle,
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                action: "View Homework",
                actionBg: "bg-slate-900 hover:bg-slate-800",
              });
            }
          }
        } catch (err) {
          console.log("Error fetching courses or homeworks");
        }

        setStats(newStats);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-6 bg-slate-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`${stat.bgColor} border ${stat.borderColor} flex flex-col justify-between rounded-lg p-6`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-600 font-medium">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {stat.subtitle}
                </h3>
                {stat.detail && (
                  <p className="text-sm  text-slate-600 mt-2">{stat.detail}</p>
                )}
              </div>
              <Icon className="w-6 h-6 text-slate-400" />
            </div>

            <button
              className={`w-full ${stat.actionBg}  text-white font-semibold py-2 rounded-lg transition`}
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