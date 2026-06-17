"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bell, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Notification {
  id: string;
  type: "info" | "success" | "warning";
  icon: React.ReactNode;
  message: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setLoading(false);
          return;
        }

        const generatedNotifications: Notification[] = [];

        // Payment reminders come first — a lapsing subscription is the most
        // important thing for a student to see.
        try {
          const payRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/courses/payment-status`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (Array.isArray(payRes.data)) {
            for (const status of payRes.data) {
              if (!status.reminder) continue;
              const days = status.days_remaining;
              generatedNotifications.push({
                id: `payment-${status.course_id}`,
                type: "warning",
                icon: <AlertCircle className="w-5 h-5" />,
                message: `Payment due: your subscription for ${status.course_name} expires in ${days} day${
                  days === 1 ? "" : "s"
                }. Please renew to keep access.`,
              });
            }
          }
        } catch (err) {
          console.log("Error fetching payment status");
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

            // Fetch homeworks for each course
            for (const course of coursesRes.data) {
              try {
                const homeworkRes = await axios.get(
                  `${process.env.NEXT_PUBLIC_API_URL}/homeworks/course/${course.id}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                if (
                  homeworkRes.data &&
                  homeworkRes.data.length > 0 &&
                  generatedNotifications.length < 3
                ) {
                  const pendingHomework = homeworkRes.data
                    .filter((hw: any) => {
                      const dueDate = new Date(hw.due_date);
                      return dueDate > now;
                    })
                    .sort(
                      (a: any, b: any) =>
                        new Date(a.due_date).getTime() -
                        new Date(b.due_date).getTime()
                    );

                  if (pendingHomework.length > 0) {
                    generatedNotifications.push({
                      id: `hw-${course.id}`,
                      type: "info",
                      icon: <Bell className="w-5 h-5" />,
                      message: `New homework in ${course.name}: ${pendingHomework[0].title}`,
                    });
                  }
                }
              } catch (err) {
                console.log(`No homeworks for course ${course.id}`);
              }
            }

            // Fetch quizzes for each course
            for (const course of coursesRes.data) {
              if (generatedNotifications.length >= 3) break;
              try {
                const quizRes = await axios.get(
                  `${process.env.NEXT_PUBLIC_API_URL}/quizzes/course/${course.id}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                if (quizRes.data && quizRes.data.length > 0) {
                  // Find published quizzes
                  const publishedQuizzes = quizRes.data.filter(
                    (q: any) => q.is_published !== false
                  );

                  if (publishedQuizzes.length > 0) {
                    generatedNotifications.push({
                      id: `quiz-${course.id}`,
                      type: "success",
                      icon: <CheckCircle className="w-5 h-5" />,
                      message: `New quiz in ${course.name}: ${publishedQuizzes[0].title}`,
                    });
                  }
                }
              } catch (err) {
                console.log(`No quizzes for course ${course.id}`, err);
              }
            }
          }
        } catch (err) {
          console.log("Error fetching courses");
        }

        // Fetch upcoming live classes
        try {
          const classesRes = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/live-classes/me`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (classesRes.data && classesRes.data.length > 0) {
            const now = new Date();
            const allClasses = classesRes.data
              .sort(
                (a: any, b: any) =>
                  new Date(a.starts_at).getTime() -
                  new Date(b.starts_at).getTime()
              );

            // Show the most recent class (started or upcoming)
            if (allClasses.length > 0 && generatedNotifications.length < 3) {
              const nextClass = allClasses[0];
              const startTime = new Date(nextClass.starts_at);
              const timeUntil = Math.floor(
                (startTime.getTime() - now.getTime()) / (1000 * 60)
              );

              let timeDisplay = "";
              if (timeUntil < 0) {
                // Class has started
                const minutesAgo = Math.floor(-timeUntil);
                if (minutesAgo < 60) {
                  timeDisplay = `started ${minutesAgo} minutes ago`;
                } else if (minutesAgo < 1440) {
                  timeDisplay = `started ${Math.floor(minutesAgo / 60)} hours ago`;
                } else {
                  timeDisplay = `started ${Math.floor(minutesAgo / 1440)} days ago`;
                }
              } else {
                // Class is upcoming
                if (timeUntil < 60) {
                  timeDisplay = `starts in ${timeUntil} minutes`;
                } else if (timeUntil < 1440) {
                  timeDisplay = `starts in ${Math.floor(timeUntil / 60)} hours`;
                } else {
                  timeDisplay = `starts in ${Math.floor(timeUntil / 1440)} days`;
                }
              }

              generatedNotifications.push({
                id: "class-upcoming",
                type: "warning",
                icon: <Clock className="w-5 h-5" />,
                message: `Class "${nextClass.title}" ${timeDisplay}`,
              });
            }
          }
        } catch (err) {
          console.log("No live classes available", err);
        }

        // If no notifications generated, show default
        if (generatedNotifications.length === 0) {
          generatedNotifications.push({
            id: "default",
            type: "info",
            icon: <Bell className="w-5 h-5" />,
            message: "No new notifications at the moment",
          });
        }

        setNotifications(generatedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([
          {
            id: "default",
            type: "info",
            icon: <Bell className="w-5 h-5" />,
            message: "No new notifications at the moment",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
          Notifications
        </h2>
        <div className="text-center py-8">
          <div className="animate-pulse text-slate-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
        Notifications
      </h2>

      <div className="space-y-3 sm:space-y-4">
        {notifications.map((notif) => {
          const styles =
            notif.type === "warning"
              ? { box: "border-red-200 bg-red-50 hover:border-red-300", icon: "text-red-600", text: "text-red-800" }
              : notif.type === "success"
              ? { box: "border-emerald-200 bg-emerald-50 hover:border-emerald-300", icon: "text-emerald-600", text: "text-emerald-800" }
              : { box: "border-slate-200 hover:border-slate-300", icon: "text-slate-600", text: "text-slate-700" };
          return (
            <div
              key={notif.id}
              className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition ${styles.box}`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 mt-1 ${styles.icon}`}>
                {notif.icon}
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm sm:text-base font-medium break-words ${styles.text}`}>
                  {notif.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Button */}
      {/* <button className="w-full mt-4 sm:mt-6 py-2 text-slate-900 font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition text-sm sm:text-base">
        View All Notifications
      </button> */}
    </div>
  );
};

export default Notifications;