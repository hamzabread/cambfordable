"use client";
import React, { useState } from "react";
import {
  BookOpen,
  Beaker,
  Calculator,
  Microscope,
  Code,
  Globe,
} from "lucide-react";
import { ChevronRight } from "lucide-react";
import Image from "next/image";

export default function CoursesSection() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const courses = [
    {
      id: 1,
      title: "Mathematics",
      level: "O-Levels & A-Levels",
      description:
        "Master algebra, calculus, statistics, and problem-solving techniques with comprehensive guidance.",
      icon: Calculator,
      topics: ["Algebra", "Calculus", "Statistics", "Trigonometry"],
      students: "150+ Students",
    },
    {
      id: 2,
      title: "Physics",
      level: "O-Levels & A-Levels",
      description:
        "Understand mechanics, thermodynamics, electricity, and modern physics concepts thoroughly.",
      icon: Microscope,
      topics: ["Mechanics", "Thermodynamics", "Electricity", "Waves"],
      students: "120+ Students",
    },
    {
      id: 3,
      title: "Chemistry",
      level: "O-Levels & A-Levels",
      description:
        "Explore organic, inorganic, and physical chemistry with practical examples and clear explanations.",
      icon: Beaker,
      topics: ["Organic", "Inorganic", "Physical", "Reactions"],
      students: "110+ Students",
    },
    {
      id: 4,
      title: "English Literature",
      level: "O-Levels & A-Levels",
      description:
        "Analyze texts, improve writing skills, and develop critical thinking through literary studies.",
      icon: BookOpen,
      topics: ["Texts Analysis", "Essay Writing", "Comprehension", "Grammar"],
      students: "95+ Students",
    },
    {
      id: 5,
      title: "Artificial Intelligence",
      level: "Specialization",
      description:
        "Learn machine learning, deep learning, and practical AI applications in the modern world.",
      icon: Code,
      topics: ["ML Algorithms", "Deep Learning", "NLP", "Computer Vision"],
      students: "85+ Students",
    },
    {
      id: 6,
      title: "Global Perspectives",
      level: "O-Levels & A-Levels",
      description:
        "Understand international issues, cultures, and global systems with critical analysis.",
      icon: Globe,
      topics: ["Global Issues", "Cultures", "Politics", "Economics"],
      students: "75+ Students",
    },
  ];

  return (
    <div className="bg-[#FBFDFF] relative z-10 py-16 px-4 sm:px-6 lg:px-8">
      

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex gap-8 items-center justify-center mx-auto mb-16">
          <Image
            width={150}
            height={150}
            src="/assets/subjects/pencil.svg"
            alt="pencli"
            className="absolute left-[-25px] md:static"
          />
          <div className="text-center z-10 flex-col flex">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Subjects I Teach
            </h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Comprehensive courses covering O-Levels, A-Levels, and specialized
              AI training
            </p>
          </div>
          <Image
            width={150}
            height={150}
            src="/assets/subjects/ruler.svg"
            alt="ruler"
            className="absolute right-[-25px] md:static"
          />
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => {
            const IconComponent = course.icon;
            const isHovered = hoveredId === course.id;

            return (
              <div
                key={course.id}
                onMouseEnter={() => setHoveredId(course.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-8px] flex flex-col cursor-pointer group"
              >
                {/* Top Section with Icon */}
                <div className="bg-[#1e3557] p-6 border-b border-gray-200 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {course.title}
                    </h2>
                    <p className="text-sm text-gray-300">{course.level}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <IconComponent className="w-7 h-7 text-[#1e3557]" />
                  </div>
                </div>

                {/* Description */}
                <div className="px-6 py-4 flex-1">
                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                    {course.description}
                  </p>

                  {/* Topics */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Key Topics
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {course.topics.slice(0, 3).map((topic, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                      {course.topics.length > 3 && (
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                          +{course.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#F5F7FA] border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">
                    {course.students}
                  </p>
                  <div
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      isHovered
                        ? "bg-[#1e3557] text-white"
                        : "bg-white text-[#1e3557] border border-[#1e3557]"
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-white rounded-xl p-10 border border-gray-200 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Learning?
          </h2>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
            Choose any subject and begin your journey towards academic
            excellence with personalized one-on-one sessions.
          </p>
          <button className="bg-[#1e3557] hover:bg-[#152848] text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] shadow-md hover:shadow-lg">
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
}
