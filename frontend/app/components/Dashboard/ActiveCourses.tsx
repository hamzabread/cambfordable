"use client";

import React from "react";

interface Course {
  id: string;
  name: string;
  code: string;
  nextClass: string;
  time: string;
  progress: number;
  completed: number;
}

const ActiveCourses = () => {
  const courses: Course[] = [
    {
      id: "1",
      name: "Chemistry",
      code: "9701",
      nextClass: "Next class",
      time: "Tomorrow, 2:30 PM",
      progress: 40,
      completed: 40,
    },
    {
      id: "2",
      name: "Mathematics",
      code: "9709",
      nextClass: "Next class",
      time: "Friday, 4:00 PM",
      progress: 65,
      completed: 65,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">My Active Courses</h2>

      <div className="space-y-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="flex items-center justify-between p-6 border border-slate-200 rounded-lg hover:border-slate-300 transition"
          >
            {/* Left Section - Course Info */}
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {course.name}
                </h3>
                <p className="text-sm text-slate-500">({course.code})</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-600">{course.nextClass}</p>
                  <p className="font-medium text-slate-900">{course.time}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Progress</p>
                  <p className="font-medium text-slate-900">{course.progress}%</p>
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
            <button className="ml-6 px-6 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition whitespace-nowrap">
              Join Class
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveCourses;