"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

interface Course {
  id: string;
  name: string;
  code: string;
  progress: number;
  completed: number;
}

const ActiveCourses = () => {
  const [activeCourses, setActiveCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("Authentication token not found");
          setLoading(false);
          return;
        }

        const res = await axios.get("http://localhost:8000/courses/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("Courses fetched:", res.data);
        setActiveCourses(res.data);
        setError(null);
      } catch (error: any) {
        console.error("Error fetching courses:", error);
        
        if (error.response?.status === 401) {
          setError("Session expired. Please login again.");
          localStorage.removeItem("access_token");
        } else if (error.response?.status === 404) {
          setError("Courses not found");
        } else {
          setError("Failed to fetch courses. Please try again later.");
        }
        
        setActiveCourses([
          {
            id: "1",
            name: "Chemistry",
            code: "9701",
            progress: 40,
            completed: 40,
          },
          {
            id: "2",
            name: "Mathematics",
            code: "9709",
            progress: 65,
            completed: 65,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
          My Active Courses
        </h2>
        <div className="text-center py-8">
          <div className="animate-pulse">Loading courses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6 lg:p-8">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
        My Active Courses
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {activeCourses.length > 0 ? (
          activeCourses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 border border-slate-200 rounded-lg hover:border-slate-300 transition"
            >
              {/* Left Section - Course Info */}
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {course.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    ({course.code})
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Next class
                    </p>
                    <p className="font-medium text-slate-900 text-sm sm:text-base">
                      To be scheduled
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-600">Progress</p>
                    <p className="font-medium text-slate-900 text-sm sm:text-base">
                      {course.progress}%
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-slate-900 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Right Section - Button */}
              <button className="w-full sm:w-auto sm:ml-4 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition text-sm sm:text-base flex-shrink-0">
                Join Class
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>No active courses found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveCourses;